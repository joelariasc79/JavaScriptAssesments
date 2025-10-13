// src/redux/product/productReviewActions.js
import axios from 'axios';

// Action Types
export const ADD_PRODUCT_REQUEST = 'ADD_PRODUCT_REQUEST';
export const ADD_PRODUCT_SUCCESS = 'ADD_PRODUCT_SUCCESS';
export const ADD_PRODUCT_FAILURE = 'ADD_PRODUCT_FAILURE';
export const CLEAR_PRODUCT_STATUS = 'CLEAR_PRODUCT_STATUS';

// Action Creators
export const addProductRequest = () => ({
    type: ADD_PRODUCT_REQUEST,
});

export const addProductSuccess = (product) => ({
    type: ADD_PRODUCT_SUCCESS,
    payload: product,
});

export const addProductFailure = (error) => ({
    type: ADD_PRODUCT_FAILURE,
    payload: error,
});

export const clearProductStatus = () => ({
    type: CLEAR_PRODUCT_STATUS,
});

// Async Action to add a product to the database
export const addProduct = (productData) => {
    return async (dispatch) => {
        dispatch(addProductRequest());
        try {
            // Updated: Sending productData as is, ensure it matches API expectation
            const response = await axios.post('http://localhost:9000/api/products', productData);
            dispatch(addProductSuccess(response.data));
            // Optional: Clear status after a short delay for patient feedback
            setTimeout(() => dispatch(clearProductStatus()), 3000);
        } catch (error) {
            const errorMessage = error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : error.message;
            dispatch(addProductFailure(errorMessage));
            // Optional: Clear error after a short delay
            setTimeout(() => dispatch(clearProductStatus()), 5000);
        }
    };
};
