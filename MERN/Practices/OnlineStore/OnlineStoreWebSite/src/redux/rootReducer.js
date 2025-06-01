// src/redux/rootReducer.js
import { combineReducers } from 'redux';
import productReducer from './product/productReducer'; // Assuming your product reducer is named productReducer
import allProductsReducer from './product/allProductsReducer'; // Assuming this exists for your allProducts slice
import cartReducer from './cart/cartReducer'; // Assuming your cart reducer
import userReducer from './user/userReducer'; // Assuming your user reducer

const rootReducer = combineReducers({
    // Make sure 'addProduct' key correctly points to your productReducer
    addProduct: productReducer, // <--- THIS IS THE CRITICAL LINE
    allProducts: allProductsReducer,
    cart: cartReducer,
    user: userReducer,
    // ... any other reducers you have
});

export default rootReducer;