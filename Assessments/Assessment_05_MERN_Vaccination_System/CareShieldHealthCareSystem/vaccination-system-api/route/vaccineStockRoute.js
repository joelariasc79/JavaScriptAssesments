// src/backend/routes/vaccineStockRoutes.js
const express = require('express');
const vaccineStockRouter = express.Router({ strict: true, caseSensitive: true });
const VaccineStockModel = require('../dataModel/vaccineStockDataModel'); // Import the VaccineStock models
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route GET /api/vaccine-stock
 * @description Get all vaccine stock entries, with optional filters.
 * @queryparam {string} hospitalId - Filter by hospital.
 * @queryparam {string} vaccineId - Filter by vaccine.
 * @access Protected (Any authenticated user can view stock availability)
 */
vaccineStockRouter.get('/api/vaccine-stock', authenticateToken, async (req, res) => {
    try {
        const query = {};
        if (req.query.hospitalId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.hospitalId)) {
                return res.status(400).json({ message: 'Invalid Hospital ID format.' });
            }
            query.hospital = req.query.hospitalId; // Use 'hospital' as per schema
        }
        if (req.query.vaccineId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.vaccineId)) {
                return res.status(400).json({ message: 'Invalid Vaccine ID format.' });
            }
            query.vaccine = req.query.vaccineId; // Use 'vaccine' as per schema
        }

        const vaccineStocks = await VaccineStockModel.find(query)
            .populate('hospital', 'name address.city') // Populate hospital name and city
            .populate('vaccine', 'name type doses_required price'); // Populate vaccine name, type, doses_required, price

        res.status(200).json(vaccineStocks);
    } catch (error) {
        console.error('Error fetching vaccine stock:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccine stock.', error: error.message });
    }
});

/**
 * @route GET /api/vaccine-stock/:hospitalId/:vaccineId
 * @description Get a single vaccine stock entry by its ID.
 * @access Protected (Any authenticated user)
 */
