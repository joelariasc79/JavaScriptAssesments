// DataModel/vaccinationRecordDataModel.js
const mongoose = require('mongoose');

const VaccinationRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (the patient)
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital', // References the Hospital model where vaccination occurred
        required: true
    },
    vaccineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine', // References the Vaccine model used
        required: true
    },
    dose_number: {
        type: Number,
        required: true,
        min: 1 // First dose, second dose, etc.
    },
    vaccination_date: {
        type: Date,
        required: true,
        default: Date.now // Defaults to current date if not provided
    },
    batch_number: { // Specific batch/lot number of the vaccine
        type: String,
        trim: true,
        required: false // Optional but good for traceability
    },
    administered_by: { // Optional: ID of the staff member who administered the vaccine
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can reference the User model (assuming staff are users)
        required: false
    }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt

// Ensure a user cannot have the same dose of the same vaccine recorded multiple times
VaccinationRecordSchema.index({ userId: 1, vaccineId: 1, dose_number: 1 }, { unique: true });

const VaccinationRecordModel = mongoose.model('VaccinationRecord', VaccinationRecordSchema);

module.exports = VaccinationRecordModel;