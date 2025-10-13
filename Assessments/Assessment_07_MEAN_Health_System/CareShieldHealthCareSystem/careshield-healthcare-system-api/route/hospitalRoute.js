// route/hospitalRoute.js
const express = require('express');
const hospitalRouter = express.Router({ strict: true, caseSensitive: true });
const HospitalModel = require('../dataModel/hospitalDataModel');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');


/**
 * @route GET /api/hospitals
 * @description Get all hospitals. Accessible to all authenticated users.
 * @access Protected (Any authenticated patient)
 */
hospitalRouter.get('/api/hospitals', authenticateToken, async (req, res) => {
    try {
        // No filtering by is_approved as the field is removed
        const hospitals = await HospitalModel.find({});
        res.status(200).json(hospitals);
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ message: 'Internal server error fetching hospitals.', error: error.message });
    }
});

/**
 * @route GET /api/hospitals/:id
 * @description Get a single hospital by ID. Accessible to all authenticated users.
 * @access Protected (Any authenticated patient)
 */
hospitalRouter.get('/api/hospitals/:id', authenticateToken, async (req, res) => {
    try {
        const hospitalId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        // No filtering by is_approved as the field is removed
        const hospital = await HospitalModel.findById(hospitalId);

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }
        res.status(200).json(hospital);
    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ message: 'Internal server error fetching hospital.', error: error.message });
    }
});

/**
 * @route POST /api/hospitals
 * @description Create a new hospital. Requires admin authentication.
 * @body {string} name, {object} address, {string} type, {string} contact_number, {number} charges
 * @access Protected (Admin-only)
 */
hospitalRouter.post('/api/hospitals', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can create hospitals.' });
        }

        const { name, address, type, contact_number, charges } = req.body; // is_approved removed

        if (!name || !address || !address.street || !address.city || !address.state || !contact_number || charges === undefined || charges === null || !type) {
            return res.status(400).json({ message: 'Missing required hospital fields (name, address with street/city/state, type, contact_number, charges).' });
        }

        const existingHospital = await HospitalModel.findOne({ name: name });
        if (existingHospital) {
            return res.status(409).json({ message: 'Hospital with that name already exists.' });
        }

        const newHospital = new HospitalModel({
            name,
            address,
            type,
            contact_number,
            charges
        });

        const savedHospital = await newHospital.save();
        res.status(201).json({ message: 'Hospital created successfully!', hospital: savedHospital });

    } catch (error) {
        console.error('Error creating hospital:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'A hospital with the provided name already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during hospital creation.', error: error.message });
    }
});

/**
 * @route PUT /api/hospitals/:id
 * @description Update a hospital by ID. Requires admin authentication.
 * @body Any updatable fields from the schema
 * @access Protected (Admin-only)
 */
hospitalRouter.put('/api/hospitals/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can update hospitals.' });
        }

        const hospitalId = req.params.id;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        const updatedHospital = await HospitalModel.findByIdAndUpdate(
            hospitalId,
            { $set: updates },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedHospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }

        res.status(200).json({ message: 'Hospital updated successfully!', hospital: updatedHospital });

    } catch (error) {
        console.error('Error updating hospital:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'Update failed: A hospital with that name already exists.' });
        }
        res.status(500).json({ message: 'Internal server error updating hospital.', error: error.message });
    }
});

/**
 * @route DELETE /api/hospitals/:id
 * @description Delete a hospital by ID. Requires admin authentication.
 * @access Protected (Admin-only)
 */
hospitalRouter.delete('/api/hospitals/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete hospitals.' });
        }

        const hospitalId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        const deletedHospital = await HospitalModel.findByIdAndDelete(hospitalId);

        if (!deletedHospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }

        res.status(200).json({ message: 'Hospital deleted successfully!', hospital: { _id: deletedHospital._id, name: deletedHospital.name } });

    } catch (error) {
        console.error('Error deleting hospital:', error);
        res.status(500).json({ message: 'Internal server error deleting hospital.', error: error.message });
    }
});

module.exports = hospitalRouter;