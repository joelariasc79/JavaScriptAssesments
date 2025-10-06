const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware'); // Assuming this path is correct
const DoctorBlockoutModel = require('../dataModel/doctorBlockoutDataModel'); // Assumes this models is defined and imported

// Create a new router instance for blockout routes
const doctorBlockoutRouter = express.Router({ strict: true, caseSensitive: true });

/* -------------------------------------------
 * 1. Schema Reminder (based on user context)
 * -------------------------------------------
 * The models fields expected for DoctorBlockoutModel:
 * - doctorId (ObjectId, ref: 'User')
 * - reason (String)
 * - startDate (Date)
 * - endDate (Date)
 * - type (String, enum: ['vacation', 'conference', 'daily_break', 'sick_leave'])
 * ------------------------------------------- */


/**
 * Helper function to check if the current user can modify the blockout of a given doctor.
 * This function encapsulates the authorization logic for POST, PUT, and DELETE.
 * @param {object} currentUser - The req.user object from the JWT payload.
 * @param {string} targetDoctorId - The ID of the doctor whose blockout is being modified.
 * @returns {boolean} True if authorized, false otherwise.
 */
const canManageBlockout = async (currentUser, targetDoctorId) => {
    const { role, userId, hospitalIds } = currentUser;

    // 1. Admin can manage any blockout
    if (role === 'admin') {
        return true;
    }

    // 2. Doctor can only manage their own blockout
    if (role === 'doctor' && userId.toString() === targetDoctorId) {
        return true;
    }

    // 3. Hospital Admin can manage doctors associated with their hospitals
    if (role === 'hospital_admin' && hospitalIds && hospitalIds.length > 0) {
        // Find the target doctor to check their hospital affiliation
        // We use mongoose.models('User') assuming 'User' is the models name for doctors/patients
        const UserModel = mongoose.model('User');
        const targetDoctor = await UserModel.findById(targetDoctorId).select('hospital');

        if (!targetDoctor) return false;

        // Check if the doctor is associated with any of the admin's hospitals
        const isAssociated = targetDoctor.hospital.some(h => hospitalIds.includes(h.toString()));
        return isAssociated;
    }

    return false;
};

// ----------------------------------
// --- Doctor Blockout Endpoints ---
// ----------------------------------


/**
 * @route POST /api/blockouts
 * @description Creates a new blockout period for a doctor.
 * @access Protected (Admin, Hospital Admin, or Doctor-Self)
 */
doctorBlockoutRouter.post('/api/blockouts', authenticateToken, async (req, res) => {
    try {
        const { doctorId, reason, startDate, endDate, type } = req.body;

        // 1. Input Validation
        if (!doctorId || !reason || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing required fields: doctorId, reason, startDate, or endDate.' });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: 'Start date must be before end date.' });
        }

        // 2. Authorization Check
        if (!(await canManageBlockout(req.user, doctorId))) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to set blockouts for this doctor.' });
        }

        // 3. Create and Save
        const newBlockout = new DoctorBlockoutModel({
            doctorId,
            reason,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type: type // Schema will handle enum validation/default
        });

        const savedBlockout = await newBlockout.save();
        res.status(201).json({ message: 'Doctor blockout created successfully.', blockout: savedBlockout });

    } catch (error) {
        console.error('Error creating doctor blockout:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error creating blockout.', error: error.message });
    }
});


/**
 * @route GET /api/blockouts/:doctorId
 * @description Gets all blockout entries for a specific doctor.
 * @access Protected (Viewable by Admins, Doctors, Hospital Admins, and Patients for availability checks)
 */
