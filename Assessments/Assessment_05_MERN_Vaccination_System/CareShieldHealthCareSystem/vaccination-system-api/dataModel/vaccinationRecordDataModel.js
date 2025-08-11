// /dataModel/vaccinationRecordDataModel.js
const mongoose = require('mongoose');

const vaccinationRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    vaccineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine',
        required: true
    },
    vaccinationOrderId: { // Link back to the order that led to this record
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VaccinationOrder',
        required: true,
        unique: true // A record should typically correspond to one order
    },
    dose_number: {
        type: Number,
        required: true,
        min: 1
    },
    vaccination_date: {
        type: Date,
        default: Date.now,
        required: true
    },
    // administeredBy: { // Staff who administered the vaccine
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     required: true
    // },
    // UPDATED: administeredBy is now optional, as patient is updating the record
    administeredBy: { // Staff who administered the vaccine, or null if patient self-records
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Made optional
        default: null    // Set default to null
    },
    // You can add more fields like batch_number, expiry_date, notes, etc.
}, { timestamps: true });

// Ensure a unique record per order to prevent multiple records for one vaccination order
vaccinationRecordSchema.index({ vaccinationOrderId: 1 }, { unique: true });

module.exports = mongoose.models.VaccinationRecord || mongoose.model('VaccinationRecord', vaccinationRecordSchema);