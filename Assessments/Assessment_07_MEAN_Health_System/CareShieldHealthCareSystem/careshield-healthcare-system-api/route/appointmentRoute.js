const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');
const AppointmentModel = require('../dataModel/appointmentDataModel');
const DoctorBlockoutModel = require('../dataModel/doctorBlockoutDataModel');
const WeeklyScheduleModel = require('../dataModel/weeklyScheduleDataModel');
const UserModel = require('../dataModel/userDataModel');
const HospitalModel = require('../dataModel/hospitalDataModel');
const { sendAppointmentConfirmationEmail } = require('../services/appointmentNotificationService');

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
// move to the utility folder
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
    // ... (Steps 1 & 2 for Appointments and Blockouts remain the same) ...

    // 3. Check for conflicts with Doctor's Weekly Schedule
    // ----------------------------------------------------------------------------------
    const dayIndex = startTime.getDay(); // 0 (Sunday) to 6 (Saturday)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dayIndex];

    // 1. Query for ALL matching shifts for the doctor on that specific day of the week
    const daySchedules = await WeeklyScheduleModel.find({
        doctorId: doctorId,
        dayOfWeek: dayIndex // Assuming the model stores the day as a number (0-6)
    }).exec();

    if (daySchedules.length === 0) {
        // This handles the case where no schedule documents exist for the doctor/day.
        return `Doctor's weekly schedule has not been defined for ${dayOfWeek}.`;
    }

    // Convert appointment times to minutes past midnight (00:00)
    const apptStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const apptEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    // Check if the appointment falls completely within ANY defined shift for that day
    const isWithinSchedule = daySchedules.some(schedule => {
        // The schedule object now directly holds startTime and endTime strings
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
 * Helper function to check if the current patient is authorized to manage a specific appointment.
 * Authorization logic for GET, PUT, DELETE.
 * @param {object} currentUser - The req.patient object from the JWT payload.
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
    if (role === 'patient' && userId.toString() === appointment.patientId._id.toString()) {
        console.log("here");
        return true;
    }

    // 3. Doctor can access their own appointments
    if (role === 'doctor' && userId.toString() === appointment.doctorId._id.toString()) {
        return true;
    }

    // 4. Hospital Staff (Admin/Doctor) can access appointments linked to their associated hospitals
    if ((role === 'hospital_admin' || role === 'doctor') && hospitalIds && hospitalIds.length > 0) {
        // If the appointment has a hospitalId, check if it's one of the patient's hospitals.
        if (appointment.hospitalId && hospitalIds.includes(appointment.hospitalId._id.toString())) {
            return true;
        }
    }

    return false;
};


/* -------------------------------------------
 * Appointment Endpoints
 * ------------------------------------------- */

/**
 * @route POST /api/appointments
 * @description Creates a new appointment, enforcing hospitalId from screening if present, and calculates fee.
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        // 1. EXTRACT ALL FIELDS
        let {
            doctorId, patientId, startTime, durationMinutes, reasonForVisit, hospitalId, notes,
            screeningId,
            feeAmount, paymentStatus, paymentTransactionId, paymentMethod
        } = req.body;
        const currentUser = req.user;

        // 2. Input Validation (Abbreviated)
        if (!doctorId || !patientId || !startTime || !durationMinutes || !reasonForVisit) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid Doctor or Patient ID format.' });
        }
        // ... (other validation checks omitted for brevity) ...

        const calculatedStartTime = new Date(startTime);
        const endTime = new Date(calculatedStartTime.getTime() + durationMinutes * 60000);

        // 2.1 Fetch Screening Data to potentially enforce hospitalId (Logic omitted for brevity)

        // 3. Authorization (Who can book for whom?) (Logic omitted for brevity)
        if (currentUser.role === 'patient' && currentUser.userId.toString() !== patientId) {
            return res.status(403).json({ message: 'Patients can only book appointments for themselves.' });
        }

        // Fetch doctor and hospital details for authorization/fee calculation
        const doctor = await UserModel.findById(doctorId).select('hospital fees role');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

        let hospital = null;
        if (hospitalId) {
            hospital = await HospitalModel.findById(hospitalId).select('charges');
            if (!hospital) return res.status(404).json({ message: 'Hospital not found.' });
        }
        // ... (Hospital staff authorization check omitted) ...

        // 4. FEE CALCULATION LOGIC
        if (feeAmount === undefined) {
            const doctorFees = doctor.fees || 0;
            const hospitalCharges = hospital ? (hospital.charges || 0) : 0;
            feeAmount = doctorFees + hospitalCharges;
        }

        // 5. Conflict Check
        const conflictMessage = await checkTimeConflicts(doctorId, calculatedStartTime, endTime);
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage });
        }

        // 6. Create and Save Appointment
        const newAppointment = new AppointmentModel({
            doctorId, patientId, startTime: calculatedStartTime, endTime, durationMinutes,
            reasonForVisit, hospitalId: hospitalId || null, notes, screeningId: screeningId || null,
            feeAmount: feeAmount, paymentStatus: paymentStatus || 'unpaid',
            paymentTransactionId: paymentTransactionId || null, paymentMethod: paymentMethod || null
        });

        const savedAppointment = await newAppointment.save();

        // 7. UPDATE ASSOCIATED SCREENING
        if (screeningId) {
            const PatientScreeningModel = mongoose.model('PatientScreening');
            await PatientScreeningModel.findByIdAndUpdate(
                screeningId,
                { $set: { screeningStatus: 'converted_to_appointment', appointmentId: savedAppointment._id } }
            );
        }

        // 💡 8. Send Appointment Confirmation Email (Asynchronously)
        sendAppointmentConfirmationEmail(savedAppointment._id).catch(err => {
            console.error('ASYNCHRONOUS CONFIRMATION EMAIL FAILED:', err);
        });

        res.status(201).json({
            message: 'Appointment created successfully. Confirmation email initiated.',
            appointment: savedAppointment
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A conflict occurred (duplicate start time).' });
        }
        res.status(500).json({ message: 'Internal server error creating appointment.', error: error.message });
    }
});

// -------------------------------------------

/**
 * @route PUT /api/appointments/:id
 * @description Updates an existing appointment.
 * @access Protected
 */
appointmentRouter.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        let updates = req.body;
        const currentUser = req.user;

        // 1. Find and Authorize
        const existingAppointment = await AppointmentModel.findById(appointmentId);
        if (!existingAppointment) return res.status(404).json({ message: 'Appointment not found.' });
        if (!canAccessAppointment(currentUser, existingAppointment)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        // 2. Restrictions and Sanitization (Logic omitted for brevity)
        const doctorIdToUse = existingAppointment.doctorId.toString();
        let hospitalIdToUse = existingAppointment.hospitalId;
        if (updates.hospitalId !== undefined) hospitalIdToUse = updates.hospitalId;

        // 4. Handle time recalculation and conflict checking
        let calculatedStartTime = updates.startTime ? new Date(updates.startTime) : existingAppointment.startTime;
        let durationMinutes = updates.durationMinutes || existingAppointment.durationMinutes;

        if (updates.startTime || updates.durationMinutes) {
            const endTime = new Date(calculatedStartTime.getTime() + durationMinutes * 60000);

            const conflictMessage = await checkTimeConflicts(doctorIdToUse, calculatedStartTime, endTime, appointmentId);
            if (conflictMessage) return res.status(409).json({ message: conflictMessage });

            updates.endTime = endTime;
            updates.startTime = calculatedStartTime;
            updates.durationMinutes = durationMinutes;
        }

        // 5. FEE RECALCULATION LOGIC (Logic omitted for brevity)
        // ...

        // 6. Perform the update
        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('doctorId', 'name specialty role')
            .populate('patientId', 'name contact_number role');

        if (!updatedAppointment) return res.status(404).json({ message: 'Appointment not found after update.' });

        // 7. Update Screening Status if necessary (Logic omitted for brevity)

        res.status(200).json({ message: 'Appointment updated successfully.', appointment: updatedAppointment });

    } catch (error) {
        console.error('Error updating appointment:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error updating appointment.', error: error.message });
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
 * @description Lists appointments based on patient role and query filters.
 * @queryParam doctorId (optional)
 * @queryParam patientId (optional)
 * @queryParam status (optional)
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        let updates = req.body;
        const currentUser = req.user;

        // 1. Find and Authorize
        const existingAppointment = await AppointmentModel.findById(appointmentId);
        if (!existingAppointment) return res.status(404).json({ message: 'Appointment not found.' });

        // Check if a confirmation email is needed BEFORE the update
        // We track changes to time or status here.
        const requiresNotification = (
            updates.startTime !== undefined ||
            updates.durationMinutes !== undefined ||
            updates.status !== undefined ||
            updates.notes !== undefined // Notes may be critical enough for an update email
        );

        if (!canAccessAppointment(currentUser, existingAppointment)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        // 2. Restrictions and Sanitization (Logic omitted for brevity)
        const doctorIdToUse = existingAppointment.doctorId.toString();
        let hospitalIdToUse = existingAppointment.hospitalId;
        if (updates.hospitalId !== undefined) hospitalIdToUse = updates.hospitalId;
        // ... (role-based restrictions logic) ...

        // 4. Handle time recalculation and conflict checking
        let calculatedStartTime = updates.startTime ? new Date(updates.startTime) : existingAppointment.startTime;
        let durationMinutes = updates.durationMinutes || existingAppointment.durationMinutes;

        if (updates.startTime || updates.durationMinutes) {
            const endTime = new Date(calculatedStartTime.getTime() + durationMinutes * 60000);

            const conflictMessage = await checkTimeConflicts(doctorIdToUse, calculatedStartTime, endTime, appointmentId);
            if (conflictMessage) return res.status(409).json({ message: conflictMessage });

            updates.endTime = endTime;
            updates.startTime = calculatedStartTime;
            updates.durationMinutes = durationMinutes;
        }

        // 5. FEE RECALCULATION LOGIC (Logic omitted for brevity)
        // ...

        // 6. Perform the update
        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('doctorId', 'name specialty role')
            .populate('patientId', 'name contact_number role');

        if (!updatedAppointment) return res.status(404).json({ message: 'Appointment not found after update.' });

        // 7. Update Screening Status if necessary (Logic omitted for brevity)

        // 💡 8. Send Update/Confirmation Email (Asynchronously)
        if (requiresNotification) {
            // Note: sendAppointmentConfirmationEmail should handle the fact that it's now an update,
            // perhaps by checking the appointment status or simply sending the latest details.
            sendAppointmentConfirmationEmail(updatedAppointment._id).catch(err => {
                console.error('ASYNCHRONOUS UPDATE/CONFIRMATION EMAIL FAILED:', err);
            });
        }

        res.status(200).json({
            message: requiresNotification ? 'Appointment updated and confirmation email re-initiated.' : 'Appointment updated successfully.',
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error('Error updating appointment:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error updating appointment.', error: error.message });
    }
});