vaccineStockRouter.get('/api/vaccine-stock/:hospitalId/:vaccineId', authenticateToken, async (req, res) => {
    try {
        const { hospitalId, vaccineId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid hospital ID or vaccine ID format.' });
        }

        const vaccineStock = await VaccineStockModel.findOne({ hospital: hospitalId, vaccine: vaccineId })
            .populate('hospital', 'name address.city')
            .populate('vaccine', 'name type doses_required price');

        if (!vaccineStock) {
            // If vaccineStock is not found, return 200 OK with default values
            return res.status(200).json({
                hospital: hospitalId, // Return the hospitalId as is, without population
                vaccine: vaccineId,   // Return the vaccineId as is, without population
                quantity: 0,
                message: 'Vaccine stock entry not found, returning default quantity 0.'
            });
        }

        res.status(200).json(vaccineStock);
    } catch (error) {
        console.error('Error fetching vaccine stock by hospitalId and vaccineId:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccine stock.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccine-stock/:hospitalId/:vaccineId
 * @description Update vaccine stock quantity by adding/subtracting the provided changeQty.
 * If the record does not exist, it will be created (upsert).
 * @body {number} changeQty - The quantity to add to (positive) or subtract from (negative) the current stock.
 * @access Protected (Admin, Hospital Staff)
 */
vaccineStockRouter.patch('/api/vaccine-stock/:hospitalId/:vaccineId', authenticateToken, async (req, res) => {
    try {
        const { hospitalId, vaccineId } = req.params;
        const { changeQty } = req.body; // changeQty is the difference (proposed - current)

        // Validate input
        if (typeof changeQty !== 'number' || isNaN(changeQty)) {
            return res.status(400).json({ message: 'Invalid changeQty. Must be a number.' });
        }

        if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid hospital ID or vaccine ID format.' });
        }

        // Ensure only authorized staff can update their hospital's stock
        if (req.user.role === 'hospital_staff') {
            if (!req.user.hospitalId || req.user.hospitalId.toString() !== hospitalId) {
                return res.status(403).json({ message: 'Access denied. You can only update stock for your assigned hospital.' });
            }
        }
        // Admin users can update stock for any hospital
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can update vaccine stock.' });
        }

        // Find the vaccine stock entry and update its quantity
        // If the entry doesn't exist, create it with the initial changeQty
        const updatedStock = await VaccineStockModel.findOneAndUpdate(
            { hospital: hospitalId, vaccine: vaccineId },
            {
                $inc: { quantity: changeQty }, // Increment/decrement the quantity
                $set: { lastUpdated: Date.now() } // Update last updated timestamp
            },
            {
                new: true, // Return the updated document
                upsert: true, // Create the document if it doesn't exist
                runValidators: true, // Run schema validators on the update
                setDefaultsOnInsert: true // Apply schema defaults if a new document is inserted
            }
        );

        // The `min: 0` validator on the schema will prevent negative quantities.
        // If `updatedStock` is null after `findOneAndUpdate` with `upsert:true`, it's an unexpected error.
        // If a ValidationError occurs due to `min:0`, it will be caught below.

        res.status(200).json({
            message: 'Vaccine stock updated successfully!',
            stock: updatedStock,
        });

    } catch (error) {
        console.error('Error updating vaccine stock (PATCH):', error);
        if (error.name === 'ValidationError') {
            // This catches errors like trying to set quantity below 0 due to `min: 0` in schema
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error updating vaccine stock.', error: error.message });
    }
});

/**
 * @route DELETE /api/vaccine-stock/:id
 * @description Delete a vaccine stock entry.
 * @access Protected (Admin only)
 */
vaccineStockRouter.delete('/api/vaccine-stock/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete vaccine stock entries.' });
        }

        const stockId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(stockId)) {
            return res.status(400).json({ message: 'Invalid stock ID format.' });
        }

        const deletedVaccineStock = await VaccineStockModel.findByIdAndDelete(stockId);

        if (!deletedVaccineStock) {
            return res.status(404).json({ message: 'Vaccine stock entry not found.' });
        }

        res.status(200).json({ message: 'Vaccine stock entry deleted successfully!', vaccineStock: { _id: deletedVaccineStock._id } });

    } catch (error) {
        console.error('Error deleting vaccine stock:', error);
        res.status(500).json({ message: 'Internal server error deleting vaccine stock.', error: error.message });
    }
});

module.exports = vaccineStockRouter;



