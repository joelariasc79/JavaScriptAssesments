// src/redux/product/productReducer.js
import {
    ADD_PRODUCT_REQUEST,
    ADD_PRODUCT_SUCCESS,
    ADD_PRODUCT_FAILURE,
    CLEAR_PRODUCT_STATUS,
} from './productActions';

const initialState = {
    addedProduct: null, // Stores the product successfully added
    loading: false,
    error: null,
    successMessage: null,
};

const productReducer = (state = initialState, action) => {
    switch (action.type) {
        case ADD_PRODUCT_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                successMessage: null,
            };
        case ADD_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                addedProduct: action.payload,
                error: null,
                successMessage: 'Product added successfully!',
            };
        case ADD_PRODUCT_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                successMessage: null,
            };
        case CLEAR_PRODUCT_STATUS:
            return {
                ...state,
                error: null,
                successMessage: null,
                addedProduct: null, // Clear the added product info as well
            };
        default:
            return state;
    }
};

export default productReducer;