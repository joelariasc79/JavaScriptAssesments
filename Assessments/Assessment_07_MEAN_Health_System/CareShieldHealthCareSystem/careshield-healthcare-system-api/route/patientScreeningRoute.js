const express = require('express');
const patientScreeningRouter = express.Router({ strict: true, caseSensitive: true });
const mongoose = require('mongoose');
const PatientScreeningModel = require('../dataModel/patientScreeningDataModel');
const { authenticateToken } = require('../middleware/authMiddleware');


// --- HELPER FUNCTION TO TRANSFORM MEDICATION STRING ---
const transformMedications = (medicationString) => {
    if (!medicationString || typeof medicationString !== 'string') {
        return [];
    }

    return medicationString.split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => ({ name })); // Converts to array of { name: '...' } objects
};


/**
 * @route GET /api/patients/patientScreening
 * @description Get all Patient Screenings (System-wide).
 * @access Protected (Admin, Hospital Admin, Doctor)
 */
patientScreeningRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const requestingUserRole = req.user.role;
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin' || requestingUserRole === 'doctor';

        if (!isAdminOrDoctor) {
            return res.status(403).json({ message: 'Forbidden. Only authorized staff can view all screening records.' });
        }

        const screenings = await PatientScreeningModel.find({});
        res.status(200).json(screenings);
    } catch (error) {
        console.error('Error fetching patient screenings:', error);
        res.status(500).json({ message: 'Internal server error fetching patient screenings.', error: error.message });
    }
});


/**
 * @route GET /api/patients/patientScreening/my-hospital-screenings
 * @description Get all Patient Screenings for the currently logged-in Patient,
 * scoped by their currently selected hospital.
 * @access Protected (Patient)
 */
patientScreeningRouter.get('/my-hospital-screenings', authenticateToken, async (req, res) => {
    try {
        const patientId = req.user.id || req.user._id;
        // Use the hospital the patient is currently "logged into"
        const currentHospitalId = req.user.selectedHospitalId;

        // 1. Basic Validation & Authorization
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Forbidden. This endpoint is for patients only.' });
        }

        if (!currentHospitalId || !mongoose.Types.ObjectId.isValid(currentHospitalId)) {
            return res.status(400).json({
                message: 'Hospital scope error: Current patient is not logged into a valid hospital context.'
            });
        }

        // 2. Execute the Scoped Query
        // Filters by patient and the hospital context the patient is currently using.
        const screenings = await PatientScreeningModel.find({
            patientId: patientId,
            hospitalId: currentHospitalId // Requires hospitalId field in the Screening Schema
        })
            .sort({ createdAt: -1 });

        res.status(200).json(screenings);

    } catch (error) {
        console.error('Error fetching patient hospital-scoped screenings:', error);
        res.status(500).json({
            message: 'Internal server error fetching hospital-scoped patient screenings.',
            error: error.message
        });
    }
});


/**
 * @route GET /api/patients/patientScreening/my-hospital-open-screenings
 * @description Get Patient Screenings (submitted, reviewed, referred) for the logged-in Patient,
 * scoped by their currently selected hospital. These are "open" or actionable screenings.
 * @access Protected (Patient)
 */
patientScreeningRouter.get('/my-hospital-open-screenings', authenticateToken, async (req, res) => {
    try {
        const patientId = req.user.id || req.user._id;
        const currentHospitalId = req.user.selectedHospitalId;

        // 1. Basic Validation & Authorization
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Forbidden. This endpoint is for patients only.' });
        }

        if (!currentHospitalId || !mongoose.Types.ObjectId.isValid(currentHospitalId)) {
            return res.status(400).json({
                message: 'Hospital scope error: Current patient is not logged into a valid hospital context.'
            });
        }

        // 2. Execute the Scoped Query, filtering out archived and converted appointments
        const screenings = await PatientScreeningModel.find({
            patientId: patientId,
            hospitalId: currentHospitalId,
            // Only return screenings that are NOT archived and NOT converted
            screeningStatus: {
                $nin: ['archived', 'converted_to_appointment']
            }
        })
            .sort({ createdAt: -1 });

        res.status(200).json(screenings);

    } catch (error) {
        console.error('Error fetching patient open hospital-scoped screenings:', error);
        res.status(500).json({
            message: 'Internal server error fetching open hospital-scoped patient screenings.',
            error: error.message
        });
    }
});


