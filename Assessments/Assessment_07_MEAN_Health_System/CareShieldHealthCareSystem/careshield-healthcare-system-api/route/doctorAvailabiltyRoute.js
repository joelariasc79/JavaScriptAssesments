const express = require('express');
const mongoose = require('mongoose');
const doctorAvailabilityRouter = express.Router();

// const doctorAvailabilityRouter = express.Router({ strict: true, caseSensitive: true });

// Data models imports (assuming these paths are correct in your project)
const AppointmentModel = require('../dataModel/appointmentDataModel');
const DoctorBlockoutModel = require('../dataModel/doctorBlockoutDataModel');
const WeeklyScheduleModel = require('../dataModel/weeklyScheduleDataModel');


// Import authentication middleware
const { authenticateToken } = require('../middleware/authMiddleware');

// Define the roles allowed to check doctor availability
const ALLOWED_ROLES = ['patient', 'admin', 'hospital_admin', 'doctor'];


/**
 * Custom middleware to authorize users based on a list of allowed roles.
 * Checks if the authenticated patient's role is included in the provided array.
 * @param {Array<string>} allowedRoles - The roles permitted to access the resource.
 */
const authorizeMultipleRoles = (allowedRoles) => {
    return (req, res, next) => {
        // req.patient is populated by authenticateToken, which runs first
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Forbidden: User not authenticated or role missing from token payload.' });
        }

        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                message: 'Forbidden: Insufficient permissions. Required roles: ' + allowedRoles.join(', ')
            });
        }
    };
};

/**
 * Helper to convert "HH:MM" string (e.g., "09:30") to minutes past midnight.
 * This is used for comparing schedule times.
 * @param {string} timeStr - Time string in "HH:MM" format.
 * @returns {number} Minutes past midnight.
 */
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};


/**
 * @route GET /api/doctors/availability
 * @description Calculates and returns the available time slots for a specified doctor within a date range.
 * @queryParam doctorId (required)
 * @queryParam startDate (required, YYYY-MM-DD)
 * @queryParam endDate (required, YYYY-MM-DD)
 * @queryParam durationMinutes (optional, defaults to 30)
 * @access Protected (Roles: patient, admin, hospital_admin, doctor)
 */
doctorAvailabilityRouter.get('/slots', authenticateToken, authorizeMultipleRoles(ALLOWED_ROLES),
    async (req, res) => {
        try {
            // FIX: Retrieve doctorId, ensure it's a string, and TRIM any leading/trailing whitespace.
            const rawDoctorId = req.query.doctorId;
            const doctorId = typeof rawDoctorId === 'string' ? rawDoctorId.trim() : rawDoctorId;

            const { startDate, endDate, durationMinutes: durationQuery } = req.query;

            // 1. Input Validation
            if (!doctorId || !startDate || !endDate) {
                return res.status(400).json({ message: 'Missing required query parameters: doctorId, startDate, and endDate.' });
            }
            // This validation now uses the trimmed doctorId, which should resolve the 400 error.
            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return res.status(400).json({ message: 'Invalid Doctor ID format.' });
            }

            // Convert doctorId to ObjectId for all queries
            const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

            const start = new Date(startDate);
            const end = new Date(endDate);
            const duration = parseInt(durationQuery) || 30; // Default to 30 minutes

            if (isNaN(duration) || duration <= 0) {
                return res.status(400).json({ message: 'Invalid durationMinutes.' });
            }
            if (start > end) {
                return res.status(400).json({ message: 'Start date cannot be after end date.' });
            }

            // 2. Fetch all necessary data for the range
            // Fetch ALL WeeklySchedule documents for the doctor.
            const scheduleDocs = await WeeklyScheduleModel.find({ doctorId: doctorObjectId }).exec(); // Use doctorObjectId

            if (scheduleDocs.length === 0) {
                return res.status(200).json({ message: "Doctor's weekly schedule is not defined.", availableSlots: [] });
            }

            // Fetch blockouts that overlap the requested range
            const blockouts = await DoctorBlockoutModel.find({
                doctorId: doctorObjectId, // Use doctorObjectId
                startDate: { $lt: end }, // Blockout starts before the range ends
                endDate: { $gt: start }   // Blockout ends after the range starts
            }).exec();

            // Fetch pending/confirmed appointments that overlap the requested range
            const bookedAppointments = await AppointmentModel.find({
                doctorId: doctorObjectId, // Use doctorObjectId
                status: { $in: ['pending', 'confirmed'] },
                startTime: { $lt: end },
                endTime: { $gt: start }
            }).exec();

            const availableSlots = [];

            // 3. Iterate through each day in the range
            let currentDate = new Date(start);
            currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

            while (currentDate <= end) {
                // Use numeric day of week (0-6)
                const dayOfWeekIndex = currentDate.getDay();

                // Filter the complete set of schedule documents by the numeric day index.
                const daySchedules = scheduleDocs.filter(s => s.dayOfWeek === dayOfWeekIndex);

                // 4. Check each scheduled shift for the day
                for (const shift of daySchedules) {
                    const shiftStartMinutes = timeToMinutes(shift.startTime);
                    const shiftEndMinutes = timeToMinutes(shift.endTime);

                    // Initialize the slot check iterator for this shift
                    let slotStartMinutes = shiftStartMinutes;

                    while (slotStartMinutes + duration <= shiftEndMinutes) {
                        const slotEndMinutes = slotStartMinutes + duration;

                        // Calculate actual Date objects for the potential slot
                        const slotStartTime = new Date(currentDate);
                        slotStartTime.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0);

                        const slotEndTime = new Date(currentDate);
                        slotEndTime.setHours(Math.floor(slotEndMinutes / 60), slotEndMinutes % 60, 0, 0);

                        // --- Conflict Checking for the Slot ---
                        let isConflict = false;

                        // a. Check against Blockouts
                        for (const blockout of blockouts) {
                            // Conflict if: (SlotStart < BlockoutEnd) && (SlotEnd > BlockoutStart)
                            if (slotStartTime < blockout.endDate && slotEndTime > blockout.startDate) {
                                isConflict = true;
                                break;
                            }
                        }
                        if (isConflict) {
                            // Move iterator past the current slot
                            slotStartMinutes += duration;
                            continue;
                        }

                        // b. Check against Booked Appointments
                        for (const appt of bookedAppointments) {
                            // Conflict if: (SlotStart < ApptEnd) && (SlotEnd > ApptStart)
                            if (slotStartTime < appt.endTime && slotEndTime > appt.startTime) {
                                isConflict = true;
                                break;
                            }
                        }

                        // --- Add available slot ---
                        if (!isConflict) {
                            availableSlots.push({
                                startTime: slotStartTime.toISOString(),
                                endTime: slotEndTime.toISOString(),
                                durationMinutes: duration
                            });
                        }

                        // Move iterator to the next slot
                        slotStartMinutes += duration;
                    }
                }

                // Move to the next day
                currentDate.setDate(currentDate.getDate() + 1);
                currentDate.setHours(0, 0, 0, 0); // Keep it at start of day
            }

            res.status(200).json({ availableSlots });

        } catch (error) {
            console.error('Error calculating doctor availability:', error);
            res.status(500).json({ message: 'Internal server error calculating availability.', error: error.message });
        }
    });

