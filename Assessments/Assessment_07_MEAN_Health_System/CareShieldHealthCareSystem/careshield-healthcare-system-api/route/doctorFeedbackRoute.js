const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const ClinicalEncounterModel = require('../dataModel/clinicalEncounterDataModel');
const DoctorFeedbackModel = require('../dataModel/doctorFeedbackDataModel');

const doctorFeedbackRouter = express.Router();

// -------------------------------------------------------------------
// NEW API: GET /user-hospital-feedbacks
// Retrieves feedback based on the user's role:
// - Patient: All feedback *given by* the patient.
// - Doctor: All feedback *received by* the doctor.
// - Hospital Admin: All feedback recorded for doctors in the currently selected hospital.
// -------------------------------------------------------------------
doctorFeedbackRouter.get('/user-hospital-feedbacks', authenticateToken, async (req, res) => {
    try {
        // Destructure necessary user data from the request
        const { _id: userId, role, selectedHospitalId } = req.user;
        let filter = {};

        // Define explicitly allowed roles for this combined endpoint
        const allowedRoles = ['patient', 'doctor', 'hospital_admin'];

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ message: 'Forbidden: Access restricted to patients, doctors, and hospital admins.' });
        }

        switch (role) {
            case 'patient':
                // Patient: Get all feedbacks given by the patient
                filter = { patientId: userId };
                break;

            case 'doctor':
                // Doctor: Get all feedbacks received by the doctor
                filter = { doctorId: userId };
                break;

            case 'hospital_admin':
                // Hospital Admin: Get all doctor feedbacks in their currently selected hospital
                if (!selectedHospitalId) {
                    return res.status(400).json({ message: 'Hospital Admin must have a selected hospital to view hospital-wide feedback.' });
                }
                filter = { hospitalId: selectedHospitalId };
                break;

            // No default needed as roles are checked above
        }

        // Find all feedback matching the determined filter
        const feedbackList = await DoctorFeedbackModel.find(filter)
            .populate('patientId', 'name') // Show who gave the feedback
            .populate('doctorId', 'name')   // Show which doctor received the feedback
            .sort({ createdAt: -1 });

        res.status(200).json(feedbackList);

    } catch (error) {
        console.error('Error fetching role-based feedback list:', error);
        res.status(500).json({ message: 'Internal server error while fetching feedback.' });
    }
});

// -------------------------------------------------------------------
// AGGREGATION API: GET average rating for a doctor
// Accessible by staff roles.
// -------------------------------------------------------------------
doctorFeedbackRouter.get('/doctor/:doctorId/average', authenticateToken, authorizeRole('doctor'), async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Ensure the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid Doctor ID format.' });
        }

        const aggregationResult = await DoctorFeedbackModel.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
            { $group: {
                    _id: '$doctorId',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }}
        ]);

        if (aggregationResult.length === 0) {
            return res.status(200).json({ averageRating: 0, reviewCount: 0, doctorId });
        }

        const result = aggregationResult[0];
        res.status(200).json({
            averageRating: parseFloat(result.averageRating.toFixed(2)),
            reviewCount: result.reviewCount,
            doctorId: result._id
        });

    } catch (error) {
        console.error('Error calculating average rating:', error);
        res.status(500).json({ message: 'Internal server error while calculating average rating.' });
    }
});


// -------------------------------------------------------------------
// NEW AGGREGATION API: GET average ratings for all doctors in the current hospital
// Accessible by staff roles (doctor, hospital_admin).
// -------------------------------------------------------------------
doctorFeedbackRouter.get('/hospital/average-ratings', authenticateToken, authorizeRole('doctor', 'hospital_admin', 'patient'), async (req, res) => {
    try {
        const currentHospitalId = req.user.selectedHospitalId;

        if (!currentHospitalId) {
            return res.status(400).json({ message: 'User must be associated with a selected hospital to view hospital-wide ratings.' });
        }

        const hospitalObjectId = new mongoose.Types.ObjectId(currentHospitalId);

        const aggregationResult = await DoctorFeedbackModel.aggregate([
            { $match: { hospitalId: hospitalObjectId } }, // 1. Filter by hospital
            { $group: {
                    _id: '$doctorId', // 2. Group by doctor ID
                    averageRating: { $avg: '$rating' }, // 3. Calculate average rating
                    reviewCount: { $sum: 1 } // 4. Count total reviews per doctor
                }},
            { $sort: { averageRating: -1 } } // Sort by rating (optional: highest first)
        ]);

        // Format the results to clean up the doctorId and rating precision
        const formattedResults = aggregationResult.map(result => ({
            doctorId: result._id,
            averageRating: parseFloat(result.averageRating.toFixed(2)),
            reviewCount: result.reviewCount
        }));

        res.status(200).json(formattedResults);

    } catch (error) {
        console.error('Error calculating hospital-wide doctor average ratings:', error);
        res.status(500).json({ message: 'Internal server error while calculating hospital-wide doctor average ratings.' });
    }
});