/**
 * http://localhost:9200/api/patients/patientScreening/68e48bc78e62b8160bc0ccaf
 * @route GET /api/patients/patientScreening/:patientId
 * @description Get all Patient Screenings by a specific Patient ID.
 * @access Protected (Owner, Admin, Hospital Admin, or Doctor)
 */
patientScreeningRouter.get(`/patients/:patientId`, authenticateToken, async (req, res) => {
    try {
        const targetPatientId = req.params.patientId;
        const requestingUserId = req.user.id || req.user._id;
        const requestingUserRole = req.user.role;

        if (!mongoose.Types.ObjectId.isValid(targetPatientId)) {
            return res.status(400).json({ message: 'Invalid patient ID format.' });
        }

        // --- 🔒 AUTHORIZATION CHECK (Simplified) ---
        const isOwner = targetPatientId.toString() === requestingUserId.toString();
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin' || requestingUserRole === 'doctor';

        if (!isAdminOrDoctor && !isOwner) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        // -----------------------------

        const patientScreenings = await PatientScreeningModel.find({ patientId: targetPatientId });
        res.status(200).json(patientScreenings);

    } catch (error) {
        console.error('Error fetching patient Screening:', error);
        res.status(500).json({ message: 'Internal server error fetching patient screening.', error: error.message });
    }
});


/**
 * @route GET /api/patients/patientScreening/:id
 * @description Get a single Patient Screening by its unique Screening ID (_id).
 * @access Protected (Owner, Admin, Hospital Admin, or Doctor)
 */
patientScreeningRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const screeningId = req.params.id;
        const requestingUserId = req.user.id || req.user._id;
        const requestingUserRole = req.user.role;

        if (!mongoose.Types.ObjectId.isValid(screeningId)) {
            return res.status(400).json({ message: 'Invalid screening ID format.' });
        }

        const patientScreening = await PatientScreeningModel.findById(screeningId);

        if (!patientScreening) {
            return res.status(404).json({ message: 'Patient Screening not found.' });
        }

        // --- 🔒 AUTHORIZATION CHECK ---
        const ownerId = patientScreening.patientId;
        const isOwner = ownerId.toString() === requestingUserId.toString();
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin'
            || requestingUserRole === 'doctor';

        if (!isOwner && !isAdminOrDoctor) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to view this screening record.' });
        }
        // -----------------------------

        res.status(200).json(patientScreening);

    } catch (error) {
        console.error(`Error fetching patient Screening with ID ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.path === '_id') {
            return res.status(400).json({ message: 'Invalid screening ID format.' });
        }
        res.status(500).json({ message: 'Internal server error fetching patient screening.', error: error.message });
    }
});


/**
 * @route POST /api/patients/patientScreening
 * @description Post a Patient Screening
 * @access Protected (Patient)
 */
patientScreeningRouter.post('/', authenticateToken, async (req, res) => {
    try {
        const requestingUserId = req.user.id || req.user._id;
        const requestingUserRole = req.user.role;
        // Get the hospital the patient is currently "logged into"
        const currentHospitalId = req.user.selectedHospitalId;

        // --- 🔒 AUTHORIZATION CHECK ---
        if (requestingUserRole !== 'patient') {
            return res.status(403).json({ message: 'Forbidden. Only patients can create a new screening record.' });
        }

        // --- 🛑 CRITICAL HOSPITAL SCOPE CHECK ---
        if (!currentHospitalId || !mongoose.Types.ObjectId.isValid(currentHospitalId)) {
            return res.status(400).json({ message: 'Hospital context required to submit screening.' });
        }
        // -----------------------------

        const { selectedDisease, chiefComplaint, symptomDescription, duration, currentMedications, painLevel } = req.body;
        const medicationsArray = transformMedications(currentMedications);

        if (!chiefComplaint || !symptomDescription || !duration || painLevel === undefined) {
            return res.status(400).json({ message: 'Missing required screening fields.' });
        }

        const newPatientScreening = new PatientScreeningModel({
            patientId: requestingUserId,
            hospitalId: currentHospitalId, // 🌟 FIX: Include the hospital ID
            selectedDisease: selectedDisease || null,
            chiefComplaint,
            symptomDescription,
            duration,
            currentMedications: medicationsArray,
            painLevel,
            screeningStatus: 'submitted'
        });

        const savedPatientScreening = await newPatientScreening.save();
        res.status(201).json({ message: 'Patient Screening created successfully!', screening: savedPatientScreening });

    } catch (error) {
        console.error('Error creating Patient Screening:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed for Patient Screening.', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error during Patient Screening creation.', error: error.message });
    }
});

/**
 * @route PUT /api/patients/patientScreening/:id
 * @description Update an existing Patient Screening by its unique Screening ID (_id).
 * @access Protected (Owner, Admin, Hospital Admin, or Doctor)
 */
patientScreeningRouter.put('/:id', authenticateToken, async (req, res) => {
    try {
        const screeningId = req.params.id;
        const requestingUserId = req.user.id || req.user._id;
        const requestingUserRole = req.user.role;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(screeningId)) {
            return res.status(400).json({ message: 'Invalid screening ID format.' });
        }

        const patientScreening = await PatientScreeningModel.findById(screeningId);

        if (!patientScreening) {
            return res.status(404).json({ message: 'Patient Screening not found.' });
        }

        // --- Authorization Setup ---
        const ownerId = patientScreening.patientId;
        const isOwner = ownerId.toString() === requestingUserId.toString();
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin' || requestingUserRole === 'doctor';

        if (!isOwner && !isAdminOrDoctor) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to update this screening record.' });
        }

        // --- Input Cleaning & Restrictions ---
        if (updates.currentMedications) {
            updates.currentMedications = transformMedications(updates.currentMedications);
        }

        // 🛑 PREVENT HOSPITAL ID UPDATE: Do not allow changing the hospital ID post-creation.
        // This ensures the screening remains tied to its original hospital context.
        delete updates.hospitalId;

        // Restriction for patients: prevent changing status fields
        if (isOwner && !isAdminOrDoctor) {
            const restrictedFields = ['screeningStatus', 'appointmentId'];
            const disallowedUpdate = Object.keys(updates).some(key => restrictedFields.includes(key));

            if (disallowedUpdate) {
                return res.status(403).json({ message: 'Forbidden. As the patient, you cannot update status or appointment fields directly.' });
            }
        }
        // -----------------------------

        const updatedScreening = await PatientScreeningModel.findByIdAndUpdate(
            screeningId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Patient Screening updated successfully.', screening: updatedScreening });

    } catch (error) {
        console.error(`Error updating patient Screening with ID ${req.params.id}:`, error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed.', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error during Patient Screening update.', error: error.message });
    }
});

/**
 * @route DELETE /api/patients/patientScreening/:id
 * @description Delete an existing Patient Screening by its unique Screening ID (_id).
 * @access Protected (Owner, Admin, Hospital Admin, or Doctor)
 */
patientScreeningRouter.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const screeningId = req.params.id;
        const requestingUserId = req.user.id || req.user._id;
        const requestingUserRole = req.user.role;

        if (!mongoose.Types.ObjectId.isValid(screeningId)) {
            return res.status(400).json({ message: 'Invalid screening ID format.' });
        }

        const patientScreening = await PatientScreeningModel.findById(screeningId);

        if (!patientScreening) {
            return res.status(204).send();
        }

        // --- 🔒 AUTHORIZATION CHECK ---
        const ownerId = patientScreening.patientId;
        const isOwner = ownerId.toString() === requestingUserId.toString();
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin' || requestingUserRole === 'doctor';

        if (!isOwner && !isAdminOrDoctor) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to delete this screening record.' });
        }
        // -----------------------------

        await PatientScreeningModel.findByIdAndDelete(screeningId);

        res.status(204).send();

    } catch (error) {
        console.error(`Error deleting patient Screening with ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Internal server error during Patient Screening deletion.', error: error.message });
    }
});


module.exports = patientScreeningRouter;