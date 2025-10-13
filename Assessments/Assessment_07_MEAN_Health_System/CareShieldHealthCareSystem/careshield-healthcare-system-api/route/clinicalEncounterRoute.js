const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const ClinicalEncounterModel = require('../dataModel/clinicalEncounterDataModel');
const AppointmentModel = require('../dataModel/appointmentDataModel');

// Using the provided router name `clinicalEncounterRouter`
const clinicalEncounterRouter = express.Router();

/* -------------------------------------------
 * Auxiliary Functions for Authorization
 * ------------------------------------------- */

/**
 * Helper function to check if the current patient is authorized to access a Clinical Encounter.
 * NOTE: For Doctors/Hospital Admins, access is restricted to the currently selected hospital.
 * @param {object} currentUser - The req.patient object from the JWT payload.
 * @param {object} encounter - The Mongoose ClinicalEncounter document.
 * @returns {boolean} True if authorized, false otherwise.
 */
const canAccessEncounter = (currentUser, encounter) => {
    const { role, userId, selectedHospitalId } = currentUser;
    const userIdStr = userId.toString();

    // 1. Admin has full access
    if (role === 'admin') {
        return true;
    }

    // 2. Doctor: Can access encounters they created
    if (role === 'doctor' && encounter.doctorId && userIdStr === encounter.doctorId._id.toString()) {
        return true;
    }

    // 3. Patient: Can access encounters concerning them
    if (role === 'patient' && encounter.patientId && userIdStr === encounter.patientId._id.toString()) {
        return true;
    }

    // 4. Hospital Staff/Admin: Can access encounters at their selected hospital
    if ((role === 'hospital_admin' || role === 'doctor') && selectedHospitalId) {
        // Check if the encounter's hospital matches the patient's currently selected hospital
        if (encounter.hospitalId && selectedHospitalId === encounter.hospitalId._id.toString()) {
            return true;
        }
    }

    return false;
};

/* -------------------------------------------
 * Clinical Encounter Endpoints (CRUD)
 * ------------------------------------------- */

/**
 * @route POST /api/clinical-encounters
 * @description Creates a new clinical encounter record tied to a completed appointment.
 * @access Protected (Doctor only)
 */
