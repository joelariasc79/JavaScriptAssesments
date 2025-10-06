const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');
const AppointmentModel = require('../dataModel/appointmentDataModel');
const DoctorBlockoutModel = require('../dataModel/doctorBlockoutDataModel');
const WeeklyScheduleModel = require('../dataModel/weeklyScheduleDataModel');

// Create a new router instance for appointment routes
const appointmentRouter = express.Router({ strict: true, caseSensitive: true });

/* -------------------------------------------
 * Auxiliary Functions for Authorization & Conflict Check
 * ------------------------------------------- */

/**
 * Helper to convert "HH:MM" string (e.g., "09:30") to minutes past midnight.
 * This is used for comparing schedule times.
 * @param {string} timeStr - Time string in "HH:MM" format.
 * @returns {number} Minutes past midnight.
 */
const timeToMinutes = (timeStr) => {
    // timeStr is expected in "HH:MM" format
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Helper function to check for time conflicts (appointments, blockouts, AND weekly schedule).
 * @param {string} doctorId - The ID of the doctor to check.
 * @param {Date} startTime - The proposed start time.
 * @param {Date} endTime - The proposed end time.
 * @param {string|null} excludeAppointmentId - Optional ID of an appointment to exclude (for PUT updates).
 * @returns {Promise<string|null>} Conflict message if conflict exists, null otherwise.
 */
const checkTimeConflicts = async (doctorId, startTime, endTime, excludeAppointmentId = null) => {
    // 1. Check for conflicts with existing Appointments
    const appointmentQuery = {
        doctorId: doctorId,
        status: { $in: ['pending', 'confirmed'] }, // Only check against non-canceled appointments
        // Checks for overlap: (StartA < EndB) && (EndA > StartB)
        $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
    };

    if (excludeAppointmentId) {
        // Exclude the current appointment being updated
        appointmentQuery._id = { $ne: excludeAppointmentId };
    }

    const conflictingAppointment = await AppointmentModel.findOne(appointmentQuery).exec();
    if (conflictingAppointment) {
        return 'Time slot overlaps with an existing appointment.';
    }

    // 2. Check for conflicts with Doctor Blockouts
    const blockoutQuery = {
        doctorId: doctorId,
        // Checks for overlap: (StartA < EndB) && (EndA > StartB)
        $or: [
            { startDate: { $lt: endTime }, endDate: { $gt: startTime } }
        ]
    };
    const conflictingBlockout = await DoctorBlockoutModel.findOne(blockoutQuery).exec();
    if (conflictingBlockout) {
        return `Time slot falls within a doctor blockout period (Reason: ${conflictingBlockout.reason}).`;
    }

    // 3. NEW: Check for conflicts with Doctor's Weekly Schedule
    // ----------------------------------------------------------------------------------
    const dayIndex = startTime.getDay(); // 0 (Sunday) to 6 (Saturday)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dayIndex];

    // ASSUMPTION: WeeklyScheduleModel has a document per doctor, with a field named 'schedule'
    // that is an array of shifts: [{ dayOfWeek: 'Monday', startTime: 'HH:MM', endTime: 'HH:MM' }, ...]
    const doctorScheduleDoc = await WeeklyScheduleModel.findOne({ doctorId: doctorId }).exec();

    if (!doctorScheduleDoc || !doctorScheduleDoc.schedule) {
        // If the doctor has no defined schedule, it's safer to assume no availability.
        return `Doctor's weekly schedule has not been defined.`;
    }

    const daySchedules = doctorScheduleDoc.schedule.filter(s => s.dayOfWeek === dayOfWeek);

    if (daySchedules.length === 0) {
        return `Doctor is not scheduled to work on ${dayOfWeek}.`;
    }

    // Convert appointment times to minutes past midnight (00:00)
    const apptStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const apptEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    // Check if the appointment falls completely within ANY defined shift for that day
    const isWithinSchedule = daySchedules.some(schedule => {
        const shiftStartMinutes = timeToMinutes(schedule.startTime);
        const shiftEndMinutes = timeToMinutes(schedule.endTime);

        // Appointment is valid only if its start time is >= shift start AND its end time is <= shift end.
        return apptStartMinutes >= shiftStartMinutes && apptEndMinutes <= shiftEndMinutes;
    });

    if (!isWithinSchedule) {
        return `Proposed time slot falls outside the doctor's scheduled working hours on ${dayOfWeek}.`;
    }
    // ----------------------------------------------------------------------------------

    return null; // No conflicts found
};


/**
 * Helper function to check if the current user is authorized to manage a specific appointment.
 * Authorization logic for GET, PUT, DELETE.
 * @param {object} currentUser - The req.user object from the JWT payload.
 * @param {object} appointment - The Mongoose Appointment document.
 * @returns {boolean} True if authorized, false otherwise.
 */
const canAccessAppointment = (currentUser, appointment) => {
    const { role, userId, hospitalIds } = currentUser;

    // 1. Admin has full access
    if (role === 'admin') {
        return true;
    }

    // 2. Patient can only access their own appointments
    if (role === 'patient' && userId.toString() === appointment.patientId.toString()) {
        return true;
    }

    // 3. Doctor can access their own appointments
    if (role === 'doctor' && userId.toString() === appointment.doctorId.toString()) {
        return true;
    }

    // 4. Hospital Staff (Admin/Doctor) can access appointments linked to their associated hospitals
    if ((role === 'hospital_admin' || role === 'doctor') && hospitalIds && hospitalIds.length > 0) {
        // If the appointment has a hospitalId, check if it's one of the user's hospitals.
        if (appointment.hospitalId && hospitalIds.includes(appointment.hospitalId.toString())) {
            return true;
        }
        // NOTE: A more thorough check might involve fetching the doctor's primary hospital,
        // but for simplicity, we rely on the doctor's hospital affiliation checked during user fetch/login.
        // If the current user *is* the doctor (handled in point 3), this check is implicit.
    }

    return false;
};


/* -------------------------------------------
 * Appointment Endpoints
 * ------------------------------------------- */

/**
 * @route POST /api/appointments
 * @description Creates a new appointment.
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        let { doctorId, patientId, startTime, durationMinutes, reasonForVisit, hospitalId, notes } = req.body;
        const currentUser = req.user;

        // 1. Input Validation
        if (!doctorId || !patientId || !startTime || !durationMinutes || !reasonForVisit) {
            return res.status(400).json({ message: 'Missing required fields: doctorId, patientId, startTime, durationMinutes, or reasonForVisit.' });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid Doctor or Patient ID format.' });
        }

        const calculatedStartTime = new Date(startTime);
        const endTime = new Date(calculatedStartTime.getTime() + durationMinutes * 60000);

        // 2. Authorization (Who can book for whom?)
        if (currentUser.role === 'patient' && currentUser.userId.toString() !== patientId) {
            return res.status(403).json({ message: 'Patients can only book appointments for themselves.' });
        }
        // Hospital staff authorization (If staff books for someone, check doctor association)
        if (currentUser.role === 'hospital_admin' || currentUser.role === 'doctor') {
            const UserModel = mongoose.model('User');
            const doctor = await UserModel.findById(doctorId).select('hospital');
            if (!doctor || !doctor.hospital.some(h => currentUser.hospitalIds.includes(h.toString()))) {
                return res.status(403).json({ message: 'Access denied. You can only book appointments for doctors associated with your hospitals.' });
            }
        }

        // 3. Conflict Check
        const conflictMessage = await checkTimeConflicts(doctorId, calculatedStartTime, endTime);
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage });
        }

        // 4. Create and Save
        const newAppointment = new AppointmentModel({
            doctorId,
            patientId,
            startTime: calculatedStartTime,
            endTime: endTime,
            durationMinutes,
            reasonForVisit,
            hospitalId: hospitalId || null,
            notes
        });

        const savedAppointment = await newAppointment.save();
        res.status(201).json({ message: 'Appointment created successfully.', appointment: savedAppointment });

    } catch (error) {
        console.error('Error creating appointment:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A conflict occurred (possibly duplicate start time for doctor).' });
        }
        res.status(500).json({ message: 'Internal server error creating appointment.', error: error.message });
    }
});


/**
 * @route GET /api/appointments/:id
 * @description Gets a single appointment by ID.
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.get('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const appointmentId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }

        const appointment = await AppointmentModel.findById(appointmentId)
            .populate('doctorId', 'name specialty role')
            .populate('patientId', 'name contact_number role');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Authorization Check
        if (!canAccessAppointment(req.user, appointment)) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to view this appointment.' });
        }

        res.status(200).json(appointment);

    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ message: 'Internal server error fetching appointment.', error: error.message });
    }
});


/**
 * @route GET /api/appointments
 * @description Lists appointments based on user role and query filters.
 * @queryParam doctorId (optional)
 * @queryParam patientId (optional)
 * @queryParam status (optional)
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const { doctorId, patientId, status } = req.query;
        let query = {};

        // 1. Role-based Query Filtering (Security)
        switch (currentUser.role) {
            case 'admin':
                // Admins see all. Optional query params (doctorId/patientId) can refine the results.
                break;

            case 'doctor':
                // Doctors only see their own appointments.
                query.doctorId = currentUser.userId;
                break;

            case 'patient':
                // Patients only see their own appointments.
                query.patientId = currentUser.userId;
                break;

            case 'hospital_admin':
                // Hospital Admins see appointments for doctors associated with their hospitals.
                if (currentUser.hospitalIds && currentUser.hospitalIds.length > 0) {
                    const UserModel = mongoose.model('User');
                    // Find all doctor IDs associated with the Hospital Admin's hospitals
                    const associatedDoctors = await UserModel.find({
                        role: 'doctor',
                        hospital: { $in: currentUser.hospitalIds }
                    }).select('_id');

                    const doctorIds = associatedDoctors.map(doc => doc._id);
                    query.doctorId = { $in: doctorIds };
                } else {
                    // No hospitals associated, so no appointments to see
                    query.doctorId = { $in: [] };
                }
                break;

            default:
                return res.status(403).json({ message: 'Access denied.' });
        }

        // 2. Query Refinement (Filtering based on optional query params)
        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
            // If the user provided a doctorId, ensure it matches the user's role-based query if one exists.
            if (query.doctorId && query.doctorId !== doctorId) {
                // This handles cases like a Doctor (current user) trying to query another doctor's appointments
                return res.status(403).json({ message: 'Access denied. Cannot filter by an unauthorized doctor ID.' });
            }
            query.doctorId = doctorId;
        }

        if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
            // Same check for patientId
            if (query.patientId && query.patientId !== patientId) {
                return res.status(403).json({ message: 'Access denied. Cannot filter by an unauthorized patient ID.' });
            }
            query.patientId = patientId;
        }

        if (status) {
            // Ensure status is a valid enum value if provided (Mongoose will handle validation, but good practice to check)
            query.status = status;
        }

        // 3. Execute Query
        const appointments = await AppointmentModel.find(query)
            .sort({ startTime: 1 }) // Sort by upcoming appointments
            .populate('doctorId', 'name specialty role')
            .populate('patientId', 'name contact_number role')
            .exec();

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal server error fetching appointments.', error: error.message });
    }
});

/**
 * @route PUT /api/appointments/:id
 * @description Updates an existing appointment (e.g., reschedule, change status, add notes).
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const updates = req.body;
        const currentUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }

        // 1. Find the existing appointment
        const existingAppointment = await AppointmentModel.findById(appointmentId);
        if (!existingAppointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // 2. Authorization Check (Who can update?)
        if (!canAccessAppointment(currentUser, existingAppointment)) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to modify this appointment.' });
        }

        // 3. Role-based update restrictions
        if (currentUser.role === 'patient') {
            const allowedPatientUpdates = ['status', 'reasonForVisit', 'notes'];
            // Patients cannot change the doctor, patient, time, or duration.
            const unauthorizedUpdates = Object.keys(updates).filter(key => !allowedPatientUpdates.includes(key));

            if (unauthorizedUpdates.length > 0) {
                return res.status(403).json({ message: `Patients cannot modify fields: ${unauthorizedUpdates.join(', ')}.` });
            }
            // If patient sets status to anything other than a cancel state, restrict it.
            if (updates.status && updates.status !== 'canceled_by_patient') {
                return res.status(403).json({ message: 'Patients can only cancel (set status to canceled_by_patient).' });
            }
        }

        // 4. Handle time recalculation and conflict checking
        let calculatedStartTime = updates.startTime ? new Date(updates.startTime) : existingAppointment.startTime;
        let durationMinutes = updates.durationMinutes || existingAppointment.durationMinutes;

        // Only check for conflicts if time-related fields are updated
        if (updates.startTime || updates.durationMinutes) {
            const endTime = new Date(calculatedStartTime.getTime() + durationMinutes * 60000);

            if (calculatedStartTime >= endTime) {
                return res.status(400).json({ message: 'Start time must be before end time.' });
            }

            const conflictMessage = await checkTimeConflicts(
                existingAppointment.doctorId.toString(),
                calculatedStartTime,
                endTime,
                appointmentId // Exclude the appointment being updated
            );

            if (conflictMessage) {
                return res.status(409).json({ message: conflictMessage });
            }
            // Add calculated endTime and potentially updated startTime/duration back to updates object
            updates.endTime = endTime;
            updates.startTime = calculatedStartTime;
            updates.durationMinutes = durationMinutes;
        }

        // 5. Perform the update
        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('doctorId', 'name specialty role')
            .populate('patientId', 'name contact_number role');

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found after update.' });
        }

        res.status(200).json({ message: 'Appointment updated successfully.', appointment: updatedAppointment });

    } catch (error) {
        console.error('Error updating appointment:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Update failed due to a unique key conflict (e.g., duplicate start time).' });
        }
        res.status(500).json({ message: 'Internal server error updating appointment.', error: error.message });
    }
});


/**
 * @route DELETE /api/appointments/:id
 * @description Hard deletes an appointment. (Restricted, generally prefer status change via PUT).
 * @access Restricted (Admin Only)
 */
appointmentRouter.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            // Standard users should use PUT to change status to 'canceled_by_patient'/'canceled_by_doctor'.
            return res.status(403).json({ message: 'Access denied. Only administrators can permanently delete appointments.' });
        }

        const appointmentId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }

        const result = await AppointmentModel.findByIdAndDelete(appointmentId);

        if (!result) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        res.status(200).json({ message: 'Appointment deleted successfully.' });

    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ message: 'Internal server error deleting appointment.', error: error.message });
    }
});


module.exports = appointmentRouter;
