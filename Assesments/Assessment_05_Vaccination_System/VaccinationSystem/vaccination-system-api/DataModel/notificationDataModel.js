// DataModel/notificationDataModel.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: { // e.g., 'SMS', 'Email', 'In-App'
        type: String,
        required: true,
        enum: ['SMS', 'Email', 'In-App'],
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    recipient: { // Phone number or email address
        type: String,
        required: true,
        trim: true
    },
    status: { // e.g., 'sent', 'failed', 'pending'
        type: String,
        enum: ['sent', 'failed', 'pending'],
        default: 'pending',
        trim: true
    },
    related_appointment_id: { // Optional: Link to an appointment
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null
    },
    sent_at: {
        type: Date,
        default: Date.now
    },
    failure_reason: { // If status is 'failed'
        type: String,
        trim: true
    }
}, { timestamps: true });

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = NotificationModel;