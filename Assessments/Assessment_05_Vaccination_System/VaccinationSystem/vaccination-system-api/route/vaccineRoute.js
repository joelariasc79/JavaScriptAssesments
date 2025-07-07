// route/vaccineRoute.js
const express = require('express');
const vaccineRouter = express.Router({ strict: true, caseSensitive: true });
const VaccineModel = require('../DataModel/vaccineDataModel'); // Import the Mongoose Vaccine model
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// Assuming authenticateToken is exported from userRoute.js
const { authenticateToken } = require('./userRoute'); // Adjust path if needed

/**
 * @route POST /api/vaccines
 * @description Create a new vaccine. Requires admin authentication.
 * @body {string} name, {string} manufacturer, {string} type, {number} price, {string} side_effect, {string} origin, {number} doses_required, {number} time_between_doses_days, {string} other_info, {string} strains_covered
 * @access Protected (Admin-only)
 */
vaccineRouter.post('/api/vaccines', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'hospital_staff'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Only administrators can create vaccines.' });
        }

        // Destructure the new 'manufacturer' field
        const { name, manufacturer, type, price, side_effect, origin, doses_required, time_between_doses_days, other_info, strains_covered } = req.body;

        // Basic validation for required fields, now including manufacturer
        if (!name || !manufacturer || !type || price === undefined || price === null || !doses_required) {
            return res.status(400).json({ message: 'Missing required vaccine fields: name, manufacturer, type, price, doses_required.' });
        }
        if (typeof doses_required !== 'number' || doses_required < 1) {
            return res.status(400).json({ message: 'Doses required must be a number greater than or equal to 1.' });
        }
        if (doses_required > 1 && (time_between_doses_days === undefined || time_between_doses_days === null)) {
            // For multi-dose vaccines, time_between_doses_days should ideally be provided
            // However, making it not strictly required in schema. But can add a warning/recommendation here.
            console.warn(`Warning: time_between_doses_days not provided for multi-dose vaccine: ${name}`);
        }


        const existingVaccine = await VaccineModel.findOne({ name: name });
        if (existingVaccine) {
            return res.status(409).json({ message: 'Vaccine with that name already exists.' });
        }

        const newVaccine = new VaccineModel({
            name,
            manufacturer,
            type,
            price,
            side_effect,
            origin,
            doses_required,
            time_between_doses_days,
            other_info,
            strains_covered
        });

        const savedVaccine = await newVaccine.save();
        res.status(201).json({ message: 'Vaccine created successfully!', vaccine: savedVaccine });

    } catch (error) {
        console.error('Error creating vaccine:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'A vaccine with the provided name already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during vaccine creation.', error: error.message });
    }
});

/**
 * @route GET /api/vaccines
 * @description Get all vaccines. Accessible to all authenticated users.
 * @access Protected (Any authenticated user)
 */
vaccineRouter.get('/api/vaccines', authenticateToken, async (req, res) => {
    try {
        const vaccines = await VaccineModel.find({});
        res.status(200).json(vaccines);
    } catch (error) {
        console.error('Error fetching vaccines:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccines.', error: error.message });
    }
});

/**
 * @route GET /api/vaccines/:id
 * @description Get a single vaccine by ID. Accessible to all authenticated users.
 * @access Protected (Any authenticated user)
 */
vaccineRouter.get('/api/vaccines/:id', authenticateToken, async (req, res) => {
    try {
        const vaccineId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid vaccine ID format.' });
        }

        const vaccine = await VaccineModel.findById(vaccineId);

        if (!vaccine) {
            return res.status(404).json({ message: 'Vaccine not found.' });
        }
        res.status(200).json(vaccine);
    } catch (error) {
        console.error('Error fetching vaccine:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccine.', error: error.message });
    }
});

/**
 * @route PUT /api/vaccines/:id
 * @description Update a vaccine by ID. Requires admin authentication.
 * @body Any updatable fields from the schema (now includes manufacturer)
 * @access Protected (Admin-only)
 */
vaccineRouter.put('/api/vaccines/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can update vaccines.' });
        }

        const vaccineId = req.params.id;
        const updates = req.body; // manufacturer will be handled here if present in updates

        if (!mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid vaccine ID format.' });
        }

        const updatedVaccine = await VaccineModel.findByIdAndUpdate(
            vaccineId,
            { $set: updates },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedVaccine) {
            return res.status(404).json({ message: 'Vaccine not found.' });
        }

        res.status(200).json({ message: 'Vaccine updated successfully!', vaccine: updatedVaccine });

    } catch (error) {
        console.error('Error updating vaccine:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'Update failed: A vaccine with that name already exists.' });
        }
        res.status(500).json({ message: 'Internal server error updating vaccine.', error: error.message });
    }
});

/**
 * @route DELETE /api/vaccines/:id
 * @description Delete a vaccine by ID. Requires admin authentication.
 * @access Protected (Admin-only)
 */
vaccineRouter.delete('/api/vaccines/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete vaccines.' });
        }

        const vaccineId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid vaccine ID format.' });
        }

        const deletedVaccine = await VaccineModel.findByIdAndDelete(vaccineId);

        if (!deletedVaccine) {
            return res.status(404).json({ message: 'Vaccine not found.' });
        }

        res.status(200).json({ message: 'Vaccine deleted successfully!', vaccine: { _id: deletedVaccine._id, name: deletedVaccine.name } });

    } catch (error) {
        console.error('Error deleting vaccine:', error);
        res.status(500).json({ message: 'Internal server error deleting vaccine.', error: error.message });
    }
});

module.exports = vaccineRouter;