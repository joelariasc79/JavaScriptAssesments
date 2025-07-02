import axios from 'axios';

// --- Action Types ---
export const FETCH_CART_REQUEST = 'FETCH_CART_REQUEST';
export const FETCH_CART_SUCCESS = 'FETCH_CART_SUCCESS';
export const FETCH_CART_FAILURE = 'FETCH_CART_FAILURE';

export const ADD_ITEM_TO_CART_REQUEST = 'ADD_ITEM_TO_CART_REQUEST';
export const ADD_ITEM_TO_CART_SUCCESS = 'ADD_ITEM_TO_CART_SUCCESS';
export const ADD_ITEM_TO_CART_FAILURE = 'ADD_ITEM_TO_CART_FAILURE';

export const REMOVE_ITEM_FROM_CART_REQUEST = 'REMOVE_ITEM_FROM_CART_REQUEST';
export const REMOVE_ITEM_FROM_CART_SUCCESS = 'REMOVE_ITEM_FROM_CART_SUCCESS';
export const REMOVE_ITEM_FROM_CART_FAILURE = 'REMOVE_ITEM_FROM_CART_FAILURE';

export const UPDATE_CART_ITEM_QUANTITY_REQUEST = 'UPDATE_CART_ITEM_QUANTITY_REQUEST';
export const UPDATE_CART_ITEM_QUANTITY_SUCCESS = 'UPDATE_CART_ITEM_QUANTITY_SUCCESS';
export const UPDATE_CART_ITEM_QUANTITY_FAILURE = 'UPDATE_CART_ITEM_QUANTITY_FAILURE';

export const CHECKOUT_CART_REQUEST = 'CHECKOUT_CART_REQUEST';
export const CHECKOUT_CART_SUCCESS = 'CHECKOUT_CART_SUCCESS';
export const CHECKOUT_CART_FAILURE = 'CHECKOUT_CART_FAILURE';

export const CLEAR_CART_ONLY_REQUEST = 'CLEAR_CART_ONLY_REQUEST';
export const CLEAR_CART_ONLY_SUCCESS = 'CLEAR_CART_ONLY_SUCCESS';
export const CLEAR_CART_ONLY_FAILURE = 'CLEAR_CART_ONLY_FAILURE';

export const PROCESS_PAYMENT_REQUEST = 'PROCESS_PAYMENT_REQUEST';
export const PROCESS_PAYMENT_SUCCESS = 'PROCESS_PAYMENT_SUCCESS';
export const PROCESS_PAYMENT_FAILURE = 'PROCESS_PAYMENT_FAILURE';

export const APPLY_COUPON_REQUEST = 'APPLY_COUPON_REQUEST';
export const APPLY_COUPON_SUCCESS = 'APPLY_COUPON_SUCCESS';
export const APPLY_COUPON_FAILURE = 'APPLY_COUPON_FAILURE';
export const CLEAR_APPLIED_COUPON = 'CLEAR_APPLIED_COUPON';


// --- Synchronous Action Creators ---
export const fetchCartRequest = () => ({ type: FETCH_CART_REQUEST });
export const fetchCartSuccess = (cart) => ({ type: FETCH_CART_SUCCESS, payload: cart });
export const fetchCartFailure = (error) => ({ type: FETCH_CART_FAILURE, payload: error });

export const addItemToCartRequest = () => ({ type: ADD_ITEM_TO_CART_REQUEST });
export const addItemToCartSuccess = (cart) => ({ type: ADD_ITEM_TO_CART_SUCCESS, payload: cart });
export const addItemToCartFailure = (error) => ({ type: ADD_ITEM_TO_CART_FAILURE, payload: error });

export const removeItemFromCartRequest = () => ({ type: REMOVE_ITEM_FROM_CART_REQUEST });
export const removeItemFromCartSuccess = (response) => ({ type: REMOVE_ITEM_FROM_CART_SUCCESS, payload: response });
export const removeItemFromCartFailure = (error) => ({ type: REMOVE_ITEM_FROM_CART_FAILURE, payload: error });

export const updateCartItemQuantityRequest = () => ({ type: UPDATE_CART_ITEM_QUANTITY_REQUEST });
export const updateCartItemQuantitySuccess = (cart) => ({ type: UPDATE_CART_ITEM_QUANTITY_SUCCESS, payload: cart });
export const updateCartItemQuantityFailure = (error) => ({ type: UPDATE_CART_ITEM_QUANTITY_FAILURE, payload: error });

export const checkoutCartRequest = () => ({ type: CHECKOUT_CART_REQUEST });
export const checkoutCartSuccess = (response) => ({ type: CHECKOUT_CART_SUCCESS, payload: response });
export const checkoutCartFailure = (error) => ({ type: CHECKOUT_CART_FAILURE, payload: error });

