// src/redux/notifications/notificationReducer.js
import {
    FETCH_NOTIFICATIONS_REQUEST,
    FETCH_NOTIFICATIONS_SUCCESS,
    FETCH_NOTIFICATIONS_FAILURE,
    MARK_NOTIFICATION_READ_REQUEST,
    MARK_NOTIFICATION_READ_SUCCESS,
    MARK_NOTIFICATION_READ_FAILURE,
    ADD_REALTIME_NOTIFICATION,
    UPDATE_NOTIFICATION_COUNT,
    CLEAR_ALL_NOTIFICATIONS,
    REMOVE_NOTIFICATION_BY_ID,
} from './notificationActions';

const initialState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
};

const notificationReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_NOTIFICATIONS_REQUEST:
        case MARK_NOTIFICATION_READ_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };

        case FETCH_NOTIFICATIONS_SUCCESS:
            return {
                ...state,
                loading: false,
                notifications: action.payload.notifications,
                unreadCount: action.payload.unreadCount,
                error: null,
            };

        case FETCH_NOTIFICATIONS_FAILURE:
        case MARK_NOTIFICATION_READ_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        case MARK_NOTIFICATION_READ_SUCCESS:
            const markedNotificationId = action.payload;
            return {
                ...state,
                loading: false,
                notifications: state.notifications.map(notif =>
                    notif._id === markedNotificationId ? { ...notif, read: true } : notif
                ),
                // Decrement unread count if the marked notification was previously unread
                unreadCount: state.notifications.find(notif => notif._id === markedNotificationId && !notif.read)
                    ? state.unreadCount - 1
                    : state.unreadCount,
                error: null,
            };

        case ADD_REALTIME_NOTIFICATION:
            const newNotification = action.payload;
            // Prevent adding duplicate if it was already fetched via REST API
            const exists = state.notifications.some(notif => notif._id === newNotification._id);
            if (exists) {
                return state;
            }
            return {
                ...state,
                notifications: [newNotification, ...state.notifications], // Add new notification to top
                unreadCount: newNotification.read ? state.unreadCount : state.unreadCount + 1, // Increment if unread
                error: null,
            };

        case UPDATE_NOTIFICATION_COUNT:
            return {
                ...state,
                unreadCount: action.payload,
            };

        case CLEAR_ALL_NOTIFICATIONS:
            return {
                ...initialState, // Reset to initial state
                notifications: [],
                unreadCount: 0
            };

        case REMOVE_NOTIFICATION_BY_ID:
            const notificationToRemoveId = action.payload;
            const notificationBeforeRemoval = state.notifications.find(n => n._id === notificationToRemoveId);
            return {
                ...state,
                notifications: state.notifications.filter(notif => notif._id !== notificationToRemoveId),
                // Only decrement count if the removed notification was unread
                unreadCount: (notificationBeforeRemoval && !notificationBeforeRemoval.read) ? state.unreadCount - 1 : state.unreadCount
            };

        default:
            return state;
    }
};

export default notificationReducer;
