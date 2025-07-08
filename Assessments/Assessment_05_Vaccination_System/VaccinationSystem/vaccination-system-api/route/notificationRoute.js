// route/notificationRoute.js
const express = require('express');
const notificationRouter = express.Router({ strict: true, caseSensitive: true });
const NotificationModel = require('../dataModel/notificationDataModel');
const UserModel = require('../dataModel/userDataModel'); // To get user details for sending
const mongoose = require('mongoose');

const { authenticateToken } = require('./userRoute'); // Adjust path if needed
const notificationService = require('../services/notificationService'); // Import the notification service

/**
 * @route POST /api/notifications/send
 * @description Manually send a notification (for admin/testing purposes).
 * @body {string} userId, {string} type ('SMS'|'Email'|'In-App'), {string} message, {string} recipient, {string} [related_appointment_id]
 * @access Protected (Admin or Hospital Staff)
 */
notificationRouter.post('/api/notifications/send', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only authorized personnel can send notifications.' });
        }

        const { userId, type, message, recipient, related_appointment_id } = req.body;

        if (!userId || !type || !message || !recipient) {
            return res.status(400).json({ message: 'Missing required fields: userId, type, message, recipient.' });
        }
        if (!['SMS', 'Email', 'In-App'].includes(type)) {
            return res.status(400).json({ message: 'Invalid notification type. Must be SMS, Email, or In-App.' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        if (related_appointment_id && !mongoose.Types.ObjectId.isValid(related_appointment_id)) {
            return res.status(400).json({ message: 'Invalid related appointment ID format.' });
        }

        const result = await notificationService.createAndSendNotification({
            userId,
            type,
            message,
            recipient,
            related_appointment_id
        });

        if (result.success) {
            res.status(200).json({ message: 'Notification initiated successfully.', notificationRecord: result.notification });
        } else {
            res.status(500).json({ message: result.message || 'Failed to initiate notification.' });
        }

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Internal server error initiating notification.', error: error.message });
    }
});

/**
 * @route GET /api/notifications/me
 * @description Get notification history for the authenticated user.
 * @access Protected (Any authenticated user)
 */
notificationRouter.get('/api/notifications/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const notifications = await NotificationModel.find({ userId: userId })
            .sort({ sent_at: -1 }) // Latest first
            .limit(50); // Limit to recent 50 notifications

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Internal server error fetching notifications.', error: error.message });
    }
});

/**
 * @route GET /api/notifications
 * @description Get all notification history (Admin only).
 * @access Protected (Admin only)
 */
notificationRouter.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can view all notifications.' });
        }

        const notifications = await NotificationModel.find({})
            .populate('userId', 'username name email') // Populate user details
            .sort({ sent_at: -1 })
            .limit(100); // Limit to recent 100 notifications for admin view

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({ message: 'Internal server error fetching notifications.', error: error.message });
    }
});

module.exports = notificationRouter;