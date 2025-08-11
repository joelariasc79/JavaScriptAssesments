// dataModel/hospitalDataModel.js
const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Hospital names should ideally be unique
        trim: true
    },
    address: { // Embedded document for structured address
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true }, // E.g., 'NY', 'CA'
        zipCode: { type: String, trim: true },
        country: { type: String, default: 'USA', trim: true }
    },
    type: { // e.g., 'Government', 'Private'
        type: String,
        required: true,
        enum: ['Government', 'Private', 'Other'], // Define allowed types
        trim: true
    },
    contact_number: {
        type: String,
        required: true,
        trim: true
    },
    charges: { // Example: charge per consultation or bed night
        type: Number,
        required: true,
        min: 0 // Charges cannot be negative
    }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt

const HospitalModel = mongoose.model('Hospital', HospitalSchema);

module.exports = HospitalModel;