// // src/backend/routes/vaccineStockRoutes.js
// const express = require('express');
// const vaccineStockRouter = express.Router({ strict: true, caseSensitive: true });
// const VaccineStockModel = require('../dataModel/vaccineStockDataModel'); // Import the VaccineStock models
// const VaccineModel = require('../dataModel/vaccineDataModel'); // Import the Vaccine models for validation
// const HospitalModel = require('../dataModel/hospitalDataModel'); // Import the Hospital models for validation
// const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
//
// const { authenticateToken } = require('./userRoute'); // Adjust path if needed
//
// /**
//  * @route POST /api/vaccine-stock
//  * @description Add or update vaccine stock for a hospital by INCREMENTING the quantity.
//  * If the entry doesn't exist, it's created with the provided quantity.
//  * @body {string} hospitalId, {string} vaccineId, {number} quantity (can be positive or negative for adjustment)
//  * @access Protected (Admin or Hospital Staff)
//  */
// vaccineStockRouter.post('/api/vaccine-stock', authenticateToken, async (req, res) => {
//     try {
//         // Only admins or hospital staff can manage vaccine stock
//         if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
//             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can manage vaccine stock.' });
//         }
//
//         const { hospitalId, vaccineId, quantity } = req.body;
//
//         // Basic validation for required fields
//         if (!hospitalId || !vaccineId || quantity === undefined || quantity === null) {
//             return res.status(400).json({ message: 'Missing required fields: hospitalId, vaccineId, quantity.' });
//         }
//         // Validate quantity type. It can be negative if it's an adjustment.
//         if (typeof quantity !== 'number' || isNaN(quantity)) {
//             return res.status(400).json({ message: 'Quantity must be a number.' });
//         }
//
//         // Validate ObjectIds
//         if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
//             return res.status(400).json({ message: 'Invalid Hospital ID or Vaccine ID format.' });
//         }
//
//         // Verify if Hospital and Vaccine exist
//         const hospitalExists = await HospitalModel.findById(hospitalId);
//         if (!hospitalExists) {
//             return res.status(404).json({ message: 'Hospital not found.' });
//         }
//         const vaccineExists = await VaccineModel.findById(vaccineId);
//         if (!vaccineExists) {
//             return res.status(404).json({ message: 'Vaccine not found.' });
//         }
//
//         // Hospital staff can only manage stock for their assigned hospital
//         if (req.user.role === 'hospital_staff' && (!req.user.hospitalId || req.user.hospitalId.toString() !== hospitalId)) {
//             return res.status(403).json({ message: 'Access denied. You can only manage stock for your assigned hospital.' });
//         }
//
//         // Find the vaccine stock entry and update its quantity by incrementing/decrementing
//         // If the entry doesn't exist, create it with the initial quantity
//         const updatedStock = await VaccineStockModel.findOneAndUpdate(
//             { hospital: hospitalId, vaccine: vaccineId }, // Use 'hospital' and 'vaccine' as per schema
//             {
//                 $inc: { quantity: quantity }, // Increment/decrement the quantity
//                 $set: { lastUpdated: Date.now() } // Update last updated timestamp
//             },
//             {
//                 new: true, // Return the updated document
//                 upsert: true, // Create the document if it doesn't exist
//                 runValidators: true, // Run schema validators on the update (e.g., min: 0 for quantity)
//             }
//         );
//
//         res.status(200).json({
//             message: 'Vaccine stock updated successfully!',
//             vaccineStock: updatedStock,
//         });
//
//     } catch (error) {
//         console.error('Error managing vaccine stock (POST):', error);
//         // Handle specific errors like validation errors (e.g., quantity becoming negative if min:0 is set)
//         if (error.name === 'ValidationError') {
//             return res.status(400).json({ message: error.message });
//         }
//         res.status(500).json({ message: 'Internal server error managing vaccine stock.', error: error.message });
//     }
// });
//
// /**
//  * @route GET /api/vaccine-stock
//  * @description Get all vaccine stock entries, with optional filters.
//  * @queryparam {string} hospitalId - Filter by hospital.
//  * @queryparam {string} vaccineId - Filter by vaccine.
//  * @access Protected (Any authenticated user can view stock availability)
//  */
// vaccineStockRouter.get('/api/vaccine-stock', authenticateToken, async (req, res) => {
//     try {
//         const query = {};
//         if (req.query.hospitalId) {
//             if (!mongoose.Types.ObjectId.isValid(req.query.hospitalId)) {
//                 return res.status(400).json({ message: 'Invalid Hospital ID format.' });
//             }
//             query.hospital = req.query.hospitalId; // Use 'hospital' as per schema
//         }
//         if (req.query.vaccineId) {
//             if (!mongoose.Types.ObjectId.isValid(req.query.vaccineId)) {
//                 return res.status(400).json({ message: 'Invalid Vaccine ID format.' });
//             }
//             query.vaccine = req.query.vaccineId; // Use 'vaccine' as per schema
//         }
//
//         const vaccineStocks = await VaccineStockModel.find(query)
//             .populate('hospital', 'name address.city') // Populate hospital name and city
//             .populate('vaccine', 'name type doses_required price'); // Populate vaccine name, type, doses_required, price
//
//         res.status(200).json(vaccineStocks);
//     } catch (error) {
//         console.error('Error fetching vaccine stock:', error);
//         res.status(500).json({ message: 'Internal server error fetching vaccine stock.', error: error.message });
//     }
// });
//
// /**
//  * @route GET /api/vaccine-stock/:id
//  * @description Get a single vaccine stock entry by its ID.
//  * @access Protected (Any authenticated user)
//  */
// vaccineStockRouter.get('/api/vaccine-stock/:hospitalId/:vaccineId', authenticateToken, async (req, res) => {
//     try {
//         const { hospitalId, vaccineId } = req.params;
//
//         if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
//             return res.status(400).json({ message: 'Invalid hospital ID or vaccine ID format.' });
//         }
//
//         const vaccineStock = await VaccineStockModel.findOne({ hospital: hospitalId, vaccine: vaccineId })
//             .populate('hospital', 'name address.city')
//             .populate('vaccine', 'name type doses_required price');
//
//         if (!vaccineStock) {
//             // If vaccineStock is not found, return 200 OK with default values
//             return res.status(200).json({
//                 hospital: hospitalId, // Return the hospitalId as is, without population
//                 vaccine: vaccineId,   // Return the vaccineId as is, without population
//                 quantity: 0,
//                 // You might also want to include a message to indicate it's a default/not-found entry
//                 message: 'Vaccine stock entry not found, returning default quantity 0.'
//             });
//         }
//
//         res.status(200).json(vaccineStock);
//     } catch (error) {
//         console.error('Error fetching vaccine stock by hospitalId and vaccineId:', error);
//         res.status(500).json({ message: 'Internal server error fetching vaccine stock.', error: error.message });
//     }
// });
// /**
//  * @route PUT /api/vaccine-stock/:id
//  * @description Update a specific vaccine stock entry.
//  * If 'quantity' is provided, it will be ADDED to the current quantity.
//  * Other fields will be SET.
//  * @body {number} quantity (optional, for increment/decrement), other updatable fields
//  * @access Protected (Admin or Hospital Staff)
//  */
// vaccineStockRouter.put('/api/vaccine-stock/:id', authenticateToken, async (req, res) => {
//     try {
//         if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
//             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can update vaccine stock.' });
//         }
//
//         const stockId = req.params.id;
//         const { quantity, ...otherUpdates } = req.body; // Separate quantity from other updates
//
//         if (!mongoose.Types.ObjectId.isValid(stockId)) {
//             return res.status(400).json({ message: 'Invalid stock ID format.' });
//         }
//
//         // Prevent updating hospitalId or vaccineId directly through this route
//         delete otherUpdates.hospital; // Changed from hospitalId
//         delete otherUpdates.vaccine;  // Changed from vaccineId
//
//         const updateOperations = {
//             $set: { ...otherUpdates, lastUpdated: Date.now() } // Set other fields and lastUpdated
//         };
//
//         // If quantity is provided, add it to the $inc operator
//         if (quantity !== undefined && quantity !== null) {
//             if (typeof quantity !== 'number' || isNaN(quantity)) {
//                 return res.status(400).json({ message: 'Quantity must be a number if provided.' });
//             }
//             updateOperations.$inc = { quantity: quantity }; // Use $inc for quantity
//         }
//
//         const updatedVaccineStock = await VaccineStockModel.findByIdAndUpdate(
//             stockId,
//             updateOperations, // Use the combined update operations
//             { new: true, runValidators: true } // Return the updated document and run schema validators
//         )
//             .populate('hospital', 'name address.city') // Changed from hospitalId
//             .populate('vaccine', 'name type doses_required price'); // Changed from vaccineId
//
//         if (!updatedVaccineStock) {
//             return res.status(404).json({ message: 'Vaccine stock entry not found.' });
//         }
//
//         res.status(200).json({ message: 'Vaccine stock updated successfully!', vaccineStock: updatedVaccineStock });
//
//     } catch (error) {
//         console.error('Error updating vaccine stock (PUT):', error);
//         if (error.name === 'ValidationError') {
//             return res.status(400).json({ message: error.message });
//         }
//         res.status(500).json({ message: 'Internal server error updating vaccine stock.', error: error.message });
//     }
// });
//
//
// /**
//  * @route PATCH /api/vaccine-stock/:hospitalId/:vaccineId
//  * @description Update vaccine stock quantity by adding/subtracting the provided changeQty.
//  * @access Protected (Admin, Hospital Staff)
//  * @body {number} changeQty - The quantity to add to (positive) or subtract from (negative) the current stock.
//  */
// vaccineStockRouter.patch('/api/vaccine-stock/:hospitalId/:vaccineId', authenticateToken, async (req, res) => {
//     try {
//         const { hospitalId, vaccineId } = req.params;
//         const { changeQty } = req.body;
//
//         if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
//             return res.status(400).json({ message: 'Invalid hospital ID or vaccine ID format.' });
//         }
//
//         // Ensure only authorized staff can update their hospital's stock
//         if (req.user.role === 'hospital_staff') {
//             if (!req.user.hospitalId || req.user.hospitalId.toString() !== hospitalId) {
//                 return res.status(403).json({ message: 'Access denied. You can only update stock for your assigned hospital.' });
//             }
//         }
//
//         // Admin users can update stock for any hospital
//         if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
//             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can update vaccine stock.' });
//         }
//
//         // Validate input
//         if (typeof changeQty !== 'number' || isNaN(changeQty)) {
//             return res.status(400).json({ message: 'Invalid changeQty. Must be a number.' });
//         }
//
//         // --- NEW VALIDATION FOR NEGATIVE QUANTITY ---
//         if (changeQty < 0) {
//             const currentStock = await VaccineStockModel.findOne({ hospital: hospitalId, vaccine: vaccineId });
//             if (!currentStock || (currentStock.quantity + changeQty) < 0) {
//                 return res.status(400).json({ message: 'Cannot update quantity. Resulting stock would be negative.' });
//             }
//         }
//         // --- END NEW VALIDATION ---
//
//         // Find the vaccine stock entry and update its quantity
//         const updatedStock = await VaccineStockModel.findOneAndUpdate(
//             { hospital: hospitalId, vaccine: vaccineId }, // Ensure consistency: use hospital, vaccine as per schema
//             {
//                 $inc: { quantity: changeQty }, // Increment/decrement the quantity
//                 $set: { lastUpdated: Date.now() } // Update last updated timestamp
//             },
//             {
//                 new: true, // Return the updated document
//                 upsert: true, // Create the document if it doesn't exist
//                 runValidators: true, // Run schema validators on the update
//             }
//         );
//
//         res.status(200).json({
//             message: 'Vaccine stock updated successfully!',
//             stock: updatedStock,
//         });
//
//     } catch (error) {
//         console.error('Error updating vaccine stock (PATCH):', error);
//         if (error.name === 'ValidationError') {
//             return res.status(400).json({ message: error.message });
//         }
//         res.status(500).json({ message: 'Internal server error updating vaccine stock.', error: error.message });
//     }
// });
//
// /**
//  * @route DELETE /api/vaccine-stock/:id
//  * @description Delete a vaccine stock entry.
//  * @access Protected (Admin only)
//  */
// vaccineStockRouter.delete('/api/vaccine-stock/:id', authenticateToken, async (req, res) => {
//     try {
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Access denied. Only administrators can delete vaccine stock entries.' });
//         }
//
//         const stockId = req.params.id;
//
//         if (!mongoose.Types.ObjectId.isValid(stockId)) {
//             return res.status(400).json({ message: 'Invalid stock ID format.' });
//         }
//
//         const deletedVaccineStock = await VaccineStockModel.findByIdAndDelete(stockId);
//
//         if (!deletedVaccineStock) {
//             return res.status(404).json({ message: 'Vaccine stock entry not found.' });
//         }
//
//         res.status(200).json({ message: 'Vaccine stock entry deleted successfully!', vaccineStock: { _id: deletedVaccineStock._id } });
//
//     } catch (error) {
//         console.error('Error deleting vaccine stock:', error);
//         res.status(500).json({ message: 'Internal server error deleting vaccine stock.', error: error.message });
//     }
// });
//
// module.exports = vaccineStockRouter;