clinicalEncounterRouter.post('/api/clinical-encounters', authenticateToken, authorizeRole('doctor'), async (req, res) => {
    try {
        const { appointmentId, diagnosis, physicianNotes, recommendations, prescriptions, status } = req.body;
        const doctorId = req.user.userId;

        // 1. Basic Validation
        if (!appointmentId || !diagnosis || !physicianNotes) {
            return res.status(400).json({ message: 'Missing required fields: appointmentId, diagnosis, and physicianNotes.' });
        }
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }

        // 2. Verify Appointment and Doctor match
        const appointment = await AppointmentModel.findById(appointmentId)
            .select('patientId doctorId hospitalId status startTime endTime durationMinutes reasonForVisit')
            .lean(); // <-- FIX: Use .lean() to get a plain JS object and avoid validation errors when copying required fields

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Ensure the doctor creating the encounter is the doctor assigned to the appointment
        if (appointment.doctorId.toString() !== doctorId) {
            return res.status(403).json({ message: 'Forbidden: You are not the doctor assigned to this appointment.' });
        }

        // Ensure the encounter doesn't already exist (Schema has unique: true, but checking prevents a raw 11000 error)
        const existingEncounter = await ClinicalEncounterModel.findOne({ appointmentId: appointmentId });
        if (existingEncounter) {
            return res.status(409).json({ message: 'A clinical encounter already exists for this appointment.' });
        }

        // Ensure essential fields are present for the model
        if (!appointment.hospitalId || !appointment.patientId) {
            return res.status(500).json({ message: 'Appointment data incomplete (Missing hospitalId or patientId).' });
        }

        // Ensure the new fields are present (though Mongoose validators handle required)
        if (!appointment.startTime || !appointment.endTime || !appointment.durationMinutes || !appointment.reasonForVisit) {
            // This check should now correctly catch missing data in the Appointment document itself
            return res.status(500).json({ message: 'Appointment data incomplete (Missing time or reason details).' });
        }

        // 3. Create and Save the Encounter
        const newEncounter = new ClinicalEncounterModel({
            appointmentId,
            patientId: appointment.patientId,
            doctorId: doctorId,
            hospitalId: appointment.hospitalId,

            // Copying appointment context fields
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            durationMinutes: appointment.durationMinutes,
            reasonForVisit: appointment.reasonForVisit,

            diagnosis,
            physicianNotes,
            recommendations,
            prescriptions: prescriptions || [],
            status: status || 'Draft',
            signedOffAt: (status === 'Final' ? Date.now() : null)
        });

        const savedEncounter = await newEncounter.save();

        // 4. Update Appointment status (Optional: e.g., to 'completed' if not already)
        if (appointment.status !== 'completed' && appointment.status !== 'no_show') {
            await AppointmentModel.findByIdAndUpdate(appointmentId, { status: 'completed' });
        }

        // Populate references for the response
        const responseEncounter = await ClinicalEncounterModel.findById(savedEncounter._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialty');

        res.status(201).json({
            message: 'Clinical encounter recorded successfully.',
            encounter: responseEncounter
        });

    } catch (error) {
        console.error('Error creating clinical encounter:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A clinical encounter already exists for this appointment.' });
        }
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

// --- ROUTE FOR HOSPITAL-BASED ENCOUNTERS (MOVED TO BE BEFORE DYNAMIC ID ROUTE) ---

/**
 * @route GET /api/clinical-encounters/current-hospital
 * @description Retrieves all clinical encounters associated with the hospitals
 * the logged-in patient (Hospital Admin, Doctor, Admin) is linked to.
 * This is the route that retrieves encounters for the patient's "hotel" (Hospital).
 * @access Protected (Admin, Doctor, Hospital Admin)
 */
clinicalEncounterRouter.get('/api/clinical-encounters/current-hospital', authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const { role, selectedHospitalId } = currentUser;

        // 1. Authorization Check
        if (role === 'patient') {
            return res.status(403).json({ message: 'Access denied: Patients cannot view all hospital encounters.' });
        }

        // Staff/Admin must have an associated hospital ID to scope the search
        if (!selectedHospitalId) {
            return res.status(403).json({ message: 'Forbidden: User is not associated with any hospital.' });
        }

        // 2. Query encounters using the authorized hospital ID
        const query = {
            hospitalId: selectedHospitalId
        };

        const encounters = await ClinicalEncounterModel.find(query)
            .populate('patientId', 'name contact_number')
            .populate('doctorId', 'name specialty')
            .populate('hospitalId', 'name')
            .sort({ signedOffAt: -1, createdAt: -1 });

        // 3. Success response
        res.status(200).json(encounters);

    } catch (error) {
        console.error('Error fetching clinical encounters by hospital:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


/**
 * @route GET /api/clinical-encounters/:id
 * @description Gets a single clinical encounter by ID.
 * @access Protected (Authorized roles: Admin, Patient, Doctor, Hospital Admin)
 */
clinicalEncounterRouter.get('/api/clinical-encounters/:id', authenticateToken, async (req, res) => {
    try {
        const encounterId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(encounterId)) {
            // This is the check that was incorrectly capturing 'current-hospital'
            return res.status(400).json({ message: 'Invalid encounter ID format.' });
        }

        const encounter = await ClinicalEncounterModel.findById(encounterId)
            .populate('patientId', 'name contact_number')
            .populate('doctorId', 'name specialty')
            .populate('hospitalId', 'name');

        if (!encounter) {
            return res.status(404).json({ message: 'Clinical encounter not found.' });
        }

        // Authorization Check
        if (!canAccessEncounter(req.user, encounter)) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to view this record.' });
        }

        res.status(200).json(encounter);

    } catch (error) {
        console.error('Error fetching clinical encounter:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


/**
 * @route GET /api/clinical-encounters/patient/:patientId
 * @description Gets all clinical encounters for a specific patient.
 * @access Protected (Admin, Patient (self), Doctor, Hospital Admin).
 * The query is correctly scoped using currentUser.selectedHospitalId for staff.
 */
clinicalEncounterRouter.get('/api/patients/clinical-encounters', authenticateToken, async (req, res) => {
    try {

        const currentUser = req.user;
        const userIdStr = currentUser.userId.toString();
        // Destructure the selectedHospitalId for staff filtering
        const { selectedHospitalId } = currentUser;


        // if (!mongoose.Types.ObjectId.isValid(requestedPatientId)) {
        //     return res.status(400).json({ message: 'Invalid patient ID format.' });
        // }

        // Authorization Check: Only allow access to:
        // 1. Admin/Hospital Admin
        // 2. Patient requesting their own records
        // 3. Doctor requesting records for their patient/hospital (checked after data retrieval)

        // if (currentUser.role === 'patient' && userIdStr !== requestedPatientId) {
        //     return res.status(403).json({ message: 'Access denied. Patients can only view their own records.' });
        // }

        let query = { patientId: currentUser };

        // Doctors and Hospital Admins filter by associated hospitals/doctors (using selectedHospitalId)
        if (currentUser.role === 'doctor' && selectedHospitalId) {
            // A doctor can see records if they created them OR if the record is in their selected hospital
            query = {
                patientId: currentUser,
                $or: [
                    { doctorId: userIdStr },
                    { hospitalId: selectedHospitalId } // Filters by patient's currently selected hospital
                ]
            };
        } else if (currentUser.role === 'hospital_admin' && selectedHospitalId) {
            // Hospital Admin sees records in their selected hospital context
            query.hospitalId = selectedHospitalId;
        }

        // Fetch encounters
        const encounters = await ClinicalEncounterModel.find(query)
            .populate('doctorId', 'name specialty')
            .populate('hospitalId', 'name')
            .sort({ signedOffAt: -1, createdAt: -1 });

        // Final check to prevent a doctor from seeing records they aren't authorized for
        if (currentUser.role !== 'admin' && encounters.length > 0 && !encounters.every(e => canAccessEncounter(currentUser, e))) {
            return res.status(403).json({ message: 'Access denied to some records.' });
        }

        res.status(200).json(encounters);

    } catch (error) {
        console.error('Error fetching patient encounters:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


/**
 * @route PUT /api/clinical-encounters/:id
 * @description Updates an existing clinical encounter record.
 * @access Protected (Doctor who created it, or Admin)
 */
clinicalEncounterRouter.put('/api/clinical-encounters/:id', authenticateToken, async (req, res) => {
    try {
        const encounterId = req.params.id;
        const updates = req.body;
        const currentUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(encounterId)) {
            return res.status(400).json({ message: 'Invalid encounter ID format.' });
        }

        const existingEncounter = await ClinicalEncounterModel.findById(encounterId);
        if (!existingEncounter) {
            return res.status(404).json({ message: 'Clinical encounter not found.' });
        }

        // Authorization: Only the original doctor or an Admin can modify the record
        const isOriginalDoctor = existingEncounter.doctorId.toString() === currentUser.userId.toString();
        const isAdmin = currentUser.role === 'admin';

        if (!isOriginalDoctor && !isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Only the assigned doctor or an Admin can modify this record.' });
        }

        // Prevent editing if the record is 'Final', unless changing the status to 'Amended'
        if (existingEncounter.status === 'Final' && updates.status !== 'Amended' && !isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Finalized records cannot be modified (change status to Amended first).' });
        }

        // Update signedOffAt if status is changed to 'Final'
        if (updates.status === 'Final' && existingEncounter.status !== 'Final') {
            updates.signedOffAt = Date.now();
        }

        // Prevent changing core references
        delete updates.appointmentId;
        delete updates.patientId;
        delete updates.doctorId;
        delete updates.hospitalId;

        // Perform the update
        const updatedEncounter = await ClinicalEncounterModel.findByIdAndUpdate(
            encounterId,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialty');

        res.status(200).json({
            message: 'Clinical encounter updated successfully.',
            encounter: updatedEncounter
        });

    } catch (error) {
        console.error('Error updating clinical encounter:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


/**
 * @route DELETE /api/clinical-encounters/:id
 * @description Deletes a clinical encounter record.
 * @access Protected (Admin only, highly restricted)
 */
clinicalEncounterRouter.delete('/api/clinical-encounters/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const encounterId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(encounterId)) {
            return res.status(400).json({ message: 'Invalid encounter ID format.' });
        }

        const deletedEncounter = await ClinicalEncounterModel.findByIdAndDelete(encounterId);

        if (!deletedEncounter) {
            return res.status(404).json({ message: 'Clinical encounter not found.' });
        }

        // Optional: Revert Appointment status (e.g., from 'completed' back to 'pending' or 'confirmed')
        // This is complex and usually requires specific business logic, so we omit for simplicity.

        res.status(200).json({
            message: 'Clinical encounter deleted successfully.',
            deletedEncounterId: encounterId
        });

    } catch (error) {
        console.error('Error deleting clinical encounter:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

module.exports = clinicalEncounterRouter;
