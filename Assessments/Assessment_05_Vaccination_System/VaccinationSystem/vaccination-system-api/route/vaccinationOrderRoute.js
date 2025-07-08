// src/backend/routes/vaccinationOrderRoute.js
const express = require('express');
const vaccinationOrderRouter = express.Router({ strict: true, caseSensitive: true });
const VaccinationOrderModel = require('../dataModel/vaccinationOrderModel'); // Adjust path as needed
const UserModel = require('../dataModel/userDataModel'); // For checking if user (patient) exists
const VaccineModel = require('../dataModel/vaccineDataModel'); // For checking if vaccine exists
const HospitalModel = require('../dataModel/hospitalDataModel'); // For checking if hospital exists
const mongoose = require('mongoose'); // For ObjectId validation

// Assuming authenticateToken is exported from userRoute.js or authMiddleware.js
// const { authenticateToken } = require('../middleware/authMiddleware'); // Adjust path if needed
const { authenticateToken } = require('./userRoute'); // Adjust path if needed

/**
 * @route POST /api/vaccination-orders
 * @description Create a new vaccination order.
 * @body {string} userId, {string} hospitalId, {string} vaccineId, {number} dose_number, {number} charge_to_be_paid
 * @access Protected (Admin, Hospital Staff)
 */
vaccinationOrderRouter.post('/api/vaccination-orders', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can create vaccination orders.' });
        }

        const { userId, hospitalId, vaccineId, dose_number, charge_to_be_paid } = req.body;
        const createdBy = req.user.userId; // The ID of the staff creating the order

        // --- Input Validation ---
        if (!userId || !hospitalId || !vaccineId || dose_number === undefined || dose_number === null || charge_to_be_paid === undefined || charge_to_be_paid === null) {
            return res.status(400).json({ message: 'Missing required fields: userId, hospitalId, vaccineId, dose_number, charge_to_be_paid.' });
        }
        if (typeof dose_number !== 'number' || dose_number < 1) {
            return res.status(400).json({ message: 'Dose number must be a positive integer.' });
        }
        if (typeof charge_to_be_paid !== 'number' || charge_to_be_paid < 0) {
            return res.status(400).json({ message: 'Charge to be paid must be a non-negative number.' });
        }

        // Validate Object IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid ID format for user, hospital, or vaccine.' });
        }

        // --- Authorization Check (Hospital Staff specific) ---
        if (req.user.role === 'hospital_staff' && req.user.hospitalId.toString() !== hospitalId) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only create orders for their own hospital.' });
        }

        // --- Existence Checks for Referenced Documents ---
        const [userExists, hospitalExists, vaccineExists] = await Promise.all([
            UserModel.findById(userId),
            HospitalModel.findById(hospitalId),
            VaccineModel.findById(vaccineId)
        ]);

        if (!userExists) return res.status(404).json({ message: 'Patient (User) not found.' });
        if (userExists.role !== 'patient') return res.status(400).json({ message: 'Selected user is not a patient.' }); // Ensure the selected user is a patient
        if (!hospitalExists) return res.status(404).json({ message: 'Hospital not found.' });
        if (!vaccineExists) return res.status(404).json({ message: 'Vaccine not found.' });

        // --- UPDATED: Prevent Duplicate Pending/Active Orders ---
        // Check if an order for the same user, hospital, vaccine, and dose number already exists
        // with an 'active' vaccination status (not vaccinated/not_vaccinated)
        // AND an 'active' payment status (not cancelled/refunded).
        const existingPendingOrActiveOrder = await VaccinationOrderModel.findOne({
            userId,
            hospitalId, // Added hospitalId to the uniqueness check
            vaccineId,
            dose_number,
            vaccinationStatus: { $nin: ['vaccinated', 'not_vaccinated'] }, // Not yet completed/failed vaccination
            paymentStatus: { $nin: ['cancelled', 'refunded'] } // Not yet cancelled or refunded payment
        });

        if (existingPendingOrActiveOrder) {
            return res.status(409).json({ message: `A pending or active vaccination order for dose ${dose_number} of this vaccine already exists for this patient at this hospital.` });
        }

        // --- Create Vaccination Order ---
        const newOrder = new VaccinationOrderModel({
            userId,
            hospitalId,
            vaccineId,
            dose_number,
            charge_to_be_paid,
            createdBy
        });

        const savedOrder = await newOrder.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(savedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');


        res.status(201).json({ message: 'Vaccination order created successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error creating vaccination order:', error);
        // The duplicate key error (code 11000) from a unique index might still fire
        // if you have a unique compound index that only checks userId, vaccineId, dose_number.
        // The more specific check above handles the status conditions.
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A similar pending vaccination order already exists for this patient, vaccine, and dose (possibly due to a database unique constraint).' });
        }
        res.status(500).json({ message: 'Internal server error creating vaccination order.', error: error.message });
    }
});

module.exports = vaccinationOrderRouter;