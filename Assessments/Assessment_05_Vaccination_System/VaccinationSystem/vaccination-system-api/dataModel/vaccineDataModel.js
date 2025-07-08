// dataModel/vaccineDataModel.js
const mongoose = require('mongoose');

const VaccineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Vaccine names should ideally be unique
        trim: true
    },
    manufacturer: { // NEW FIELD ADDED: Manufacturer of the vaccine
        type: String,
        required: true, // Assuming it's required
        trim: true
    },
    type: { // e.g., 'mRNA', 'Viral Vector', 'Inactivated'
        type: String,
        required: true,
        trim: true
    },
    price: { // Price per dose
        type: Number,
        required: true,
        min: 0
    },
    side_effect: {
        type: String,
        trim: true,
        default: 'Mild fever, fatigue, headache, muscle pain, chills, nausea.' // Common side effects
    },
    origin: { // Country or region of origin (distinct from manufacturer)
        type: String,
        trim: true
    },
    doses_required: {
        type: Number,
        required: true,
        min: 1 // At least 1 dose required
    },
    time_between_doses_days: { // Applicable if doses_required > 1
        type: Number,
        min: 0,
        default: null // Can be null for single-dose vaccines
    },
    other_info: {
        type: String,
        trim: true
    },
    strains_covered: { // E.g., 'Alpha, Delta, Omicron variants'
        type: String,
        trim: true
    }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt

const VaccineModel = mongoose.model('Vaccine', VaccineSchema);

module.exports = VaccineModel;