export const clearCartOnlyRequest = () => ({ type: CLEAR_CART_ONLY_REQUEST });
export const clearCartOnlySuccess = (response) => ({ type: CLEAR_CART_ONLY_SUCCESS, payload: response });
export const clearCartOnlyFailure = (error) => ({ type: CLEAR_CART_ONLY_FAILURE, payload: error });

export const processPaymentRequest = () => ({ type: PROCESS_PAYMENT_REQUEST });
export const processPaymentSuccess = (response) => ({ type: PROCESS_PAYMENT_SUCCESS, payload: response });
export const processPaymentFailure = (error) => ({ type: PROCESS_PAYMENT_FAILURE, payload: error });


// --- Asynchronous Thunk Action Creators ---
const API_BASE_URL = 'http://localhost:9000/api'; // Ensure this matches your backend API

export const fetchCartItems = (userId) => {
    return async (dispatch) => {
        dispatch(fetchCartRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/cart/${userId}`);
            dispatch(fetchCartSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchCartFailure(errorMessage));
        }
    };
};

export const addItemToCart = (userId, productId, quantity = 1) => {
    return async (dispatch) => {
        dispatch(addItemToCartRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/cart/add`, { userId, productId, quantity });
            dispatch(addItemToCartSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(addItemToCartFailure(errorMessage));
        }
    };
};

export const removeItemFromCart = (userId, productId) => {
    return async (dispatch) => {
        dispatch(removeItemFromCartRequest());
        try {
            const response = await axios.delete(`${API_BASE_URL}/cart/${userId}/items/${productId}`);
            dispatch(removeItemFromCartSuccess(response.data)); // Backend should return updated cart
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(removeItemFromCartFailure(errorMessage));
        }
    };
};

export const updateCartItemQuantity = (userId, productId, newQuantity) => {
    return async (dispatch) => {
        dispatch(updateCartItemQuantityRequest());
        try {
            // Assuming your backend supports PUT for quantity update
            const response = await axios.put(`${API_BASE_URL}/cart/${userId}/items/${productId}`, { quantity: newQuantity });
            dispatch(updateCartItemQuantitySuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(updateCartItemQuantityFailure(errorMessage));
        }
    };
};

export const checkoutCart = (userId) => {
    return async (dispatch) => {
        dispatch(checkoutCartRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/cart/checkout`, { userId });
            dispatch(checkoutCartSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(checkoutCartFailure(errorMessage));
        }
    };
};

export const clearCart = (userId) => {
    return async (dispatch) => {
        dispatch(clearCartOnlyRequest());
        try {
            // Assuming backend has a /cart/clear endpoint for specific user
            const response = await axios.post(`${API_BASE_URL}/cart/clear`, { userId }); // Or a DELETE endpoint
            dispatch(clearCartOnlySuccess(response.data));
            // After clearing, refetch to ensure cart state is consistent (e.g., now empty)
            dispatch(fetchCartItems(userId));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(clearCartOnlyFailure(errorMessage));
        }
    };
};

export const processPayment = (orderId, paymentData) => {
    return async (dispatch) => {
        dispatch(processPaymentRequest());
        try {
            // FIX: Only send couponCode to backend. Backend calculates discountPercentage and amountSaved.
            const dataToSend = { ...paymentData };
            if (dataToSend.couponCode) {
                // If couponCode is present, the backend will handle validation and calculation.
                // Remove frontend-calculated discount details if they were mistakenly added here.
                delete dataToSend.discountPercentage;
                delete dataToSend.amountSaved;
            }

            const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/pay`, dataToSend);
            dispatch(processPaymentSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(processPaymentFailure(errorMessage));
        }
    };
};

// FIX: New Async Thunk Action: applyCoupon
// This action now only fetches coupon details for display, not for calculating final total in state.
export const applyCoupon = (couponCode) => { // Removed originalTotal as parameter
    return async (dispatch) => {
        dispatch({ type: APPLY_COUPON_REQUEST });
        try {
            const response = await axios.get(`${API_BASE_URL}/coupon/${couponCode}`);
            const couponData = response.data.coupon; // Assuming response.data is { coupon: { code, discountPercentage, ... } }

            dispatch({
                type: APPLY_COUPON_SUCCESS,
                payload: {
                    code: couponData.code,
                    discountPercentage: couponData.discountPercentage,
                    // FIX: No discountAmount or newTotal calculated/stored here.
                    // These will be derived in the component/selector for display.
                },
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({
                type: APPLY_COUPON_FAILURE,
                payload: errorMessage,
            });
        }
    };
};

// New Action Creator: clearAppliedCoupon (optional, but good for resetting)
export const clearAppliedCoupon = () => {
    return {
        type: CLEAR_APPLIED_COUPON,
    };
};