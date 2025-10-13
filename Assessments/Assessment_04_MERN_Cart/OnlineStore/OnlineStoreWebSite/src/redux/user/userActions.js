import axios from 'axios';

// --- Action Types ---
export const FETCH_USER_REQUEST = 'FETCH_USER_REQUEST';
export const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
export const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

export const CREATE_USER_REQUEST = 'CREATE_USER_REQUEST';
export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_FAILURE = 'CREATE_USER_FAILURE';

// New Action Types for Login
export const LOGIN_USER_REQUEST = 'LOGIN_USER_REQUEST';
export const LOGIN_USER_SUCCESS = 'LOGIN_USER_SUCCESS';
export const LOGIN_USER_FAILURE = 'LOGIN_USER_FAILURE';

export const LOGOUT_USER = 'LOGOUT_USER'; // For logging out

export const CLEAR_USER_STATUS = 'CLEAR_USER_STATUS'; // To clear success/error messages

// --- Action Creators ---
// Fetch User
export const fetchUserRequest = () => ({ type: FETCH_USER_REQUEST });
export const fetchUserSuccess = (user) => ({ type: FETCH_USER_SUCCESS, payload: user });
export const fetchUserFailure = (error) => ({ type: FETCH_USER_FAILURE, payload: error });

// Create User
export const createUserRequest = () => ({ type: CREATE_USER_REQUEST });
export const createUserSuccess = (data) => ({ type: CREATE_USER_SUCCESS, payload: data }); // Payload now includes message and patient
export const createUserFailure = (error) => ({ type: CREATE_USER_FAILURE, payload: error });

// Login User
export const loginUserRequest = () => ({ type: LOGIN_USER_REQUEST });
export const loginUserSuccess = (token) => ({ type: LOGIN_USER_SUCCESS, payload: token });
export const loginUserFailure = (error) => ({ type: LOGIN_USER_FAILURE, payload: error });

export const logoutUser = () => ({ type: LOGOUT_USER });

export const clearUserStatus = () => ({ type: CLEAR_USER_STATUS });

// --- Async Thunk Actions ---

const API_BASE_URL = 'http://localhost:9000/api';

/**
 * Fetches a single patient's details by their custom userId.
 * This route is now protected, so it requires a JWT token.
 * @param {string} userId - The custom patient ID (e.g., "user123").
 * @param {string} token - The JWT token for authentication.
 */
export const fetchUser = (userId, token) => {
    return async (dispatch) => {
        dispatch(fetchUserRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Include JWT in Authorization header
                }
            });
            dispatch(fetchUserSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchUserFailure(errorMessage));
        }
    };
};

/**
 * Registers a new patient in the database.
 * @param {object} userData - Object containing patient details (userId, username, email, password, address object)
 */
export const createUser = (userData) => {
    return async (dispatch) => {
        dispatch(createUserRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData); // Use /auth/register
            dispatch(createUserSuccess(response.data)); // Response includes message and patient data
            setTimeout(() => dispatch(clearUserStatus()), 3000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(createUserFailure(errorMessage));
            setTimeout(() => dispatch(clearUserStatus()), 5000);
        }
    };
};

/**
 * Logs in a patient and dispatches the received JWT token.
 * @param {object} credentials - Object containing usernameOrEmail and password.
 */
export const loginUser = (credentials) => {
    return async (dispatch) => {
        dispatch(loginUserRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
            const { token } = response.data; // Extract the token from the response
            dispatch(loginUserSuccess(token)); // Dispatch the token
            setTimeout(() => dispatch(clearUserStatus()), 3000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(loginUserFailure(errorMessage));
            setTimeout(() => dispatch(clearUserStatus()), 5000);
        }
    };
};