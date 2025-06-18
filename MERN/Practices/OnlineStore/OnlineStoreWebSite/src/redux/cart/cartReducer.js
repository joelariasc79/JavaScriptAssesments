import {
    FETCH_CART_REQUEST,
    FETCH_CART_SUCCESS,
    FETCH_CART_FAILURE,
    ADD_ITEM_TO_CART_REQUEST,
    ADD_ITEM_TO_CART_SUCCESS,
    ADD_ITEM_TO_CART_FAILURE,
    REMOVE_ITEM_FROM_CART_REQUEST,
    REMOVE_ITEM_FROM_CART_SUCCESS,
    REMOVE_ITEM_FROM_CART_FAILURE,
    UPDATE_CART_ITEM_QUANTITY_REQUEST,
    UPDATE_CART_ITEM_QUANTITY_SUCCESS,
    UPDATE_CART_ITEM_QUANTITY_FAILURE,
    CLEAR_CART_REQUEST,
    CLEAR_CART_SUCCESS,
    CLEAR_CART_FAILURE,
    PROCESS_PAYMENT_REQUEST,
    PROCESS_PAYMENT_SUCCESS,
    PROCESS_PAYMENT_FAILURE,
} from './cartActions';

const initialState = {
    cart: null,
    loading: false,
    error: null,
    checkoutOrderDetails: null, // To store orders details after successful checkout
    paymentSuccess: false, // To track if payment was successful
};

const cartReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CART_REQUEST:
        case ADD_ITEM_TO_CART_REQUEST:
        case REMOVE_ITEM_FROM_CART_REQUEST:
        case UPDATE_CART_ITEM_QUANTITY_REQUEST:
        case CLEAR_CART_REQUEST:
            // These actions should only set loading, not reset paymentSuccess
            return {
                ...state,
                loading: true,
                error: null,
                // Do NOT reset paymentSuccess here
            };

        case PROCESS_PAYMENT_REQUEST:
            // This action specifically starts a payment, so it should reset paymentSuccess
            return {
                ...state,
                loading: true,
                error: null,
                paymentSuccess: false,
            };

        case FETCH_CART_SUCCESS:
        case ADD_ITEM_TO_CART_SUCCESS:
        case REMOVE_ITEM_FROM_CART_SUCCESS:
        case UPDATE_CART_ITEM_QUANTITY_SUCCESS:
            return {
                ...state,
                loading: false,
                cart: action.payload,
                error: null,
                checkoutOrderDetails: null, // Clear checkout details if cart is updated again
                paymentSuccess: false, // Reset on new cart update (non-payment operation success)
            };

        case CLEAR_CART_SUCCESS:
            return {
                ...state,
                loading: false,
                cart: { items: [] }, // Clear cart after successful checkout
                error: null,
                checkoutOrderDetails: action.payload, // Store the orders details from checkout API response
                paymentSuccess: false, // Payment hasn't happened yet for this orders
            };

        case PROCESS_PAYMENT_SUCCESS:
            return {
                ...state,
                loading: false,
                error: null,
                paymentSuccess: true, // THIS IS THE KEY: Set to true on payment success
                checkoutOrderDetails: null, // Clear checkout details after successful payment
                cart: { items: [] }, // Clear cart completely after successful payment
            };

        case FETCH_CART_FAILURE:
        case ADD_ITEM_TO_CART_FAILURE:
        case REMOVE_ITEM_FROM_CART_FAILURE:
        case UPDATE_CART_ITEM_QUANTITY_FAILURE:
        case CLEAR_CART_FAILURE:
        case PROCESS_PAYMENT_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                paymentSuccess: false, // Ensure paymentSuccess is false on error
            };

        default:
            return state;
    }
};

export default cartReducer;