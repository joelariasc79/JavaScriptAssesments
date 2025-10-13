const mongoose = require('mongoose');

const DoctorFeedbackSchema = new mongoose.Schema({
    /**
     * @description Mandatory link back to the Clinical Encounter document.
     * Used for auditing and ensuring the feedback corresponds to the encounter event.
     * Ensures uniqueness: one Feedback per Clinical Encounter.
     */
    clinicalEncounterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClinicalEncounter', // Updated reference
        required: true,
        unique: true // Guarantees a 1:1 relationship with the Clinical Encounter
    },
    /**
     * @description Reference to the patient seen.
     */
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    /**
     * @description Reference to the doctor who received the feedback.
     */
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    /**
     * @description Reference to the hospital where the appointment took place.
     */
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Order ratings typically 1-5
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000,
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields for the review
});

// REMOVED: DoctorFeedbackSchema.index({ order: 1, patient: 1 }, { unique: true });
// Uniqueness is already guaranteed by appointmentId: unique.

const DoctorFeedbackModel = mongoose.model('DoctorFeedback', DoctorFeedbackSchema);

module.exports = DoctorFeedbackModel;
