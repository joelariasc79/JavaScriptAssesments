// route/vaccineStockRoute.js
const express = require('express');
const vaccineStockRouter = express.Router({ strict: true, caseSensitive: true });
const VaccineStockModel = require('../DataModel/vaccineStockDataModel'); // Import the VaccineStock model
const VaccineModel = require('../DataModel/vaccineDataModel'); // Import the Vaccine model for validation
const HospitalModel = require('../DataModel/hospitalDataModel'); // Import the Hospital model for validation
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// Assuming authenticateToken is exported from userRoute.js
const { authenticateToken } = require('./userRoute'); // Adjust path if needed

/**
 * @route POST /api/vaccine-stock
 * @description Add or update vaccine stock for a hospital.
 * @body {string} hospitalId, {string} vaccineId, {number} quantity
 * @access Protected (Admin or Hospital Staff)
 */
vaccineStockRouter.post('/api/vaccine-stock', authenticateToken, async (req, res) => {
    try {
        // Only admins or hospital staff can manage vaccine stock
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can manage vaccine stock.' });
        }

        const { hospitalId, vaccineId, quantity } = req.body;

        // Basic validation
        if (!hospitalId || !vaccineId || quantity === undefined || quantity === null) {
            return res.status(400).json({ message: 'Missing required fields: hospitalId, vaccineId, quantity.' });
        }
        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid Hospital ID or Vaccine ID format.' });
        }

        // Verify if Hospital and Vaccine exist
        const hospitalExists = await HospitalModel.findById(hospitalId);
        if (!hospitalExists) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }
        const vaccineExists = await VaccineModel.findById(vaccineId);
        if (!vaccineExists) {
            return res.status(404).json({ message: 'Vaccine not found.' });
        }

        // Check if a stock entry already exists for this hospital and vaccine combination
        let vaccineStock = await VaccineStockModel.findOne({ hospitalId, vaccineId });

        if (vaccineStock) {
            // Update existing stock
            vaccineStock.quantity = quantity;
            await vaccineStock.save();
            res.status(200).json({ message: 'Vaccine stock updated successfully!', vaccineStock });
        } else {
            // Create new stock entry
            const newVaccineStock = new VaccineStockModel({
                hospitalId,
                vaccineId,
                quantity
            });
            const savedVaccineStock = await newVaccineStock.save();
            res.status(201).json({ message: 'Vaccine stock created successfully!', vaccineStock: savedVaccineStock });
        }

    } catch (error) {
        console.error('Error managing vaccine stock:', error);
        if (error.code === 11000) { // Duplicate key error from unique index
            return res.status(409).json({ message: 'A vaccine stock entry for this hospital and vaccine already exists.' });
        }
        res.status(500).json({ message: 'Internal server error managing vaccine stock.', error: error.message });
    }
});

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
            query.hospitalId = req.query.hospitalId;
        }
        if (req.query.vaccineId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.vaccineId)) {
                return res.status(400).json({ message: 'Invalid Vaccine ID format.' });
            }
            query.vaccineId = req.query.vaccineId;
        }

        const vaccineStocks = await VaccineStockModel.find(query)
            .populate('hospitalId', 'name address.city') // Populate hospital name and city
            .populate('vaccineId', 'name type doses_required price'); // Populate vaccine name, type, doses_required, price

        res.status(200).json(vaccineStocks);
    } catch (error) {
        console.error('Error fetching vaccine stock:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccine stock.', error: error.message });
    }
});

/**
 * @route GET /api/vaccine-stock/:id
 * @description Get a single vaccine stock entry by its ID.
 * @access Protected (Any authenticated user)
 */
vaccineStockRouter.get('/api/vaccine-stock/:id', authenticateToken, async (req, res) => {
    try {
        const stockId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(stockId)) {
            return res.status(400).json({ message: 'Invalid stock ID format.' });
        }

        const vaccineStock = await VaccineStockModel.findById(stockId)
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type doses_required price');

        if (!vaccineStock) {
            return res.status(404).json({ message: 'Vaccine stock entry not found.' });
        }
        res.status(200).json(vaccineStock);
    } catch (error) {
        console.error('Error fetching vaccine stock by ID:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccine stock.', error: error.message });
    }
});

/**
 * @route PUT /api/vaccine-stock/:id
 * @description Update a specific vaccine stock entry.
 * @body {number} quantity (or other updatable fields like expiry_date if added to schema)
 * @access Protected (Admin or Hospital Staff)
 */
vaccineStockRouter.put('/api/vaccine-stock/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can update vaccine stock.' });
        }

        const stockId = req.params.id;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(stockId)) {
            return res.status(400).json({ message: 'Invalid stock ID format.' });
        }

        // Prevent updating hospitalId or vaccineId directly through this route
        delete updates.hospitalId;
        delete updates.vaccineId;

        // Ensure quantity is a non-negative number if present in updates
        if (updates.quantity !== undefined && (typeof updates.quantity !== 'number' || updates.quantity < 0)) {
            return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
        }

        const updatedVaccineStock = await VaccineStockModel.findByIdAndUpdate(
            stockId,
            { $set: updates },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        )
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type doses_required price');


        if (!updatedVaccineStock) {
            return res.status(404).json({ message: 'Vaccine stock entry not found.' });
        }

        res.status(200).json({ message: 'Vaccine stock updated successfully!', vaccineStock: updatedVaccineStock });

    } catch (error) {
        console.error('Error updating vaccine stock:', error);
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