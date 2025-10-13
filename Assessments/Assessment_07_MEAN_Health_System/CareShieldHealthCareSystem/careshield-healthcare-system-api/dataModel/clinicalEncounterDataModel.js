const mongoose = require('mongoose');

const ClinicalEncounterSchema = new mongoose.Schema({
    // --- Core References (Required for linking) ---

    /**
     * @description Mandatory link back to the Appointment document.
     * Used for auditing and ensuring the encounter corresponds to a scheduled event.
     * Ensures uniqueness: one Encounter per Appointment.
     */
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true // Guarantees a 1:1 relationship with the Appointment
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
     * @description Reference to the doctor who recorded the encounter details.
     */
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    /**
     * @description Reference to the doctor who recorded the encounter details.
     */
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    reasonForVisit: {
        type: String,
        required: true,
        trim: true
    },

    // --- Time and Duration ---

    // The exact date and time the appointment starts (e.g., Fri Dec 12 2025 10:00:00 GMT...)
    startTime: {
        type: Date,
        required: true,
        index: true // Key for chronological sorting and availability checks
    },

    // The exact date and time the appointment ends
    endTime: {
        type: Date,
        required: true
    },

    // The length of the appointment in minutes
    durationMinutes: {
        type: Number,
        required: true,
        default: 30
    },

    // --- Status and Details ---

    // --- Clinical Data ---

    /**
     * @description The primary diagnosis or chief complaint (e.g., 'Acute Sinusitis', 'Routine Checkup').
     */
    diagnosis: {
        type: String,
        required: false,
        trim: true
    },

    /**
     * @description Detailed notes recorded by the doctor during or after the consultation.
     */
    physicianNotes: {
        type: String,
        required: false
    },

    /**
     * @description Specific instructions or recommendations given to the patient (e.g., follow-up schedule, lifestyle changes).
     */
    recommendations: {
        type: String,
        default: ''
    },

    /**
     * @description Array of prescriptions issued (could be simple strings or a sub-document array).
     */
    prescriptions: [{
        medicationName: {
            type: String,
            required: false
        },
        dosage: {
            type: String,
            required: false
        },
        frequency: {
            type: String,
            required: false
        },
        notes: {
            type: String
        }
    }],

    // --- Status and Auditing ---

    /**
     * @description The time the doctor finalized and signed off on the record.
     * Critical for legal/auditing purposes.
     */
    signedOffAt: {
        type: Date,
        default: Date.now
    },

    /**
     * @description Status of the encounter record (e.g., 'Draft', 'Final', 'Amended').
     */
    status: {
        type: String,
        enum: ['Draft', 'Final', 'Amended'],
        default: 'Draft'
    }

}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create the model
const ClinicalEncounterModel = mongoose.model('ClinicalEncounter', ClinicalEncounterSchema);

module.exports = ClinicalEncounterModel;