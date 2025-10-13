const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new mongoose.Schema({
    // --- Core References ---

    // Reference to the User who is the doctor
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Essential for querying doctor's calendar
    },

    // Reference to the User who is the patient
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Essential for querying patient's appointments
    },

    // Reference to the Hospital/Clinic where the appointment is held (Optional)
    hospitalId: {
        type: Schema.Types.ObjectId,
        ref: 'Hospital',
        default: null
    },

    screeningId: {
        type: Schema.Types.ObjectId,
        ref: 'PatientScreening',
        required: false, // Not all appointments come from a screening
        default: null
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

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'canceled_by_doctor', 'canceled_by_patient', 'no_show'],
        default: 'pending'
    },

    reasonForVisit: {
        type: String,
        required: true,
        trim: true
    },

    // Any relevant notes added by the patient or admin at booking time
    notes: {
        type: String,
        trim: true
    },

    // --- Payment and Billing (New Section) ---

    // The total fee agreed upon for this specific appointment (in cents/smallest currency unit)
    feeAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },

    // The current status of the payment
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'pending', 'paid', 'refunded', 'waived'],
        required: true,
        default: 'unpaid'
    },

    // Reference ID from the payment processor (Stripe/PayPal/etc.)
    paymentTransactionId: {
        type: String,
        required: false,
        default: null
    },

    // Method used for payment (useful for reporting)
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'insurance', 'cash', 'transfer', 'other'],
        required: false
    }

}, {
    timestamps: true // Adds createdAt and updatedAt fields
});


// Optional: Add a compound index to prevent double-booking the exact same time slot
// This ensures that for a single doctor, no two appointments can start at the exact same time.
// AppointmentSchema.index({ doctorId: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);