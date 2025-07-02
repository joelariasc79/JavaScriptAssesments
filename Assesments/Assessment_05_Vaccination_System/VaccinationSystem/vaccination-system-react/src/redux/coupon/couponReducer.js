// src/redux/coupon/couponReducer.js

import {
    GENERATE_COUPON_REQUEST,
    GENERATE_COUPON_SUCCESS,
    GENERATE_COUPON_FAILURE,
} from './couponActions';

// Initial state for the coupon reducer
const initialState = {
    couponValue: null, // This will now store the entire coupon object { code, discountPercentage, ... }
    loading: false,    // Indicates if an API call is in progress
    error: null,       // Stores any error messages from API requests
};

/**
 * Reducer for managing coupon generation state.
 * @param {object} state - The current state.
 * @param {object} action - The dispatched action.
 * @returns {object} The new state.
 */
const couponReducer = (state = initialState, action) => {
    switch (action.type) {
        case GENERATE_COUPON_REQUEST:
            return {
                ...state,
                loading: true,
                error: null, // Clear previous errors
            };
        case GENERATE_COUPON_SUCCESS:
            return {
                ...state,
                loading: false,
                couponValue: action.payload, // Store the full coupon object received from the backend
                error: null,
            };
        case GENERATE_COUPON_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload, // Store the error message
                couponValue: null,     // Clear coupon on failure
            };
        default:
            return state;
    }
};

export default couponReducer;