/**
 * @route GET /api/doctors/availability/next
 * @description Calculates and returns the single closest available time slot for a specified doctor,
 * starting from the current moment.
 * @queryParam doctorId (required)
 * @queryParam durationMinutes (optional, defaults to 30)
 * @access Protected (Roles: patient, admin, hospital_admin, doctor)
 */
doctorAvailabilityRouter.get('/next', authenticateToken, authorizeMultipleRoles(ALLOWED_ROLES),
    async (req, res) => {
        try {
            const { doctorId, durationMinutes: durationQuery } = req.query;

            // 1. Input Validation
            if (!doctorId) {
                return res.status(400).json({ message: 'Missing required query parameter: doctorId.' });
            }

            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return res.status(400).json({ message: 'Invalid Doctor ID format.' });
            }

            // Convert the string doctorId into a Mongoose ObjectId for correct querying
            const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

            const duration = parseInt(durationQuery) || 30; // Default to 30 minutes
            if (isNaN(duration) || duration <= 0) {
                return res.status(400).json({ message: 'Invalid durationMinutes.' });
            }

            // Set search range
            const now = new Date();

            // Calculate the starting date: Today at midnight (00:00:00).
            // This is the base for iterating through days.
            let currentDate = new Date(now);
            currentDate.setHours(0, 0, 0, 0); // Normalize to midnight (start of today)

            // Search limit: 90 days from the current moment
            const endSearch = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            // 2. Fetch Schedule (Required for all checks)
            const scheduleDocs = await WeeklyScheduleModel.find({ doctorId: doctorObjectId }).exec();

            if (scheduleDocs.length === 0) {
                return res.status(200).json({ message: "Doctor's weekly schedule is not defined. Please check the WeeklySchedule collection for this doctorId.", nextAvailableSlot: null });
            }

            // 3. Fetch all current conflicts (appointments and blockouts) within the 90-day range
            // We use 'now' to filter out conflicts that have already ended.
            const blockouts = await DoctorBlockoutModel.find({
                doctorId: doctorObjectId,
                endDate: { $gt: now } // Only fetch conflicts that haven't ended yet
            }).exec();

            const bookedAppointments = await AppointmentModel.find({
                doctorId: doctorObjectId,
                status: { $in: ['pending', 'confirmed'] },
                endTime: { $gt: now } // Only fetch conflicts that haven't ended yet
            }).exec();

            // 4. Iterate through each day, starting from today
            while (currentDate <= endSearch) {
                // Use numeric day of week (0-6) which matches the schema definition.
                const dayOfWeekIndex = currentDate.getDay();

                // Filter the complete set of schedule documents by the numeric day index.
                const daySchedules = scheduleDocs.filter(s => s.dayOfWeek === dayOfWeekIndex);

                // 5. Check each scheduled shift for the day
                for (const shift of daySchedules) {
                    const shiftStartMinutes = timeToMinutes(shift.startTime);
                    const shiftEndMinutes = timeToMinutes(shift.endTime);

                    // Determine the starting point for checking slots on this day (minutes past midnight)
                    let slotStartMinutes = shiftStartMinutes;

                    // 6. Slot Iteration
                    while (slotStartMinutes + duration <= shiftEndMinutes) {
                        const slotEndMinutes = slotStartMinutes + duration;

                        // Calculate actual Date objects for the potential slot
                        const slotStartTime = new Date(currentDate);
                        slotStartTime.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0);

                        const slotEndTime = new Date(currentDate);
                        slotEndTime.setHours(Math.floor(slotEndMinutes / 60), slotEndMinutes % 60, 0, 0);

                        // Skip slots whose END TIME is in the past relative to NOW
                        if (slotEndTime <= now) {
                            slotStartMinutes += duration;
                            continue;
                        }

                        let isConflict = false;

                        // Check against Blockouts
                        for (const blockout of blockouts) {
                            if (slotStartTime < blockout.endDate && slotEndTime > blockout.startDate) {
                                isConflict = true;
                                break;
                            }
                        }
                        if (isConflict) {
                            // If there is a conflict, advance the slot iterator
                            slotStartMinutes += duration;
                            continue;
                        }

                        // Check against Booked Appointments
                        for (const appt of bookedAppointments) {
                            if (slotStartTime < appt.endTime && slotEndTime > appt.startTime) {
                                isConflict = true;
                                break;
                            }
                        }

                        // --- First Available Slot Found ---
                        if (!isConflict) {
                            return res.status(200).json({
                                message: 'Next available slot found.',
                                nextAvailableSlot: {
                                    startTime: slotStartTime.toISOString(),
                                    endTime: slotEndTime.toISOString(),
                                    durationMinutes: duration
                                }
                            });
                        }

                        // Move iterator to the next slot
                        slotStartMinutes += duration;
                    }
                }

                // Move to the next day
                currentDate.setDate(currentDate.getDate() + 1);
                currentDate.setHours(0, 0, 0, 0);
            }

            // If the loop finishes without finding a slot
            res.status(200).json({
                message: `No available slots found within the next 90 days starting from now.`,
                nextAvailableSlot: null
            });

        } catch (error) {
            console.error('Error calculating next doctor availability:', error);
            res.status(500).json({ message: 'Internal server error calculating next availability.', error: error.message });
        }
    });







