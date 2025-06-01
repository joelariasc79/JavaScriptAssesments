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

export const CLEAR_CART_REQUEST = 'CLEAR_CART_REQUEST';
export const CLEAR_CART_SUCCESS = 'CLEAR_CART_SUCCESS';
export const CLEAR_CART_FAILURE = 'CLEAR_CART_FAILURE';

// --- Action Types for Payment (NEWLY ADDED / ENSURED EXPORTED) ---
export const PROCESS_PAYMENT_REQUEST = 'PROCESS_PAYMENT_REQUEST';
export const PROCESS_PAYMENT_SUCCESS = 'PROCESS_PAYMENT_SUCCESS';
export const PROCESS_PAYMENT_FAILURE = 'PROCESS_PAYMENT_FAILURE';


// --- Synchronous Action Creators ---
// These are simple functions that return a plain action object.

export const fetchCartRequest = () => ({ type: FETCH_CART_REQUEST });
export const fetchCartSuccess = (cart) => ({ type: FETCH_CART_SUCCESS, payload: cart });
export const fetchCartFailure = (error) => ({ type: FETCH_CART_FAILURE, payload: error });

export const addItemToCartRequest = () => ({ type: ADD_ITEM_TO_CART_REQUEST });
export const addItemToCartSuccess = (cart) => ({ type: ADD_ITEM_TO_CART_SUCCESS, payload: cart });
export const addItemToCartFailure = (error) => ({ type: ADD_ITEM_TO_CART_FAILURE, payload: error });

export const removeItemFromCartRequest = () => ({ type: REMOVE_ITEM_FROM_CART_REQUEST });
export const removeItemFromCartSuccess = (cart) => ({ type: REMOVE_ITEM_FROM_CART_SUCCESS, payload: cart });
export const removeItemFromCartFailure = (error) => ({ type: REMOVE_ITEM_FROM_CART_FAILURE, payload: error });

export const updateCartItemQuantityRequest = () => ({ type: UPDATE_CART_ITEM_QUANTORY_REQUEST });
export const updateCartItemQuantitySuccess = (cart) => ({ type: UPDATE_CART_ITEM_QUANTITY_SUCCESS, payload: cart });
export const updateCartItemQuantityFailure = (error) => ({ type: UPDATE_CART_ITEM_QUANTITY_FAILURE, payload: error });

export const clearCartRequest = () => ({ type: CLEAR_CART_REQUEST });
export const clearCartSuccess = (response) => ({ type: CLEAR_CART_SUCCESS, payload: response });
export const clearCartFailure = (error) => ({ type: CLEAR_CART_FAILURE, payload: error });

// --- Synchronous Action Creators for Payment (NEWLY ADDED) ---
export const processPaymentRequest = () => ({ type: PROCESS_PAYMENT_REQUEST });
export const processPaymentSuccess = (response) => ({ type: PROCESS_PAYMENT_SUCCESS, payload: response });
export const processPaymentFailure = (error) => ({ type: PROCESS_PAYMENT_FAILURE, payload: error });


// --- Asynchronous Thunk Action Creators ---
const API_BASE_URL = 'http://localhost:9000/api'; // Ensure this matches your backend API

// This is the correct, consistent fetchCartItems thunk. Removed duplicate/conflicting one.
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
            dispatch(removeItemFromCartSuccess(response.data));
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
            const response = await axios.put(`${API_BASE_URL}/cart/${userId}/items/${productId}`, { quantity: newQuantity });
            dispatch(updateCartItemQuantitySuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(updateCartItemQuantityFailure(errorMessage));
        }
    };
};

export const clearCart = (userId) => {
    return async (dispatch) => {
        dispatch(clearCartRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/cart/checkout`, { userId });
            dispatch(clearCartSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(clearCartFailure(errorMessage));
        }
    };
};

// --- Asynchronous Thunk Action Creator for Payment ---
export const processPayment = (orderId, paymentData) => { // Modified parameters
    return async (dispatch) => {
        dispatch(processPaymentRequest());
        try {
            // Using the correct endpoint and sending payment details
            const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/pay`, paymentData);
            dispatch(processPaymentSuccess(response.data));

            // Optional: You might want to clear the cart in the Redux store
            // after a successful payment, depending on your app's logic.
            dispatch(fetchCartItems(paymentData.userId)); // Refetch cart to ensure it's empty
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(processPaymentFailure(errorMessage));
        }
    };
};
