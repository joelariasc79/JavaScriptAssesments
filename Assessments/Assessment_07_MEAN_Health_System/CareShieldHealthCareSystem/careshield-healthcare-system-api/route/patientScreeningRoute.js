// patientScreeningRoute.js

const express = require('express');
const patientScreeningRouter = express.Router({ strict: true, caseSensitive: true });
const mongoose = require('mongoose'); // <-- FIX 1: Import mongoose
const PatientScreeningModel = require('../dataModel/patientScreeningDataModel');
// NOTE: PatientModel is not used in the existing routes, but kept for completeness
// const PatientModel = require('../dataModel/userDataModel');
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
 * @description Get all Patient Screenings. Accessible to Admin/Doctor roles only.
 * @access Protected (Admin, Hospital Admin, Doctor)
 */
patientScreeningRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const requestingUserRole = req.user.role;

        // --- 🔒 AUTHORIZATION CHECK ---
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin' || requestingUserRole === 'doctor';

        if (!isAdminOrDoctor) {
            return res.status(403).json({ message: 'Forbidden. Only authorized staff can view all screening records.' });
        }
        // -----------------------------

        // FIX 2: Correct models and variable name (was HospitalModel)
        const screenings = await PatientScreeningModel.find({});
        res.status(200).json(screenings);
    } catch (error) {
        console.error('Error fetching patient screenings:', error);
        // FIX 3: Corrected error message
        res.status(500).json({ message: 'Internal server error fetching patient screenings.', error: error.message });
    }
});


/**
 * @route GET /api/patients/patientScreening/:patientId
 * @description Get all Patient Screenings by Patient ID. Accessible only to patient owner or staff.
 * @access Protected (Owner, Admin, Hospital Admin, or Doctor)
 */
patientScreeningRouter.get(`/:patientId`, authenticateToken, async (req, res) => {
    try {
        const targetPatientId = req.params.patientId;

        // FIX 4: Use req.user.id which is standard for decoded JWT payloads,
        // or ensure your middleware maps the ID to req.user._id
        // Assuming req.user contains { id: <userId>, role: <role> }
        const requestingUserId = req.user.id || req.user._id;

        const requestingUserRole = req.user.role; // Assuming role is available

        if (!mongoose.Types.ObjectId.isValid(targetPatientId)) {
            return res.status(400).json({ message: 'Invalid patient ID format.' });
        }

        // CRITICAL CHECK: Ensure the authenticated user ID is present before comparison
        if (!requestingUserId) {
            console.error("Auth payload missing user ID for comparison.");
            return res.status(401).json({ message: 'Authorization error: User ID not found in token payload.' });
        }

        // --- 🔒 AUTHORIZATION CHECK ---
        // The error likely occurred here because one side was undefined
        const isOwner = targetPatientId.toString() === requestingUserId.toString();

        const isPatient = (requestingUserRole === 'patient');
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin'
            || requestingUserRole === 'doctor';

        if (isPatient && !isOwner) {
            // A patient is trying to access another patient's records
            return res.status(403).json({ message: 'Forbidden. You can only view your own screening history.' });
        }

        if (!isAdminOrDoctor && !isOwner) {
            // Any other unauthorized user is trying to access this patient's records
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
 * NOTE: This route needs to be updated to use a different path if the previous route is active,
 * but since express matches more specific routes first, this is okay for now.
 */
patientScreeningRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const screeningId = req.params.id;
        const requestingUserId = req.user.id || req.user._id;
        const requestingUserRole = req.user.role;

        // 1. Validate the screening ID format
        if (!mongoose.Types.ObjectId.isValid(screeningId)) {
            return res.status(400).json({ message: 'Invalid screening ID format.' });
        }

        // 2. Fetch the specific screening document
        const patientScreening = await PatientScreeningModel.findById(screeningId);

        // 3. Handle 'Not Found' case
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

        // 4. Return the screening data
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

        // --- 🔒 AUTHORIZATION CHECK ---
        const isPatient = requestingUserRole === 'patient';

        if (!isPatient) {
            // Only the patient role is authorized to submit a new screening
            return res.status(403).json({ message: 'Forbidden. Only patients can create a new screening record.' });
        }
        // -----------------------------

        const { selectedDisease, chiefComplaint, symptomDescription, duration, currentMedications, painLevel } = req.body;

        // --- FIX: Transform the currentMedications string ---
        const medicationsArray = transformMedications(currentMedications);
        // --------------------------------------------------

        if (!chiefComplaint || !symptomDescription || !duration || painLevel === undefined) {
            return res.status(400).json({ message: 'Missing required screening fields (chief complaint, symptom description, duration, pain level).' });
        }

        const newPatientScreening = new PatientScreeningModel({
            patientId: requestingUserId,
            selectedDisease: selectedDisease || null,
            chiefComplaint,
            symptomDescription,
            duration,
            currentMedications: medicationsArray, // Use the transformed array
            painLevel,
            screeningStatus: 'submitted'
        });

        const savedPatientScreening = await newPatientScreening.save();
        res.status(201).json({ message: 'Patient Screening created successfully!', screening: savedPatientScreening });

    } catch (error) {
        console.error('Error creating Patient Screening:', error);
        if (error.name === 'ValidationError') {
            // You can optionally iterate over error.errors to send a more detailed response
            return res.status(400).json({ message: 'Validation failed for Patient Screening.', errors: error.errors });
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

        // --- FIX: Transform currentMedications if present in updates for PUT request ---
        if (updates.currentMedications) {
            updates.currentMedications = transformMedications(updates.currentMedications);
        }
        // ----------------------------------------------------------------------------

        // --- 🔒 AUTHORIZATION CHECK ---
        const ownerId = patientScreening.patientId;
        const isOwner = ownerId.toString() === requestingUserId.toString();
        const isAdminOrDoctor = requestingUserRole === 'admin' || requestingUserRole === 'hospital_admin' || requestingUserRole === 'doctor';

        if (!isOwner && !isAdminOrDoctor) {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to update this screening record.' });
        }

        // Restriction for patients: prevent changing status fields
        if (isOwner && !isAdminOrDoctor) {
            const restrictedFields = ['screeningStatus', 'appointmentId'];
            const disallowedUpdate = Object.keys(updates).some(key => restrictedFields.includes(key));

            if (disallowedUpdate) {
                return res.status(403).json({ message: 'Forbidden. As the patient, you cannot update status or appointment fields directly.' });
            }
        }
        // -----------------------------

        // Use the updates object which now contains the correctly formatted array (if medications were updated)
        const updatedScreening = await PatientScreeningModel.findByIdAndUpdate(
            screeningId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Patient Screening updated successfully.', screening: updatedScreening });

    } catch (error) {
        console.error(`Error updating patient Screening with ID ${req.params.id}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed.', errors: error.errors });
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