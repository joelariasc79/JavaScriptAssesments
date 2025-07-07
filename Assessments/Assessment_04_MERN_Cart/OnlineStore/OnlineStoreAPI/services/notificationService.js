// OnlineStoreAPI/services/notificationService.js
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const Notification = require('../DataModel/notificationDataModel');
const UserModel = require('../DataModel/userDataModel');

let ioInstance;
let connectedUsersMap;

function init(io, usersMap) {
    ioInstance = io;
    connectedUsersMap = usersMap;
    console.log('NotificationService initialized with Socket.IO instance and connected users map.');
}

/**
 * Creates and stores a new notification in the database, and emits it in real-time.
 * @param {string | null} userIdString The string ID of the user to notify (null for broadcast/general).
 * @param {string} message The notification message.
 * @param {string} type The type of notification (e.g., 'cart_update', 'order_cancellation', 'static').
 */
async function createNotification(userIdString, message, type) {
    try {
        let userIdObjectId = null;
        if (userIdString) {
            const user = await UserModel.findOne({ userId: userIdString });
            if (user) {
                // Ensure the _id from UserModel is a valid ObjectId before using
                if (mongoose.Types.ObjectId.isValid(user._id)) {
                    userIdObjectId = user._id;
                } else {
                    console.warn(`User found, but user._id (${user._id}) is not a valid ObjectId for user string ID ${userIdString}. Notification will be general.`);
                }
            } else {
                console.warn(`User with string ID ${userIdString} not found for notification. Notification will be general.`);
            }
        }

        const newNotification = new Notification({
            userId: userIdObjectId, // Store the ObjectId or null
            message: message,
            type: type,
            read: false,
            createdAt: new Date()
        });
        await newNotification.save();
        console.log(`Notification created in DB for user ${userIdString || 'all'}: ${message}`);

        if (ioInstance && connectedUsersMap) {
            const notificationData = {
                _id: newNotification._id.toString(), // Convert ObjectId to string for client
                userId: newNotification.userId ? newNotification.userId.toString() : null,
                message: newNotification.message,
                type: newNotification.type,
                read: newNotification.read,
                createdAt: newNotification.createdAt.toISOString()
            };

            if (userIdString) {
                let notified = false;
                for (let [socketId, connectedUserId] of connectedUsersMap.entries()) {
                    if (connectedUserId === userIdString) {
                        ioInstance.to(socketId).emit('newNotification', notificationData);
                        console.log(`Emitted private notification to user ${userIdString} via socket ${socketId}`);
                        notified = true;
                    }
                }
                if (!notified) {
                    console.warn(`User ${userIdString} is not currently connected via Socket.IO, notification saved to DB only.`);
                }
            } else {
                ioInstance.emit('newNotification', notificationData);
                console.log('Emitted broadcast notification to all connected users.');
            }
        } else {
            console.warn('Socket.IO instance or connectedUsersMap not initialized in NotificationService. Cannot emit real-time notifications.');
        }
        return newNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Retrieves notifications for a specific user.
 * @param {string} userIdString The string ID of the user.
 * @param {boolean} unreadOnly If true, return only unread notifications.
 * @returns {Promise<Array>} A promise that resolves to a list of notifications.
 */
async function getNotifications(userIdString) { // Removed unreadOnly parameter or its default to force unread only
    try {
        const user = await UserModel.findOne({ userId: userIdString });
        if (!user) {
            console.warn(`User with string ID ${userIdString} not found when fetching notifications.`);
            return [];
        }
        const userIdObjectId = user._id;

        if (!mongoose.Types.ObjectId.isValid(userIdObjectId)) {
            console.error(`Invalid ObjectId derived from user._id: ${userIdObjectId} for user string ID: ${userIdString}. Cannot fetch notifications.`);
            return []; // Return empty array if the user's _id is malformed
        }

        const query = { userId: userIdObjectId };
        query.read = false; // Always retrieve only unread notifications

        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        return notifications.map(notif => ({
            _id: notif._id.toString(),
            userId: notif.userId ? notif.userId.toString() : null,
            message: notif.message,
            type: notif.type,
            read: notif.read,
            createdAt: notif.createdAt.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
}

/**
 * Marks a notification as read.
 * @param {string} notificationId The ID of the notification to mark as read.
 * @returns {Promise<object>} A promise that resolves to the updated notification.
 */
async function markNotificationAsRead(notificationId) {
    try {
        // Ensure notificationId is a valid ObjectId before querying
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            console.error(`Invalid notificationId provided: ${notificationId}. Cannot mark as read.`);
            return null;
        }
        const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
        if (notification) {
            if (ioInstance && notification.userId) {
                const user = await UserModel.findById(notification.userId); // Find user by their _id
                const userIdString = user ? user.userId : null; // Get the string userId
                for (let [socketId, connectedUserId] of connectedUsersMap.entries()) {
                    if (connectedUserId === userIdString) {
                        ioInstance.to(socketId).emit('notificationRead', { notificationId: notification._id.toString() });
                    }
                }
            }
        }
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Creates static/initial notifications for a user.
 * @param {string} userIdString The string ID of the user.
 */
async function setupStaticNotifications(userIdString) {
    const staticNotifications = [
        { message: "Welcome! Add products from the Product Screen to start shopping.", type: "static_onboarding" },
        { message: "Add items to your cart from any product page.", type: "static_add_cart" },
        { message: "Review your cart and proceed to checkout from the Cart Page.", type: "static_review_cart" },
        { message: "Complete your purchase securely from the Payment Page.", type: "static_make_payment" },
        { message: "Need help with an order? Check your order history for cancel/reorder options.", type: "static_assist_order" }
    ];

    const user = await UserModel.findOne({ userId: userIdString });
    if (!user) {
        console.warn(`User with string ID ${userIdString} not found for static notifications setup.`);
        return;
    }
    const userIdObjectId = user._id;

    // CRITICAL FIX: Ensure the retrieved _id is a valid ObjectId before using in query/creation.
    if (!mongoose.Types.ObjectId.isValid(userIdObjectId)) {
        console.error(`Invalid ObjectId derived from user._id: ${userIdObjectId} for user string ID: ${userIdString}. Cannot setup static notifications.`);
        return; // Exit if the user's _id is malformed
    }

    for (const notifData of staticNotifications) {
        const existing = await Notification.findOne({ userId: userIdObjectId, message: notifData.message, type: notifData.type });
        if (!existing) {
            // Call createNotification with the string userId, which will handle ObjectId conversion internally
            await createNotification(userIdString, notifData.message, notifData.type);
        }
    }
    console.log(`Static notifications set up for user: ${userIdString}`);
}

/**
 * Retrieves the count of unread notifications for a specific user.
 * @param {string} userIdString The string ID of the user.
 * @returns {Promise<number>} A promise that resolves to the count of unread notifications.
 */
async function getUnreadNotificationCount(userIdString) {
    try {
        const user = await UserModel.findOne({ userId: userIdString });
        if (!user) {
            console.warn(`User with string ID ${userIdString} not found when fetching unread count.`);
            return 0;
        }
        const userIdObjectId = user._id;

        // CRITICAL FIX: Ensure the retrieved _id is a valid ObjectId before querying the Notification model.
        if (!mongoose.Types.ObjectId.isValid(userIdObjectId)) {
            console.error(`Invalid ObjectId derived from user._id: ${userIdObjectId} for user string ID: ${userIdString}. Cannot fetch unread notification count.`);
            return 0; // Return 0 if the user's _id is malformed
        }
        return await Notification.countDocuments({ userId: userIdObjectId, read: false });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        throw error;
    }
}

/**
 * Clears (deletes) notifications for a specific user.
 * @param {string} userIdString The string ID of the user.
 * @param {string | null} [type=null] Optional. The type of notifications to clear (e.g., 'static').
 * If not provided, all notifications for the user will be cleared.
 * @returns {Promise<object>} A promise that resolves to an object containing the number of deleted notifications.
 */
async function clearUserNotifications(userIdString, type = null) {
    try {
        const user = await UserModel.findOne({ userId: userIdString });
        if (!user) {
            console.warn(`User with string ID ${userIdString} not found when attempting to clear notifications.`);
            return { deletedCount: 0, message: `User ${userIdString} not found.` };
        }
        const userIdObjectId = user._id;

        if (!mongoose.Types.ObjectId.isValid(userIdObjectId)) {
            console.error(`Invalid ObjectId derived from user._id: ${userIdObjectId} for user string ID: ${userIdString}. Cannot clear notifications.`);
            return { deletedCount: 0, message: `Invalid user ID derived from ${userIdString}.` };
        }

        const query = { userId: userIdObjectId };
        if (type) {
            query.type = type;
        }

        const result = await Notification.deleteMany(query);
        console.log(`Cleared ${result.deletedCount} notifications for user ${userIdString}${type ? ` of type ${type}` : ''}.`);
        return { deletedCount: result.deletedCount, message: "Notifications cleared successfully." };
    } catch (error) {
        console.error('Error clearing user notifications:', error);
        throw error;
    }
}

module.exports = {
    init,
    createNotification,
    getNotifications,
    markNotificationAsRead,
    setupStaticNotifications,
    getUnreadNotificationCount,
    clearUserNotifications
};
