import {
    FETCH_USER_REQUEST,
    FETCH_USER_SUCCESS,
    FETCH_USER_FAILURE,
    CREATE_USER_REQUEST,
    CREATE_USER_SUCCESS,
    CREATE_USER_FAILURE,
    LOGIN_USER_REQUEST, // New
    LOGIN_USER_SUCCESS, // New
    LOGIN_USER_FAILURE, // New
    LOGOUT_USER,        // New
    CLEAR_USER_STATUS,
} from './userActions';

const initialState = {
    currentUser: null, // Stores the fetched or created user object, including nested address
    token: null,       // Stores the JWT token upon successful login
    loading: false,
    error: null,
    successMessage: null, // To indicate successful user creation/fetch/login
};

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_USER_REQUEST:
        case CREATE_USER_REQUEST:
        case LOGIN_USER_REQUEST: // New
            return {
                ...state,
                loading: true,
                error: null,
                successMessage: null,
            };
        case FETCH_USER_SUCCESS:
            return {
                ...state,
                loading: false,
                currentUser: action.payload,
                error: null,
                successMessage: 'User fetched successfully!',
            };
        case CREATE_USER_SUCCESS:
            return {
                ...state,
                loading: false,
                // The payload here is { message: 'User registered successfully!', user: {...} }
                currentUser: action.payload.user, // Store the user object from the response
                error: null,
                successMessage: action.payload.message || 'User created successfully!', // Use message from payload
            };
        case LOGIN_USER_SUCCESS: // New
            return {
                ...state,
                loading: false,
                token: action.payload, // Store the JWT token
                error: null,
                successMessage: 'Login successful!',
            };
        case FETCH_USER_FAILURE:
        case CREATE_USER_FAILURE:
        case LOGIN_USER_FAILURE: // New
            return {
                ...state,
                loading: false,
                error: action.payload,
                successMessage: null,
            };
        case LOGOUT_USER: // New
            return {
                ...initialState, // Reset state to initial, effectively logging out
                successMessage: 'Logged out successfully.'
            };
        case CLEAR_USER_STATUS:
            return {
                ...state,
                error: null,
                successMessage: null,
            };
        default:
            return state;
    }
};

export default userReducer;