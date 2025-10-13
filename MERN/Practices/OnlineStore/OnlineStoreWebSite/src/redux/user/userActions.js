// src/redux/patient/userActions.js
import axios from 'axios';

// --- Action Types ---
export const FETCH_USER_REQUEST = 'FETCH_USER_REQUEST';
export const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
export const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

export const CREATE_USER_REQUEST = 'CREATE_USER_REQUEST';
export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_FAILURE = 'CREATE_USER_FAILURE';

export const CLEAR_USER_STATUS = 'CLEAR_USER_STATUS'; // To clear success/error messages

// --- Action Creators ---
// Fetch User
export const fetchUserRequest = () => ({ type: FETCH_USER_REQUEST });
export const fetchUserSuccess = (user) => ({ type: FETCH_USER_SUCCESS, payload: user });
export const fetchUserFailure = (error) => ({ type: FETCH_USER_FAILURE, payload: error });

// Create User
export const createUserRequest = () => ({ type: CREATE_USER_REQUEST });
export const createUserSuccess = (user) => ({ type: CREATE_USER_SUCCESS, payload: user });
export const createUserFailure = (error) => ({ type: CREATE_USER_FAILURE, payload: error });

export const clearUserStatus = () => ({ type: CLEAR_USER_STATUS });

// --- Async Thunk Actions ---

const API_BASE_URL = 'http://localhost:9000/api';

/**
 * Fetches a single patient's details by their custom userId.
 * @param {string} userId - The custom patient ID (e.g., "user123").
 */
export const fetchUser = (userId) => {
    return async (dispatch) => {
        dispatch(fetchUserRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
            dispatch(fetchUserSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchUserFailure(errorMessage));
        }
    };
};

/**
 * Creates a new patient in the database.
 * @param {object} userData - Object containing patient details (userId, username, email, address object)
 */
export const createUser = (userData) => {
    return async (dispatch) => {
        dispatch(createUserRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/users`, userData);
            dispatch(createUserSuccess(response.data));
            // Optional: Clear success/error status after a short delay for patient feedback
            setTimeout(() => dispatch(clearUserStatus()), 3000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(createUserFailure(errorMessage));
            // Optional: Clear error after a short delay
            setTimeout(() => dispatch(clearUserStatus()), 5000);
        }
    };
};