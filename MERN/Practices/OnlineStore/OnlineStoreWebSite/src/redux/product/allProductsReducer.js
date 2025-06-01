// src/redux/product/allProductsReducer.js
import {
    FETCH_ALL_PRODUCTS_REQUEST,
    FETCH_ALL_PRODUCTS_SUCCESS,
    FETCH_ALL_PRODUCTS_FAILURE,
} from './allProductsActions';

const initialState = {
    products: [],
    loading: false,
    error: null,
};

const allProductsReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ALL_PRODUCTS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case FETCH_ALL_PRODUCTS_SUCCESS:
            return {
                ...state,
                loading: false,
                products: action.payload,
                error: null,
            };
        case FETCH_ALL_PRODUCTS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                products: [], // Clear products on failure
            };
        default:
            return state;
    }
};

export default allProductsReducer;