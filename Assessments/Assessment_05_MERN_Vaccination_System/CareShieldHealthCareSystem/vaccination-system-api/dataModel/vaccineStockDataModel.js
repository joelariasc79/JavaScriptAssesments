// src/backend/models/VaccineStockModel.js
const mongoose = require('mongoose');

const vaccineStockSchema = new mongoose.Schema({
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital', // Reference to the Hospital models
        required: true,
    },
    vaccine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine', // Reference to the Vaccine models
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0, // Stock quantity cannot be negative
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

// Ensure a unique combination of hospital and vaccine
vaccineStockSchema.index({ hospital: 1, vaccine: 1 }, { unique: true });

const VaccineStock = mongoose.model('VaccineStock', vaccineStockSchema);

module.exports = VaccineStock;