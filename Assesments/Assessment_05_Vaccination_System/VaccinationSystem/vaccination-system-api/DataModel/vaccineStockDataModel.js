// DataModel/vaccineStockDataModel.js
const mongoose = require('mongoose');

const VaccineStockSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital', // References the Hospital model
        required: true
    },
    vaccineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine', // References the Vaccine model
        required: true
    },
    quantity: { // Available doses of this vaccine at this hospital
        type: Number,
        required: true,
        min: 0, // Quantity cannot be negative
        default: 0
    },
    // You might also add fields like:
    // batch_number: { type: String, trim: true },
    // expiry_date: { type: Date },
    // last_restocked_date: { type: Date, default: Date.now }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt

// Ensure unique combination of hospitalId and vaccineId
VaccineStockSchema.index({ hospitalId: 1, vaccineId: 1 }, { unique: true });

const VaccineStockModel = mongoose.model('VaccineStock', VaccineStockSchema);

module.exports = VaccineStockModel;