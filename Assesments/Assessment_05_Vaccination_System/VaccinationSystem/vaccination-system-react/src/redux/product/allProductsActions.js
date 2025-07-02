// src/redux/product/allProductsActions.js
import axios from 'axios';

// --- Action Types ---
export const FETCH_ALL_PRODUCTS_REQUEST = 'FETCH_ALL_PRODUCTS_REQUEST';
export const FETCH_ALL_PRODUCTS_SUCCESS = 'FETCH_ALL_PRODUCTS_SUCCESS';
export const FETCH_ALL_PRODUCTS_FAILURE = 'FETCH_ALL_PRODUCTS_FAILURE';

// --- Action Creators ---
export const fetchAllProductsRequest = () => ({
    type: FETCH_ALL_PRODUCTS_REQUEST,
});

export const fetchAllProductsSuccess = (products) => ({
    type: FETCH_ALL_PRODUCTS_SUCCESS,
    payload: products,
});

export const fetchAllProductsFailure = (error) => ({
    type: FETCH_ALL_PRODUCTS_FAILURE,
    payload: error,
});

// --- Async Thunk Action ---
const API_BASE_URL = 'http://localhost:9000/api';

export const fetchAllProducts = () => {
    return async (dispatch) => {
        dispatch(fetchAllProductsRequest());
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            dispatch(fetchAllProductsSuccess(response.data));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch(fetchAllProductsFailure(errorMessage));
        }
    };
};