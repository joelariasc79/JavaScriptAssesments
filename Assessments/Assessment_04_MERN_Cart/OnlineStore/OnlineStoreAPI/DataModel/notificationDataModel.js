// OnlineStoreAPI/dataModel/notificationDataModel.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Assuming users have ObjectId as _id
        ref: 'User', // Reference to your User model
        required: false // Notifications can be general (null userId) or specific to a user
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String, // e.g., 'static', 'cart_update', 'order_cancellation', 'order_status', 'payment_success'
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const NotificationDataModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationDataModel;
