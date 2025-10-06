const express = require('express');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { authenticateToken } = require('../middleware/authMiddleware'); // Assuming this path is correct
const WeeklyScheduleModel = require('../dataModel/weeklyScheduleDataModel'); // Assumes this models is defined and imported

// Create a new router instance for scheduling routes
const weeklyScheduleRouter = express.Router({ strict: true, caseSensitive: true });

/* -------------------------------------------
 * 1. Schema Reminder (based on user context)
 * -------------------------------------------
 * The models fields expected for WeeklyScheduleModel:
 * - doctorId (ObjectId, ref: 'User')
 * - dayOfWeek (Number, 0-6)
 * - startTime (String)
 * - endTime (String)
 * - slotDuration (Number, default: 30)
 * ------------------------------------------- */


/**
 * Helper function to check if the current user can modify the schedule of a given doctor.
 * This function encapsulates the authorization logic for POST, PUT, and DELETE.
 * @param {object} currentUser - The req.user object from the JWT payload.
 * @param {string} targetDoctorId - The ID of the doctor whose schedule is being modified.
 * @returns {boolean} True if authorized, false otherwise.
 */
const canManageSchedule = async (currentUser, targetDoctorId) => {
    const { role, userId, hospitalIds } = currentUser;

    // 1. Admin can manage any schedule
    if (role === 'admin') {
        return true;
    }

    // 2. Doctor can only manage their own schedule
    if (role === 'doctor' && userId.toString() === targetDoctorId) {
        return true;
    }

    // 3. Hospital Admin can manage doctors associated with their hospitals
    if (role === 'hospital_admin' && hospitalIds && hospitalIds.length > 0) {
        // Find the target doctor to check their hospital affiliation
        // We use mongoose.models('User') assuming 'User' is the models name for doctors/patients
        const targetDoctor = await mongoose.model('User').findById(targetDoctorId).select('hospital');
        if (!targetDoctor) return false;

        const isAssociated = targetDoctor.hospital.some(h => hospitalIds.includes(h.toString()));
        return isAssociated;
    }

    return false;
};

// ----------------------------------
// --- Weekly Schedule Endpoints ---
// ----------------------------------


/**
 * @route POST /api/schedules
 * @description Creates a new weekly schedule entry (recurring work shift) for a doctor.
 * @access Protected (Admin, Hospital Admin, or Doctor-Self)
 */
weeklyScheduleRouter.post('/api/schedules', authenticateToken, async (req, res) => {
    try {
        const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

        // 1. Input Validation
        if (!doctorId || dayOfWeek === undefined || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required fields: doctorId, dayOfWeek, startTime, or endTime.' });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }
        if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
            return res.status(400).json({ message: 'dayOfWeek must be a number between 0 (Sunday) and 6 (Saturday).' });
        }

        // 2. Authorization Check
        if (!(await canManageSchedule(req.user, doctorId))) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to set this doctor\'s schedule.' });
        }

        // 3. Create and Save
        const newSchedule = new WeeklyScheduleModel({
            doctorId,
            dayOfWeek,
            startTime,
            endTime,
            slotDuration: slotDuration || 30 // Use default if not provided
        });

        const savedSchedule = await newSchedule.save();
        res.status(201).json({ message: 'Weekly schedule created successfully.', schedule: savedSchedule });

    } catch (error) {
        console.error('Error creating weekly schedule:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A schedule already exists for this doctor on this day of the week.' });
        }
        res.status(500).json({ message: 'Internal server error creating schedule.', error: error.message });
    }
});


/**
 * @route GET /api/schedules/:doctorId
 * @description Gets all weekly schedule entries for a specific doctor.
 * @access Protected (Viewable by Admins, Doctors, Hospital Admins, and Patients for booking)
 */
weeklyScheduleRouter.get('/api/schedules/:doctorId', authenticateToken, async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }

        // Authorization for viewing is more permissive than editing/creation, as schedules are needed for booking.
        let isAuthorized = req.user.role === 'admin' || req.user.role === 'doctor' || req.user.role === 'patient';

        // Hospital Admins check for association
        if (req.user.role === 'hospital_admin' && req.user.hospitalIds && req.user.hospitalIds.length > 0) {
            const targetDoctor = await mongoose.model('User').findById(doctorId).select('hospital');
            if (targetDoctor && targetDoctor.hospital.some(h => req.user.hospitalIds.includes(h.toString()))) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to view this schedule.' });
        }


        // Execute the query, sorting by day of week for clean calendar display
        const schedules = await WeeklyScheduleModel.find({ doctorId: doctorId }).sort({ dayOfWeek: 1 }).exec();

        res.status(200).json(schedules);

    } catch (error) {
        console.error('Error fetching weekly schedules:', error);
        res.status(500).json({ message: 'Internal server error fetching schedules.', error: error.message });
    }
});

/**
 * @route PUT /api/schedules/:id
 * @description Updates an existing weekly schedule entry.
 * @access Protected (Admin, Hospital Admin, or Doctor-Self)
 */
weeklyScheduleRouter.put('/api/schedules/:id', authenticateToken, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({ message: 'Invalid schedule ID format.' });
        }

        // 1. Find the existing schedule to check doctor ID
        const existingSchedule = await WeeklyScheduleModel.findById(scheduleId);
        if (!existingSchedule) {
            return res.status(404).json({ message: 'Weekly schedule entry not found.' });
        }

        const doctorId = existingSchedule.doctorId.toString();

        // 2. Authorization Check (Uses the doctorId found in the schedule)
        if (!(await canManageSchedule(req.user, doctorId))) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to modify this schedule.' });
        }

        // 3. Apply updates
        const updatedSchedule = await WeeklyScheduleModel.findByIdAndUpdate(
            scheduleId,
            { $set: updates },
            { new: true, runValidators: true } // Return new document and enforce schema validation
        );

        res.status(200).json({ message: 'Weekly schedule updated successfully.', schedule: updatedSchedule });

    } catch (error) {
        console.error('Error updating weekly schedule:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Update failed: A schedule already exists for this doctor on the specified day of the week.' });
        }
        res.status(500).json({ message: 'Internal server error updating schedule.', error: error.message });
    }
});

/**
 * @route DELETE /api/schedules/:id
 * @description Deletes a weekly schedule entry.
 * @access Protected (Admin, Hospital Admin, or Doctor-Self)
 */
weeklyScheduleRouter.delete('/api/schedules/:id', authenticateToken, async (req, res) => {
    try {
        const scheduleId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({ message: 'Invalid schedule ID format.' });
        }

        // 1. Find the existing schedule to check doctor ID
        const existingSchedule = await WeeklyScheduleModel.findById(scheduleId);
        if (!existingSchedule) {
            return res.status(404).json({ message: 'Weekly schedule entry not found.' });
        }

        const doctorId = existingSchedule.doctorId.toString();

        // 2. Authorization Check (Uses the doctorId found in the schedule)
        if (!(await canManageSchedule(req.user, doctorId))) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to delete this schedule.' });
        }

        // 3. Delete
        await WeeklyScheduleModel.findByIdAndDelete(scheduleId);

        res.status(200).json({ message: 'Weekly schedule deleted successfully.' });

    } catch (error) {
        console.error('Error deleting weekly schedule:', error);
        res.status(500).json({ message: 'Internal server error deleting schedule.', error: error.message });
    }
});

module.exports = weeklyScheduleRouter;
