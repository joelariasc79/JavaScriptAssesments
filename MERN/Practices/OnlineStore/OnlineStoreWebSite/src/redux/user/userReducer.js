// src/redux/user/userReducer.js
import {
    FETCH_USER_REQUEST,
    FETCH_USER_SUCCESS,
    FETCH_USER_FAILURE,
    CREATE_USER_REQUEST,
    CREATE_USER_SUCCESS,
    CREATE_USER_FAILURE,
    CLEAR_USER_STATUS,
} from './userActions';

const initialState = {
    currentUser: null, // Stores the fetched or created user object, including nested address
    loading: false,
    error: null,
    successMessage: null, // To indicate successful user creation/fetch
};

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_USER_REQUEST:
        case CREATE_USER_REQUEST:
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
                currentUser: action.payload, // The newly created user
                error: null,
                successMessage: 'User created successfully!',
            };
        case FETCH_USER_FAILURE:
        case CREATE_USER_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                successMessage: null,
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