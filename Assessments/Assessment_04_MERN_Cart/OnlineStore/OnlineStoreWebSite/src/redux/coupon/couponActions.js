// src/redux/coupon/couponActions.js
import axios from 'axios';

// Action Types for coupon generation (request, success, failure)
export const GENERATE_COUPON_REQUEST = 'GENERATE_COUPON_REQUEST';
export const GENERATE_COUPON_SUCCESS = 'GENERATE_COUPON_SUCCESS';
export const GENERATE_COUPON_FAILURE = 'GENERATE_COUPON_FAILURE';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:9000/api'; // Ensure this matches your backend port

/**
 * Async Thunk Action to generate a coupon by making a POST request to the backend.
 * The backend will generate the code, discount, and store it.
 * @returns {Function} A Redux thunk function.
 */
export const generateCoupon = () => {
    return async (dispatch) => {
        dispatch({ type: GENERATE_COUPON_REQUEST }); // Dispatch request action to indicate loading
        try {
            // Make the API call to your backend's POST endpoint
            const response = await axios.post(`${API_BASE_URL}/coupon/generate-and-store`);

            // Dispatch success with the full coupon object from the backend response
            // The backend responds with: { message: '...', coupon: { code: '...', discountPercentage: '...', ... } }
            dispatch({
                type: GENERATE_COUPON_SUCCESS,
                payload: response.data.coupon, // The payload is the coupon object
            });
        } catch (error) {
            // Extract a patient-friendly error message
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({
                type: GENERATE_COUPON_FAILURE,
                payload: errorMessage,
            });
        }
    };
};