// -------------------------------------------------------------------
// CREATE API: POST /
// Only patients can submit feedback, and only after a clinical encounter.
// -------------------------------------------------------------------
doctorFeedbackRouter.post('/', authenticateToken, authorizeRole('patient'), async (req, res) => {
    try {
        // Renamed variable from appointmentId
        const { clinicalEncounterId, rating, comment } = req.body;
        const patientId = req.user._id;

        // 1. Validate Input
        // Updated field name in validation
        if (!clinicalEncounterId || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Missing required fields (clinicalEncounterId) or invalid rating (1-5).' });
        }

        // 2. Find Clinical Encounter and Check Authorization
        // Changed model lookup from AppointmentModel to ClinicalEncounterModel
        const clinicalEncounter = await ClinicalEncounterModel.findById(clinicalEncounterId);

        if (!clinicalEncounter) {
            return res.status(404).json({ message: 'Clinical Encounter not found.' });
        }

        // Ensure the logged-in user is the patient for this encounter
        if (clinicalEncounter.patientId.toString() !== patientId) {
            return res.status(403).json({ message: 'Forbidden: You can only leave feedback for your own clinical encounters.' });
        }

        // 3. Prevent duplicate feedback
        // Updated query field name
        const existingFeedback = await DoctorFeedbackModel.findOne({ clinicalEncounterId });
        if (existingFeedback) {
            return res.status(409).json({ message: 'Feedback for this clinical encounter already exists.' });
        }

        // 4. Create Feedback
        // Updated field name and source variables
        const newFeedback = await DoctorFeedbackModel.create({
            clinicalEncounterId,
            patientId,
            doctorId: clinicalEncounter.doctorId,
            hospitalId: clinicalEncounter.hospitalId,
            rating,
            comment
        });

        res.status(201).json({ message: 'Feedback submitted successfully.', feedback: newFeedback });

    } catch (error) {
        // Handle Mongoose validation errors or other issues
        console.error('Error submitting doctor feedback:', error);
        res.status(500).json({ message: 'Internal server error during feedback submission.' });
    }
});


// -------------------------------------------------------------------
// READ API: GET /:id (Single Feedback Record)
// Accessible by patient, doctor, or admin associated with the record.
// -------------------------------------------------------------------
doctorFeedbackRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await DoctorFeedbackModel.findById(id)
            .populate('patientId', 'name username role') // Populate with essential user info
            .populate('doctorId', 'name username role');

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback record not found.' });
        }

        const userId = req.user._id;
        const userRole = req.user.role;

        // Authorization check: Must be the patient, the doctor, or an admin
        const isAuthorized = feedback.patientId._id.toString() === userId ||
            feedback.doctorId._id.toString() === userId ||
            userRole === 'admin';

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to view this record.' });
        }

        res.status(200).json(feedback);

    } catch (error) {
        console.error('Error fetching single feedback:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// -------------------------------------------------------------------
// READ API: GET /doctor/:doctorId (All feedback received by a doctor)
// Accessible by the doctor themselves or an admin.
// -------------------------------------------------------------------
doctorFeedbackRouter.get('/doctor/:doctorId', authenticateToken, authorizeRole('doctor'), async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Restrict access: A doctor can only view their own feedback, unless they are an admin.
        if (req.user.role === 'doctor' && req.user._id !== doctorId) {
            return res.status(403).json({ message: 'Forbidden: Doctors can only view their own feedback.' });
        }

        const feedbackList = await DoctorFeedbackModel.find({ doctorId })
            .populate('patientId', 'name') // Only need the patient's name for context
            .sort({ createdAt: -1 });

        res.status(200).json(feedbackList);

    } catch (error) {
        console.error('Error fetching doctor feedback list:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// -------------------------------------------------------------------
// UPDATE API: PUT /:id
// Only the original patient can update their own feedback.
// -------------------------------------------------------------------
doctorFeedbackRouter.put('/:id', authenticateToken, authorizeRole('patient'), async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = req.user._id;
        const { rating, comment } = req.body;

        const updatedFields = {};
        if (rating !== undefined && rating >= 1 && rating <= 5) updatedFields.rating = rating;
        if (comment !== undefined) updatedFields.comment = comment;

        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update (rating 1-5 or comment).' });
        }

        // Find and update, ensuring the patientId matches the logged-in user
        const updatedFeedback = await DoctorFeedbackModel.findOneAndUpdate(
            { _id: id, patientId: patientId },
            { $set: updatedFields },
            { new: true, runValidators: true }
        );

        if (!updatedFeedback) {
            // Either feedback wasn't found or patientId didn't match
            return res.status(404).json({ message: 'Feedback not found or access denied.' });
        }

        res.status(200).json({ message: 'Feedback updated successfully.', feedback: updatedFeedback });

    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ message: 'Internal server error during update.' });
    }
});


// -------------------------------------------------------------------
// DELETE API: DELETE /:id
// Only the original patient or an admin can delete the feedback.
// -------------------------------------------------------------------
doctorFeedbackRouter.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const feedback = await DoctorFeedbackModel.findById(id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found.' });
        }

        // Authorization check: Must be the patient or an admin
        if (feedback.patientId.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this record.' });
        }

        await DoctorFeedbackModel.deleteOne({ _id: id });
        res.status(200).json({ message: 'Feedback deleted successfully.' });

    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: 'Internal server error during deletion.' });
    }
});


module.exports = doctorFeedbackRouter;
