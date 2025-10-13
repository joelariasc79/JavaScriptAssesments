const mongoose = require('mongoose');
const { Schema } = mongoose;

const PatientScreeningSchema = new mongoose.Schema({
    // --- Core References ---

    // Reference to the User who submitted the screening form (the Patient)
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    hospitalId: {
        type: Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
        index: true
    },

    // Reference to the Disease the patient believes they have, or the disease
    // that best matches their symptoms based on the screening.
    // This connects to the system's defined Disease models.
    selectedDisease: {
        type: Schema.Types.ObjectId,
        ref: 'Disease',
        required: false, // Optional if the patient is unsure or it's a new problem
        default: null
    },

    // --- Patient Provided Information ---

    // The patient's primary reason for seeking care (chief complaint)
    chiefComplaint: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },

    // Detailed description of the current symptoms
    symptomDescription: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },

    // Duration of the symptoms
    duration: {
        type: String,
        required: true,
        trim: true,
        enum: [
            'Less than 24 hours',
            '1-7 days',
            '1-4 weeks',
            '1-6 months',
            'More than 6 months'
        ]
    },

    // --- Patient Health History (For this specific screening) ---

    // List of current medications the patient is taking
    currentMedications: [{
        name: { type: String, trim: true },
        dosage: { type: String, trim: true }
    }],

    // Patient's self-reported current pain level (using a 1-10 scale)
    painLevel: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },

    // --- Status and Follow-up ---

    // Status of the screening process (e.g., initial submission, triage reviewed, converted to appointment)
    screeningStatus: {
        type: String,
        enum: ['submitted', 'reviewed', 'referred', 'archived', 'converted_to_appointment'],
        default: 'submitted'
    }

}, {
    timestamps: true // Tracks when the screening was submitted
});

module.exports = mongoose.model('PatientScreening', PatientScreeningSchema);