// src/redux/notifications/notificationActions.js
import axios from 'axios';

// --- Action Types ---
export const FETCH_NOTIFICATIONS_REQUEST = 'FETCH_NOTIFICATIONS_REQUEST';
export const FETCH_NOTIFICATIONS_SUCCESS = 'FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'FETCH_NOTIFICATIONS_FAILURE';

export const MARK_NOTIFICATION_READ_REQUEST = 'MARK_NOTIFICATION_READ_REQUEST';
export const MARK_NOTIFICATION_READ_SUCCESS = 'MARK_NOTIFICATION_READ_SUCCESS';
export const MARK_NOTIFICATION_READ_FAILURE = 'MARK_NOTIFICATION_READ_FAILURE';

export const ADD_REALTIME_NOTIFICATION = 'ADD_REALTIME_NOTIFICATION';
export const UPDATE_NOTIFICATION_COUNT = 'UPDATE_NOTIFICATION_COUNT';
export const CLEAR_ALL_NOTIFICATIONS = 'CLEAR_ALL_NOTIFICATIONS'; // For client-side clearing
export const REMOVE_NOTIFICATION_BY_ID = 'REMOVE_NOTIFICATION_BY_ID'; // For client-side removal of a single notification

// --- Synchronous Action Creators ---
export const fetchNotificationsRequest = () => ({
    type: FETCH_NOTIFICATIONS_REQUEST
});

export const fetchNotificationsSuccess = (data) => ({
    type: FETCH_NOTIFICATIONS_SUCCESS,
    payload: data // { notifications: [], unreadCount: number }
});

export const fetchNotificationsFailure = (error) => ({
    type: FETCH_NOTIFICATIONS_FAILURE,
    payload: error
});

export const markNotificationReadRequest = () => ({
    type: MARK_NOTIFICATION_READ_REQUEST
});

export const markNotificationReadSuccess = (notificationId) => ({
    type: MARK_NOTIFICATION_READ_SUCCESS,
    payload: notificationId
});

export const markNotificationReadFailure = (error) => ({
    type: MARK_NOTIFICATION_READ_FAILURE,
    payload: error
});

export const addRealtimeNotification = (notification) => ({
    type: ADD_REALTIME_NOTIFICATION,
    payload: notification
});

export const updateNotificationCount = (count) => ({
    type: UPDATE_NOTIFICATION_COUNT,
    payload: count
});

export const clearAllNotifications = () => ({
    type: CLEAR_ALL_NOTIFICATIONS
});

export const removeNotificationById = (notificationId) => ({
    type: REMOVE_NOTIFICATION_BY_ID,
    payload: notificationId
});


// --- Asynchronous Thunk Action Creators ---
const API_BASE_URL = 'http://localhost:9000/api'; // Ensure this matches your backend API

/**
 * Fetches all notifications for a specific patient from the backend.
 * @param {string} userId - The patient's ID (string).
 * @param {string} authToken - The authentication token.
 */
export const fetchNotifications = (userId, authToken) => {
    return async (dispatch) => {
        dispatch(fetchNotificationsRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/notifications/${userId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            dispatch(fetchNotificationsSuccess(response.data)); // payload: { notifications, unreadCount }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchNotificationsFailure(errorMessage));
        }
    };
};

/**
 * Fetches the unread notification count for a specific patient.
 * This is useful to update the icon badge without fetching all notifications.
 * @param {string} userId - The patient's ID (string).
 * @param {string} authToken - The authentication token.
 */
export const fetchUnreadNotificationCount = (userId, authToken) => {
    return async (dispatch) => {
        // No specific request action for count only, as it's often a lightweight poll
        try {
            const response = await axios.get(`${API_BASE_URL}/notifications/count/${userId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            dispatch(updateNotificationCount(response.data.count));
        } catch (error) {
            console.error("Error fetching unread notification count:", error.response?.data?.message || error.message);
            // Optionally dispatch a failure action if you want to handle errors for just count
        }
    };
};

/**
 * Marks a specific notification as read on the backend and updates local state.
 * @param {string} notificationId - The ID of the notification to mark as read.
 * @param {string} authToken - The authentication token.
 */
export const markNotificationAsRead = (notificationId, authToken) => {
    return async (dispatch) => {
        dispatch(markNotificationReadRequest());
        try {
            // Backend will mark it as read and return updated notification (or success message)
            await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            dispatch(markNotificationReadSuccess(notificationId));
            // After marking read, refresh the total unread count
            // This is handled by a separate Socket.IO event 'notificationRead' from backend
            // or you can explicitly refetch here: dispatch(fetchUnreadNotificationCount(userId, authToken));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(markNotificationReadFailure(errorMessage));
        }
    };
};