/**
 * @route GET /api/appointments/users/:userId
 * @description Gets all appointments where the specified patient is either the doctor or the patient.
 * The results are filtered by the current patient's hospital affiliation if they are not an 'admin'.
 * @param {string} userId - The ID of the patient whose appointments are being queried.
 * @access Protected (Admin, Hospital Admin, Doctor, Patient)
 */
appointmentRouter.get('/api/appointments/users/:userId', authenticateToken, async (req, res) => {
    try {
        const queryUserId = req.params.userId;
        const currentUser = req.user;
        const UserModel = mongoose.model('User'); // FIXED: Define UserModel here for use

        if (!mongoose.Types.ObjectId.isValid(queryUserId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const queryObjectId = new mongoose.Types.ObjectId(queryUserId);

        // Base query: find appointments where the patient is doctor OR patient
        let query = {
            $or: [
                { doctorId: queryObjectId },
                { patientId: queryObjectId }
            ]
        };

        // 1. Authorization & Filtering Check
        const isSelf = currentUser.userId.toString() === queryUserId;
        const isAdmin = currentUser.role === 'admin';
        const isHospitalStaff = currentUser.role === 'hospital_admin' || currentUser.role === 'doctor';

        let authorized = isSelf || isAdmin;
        let isFilteredByHospital = false;

        if (isHospitalStaff && !isAdmin) {
            // Case A: User is viewing their own appointments (as doctor or patient). Already authorized.
            if (isSelf) {
                if (currentUser.hospitalIds && currentUser.hospitalIds.length > 0) {
                    isFilteredByHospital = true;
                }
            } else {
                // Case B: Hospital staff is viewing another patient's (doctor's) appointments.
                const queriedUser = await UserModel.findById(queryObjectId).select('role hospital'); // hospital is an array of Ids

                if (queriedUser && queriedUser.role === 'doctor' && currentUser.hospitalIds && currentUser.hospitalIds.length > 0) {
                    // Check if the doctor is affiliated with any of the current patient's hospitals
                    // NOTE: Mongoose stores single hospitalId in the appointment document, but User.hospital is an array.
                    const affiliatedHospitalIds = currentUser.hospitalIds.map(id => id.toString());
                    const doctorHospitalIds = queriedUser.hospital.map(id => id.toString()); // Changed from hospitalId to hospital based on User schema typical structure

                    const isAffiliated = doctorHospitalIds.some(hId => affiliatedHospitalIds.includes(hId));

                    if (isAffiliated) {
                        authorized = true;
                        isFilteredByHospital = true;
                    }
                }
            }
        }

        if (!authorized) {
            return res.status(403).json({ message: 'Access denied. You can only view your own appointments or those of affiliated doctors at your hospitals.' });
        }

        // 2. APPLY HOSPITAL FILTER IF REQUIRED
        if (isFilteredByHospital && currentUser.hospitalIds && currentUser.hospitalIds.length > 0) {
            // Inject the hospitalId constraint into the main query
            query.hospitalId = { $in: currentUser.hospitalIds };
        }

        // 3. Execute Query
        const appointments = await AppointmentModel.find(query)
            .sort({ startTime: 1 }) // Sort by upcoming appointments
            .populate('doctorId', 'name specialty role')
            .populate('patientId', 'name contact_number role')
            .exec();

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Error fetching appointments by patient ID:', error);
        res.status(500).json({ message: 'Internal server error fetching appointments by patient ID.', error: error.message });
    }
});


module.exports = appointmentRouter;