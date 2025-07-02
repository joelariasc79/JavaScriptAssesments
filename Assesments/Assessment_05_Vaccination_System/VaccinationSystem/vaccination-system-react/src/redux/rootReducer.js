// src/redux/rootReducer.js
import { combineReducers } from 'redux';
import couponReducer from './coupon/couponReducer';
import productReducer from './product/productReducer';
import allProductsReducer from './product/allProductsReducer';
import cartReducer from './cart/cartReducer';
import userReducer from './user/userReducer';
import orderReducer from './orders/orderReducer';
import productReviewReducer from './productReview/productReviewReducer';
import notificationReducer from './notifications/notificationReducer';

const rootReducer = combineReducers({
    coupon: couponReducer,
    addProduct: productReducer,
    allProducts: allProductsReducer,
    cart: cartReducer,
    user: userReducer,
    orders: orderReducer,
    productReview: productReviewReducer,
    notifications: notificationReducer,
});

export default rootReducer;