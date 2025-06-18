// import axios from 'axios';
//
// // --- Base API URL ---
// const API_BASE_URL = 'http://localhost:9000/api';
//
// // --- Action Types for Fetching Multiple Orders ---
// export const FETCH_ORDERS_REQUEST = 'FETCH_ORDERS_REQUEST';
// export const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
// export const FETCH_ORDERS_FAILURE = 'FETCH_ORDERS_FAILURE';
//
// // --- Action Types for Fetching a Single Order ---
// export const FETCH_ORDER_BY_ID_REQUEST = 'FETCH_ORDER_BY_ID_REQUEST';
// export const FETCH_ORDER_BY_ID_SUCCESS = 'FETCH_ORDER_BY_ID_SUCCESS';
// export const FETCH_ORDER_BY_ID_FAILURE = 'FETCH_ORDER_BY_ID_FAILURE';
//
// // --- Action Types for Creating an Order ---
// export const CREATE_ORDER_REQUEST = 'CREATE_ORDER_REQUEST';
// export const CREATE_ORDER_SUCCESS = 'CREATE_ORDER_SUCCESS';
// export const CREATE_ORDER_FAILURE = 'CREATE_ORDER_FAILURE';
//
// // --- Action Types for Updating an Order (General Update) ---
// export const UPDATE_ORDER_REQUEST = 'UPDATE_ORDER_REQUEST';
// export const UPDATE_ORDER_SUCCESS = 'UPDATE_ORDER_SUCCESS';
// export const UPDATE_ORDER_FAILURE = 'UPDATE_ORDER_FAILURE';
//
// // --- Action Types for Deleting an Order ---
// export const DELETE_ORDER_REQUEST = 'DELETE_ORDER_REQUEST';
// export const DELETE_ORDER_SUCCESS = 'DELETE_ORDER_SUCCESS';
// export const DELETE_ORDER_FAILURE = 'DELETE_ORDER_FAILURE';
//
// // --- Specific Order Status Action Types ---
// export const CANCEL_ORDER_REQUEST = 'CANCEL_ORDER_REQUEST';
// export const CANCEL_ORDER_SUCCESS = 'CANCEL_ORDER_SUCCESS';
// export const CANCEL_ORDER_FAILURE = 'CANCEL_ORDER_FAILURE';
//
// export const REOPEN_ORDER_REQUEST = 'REOPEN_ORDER_REQUEST';
// export const REOPEN_ORDER_SUCCESS = 'REOPEN_ORDER_SUCCESS';
// export const REOPEN_ORDER_FAILURE = 'REOPEN_ORDER_FAILURE';
//
// export const DELIVER_ORDER_REQUEST = 'DELIVER_ORDER_REQUEST';
// export const DELIVER_ORDER_SUCCESS = 'DELIVER_ORDER_SUCCESS';
// export const DELIVER_ORDER_FAILURE = 'DELIVER_DELIVER_FAILURE';
//
// // --- Action Types for Reorder to Cart ---
// export const REORDER_TO_CART_REQUEST = 'REORDER_TO_CART_REQUEST';
// export const REORDER_TO_CART_SUCCESS = 'REORDER_TO_CART_SUCCESS';
// export const REORDER_TO_CART_FAILURE = 'REORDER_TO_CART_FAILURE';
//
// // NEW: Action types for submitting an order review
// export const SUBMIT_ORDER_REVIEW_REQUEST = 'SUBMIT_ORDER_REVIEW_REQUEST';
// export const SUBMIT_ORDER_REVIEW_SUCCESS = 'SUBMIT_ORDER_REVIEW_SUCCESS';
// export const SUBMIT_ORDER_REVIEW_FAILURE = 'SUBMIT_ORDER_REVIEW_FAILURE';
//
// // --- Synchronous Action Creators ---
//
// // Fetch Orders
// export const fetchOrdersRequest = () => ({ type: FETCH_ORDERS_REQUEST });
// export const fetchOrdersSuccess = (orders) => ({ type: FETCH_ORDERS_SUCCESS, payload: orders });
// export const fetchOrdersFailure = (error) => ({ type: FETCH_ORDERS_FAILURE, payload: error });
//
// // Fetch Order by ID
// export const fetchOrderByIdRequest = () => ({ type: FETCH_ORDER_BY_ID_REQUEST });
// export const fetchOrderByIdSuccess = (order) => ({ type: FETCH_ORDER_BY_ID_SUCCESS, payload: order });
// export const fetchOrderByIdFailure = (error) => ({ type: FETCH_ORDER_BY_ID_FAILURE, payload: error });
//
// // Create Order
// export const createOrderRequest = () => ({ type: CREATE_ORDER_REQUEST });
// export const createOrderSuccess = (order) => ({ type: CREATE_ORDER_SUCCESS, payload: order });
// export const createOrderFailure = (error) => ({ type: CREATE_ORDER_FAILURE, payload: error });
//
// // Update Order (General)
// export const updateOrderRequest = () => ({ type: UPDATE_ORDER_REQUEST });
// export const updateOrderSuccess = (order) => ({ type: UPDATE_ORDER_SUCCESS, payload: order });
// export const updateOrderFailure = (error) => ({ type: UPDATE_ORDER_FAILURE, payload: error });
//
// // Delete Order
// export const deleteOrderRequest = () => ({ type: DELETE_ORDER_REQUEST });
// export const deleteOrderSuccess = (orderId) => ({ type: DELETE_ORDER_SUCCESS, payload: orderId });
// export const deleteOrderFailure = (error) => ({ type: DELETE_ORDER_FAILURE, payload: error });
//
// // Cancel Order
// export const cancelOrderRequest = () => ({ type: CANCEL_ORDER_REQUEST });
// export const cancelOrderSuccess = (order) => ({ type: CANCEL_ORDER_SUCCESS, payload: order });
// export const cancelOrderFailure = (error) => ({ type: CANCEL_ORDER_FAILURE, payload: error });
//
// // Reopen Order
// export const reopenOrderRequest = () => ({ type: REOPEN_ORDER_REQUEST });
// export const reopenOrderSuccess = (order) => ({ type: REOPEN_ORDER_SUCCESS, payload: order });
// export const reopenOrderFailure = (error) => ({ type: REOPEN_ORDER_FAILURE, payload: error });
//
// // Deliver Order
// export const deliverOrderRequest = () => ({ type: DELIVER_ORDER_REQUEST });
// export const deliverOrderSuccess = (order) => ({ type: DELIVER_ORDER_SUCCESS, payload: order });
// export const deliverOrderFailure = (error) => ({ type: DELIVER_DELIVER_FAILURE, payload: error });
//
// // Reorder to Cart
// export const reorderToCartRequest = () => ({ type: REORDER_TO_CART_REQUEST });
// export const reorderToCartSuccess = (cart) => ({ type: REORDER_TO_CART_SUCCESS, payload: cart });
// // Payload is the updated cart
// export const reorderToCartFailure = (error) => ({ type: REORDER_TO_CART_FAILURE, payload: error });
//
// // NEW: Synchronous Action Creators for submitting an order review
// export const submitOrderReviewRequest = () => ({ type: SUBMIT_ORDER_REVIEW_REQUEST });
// export const submitOrderReviewSuccess = (order) => ({ type: SUBMIT_ORDER_REVIEW_SUCCESS, payload: order });
// export const submitOrderReviewFailure = (error) => ({ type: SUBMIT_ORDER_REVIEW_FAILURE, payload: error });
//
// // --- Asynchronous Thunk Action Creators ---
//
// /**
//  * Fetches all orders from the backend.
//  * This might be used by an admin dashboard.
//  * @param {string} token - JWT token for authentication.
//  */
// export const fetchAllOrders = (token) => {
//     return async (dispatch) => {
//         dispatch(fetchOrdersRequest());
//         try {
//             const response = await axios.get(`${API_BASE_URL}/orders`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             dispatch(fetchOrdersSuccess(response.data.orders)); // Assuming backend returns { orders: [...] }
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(fetchOrdersFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Fetches recent orders for a specific user.
//  * Note: This endpoint was made public in your last request, so it doesn't need a token by default.
//  * @param {string} userId - The ID of the user.
//  * @param {number} limit - Optional: Number of recent orders to fetch.
//  */
// export const fetchRecentOrdersForUser = (userId, limit = 10) => {
//     return async (dispatch) => {
//         dispatch(fetchOrdersRequest()); // Reusing FETCH_ORDERS_REQUEST/SUCCESS/FAILURE
//         try {
//             const response = await axios.get(`${API_BASE_URL}/orders/user/recent?userId=${userId}&limit=${limit}`);
//             dispatch(fetchOrdersSuccess(response.data.orders));
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(fetchOrdersFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Fetches a single order by its ID.
//  * @param {string} orderId - The ID of the order to fetch.
//  * @param {string} token - JWT token for authentication.
//  */
// export const fetchOrderById = (orderId, token) => {
//     return async (dispatch) => {
//         dispatch(fetchOrderByIdRequest());
//         try {
//             const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             dispatch(fetchOrderByIdSuccess(response.data)); // Assuming backend returns the order directly
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(fetchOrderByIdFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Creates a new order.
//  * @param {object} orderData - The data for the new order (e.g., userId, items, totalAmount).
//  * @param {string} token - JWT token for authentication.
//  */
// export const createOrder = (orderData, token) => {
//     return async (dispatch) => {
//         dispatch(createOrderRequest());
//         try {
//             const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             dispatch(createOrderSuccess(response.data.order)); // Assuming backend returns { order: {...} }
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(createOrderFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Updates an existing order (general update).
//  * @param {string} orderId - The ID of the order to update.
//  * @param {object} updateData - The data to update the order with.
//  * @param {string} token - JWT token for authentication.
//  */
// export const updateOrder = (orderId, updateData, token) => {
//     return async (dispatch) => {
//         dispatch(updateOrderRequest());
//         try {
//             const response = await axios.put(`${API_BASE_URL}/orders/${orderId}`, updateData, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             dispatch(updateOrderSuccess(response.data.order)); // Assuming backend returns { order: {...} }
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(updateOrderFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Deletes an order by its ID.
//  * @param {string} orderId - The ID of the order to delete.
//  * @param {string} token - JWT token for authentication.
//  */
// export const deleteOrder = (orderId, token) => {
//     return async (dispatch) => {
//         dispatch(deleteOrderRequest());
//         try {
//             await axios.delete(`${API_BASE_URL}/orders/${orderId}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             dispatch(deleteOrderSuccess(orderId)); // Payload is the ID of the deleted order
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(deleteOrderFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Cancels an order.
//  * @param {string} orderId - The ID of the order to cancel.
//  * @param {string} userId - The ID of the user who owns the order (now required in body).
//  */
// export const cancelOrder = (orderId, userId) => {
//     return async (dispatch) => {
//         dispatch(cancelOrderRequest());
//         try {
//             // Send userId in the request body, no Authorization header needed for this public route
//             const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/cancel`, { userId: userId });
//             dispatch(cancelOrderSuccess(response.data)); // Assuming backend returns { message, orderId, newStatus }
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(cancelOrderFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Reopens a cancelled order.
//  * @param {string} orderId - The ID of the order to reopen.
//  * @param {string} userId - The ID of the user.
//  */
// export const reopenOrder = (orderId, userId) => {
//     return async (dispatch) => {
//         dispatch(reopenOrderRequest());
//         try {
//             // Backend now expects userId in the request body, no auth token needed for this public route
//             const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/reopen`, { userId: userId });
//             dispatch(reopenOrderSuccess(response.data));
//         }
//         catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(reopenOrderFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Marks an order as delivered.
//  * @param {string} orderId - The ID of the order to mark as delivered.
//  * @param {string} userId - The ID of the user who owns the order (now required in body).
//  * @param {string} authToken - JWT token for authentication.
//  */
// export const deliverOrder = (orderId, userId, authToken) => { // Added userId parameter
//     return async (dispatch) => {
//         dispatch(deliverOrderRequest());
//         try {
//             // Backend now expects userId in the request body
//             const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/deliver`, { userId: userId }, {
//                 headers: { Authorization: `Bearer ${authToken}` }
//             });
//             dispatch(deliverOrderSuccess(response.data)); // Assuming backend returns { message, orderId, newStatus }
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(deliverOrderFailure(errorMessage));
//         }
//     };
// };
//
// /**
//  * Reorders items from an existing order to the user's cart.
//  * @param {string} orderId - The ID of the order to reorder from.
//  * @param {string} userId - The ID of the user.
//  * @param {'replace' | 'merge'} mergeBehavior - How to handle existing cart items ('replace' or 'merge').
//  */
// export const reorderToCart = (orderId, userId, mergeBehavior) => {
//     return async (dispatch) => {
//         dispatch(reorderToCartRequest());
//         try {
//             const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/reorder-to-cart`, {
//                 userId: userId,
//                 mergeBehavior: mergeBehavior,
//             });
//             dispatch(reorderToCartSuccess(response.data.cart)); // Assuming backend returns { message, cart }
//             return response.data.message; // Return success message for UI feedback
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(reorderToCartFailure(errorMessage));
//             throw new Error(errorMessage); // Propagate error for UI feedback
//         }
//     };
// };
//
// /**
//  * Submits a review for a delivered order.
//  * @param {string} orderId - The ID of the order being reviewed.
//  * @param {string} userId - The ID of the user submitting the review.
//  * @param {number} rating - The rating (1-5 stars).
//  * @param {string} comment - The review comment.
//  * @param {string} authToken - The authentication token for the user.
//  */
// export const submitOrderReview = (orderId, userId, rating, comment, authToken) => {
//     return async (dispatch) => {
//         dispatch(submitOrderReviewRequest());
//         try {
//             const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/review`,
//                 { userId, rating, comment }, // Send these in the request body
//                 {
//                     headers: { Authorization: `Bearer ${authToken}` } // Authorization header
//                 }
//             );
//             // Assuming the backend returns the updated order or a success message
//             dispatch(submitOrderReviewSuccess(response.data));
//             return response.data.message; // Return success message for UI feedback
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             dispatch(submitOrderReviewFailure(errorMessage));
//             throw new Error(errorMessage); // Propagate error for UI feedback
//         }
//     };
// };



import axios from 'axios';

// --- Base API URL ---
const API_BASE_URL = 'http://localhost:9000/api';

// --- Action Types for Fetching Multiple Orders ---
export const FETCH_ORDERS_REQUEST = 'FETCH_ORDERS_REQUEST';
export const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
export const FETCH_ORDERS_FAILURE = 'FETCH_ORDERS_FAILURE';

// --- Action Types for Fetching a Single Order ---
export const FETCH_ORDER_BY_ID_REQUEST = 'FETCH_ORDER_BY_ID_REQUEST';
export const FETCH_ORDER_BY_ID_SUCCESS = 'FETCH_ORDER_BY_ID_SUCCESS';
export const FETCH_ORDER_BY_ID_FAILURE = 'FETCH_ORDER_BY_ID_FAILURE';

// --- Action Types for Creating an Order ---
export const CREATE_ORDER_REQUEST = 'CREATE_ORDER_REQUEST';
export const CREATE_ORDER_SUCCESS = 'CREATE_ORDER_SUCCESS';
export const CREATE_ORDER_FAILURE = 'CREATE_ORDER_FAILURE';

// --- Action Types for Updating an Order (General Update) ---
export const UPDATE_ORDER_REQUEST = 'UPDATE_ORDER_REQUEST';
export const UPDATE_ORDER_SUCCESS = 'UPDATE_ORDER_SUCCESS';
export const UPDATE_ORDER_FAILURE = 'UPDATE_ORDER_FAILURE';

// --- Action Types for Deleting an Order ---
export const DELETE_ORDER_REQUEST = 'DELETE_ORDER_REQUEST';
export const DELETE_ORDER_SUCCESS = 'DELETE_ORDER_SUCCESS';
export const DELETE_ORDER_FAILURE = 'DELETE_ORDER_FAILURE';

// --- Specific Order Status Action Types ---
export const CANCEL_ORDER_REQUEST = 'CANCEL_ORDER_REQUEST';
export const CANCEL_ORDER_SUCCESS = 'CANCEL_ORDER_SUCCESS';
export const CANCEL_ORDER_FAILURE = 'CANCEL_ORDER_FAILURE';

export const REOPEN_ORDER_REQUEST = 'REOPEN_ORDER_REQUEST';
export const REOPEN_ORDER_SUCCESS = 'REOPEN_ORDER_SUCCESS';
export const REOPEN_ORDER_FAILURE = 'REOPEN_ORDER_FAILURE';

export const DELIVER_ORDER_REQUEST = 'DELIVER_ORDER_REQUEST';
export const DELIVER_ORDER_SUCCESS = 'DELIVER_ORDER_SUCCESS';
export const DELIVER_ORDER_FAILURE = 'DELIVER_DELIVER_FAILURE';

// --- Action Types for Reorder to Cart ---
export const REORDER_TO_CART_REQUEST = 'REORDER_TO_CART_REQUEST';
export const REORDER_TO_CART_SUCCESS = 'REORDER_TO_CART_SUCCESS';
export const REORDER_TO_CART_FAILURE = 'REORDER_TO_CART_FAILURE';

// NEW: Action types for submitting an order review
export const SUBMIT_ORDER_REVIEW_REQUEST = 'SUBMIT_ORDER_REVIEW_REQUEST';
export const SUBMIT_ORDER_REVIEW_SUCCESS = 'SUBMIT_ORDER_REVIEW_SUCCESS';
export const SUBMIT_ORDER_REVIEW_FAILURE = 'SUBMIT_ORDER_REVIEW_FAILURE';

// --- Synchronous Action Creators ---

// Fetch Orders
export const fetchOrdersRequest = () => ({ type: FETCH_ORDERS_REQUEST });
export const fetchOrdersSuccess = (orders) => ({ type: FETCH_ORDERS_SUCCESS, payload: orders });
export const fetchOrdersFailure = (error) => ({ type: FETCH_ORDERS_FAILURE, payload: error });

// Fetch Order by ID
export const fetchOrderByIdRequest = () => ({ type: FETCH_ORDER_BY_ID_REQUEST });
export const fetchOrderByIdSuccess = (order) => ({ type: FETCH_ORDER_BY_ID_SUCCESS, payload: order });
export const fetchOrderByIdFailure = (error) => ({ type: FETCH_ORDER_BY_ID_FAILURE, payload: error });

// Create Order
export const createOrderRequest = () => ({ type: CREATE_ORDER_REQUEST });
export const createOrderSuccess = (order) => ({ type: CREATE_ORDER_SUCCESS, payload: order });
export const createOrderFailure = (error) => ({ type: CREATE_ORDER_FAILURE, payload: error });

// Update Order (General)
export const updateOrderRequest = () => ({ type: UPDATE_ORDER_REQUEST });
export const updateOrderSuccess = (order) => ({ type: UPDATE_ORDER_SUCCESS, payload: order });
export const updateOrderFailure = (error) => ({ type: UPDATE_ORDER_FAILURE, payload: error });

// Delete Order
export const deleteOrderRequest = () => ({ type: DELETE_ORDER_REQUEST });
export const deleteOrderSuccess = (orderId) => ({ type: DELETE_ORDER_SUCCESS, payload: orderId });
export const deleteOrderFailure = (error) => ({ type: DELETE_ORDER_FAILURE, payload: error });

// Cancel Order
export const cancelOrderRequest = () => ({ type: CANCEL_ORDER_REQUEST });
export const cancelOrderSuccess = (order) => ({ type: CANCEL_ORDER_SUCCESS, payload: order });
export const cancelOrderFailure = (error) => ({ type: CANCEL_ORDER_FAILURE, payload: error });

// Reopen Order
export const reopenOrderRequest = () => ({ type: REOPEN_ORDER_REQUEST });
export const reopenOrderSuccess = (order) => ({ type: REOPEN_ORDER_SUCCESS, payload: order });
export const reopenOrderFailure = (error) => ({ type: REOPEN_ORDER_FAILURE, payload: error });

// Deliver Order
export const deliverOrderRequest = () => ({ type: DELIVER_ORDER_REQUEST });
export const deliverOrderSuccess = (order) => ({ type: DELIVER_ORDER_SUCCESS, payload: order });
export const deliverOrderFailure = (error) => ({ type: DELIVER_DELIVER_FAILURE, payload: error });

// Reorder to Cart
export const reorderToCartRequest = () => ({ type: REORDER_TO_CART_REQUEST });
export const reorderToCartSuccess = (cart) => ({ type: REORDER_TO_CART_SUCCESS, payload: cart });
// Payload is the updated cart
export const reorderToCartFailure = (error) => ({ type: REORDER_TO_CART_FAILURE, payload: error });

// NEW: Synchronous Action Creators for submitting an order review
export const submitOrderReviewRequest = () => ({ type: SUBMIT_ORDER_REVIEW_REQUEST });
export const submitOrderReviewSuccess = (order) => ({ type: SUBMIT_ORDER_REVIEW_SUCCESS, payload: order });
export const submitOrderReviewFailure = (error) => ({ type: SUBMIT_ORDER_REVIEW_FAILURE, payload: error });

// --- Asynchronous Thunk Action Creators ---

/**
 * Fetches all orders from the backend.
 * This might be used by an admin dashboard.
 * @param {string} token - JWT token for authentication.
 */
export const fetchAllOrders = (token) => {
    return async (dispatch) => {
        dispatch(fetchOrdersRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(fetchOrdersSuccess(response.data.orders)); // Assuming backend returns { orders: [...] }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchOrdersFailure(errorMessage));
        }
    };
};

/**
 * Fetches recent orders for a specific user.
 * Note: This endpoint was made public in your last request, so it doesn't need a token by default.
 * @param {string} userId - The ID of the user.
 * @param {number} limit - Optional: Number of recent orders to fetch.
 */
export const fetchRecentOrdersForUser = (userId, limit = 10) => {
    return async (dispatch) => {
        dispatch(fetchOrdersRequest()); // Reusing FETCH_ORDERS_REQUEST/SUCCESS/FAILURE
        try {
            const response = await axios.get(`${API_BASE_URL}/orders/user/recent?userId=${userId}&limit=${limit}`);
            dispatch(fetchOrdersSuccess(response.data.orders));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchOrdersFailure(errorMessage));
        }
    };
};

/**
 * Fetches a single order by its ID.
 * @param {string} orderId - The ID of the order to fetch.
 * @param {string} token - JWT token for authentication.
 */
export const fetchOrderById = (orderId, token) => {
    return async (dispatch) => {
        dispatch(fetchOrderByIdRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(fetchOrderByIdSuccess(response.data)); // Assuming backend returns the order directly
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchOrderByIdFailure(errorMessage));
        }
    };
};

/**
 * Creates a new order.
 * @param {object} orderData - The data for the new order (e.g., userId, items, totalAmount).
 * @param {string} token - JWT token for authentication.
 */
export const createOrder = (orderData, token) => {
    return async (dispatch) => {
        dispatch(createOrderRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(createOrderSuccess(response.data.order)); // Assuming backend returns { order: {...} }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(createOrderFailure(errorMessage));
        }
    };
};

/**
 * Updates an existing order (general update).
 * @param {string} orderId - The ID of the order to update.
 * @param {object} updateData - The data to update the order with.
 * @param {string} token - JWT token for authentication.
 */
export const updateOrder = (orderId, updateData, token) => {
    return async (dispatch) => {
        dispatch(updateOrderRequest());
        try {
            const response = await axios.put(`${API_BASE_URL}/orders/${orderId}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateOrderSuccess(response.data.order)); // Assuming backend returns { order: {...} }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(updateOrderFailure(errorMessage));
        }
    };
};

/**
 * Deletes an order by its ID.
 * @param {string} orderId - The ID of the order to delete.
 * @param {string} token - JWT token for authentication.
 */
export const deleteOrder = (orderId, token) => {
    return async (dispatch) => {
        dispatch(deleteOrderRequest());
        try {
            await axios.delete(`${API_BASE_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(deleteOrderSuccess(orderId)); // Payload is the ID of the deleted order
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(deleteOrderFailure(errorMessage));
        }
    };
};

/**
 * Cancels an order.
 * @param {string} orderId - The ID of the order to cancel.
 * @param {string} userId - The ID of the user who owns the order (now required in body).
 */
export const cancelOrder = (orderId, userId) => {
    return async (dispatch) => {
        dispatch(cancelOrderRequest());
        try {
            // Send userId in the request body, no Authorization header needed for this public route
            const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/cancel`, { userId: userId });
            dispatch(cancelOrderSuccess(response.data)); // Assuming backend returns { message, orderId, newStatus }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(cancelOrderFailure(errorMessage));
        }
    };
};

/**
 * Reopens a cancelled order.
 * @param {string} orderId - The ID of the order to reopen.
 * @param {string} userId - The ID of the user.
 */
export const reopenOrder = (orderId, userId) => {
    return async (dispatch) => {
        dispatch(reopenOrderRequest());
        try {
            // Backend now expects userId in the request body, no auth token needed for this public route
            const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/reopen`, { userId: userId });
            dispatch(reopenOrderSuccess(response.data));
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(reopenOrderFailure(errorMessage));
        }
    };
};

/**
 * Marks an order as delivered.
 * @param {string} orderId - The ID of the order to mark as delivered.
 * @param {string} token - JWT token for authentication.
 */
export const deliverOrder = (orderId, token) => {
    return async (dispatch) => {
        dispatch(deliverOrderRequest());
        try {
            const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/deliver`, {}, {
            });
            dispatch(deliverOrderSuccess(response.data)); // Assuming backend returns { message, orderId, newStatus }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(deliverOrderFailure(errorMessage));
        }
    };
};

/**
 * Reorders items from an existing order to the user's cart.
 * @param {string} orderId - The ID of the order to reorder from.
 * @param {string} userId - The ID of the user.
 * @param {'replace' | 'merge'} mergeBehavior - How to handle existing cart items ('replace' or 'merge').
 */
export const reorderToCart = (orderId, userId, mergeBehavior) => {
    return async (dispatch) => {
        dispatch(reorderToCartRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/reorder-to-cart`, {
                userId: userId,
                mergeBehavior: mergeBehavior,
            });
            dispatch(reorderToCartSuccess(response.data.cart)); // Assuming backend returns { message, cart }
            return response.data.message; // Return success message for UI feedback
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(reorderToCartFailure(errorMessage));
            throw new Error(errorMessage); // Propagate error for UI feedback
        }
    };
};

/**
 * Submits a review for a delivered order.
 * @param {string} orderId - The ID of the order being reviewed.
 * @param {string} userId - The ID of the user submitting the review.
 * @param {number} rating - The rating (1-5 stars).
 * @param {string} comment - The review comment.
 * @param {string} authToken - The authentication token for the user.
 */
export const submitOrderReview = (orderId, userId, rating, comment, authToken) => {
    return async (dispatch) => {
        dispatch(submitOrderReviewRequest());
        try {
            const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/review`,
                { userId, rating, comment }, // Send these in the request body
                {
                    headers: { Authorization: `Bearer ${authToken}` } // Authorization header
                }
            );
            // Assuming the backend returns the updated order or a success message
            dispatch(submitOrderReviewSuccess(response.data));
            return response.data.message; // Return success message for UI feedback
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(submitOrderReviewFailure(errorMessage));
            throw new Error(errorMessage); // Propagate error for UI feedback
        }
    };
};