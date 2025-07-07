import {
    FETCH_ORDERS_REQUEST,
    FETCH_ORDERS_SUCCESS,
    FETCH_ORDERS_FAILURE,
    FETCH_ORDER_BY_ID_REQUEST,
    FETCH_ORDER_BY_ID_SUCCESS,
    FETCH_ORDER_BY_ID_FAILURE,
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAILURE,
    UPDATE_ORDER_REQUEST,
    UPDATE_ORDER_SUCCESS,
    UPDATE_ORDER_FAILURE,
    DELETE_ORDER_REQUEST,
    DELETE_ORDER_SUCCESS,
    DELETE_ORDER_FAILURE,
    CANCEL_ORDER_REQUEST,
    CANCEL_ORDER_SUCCESS,
    CANCEL_ORDER_FAILURE,
    REOPEN_ORDER_REQUEST,
    REOPEN_ORDER_SUCCESS,
    REOPEN_ORDER_FAILURE,
    DELIVER_ORDER_REQUEST,
    DELIVER_ORDER_SUCCESS,
    DELIVER_ORDER_FAILURE,
    REORDER_TO_CART_REQUEST,
    REORDER_TO_CART_SUCCESS,
    REORDER_TO_CART_FAILURE,
    SUBMIT_ORDER_REVIEW_REQUEST,
    SUBMIT_ORDER_REVIEW_SUCCESS,
    SUBMIT_ORDER_REVIEW_FAILURE,
} from './orderActions';

// Initial state for the orders slice of your Redux store
const initialState = {
    orders: [], // Array to store a list of orders
    selectedOrder: null, // To store details of a single fetched order
    loading: false, // Indicates if a general API operation is in progress
    error: null, // Stores any general error messages from API calls
    operationSuccess: false, // Flag to indicate success of create/update/delete/reorder operations
    cartUpdated: null, // Stores the updated cart object after reorder
    // NEW: State specifically for the review submission process
    reviewLoading: false, // Indicates if a review submission is in progress
    reviewError: null, // Stores error messages specific to review submission
};

const orderReducer = (state = initialState, action) => {
    switch (action.type) {
        // --- GENERAL REQUEST Actions ---
        // These actions set general loading to true and clear previous errors/success states.
        case FETCH_ORDERS_REQUEST:
        case FETCH_ORDER_BY_ID_REQUEST:
        case CREATE_ORDER_REQUEST:
        case UPDATE_ORDER_REQUEST:
        case DELETE_ORDER_REQUEST:
        case CANCEL_ORDER_REQUEST:
        case REOPEN_ORDER_REQUEST:
        case DELIVER_ORDER_REQUEST:
        case REORDER_TO_CART_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                operationSuccess: false,
                cartUpdated: null, // Reset cart update status
            };

        // --- REVIEW-SPECIFIC REQUEST Action ---
        // This action sets a separate loading state for review submissions.
        case SUBMIT_ORDER_REVIEW_REQUEST:
            return {
                ...state,
                reviewLoading: true, // Use separate loading state for reviews
                reviewError: null, // Clear previous review errors
                operationSuccess: false, // Indicate that a new operation is starting
            };

        // --- SUCCESS Actions ---
        // These actions handle successful API responses, updating the state accordingly.
        case FETCH_ORDERS_SUCCESS:
            return {
                ...state,
                loading: false,
                orders: action.payload, // Update the list of orders
                error: null,
            };
        case FETCH_ORDER_BY_ID_SUCCESS:
            return {
                ...state,
                loading: false,
                selectedOrder: action.payload, // Set the details of the single fetched order
                error: null,
            };
        case CREATE_ORDER_SUCCESS:
            return {
                ...state,
                loading: false,
                orders: [...state.orders, action.payload], // Add new order to the list
                selectedOrder: action.payload, // Set as selected order
                error: null,
                operationSuccess: true, // Indicate successful creation
            };
        case UPDATE_ORDER_SUCCESS:
        case CANCEL_ORDER_SUCCESS:
        case REOPEN_ORDER_SUCCESS:
        case DELIVER_ORDER_SUCCESS:
            // For general order updates, the payload is the updated order object.
            const updatedOrderGeneral = action.payload.order || action.payload;
            return {
                ...state,
                loading: false,
                orders: state.orders.map((order) =>
                    order._id === updatedOrderGeneral._id ? updatedOrderGeneral : order
                ),
                selectedOrder: state.selectedOrder?._id === updatedOrderGeneral._id ? updatedOrderGeneral : state.selectedOrder,
                error: null,
                operationSuccess: true,
            };
        case SUBMIT_ORDER_REVIEW_SUCCESS: // NEW: Handle review success specifically
            // The payload contains the overall response, including the updated order details and the review object.
            const { orderId, orderStatus, orderIsReviewed, review } = action.payload;

            return {
                ...state,
                loading: false,
                reviewLoading: false, // Ensure review loading is reset
                orders: state.orders.map((order) => {
                    if (order._id === orderId) { // Find the specific order that was reviewed
                        return {
                            ...order,
                            status: orderStatus, // Update its status (should already be Delivered, but good practice)
                            isReviewed: orderIsReviewed, // Set the isReviewed flag
                            // Add the review details directly to the order object for display
                            rating: review.rating,
                            comment: review.comment,
                            reviewId: review._id // Store review ID if needed for future edits/fetching
                        };
                    }
                    return order;
                }),
                // Also update selectedOrder if it's the one being reviewed
                selectedOrder: state.selectedOrder?._id === orderId ? {
                    ...state.selectedOrder,
                    status: orderStatus,
                    isReviewed: orderIsReviewed,
                    rating: review.rating,
                    comment: review.comment,
                    reviewId: review._id
                } : state.selectedOrder,
                error: null,
                reviewError: null,
                operationSuccess: true,
            };
        case DELETE_ORDER_SUCCESS:
            return {
                ...state,
                loading: false,
                orders: state.orders.filter((order) => order._id !== action.payload), // Remove deleted order from the list
                selectedOrder: state.selectedOrder?._id === action.payload ? null : state.selectedOrder, // Clear selected order if it was deleted
                error: null,
                operationSuccess: true, // Indicate successful deletion
            };
        case REORDER_TO_CART_SUCCESS:
            return {
                ...state,
                loading: false,
                cartUpdated: action.payload, // Store the updated cart data
                error: null,
                operationSuccess: true, // Indicate successful reorder
            };

        // --- GENERAL FAILURE Actions ---
        // These actions are dispatched when a general API call fails.
        // They set `loading` to false, store the `error` message, and reset `operationSuccess`.
        case FETCH_ORDERS_FAILURE:
        case FETCH_ORDER_BY_ID_FAILURE:
        case CREATE_ORDER_FAILURE:
        case UPDATE_ORDER_FAILURE:
        case DELETE_ORDER_FAILURE:
        case CANCEL_ORDER_FAILURE:
        case REOPEN_ORDER_FAILURE:
        case DELIVER_ORDER_FAILURE:
        case REORDER_TO_CART_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload, // Store the general error message
                operationSuccess: false, // Operation failed
            };

        // --- REVIEW-SPECIFIC FAILURE Action ---
        // This action handles failures specifically for review submissions.
        case SUBMIT_ORDER_REVIEW_FAILURE:
            return {
                ...state,
                reviewLoading: false, // Reset review loading
                reviewError: action.payload, // Use separate error state for reviews
                operationSuccess: false, // Operation failed
            };

        default:
            return state;
    }
};

export default orderReducer;