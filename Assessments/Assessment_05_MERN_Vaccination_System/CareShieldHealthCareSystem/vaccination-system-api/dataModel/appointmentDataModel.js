// dataModel/appointmentDataModel.js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: true
    },
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
    appointment_date: {
        type: Date,
        required: true
    },
    dose_number: {
        type: Number,
        required: true,
        min: 1 // First dose, second dose, etc.
    },
    status: {
        type: String,
        enum: ['booked', 'confirmed', 'completed', 'cancelled'],
        default: 'booked',
        trim: true
    },
    payment_status: { // To track if the appointment charge is paid
        type: String,
        enum: ['pending', 'paid', 'waived'],
        default: 'pending',
        trim: true
    }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt

// Add a unique index to prevent duplicate appointments for the same user, dose, and date
// This might need adjustment based on business logic (e.g., if a user can book multiple vaccines on the same day)
AppointmentSchema.index({ userId: 1, vaccineId: 1, appointment_date: 1, dose_number: 1 }, { unique: true });


const AppointmentModel = mongoose.model('Appointment', AppointmentSchema);

module.exports = AppointmentModel;