doctorBlockoutRouter.get('/api/blockouts/:doctorId', authenticateToken, async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }

        // Authorization for viewing is permissive, as blockouts are needed for booking logic.
        let isAuthorized = req.user.role === 'admin' || req.user.role === 'doctor' || req.user.role === 'patient';

        // Hospital Admins check for association
        if (req.user.role === 'hospital_admin' && req.user.hospitalIds && req.user.hospitalIds.length > 0) {
            const UserModel = mongoose.model('User');
            const targetDoctor = await UserModel.findById(doctorId).select('hospital');
            if (targetDoctor && targetDoctor.hospital.some(h => req.user.hospitalIds.includes(h.toString()))) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to view this blockout information.' });
        }

        // Execute the query, sorting by startDate
        const blockouts = await DoctorBlockoutModel.find({ doctorId: doctorId }).sort({ startDate: 1 }).exec();

        res.status(200).json(blockouts);

    } catch (error) {
        console.error('Error fetching doctor blockouts:', error);
        res.status(500).json({ message: 'Internal server error fetching blockouts.', error: error.message });
    }
});

/**
 * @route PUT /api/blockouts/:id
 * @description Updates an existing blockout entry.
 * @access Protected (Admin, Hospital Admin, or Doctor-Self)
 */
doctorBlockoutRouter.put('/api/blockouts/:id', authenticateToken, async (req, res) => {
    try {
        const blockoutId = req.params.id;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(blockoutId)) {
            return res.status(400).json({ message: 'Invalid blockout ID format.' });
        }

        // 1. Find the existing blockout to check doctor ID
        const existingBlockout = await DoctorBlockoutModel.findById(blockoutId);
        if (!existingBlockout) {
            return res.status(404).json({ message: 'Doctor blockout entry not found.' });
        }

        const doctorId = existingBlockout.doctorId.toString();

        // 2. Authorization Check (Uses the doctorId found in the blockout)
        if (!(await canManageBlockout(req.user, doctorId))) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to modify this blockout.' });
        }

        // 3. Apply updates
        const updatedBlockout = await DoctorBlockoutModel.findByIdAndUpdate(
            blockoutId,
            { $set: updates },
            { new: true, runValidators: true } // Return new document and enforce schema validation
        );

        // Additional validation check for start/end dates after update
        if (updatedBlockout.startDate >= updatedBlockout.endDate) {
            // This rollback/error handling is simple; in production, you might need a transaction
            await DoctorBlockoutModel.findByIdAndUpdate(blockoutId, {
                startDate: existingBlockout.startDate,
                endDate: existingBlockout.endDate
            });
            return res.status(400).json({ message: 'Start date must be before end date.' });
        }

        res.status(200).json({ message: 'Doctor blockout updated successfully.', blockout: updatedBlockout });

    } catch (error) {
        console.error('Error updating doctor blockout:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error updating blockout.', error: error.message });
    }
});

/**
 * @route DELETE /api/blockouts/:id
 * @description Deletes a doctor blockout entry.
 * @access Protected (Admin, Hospital Admin, or Doctor-Self)
 */
doctorBlockoutRouter.delete('/api/blockouts/:id', authenticateToken, async (req, res) => {
    try {
        const blockoutId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(blockoutId)) {
            return res.status(400).json({ message: 'Invalid blockout ID format.' });
        }

        // 1. Find the existing blockout to check doctor ID
        const existingBlockout = await DoctorBlockoutModel.findById(blockoutId);
        if (!existingBlockout) {
            return res.status(404).json({ message: 'Doctor blockout entry not found.' });
        }

        const doctorId = existingBlockout.doctorId.toString();

        // 2. Authorization Check (Uses the doctorId found in the blockout)
        if (!(await canManageBlockout(req.user, doctorId))) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to delete this blockout.' });
        }

        // 3. Delete
        await DoctorBlockoutModel.findByIdAndDelete(blockoutId);

        res.status(200).json({ message: 'Doctor blockout deleted successfully.' });

    } catch (error) {
        console.error('Error deleting doctor blockout:', error);
        res.status(500).json({ message: 'Internal server error deleting blockout.', error: error.message });
    }
});

module.exports = doctorBlockoutRouter;
