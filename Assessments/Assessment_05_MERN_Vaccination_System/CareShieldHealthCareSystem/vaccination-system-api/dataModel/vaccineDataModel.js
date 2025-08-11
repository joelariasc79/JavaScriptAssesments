// dataModel/vaccineDataModel.js
const mongoose = require('mongoose');

const VaccineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
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
        default: 'Mild fever, fatigue, headache, muscle pain, chills, nausea.'
    },
    origin: {
        type: String,
        trim: true
    },
    doses_required: {
        type: Number,
        required: true,
        min: 1
    },
    time_between_doses_days: { // Applicable if doses_required > 1
        type: Number,
        min: 0,
        default: null // Can be null for single-dose vaccines
    },
    min_age_months: {
        type: Number,
        min: 0,
        default: null // Can be null if no specific minimum age (e.g., "all ages")
    },
    max_age_years: { // Maximum age for vaccine application, in years
        type: Number,
        min: 0,
        default: null // Can be null if no specific maximum age (e.g., "and older")
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