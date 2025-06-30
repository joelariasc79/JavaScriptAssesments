import axios from 'axios';

// --- Base API URL ---
const API_BASE_URL = 'http://localhost:9000/api'; // Ensure this matches your backend API

// --- Action Types for Fetching Product Details ---
export const FETCH_PRODUCT_DETAILS_REQUEST = 'FETCH_PRODUCT_DETAILS_REQUEST';
export const FETCH_PRODUCT_DETAILS_SUCCESS = 'FETCH_PRODUCT_DETAILS_SUCCESS';
export const FETCH_PRODUCT_DETAILS_FAILURE = 'FETCH_PRODUCT_DETAILS_FAILURE';

// --- Action Types for Submitting a Product Review ---
export const SUBMIT_PRODUCT_REVIEW_REQUEST = 'SUBMIT_PRODUCT_REVIEW_REQUEST';
export const SUBMIT_PRODUCT_REVIEW_SUCCESS = 'SUBMIT_PRODUCT_REVIEW_SUCCESS';
export const SUBMIT_PRODUCT_REVIEW_FAILURE = 'SUBMIT_PRODUCT_REVIEW_FAILURE';
export const CLEAR_PRODUCT_REVIEW_STATUS = 'CLEAR_PRODUCT_REVIEW_STATUS'; // To clear success/error messages

// --- Synchronous Action Creators for Fetching Product Details ---
export const fetchProductDetailsRequest = () => ({
    type: FETCH_PRODUCT_DETAILS_REQUEST
});
export const fetchProductDetailsSuccess = (product) => ({
    type: FETCH_PRODUCT_DETAILS_SUCCESS,
    payload: product
});
export const fetchProductDetailsFailure = (error) => ({
    type: FETCH_PRODUCT_DETAILS_FAILURE,
    payload: error
});

// --- Synchronous Action Creators for Submitting Product Review ---
export const submitProductReviewRequest = () => ({
    type: SUBMIT_PRODUCT_REVIEW_REQUEST
});
export const submitProductReviewSuccess = (reviewResponse) => ({ // reviewResponse contains savedReview, updatedProduct
    type: SUBMIT_PRODUCT_REVIEW_SUCCESS,
    payload: reviewResponse
});
export const submitProductReviewFailure = (error) => ({
    type: SUBMIT_PRODUCT_REVIEW_FAILURE,
    payload: error
});
export const clearProductReviewStatus = () => ({
    type: CLEAR_PRODUCT_REVIEW_STATUS
});

// --- Asynchronous Thunk Action Creators ---

/**
 * Fetches details for a specific product.
 * @param {string} productId - The ID of the product to fetch.
 */
export const fetchProductDetails = (productId) => {
    return async (dispatch) => {
        dispatch(fetchProductDetailsRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
            dispatch(fetchProductDetailsSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchProductDetailsFailure(errorMessage));
        }
    };
};

/**
 * Submits a review for a product.
 * Based on your provided backend endpoint: productRouter.post('/api/products/:productId/reviews'
 * which expects userId in the body and does NOT require authentication.
 *
 * @param {string} productId - The ID of the product being reviewed.
 * @param {string} userId - The ID of the user submitting the review.
 * @param {number} rating - The rating (1-5 stars).
 * @param {string} comment - The review comment.
 */
export const submitProductReview = (productId, userId, rating, comment) => {
    return async (dispatch) => {
        dispatch(submitProductReviewRequest());
        try {
            const response = await axios.post(`${API_BASE_URL}/products/${productId}/reviews`, {
                userId, // userId is now in the body
                rating,
                comment
            });
            // Assuming the backend returns { savedReview, updatedProduct }
            dispatch(submitProductReviewSuccess(response.data));
            return response.data.savedReview.message || "Product review submitted successfully!"; // Return a success message
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(submitProductReviewFailure(errorMessage));
            throw new Error(errorMessage); // Propagate error for UI feedback
        }
    };
};