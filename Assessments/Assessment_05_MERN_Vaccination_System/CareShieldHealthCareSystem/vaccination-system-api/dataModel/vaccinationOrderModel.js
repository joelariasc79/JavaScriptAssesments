// src/backend/models/vaccinationOrderModel.js
const mongoose = require('mongoose');

const vaccinationOrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User models (the patient)
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital', // References the Hospital models where the order is placed
        required: true
    },
    vaccineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine', // References the Vaccine type requested
        required: true
    },
    dose_number: {
        type: Number,
        required: true,
        min: 1
    },
    charge_to_be_paid: {
        type: Number,
        required: true,
        min: 0
    },
    // Statuses for the vaccination order lifecycle
    paymentStatus: {
        type: String,
        enum: ['pending_payment', 'paid', 'refunded', 'cancelled'],
        default: 'pending_payment'
    },
    appointmentStatus: {
        type: String,
        enum: ['pending_scheduling', 'scheduled', 'missed', 'cancelled', 'completed'],
        default: 'pending_scheduling'
    },
    appointment_date: { // Date of the scheduled appointment
        type: Date,
        default: null
    },
    vaccinationStatus: {
        type: String,
        enum: ['pending_approval', 'pending_vaccination', 'vaccinated', 'not_vaccinated', 'cancelled'],
        default: 'pending_approval'
    },
    // Reference to the actual VaccinationRecord once vaccination occurs
    vaccinationRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VaccinationRecord',
        default: null
    },
    createdBy: { // Who created this order (e.g., hospital staff)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true }); // Mongoose adds createdAt and updatedAt

// Ensure a user doesn't create duplicate pending orders for the same dose of the same vaccine
vaccinationOrderSchema.index(
    { userId: 1, vaccineId: 1, dose_number: 1, paymentStatus: 1, appointmentStatus: 1, vaccinationStatus: 1 },
    { unique: true, partialFilterExpression: { vaccinationStatus: { $ne: 'vaccinated' } } }
    // Only enforce unique if the order hasn't been vaccinated yet.
    // This allows a user to get a second dose even if they have a "vaccinated" order for dose 1.
);


// Apply the models overwrite fix
module.exports = mongoose.models.VaccinationOrder || mongoose.model('VaccinationOrder', vaccinationOrderSchema);