// /**
//  * @route GET /api/doctors/availability/:id?date=YYYY-MM-DD
//  * @description Get a single hospital by ID. Accessible to all authenticated users.
//  * @access Protected (Any authenticated patient)
//  */
// hospitalRouter.get('/:id?date=YYYY-MM-DD', authenticateToken, async (req, res) => {
//     try {
//         const currentUser = req.patient;
//         const doctorId = req.params.id;
//
//         // 1. Validate if the ID is a valid MongoDB ObjectId
//         if (!mongoose.Types.ObjectId.isValid(userIdToFetch)) {
//             return res.status(400).json({ message: 'Invalid patient ID format.' });
//         }
//
//         // 2. Find the patient to be fetched
//         const userToFetch = await UserModel.findById(userIdToFetch).select('-password');
//         if (!userToFetch) {
//             return res.status(404).json({ message: 'User not found.' });
//         }
//
//         // 3. Implement granular authorization based on role
//         const isAdmin = currentUser.role === 'admin';
//         const isSelf = currentUser.userId.toString() === userIdToFetch;
//         const isHospitalStaff = currentUser.role === 'hospital_admin' || currentUser.role === 'doctor';
//
//         let canView = isAdmin || isSelf || isHospitalStaff;
//
//         if (!canView) {
//             return res.status(403).json({ message: 'Access denied. You do not have permission to view this patient profile.' });
//         }
//
//         // 5. Validate if the hospital ID is a valid MongoDB ObjectId
//         const hospitalId = req.patient.hospitalId;
//
//         // 6. Find the hospital to be fetched
//         if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
//             return res.status(400).json({ message: 'Invalid hospital ID format.' });
//         }
//         const hospital = await HospitalModel.findById(hospitalId);
//
//         if (!hospital) {
//             return res.status(404).json({ message: 'Hospital not found.' });
//         }
//
//
//
//         res.status(200).json(hospital);
//     } catch (error) {
//         console.error('Error fetching hospital:', error);
//         res.status(500).json({ message: 'Internal server error fetching hospital.', error: error.message });
//     }
// });

module.exports = doctorAvailabilityRouter;
