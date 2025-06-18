// src/redux/products/productReviewReducer.js

import {
    FETCH_PRODUCT_DETAILS_REQUEST,
    FETCH_PRODUCT_DETAILS_SUCCESS,
    FETCH_PRODUCT_DETAILS_FAILURE,
    SUBMIT_PRODUCT_REVIEW_REQUEST,
    SUBMIT_PRODUCT_REVIEW_SUCCESS,
    SUBMIT_PRODUCT_REVIEW_FAILURE,
    CLEAR_PRODUCT_REVIEW_STATUS,
} from './productReviewActions';

const initialState = {
    selectedProduct: null, // Stores details of the product being reviewed
    loadingProduct: false, // Loading state for fetching product details
    productError: null, // Error for fetching product details

    reviewSubmitting: false, // Loading state for submitting a product review
    reviewSubmissionSuccess: false, // Flag for successful review submission
    reviewSubmissionError: null, // Error for product review submission
    lastSubmittedReview: null, // To hold the actual review data if needed
};

const productReviewReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_PRODUCT_DETAILS_REQUEST:
            return {
                ...state,
                loadingProduct: true,
                productError: null,
                selectedProduct: null, // Clear previous product when fetching new one
            };
        case FETCH_PRODUCT_DETAILS_SUCCESS:
            return {
                ...state,
                loadingProduct: false,
                selectedProduct: action.payload,
                productError: null,
            };
        case FETCH_PRODUCT_DETAILS_FAILURE:
            return {
                ...state,
                loadingProduct: false,
                productError: action.payload,
            };

        case SUBMIT_PRODUCT_REVIEW_REQUEST:
            return {
                ...state,
                reviewSubmitting: true,
                reviewSubmissionError: null,
                reviewSubmissionSuccess: false,
            };
        case SUBMIT_PRODUCT_REVIEW_SUCCESS:
            // Assuming payload is { savedReview, updatedProduct }
            const { savedReview, updatedProduct } = action.payload;
            return {
                ...state,
                reviewSubmitting: false,
                reviewSubmissionSuccess: true,
                reviewSubmissionError: null,
                lastSubmittedReview: savedReview,
                // Optionally update the selected product with its new average rating
                selectedProduct: state.selectedProduct && state.selectedProduct._id === updatedProduct._id
                    ? { ...state.selectedProduct, rating: updatedProduct.rating }
                    : state.selectedProduct,
            };
        case SUBMIT_PRODUCT_REVIEW_FAILURE:
            return {
                ...state,
                reviewSubmitting: false,
                reviewSubmissionError: action.payload,
                reviewSubmissionSuccess: false,
            };
        case CLEAR_PRODUCT_REVIEW_STATUS:
            return {
                ...state,
                reviewSubmissionSuccess: false,
                reviewSubmissionError: null,
                lastSubmittedReview: null,
            };
        default:
            return state;
    }
};

export default productReviewReducer;