// import {
//     FETCH_CART_REQUEST,
//     FETCH_CART_SUCCESS,
//     FETCH_CART_FAILURE,
//     ADD_ITEM_TO_CART_REQUEST,
//     ADD_ITEM_TO_CART_SUCCESS,
//     ADD_ITEM_TO_CART_FAILURE,
//     REMOVE_ITEM_FROM_CART_REQUEST,
//     REMOVE_ITEM_FROM_CART_SUCCESS,
//     REMOVE_ITEM_FROM_CART_FAILURE,
//     UPDATE_CART_ITEM_QUANTITY_REQUEST,
//     UPDATE_CART_ITEM_QUANTITY_SUCCESS,
//     UPDATE_CART_ITEM_QUANTITY_FAILURE,
//     CHECKOUT_CART_REQUEST,
//     CHECKOUT_CART_SUCCESS,
//     CHECKOUT_CART_FAILURE,
//     CLEAR_CART_ONLY_REQUEST,
//     CLEAR_CART_ONLY_SUCCESS,
//     CLEAR_CART_ONLY_FAILURE,
//     PROCESS_PAYMENT_REQUEST,
//     PROCESS_PAYMENT_SUCCESS,
//     PROCESS_PAYMENT_FAILURE,
//     APPLY_COUPON_REQUEST,
//     APPLY_COUPON_SUCCESS,
//     APPLY_COUPON_FAILURE,
//     CLEAR_APPLIED_COUPON,
// } from './cartActions';
//
// const initialState = {
//     cart: null,
//     loading: false,
//     error: null,
//     checkoutOrderDetails: null, // Contains orderId, checkedOutItems, totalAmount (initial)
//     paymentSuccess: false,
//     appliedCoupon: null, // Stores { code, discountPercentage }
//     couponLoading: false,
//     couponError: null,
// };
//
// const cartReducer = (state = initialState, action) => {
//     switch (action.type) {
//         case FETCH_CART_REQUEST:
//         case ADD_ITEM_TO_CART_REQUEST:
//         case REMOVE_ITEM_FROM_CART_REQUEST:
//         case UPDATE_CART_ITEM_QUANTITY_REQUEST:
//         case CLEAR_CART_ONLY_REQUEST: // No need to reset coupon or checkout details on these
//             return {
//                 ...state,
//                 loading: true,
//                 error: null,
//             };
//
//         case CHECKOUT_CART_REQUEST: // When initiating checkout
//             return {
//                 ...state,
//                 loading: true,
//                 error: null,
//                 // Reset checkout/payment/coupon states on new checkout request
//                 checkoutOrderDetails: null,
//                 paymentSuccess: false,
//                 appliedCoupon: null, // Clear any previously applied coupon for a new checkout
//                 couponLoading: false,
//                 couponError: null,
//             };
//
//         case PROCESS_PAYMENT_REQUEST:
//             return {
//                 ...state,
//                 loading: true,
//                 error: null,
//                 paymentSuccess: false, // Reset payment success on new payment request
//             };
//
//         case FETCH_CART_SUCCESS:
//             return {
//                 ...state,
//                 loading: false,
//                 cart: action.payload,
//                 error: null,
//                 // If fetching a cart, we're likely not in a checkout/payment flow. Reset these.
//                 paymentSuccess: false,
//                 checkoutOrderDetails: null,
//                 appliedCoupon: null,
//             };
//         case ADD_ITEM_TO_CART_SUCCESS:
//         case UPDATE_CART_ITEM_QUANTITY_SUCCESS:
//             return {
//                 ...state,
//                 loading: false,
//                 cart: action.payload,
//                 error: null,
//                 // Adding/updating items means previous checkout/payment state is likely invalid
//                 checkoutOrderDetails: null, // User is back to cart editing, clear checkout details
//                 paymentSuccess: false,
//                 appliedCoupon: null, // If cart items change, coupon calculation might be invalid
//             };
//
//         case REMOVE_ITEM_FROM_CART_SUCCESS:
//             return {
//                 ...state,
//                 loading: false,
//                 cart: action.payload.cart, // Payload might contain 'cart' object
//                 error: null,
//                 checkoutOrderDetails: null, // User is back to cart editing, clear checkout details
//                 paymentSuccess: false,
//                 appliedCoupon: null, // If cart items change, coupon calculation might be invalid
//             };
//
//         case CHECKOUT_CART_SUCCESS:
//             // FIX: Ensure originalTotalAmount is stored from the backend's initial checkout response.
//             // totalAmount will initially be the same as originalTotalAmount.
//             return {
//                 ...state,
//                 loading: false,
//                 cart: { items: [] }, // Clear cart after successful checkout (moved to orders)
//                 error: null,
//                 checkoutOrderDetails: {
//                     ...action.payload,
//                     // Use payload.totalAmount as both initial and current total from checkout
//                     originalTotalAmount: parseFloat(action.payload.totalAmount),
//                     totalAmount: parseFloat(action.payload.totalAmount), // This is the initial total
//                 },
//                 paymentSuccess: false, // Set to false, payment is still pending
//                 appliedCoupon: null, // Ensure coupon state is clean for this new checkout order
//                 couponLoading: false,
//                 couponError: null,
//             };
//
//         case CLEAR_CART_ONLY_SUCCESS:
//             return {
//                 ...state,
//                 loading: false,
//                 cart: { items: [] }, // cart is cleared
//                 error: null,
//                 checkoutOrderDetails: null, // Clear checkout details too
//                 paymentSuccess: false, // Reset payment state
//                 appliedCoupon: null, // Reset coupon state
//             };
//
//         case PROCESS_PAYMENT_SUCCESS:
//             // FIX: The backend now returns the final total after discount.
//             // Update checkoutOrderDetails.totalAmount with the *final* amount from backend.
//             return {
//                 ...state,
//                 loading: false,
//                 error: null,
//                 paymentSuccess: true, // ONLY place this should be true
//                 // Clear checkout details and cart after successful payment
//                 checkoutOrderDetails: null,
//                 cart: { items: [] },
//                 appliedCoupon: null, // Clear coupon once payment is successful
//             };
//
//         case FETCH_CART_FAILURE:
//         case ADD_ITEM_TO_CART_FAILURE:
//         case REMOVE_ITEM_FROM_CART_FAILURE:
//         case UPDATE_CART_ITEM_QUANTITY_FAILURE:
//         case CHECKOUT_CART_FAILURE:
//         case CLEAR_CART_ONLY_FAILURE:
//         case PROCESS_PAYMENT_FAILURE:
//             return {
//                 ...state,
//                 loading: false,
//                 error: action.payload,
//                 paymentSuccess: false, // Always set to false on failure
//             };
//         case APPLY_COUPON_REQUEST:
//             return {
//                 ...state,
//                 couponLoading: true,
//                 couponError: null,
//             };
//         case APPLY_COUPON_SUCCESS:
//             // FIX: Only store coupon code and percentage. DO NOT update checkoutOrderDetails.totalAmount here.
//             // The actual discounted total will be calculated in the component/selector for display,
//             // and the final total will come from the backend during payment processing.
//             return {
//                 ...state,
//                 couponLoading: false,
//                 appliedCoupon: {
//                     code: action.payload.code,
//                     discountPercentage: action.payload.discountPercentage,
//                 },
//                 couponError: null,
//                 // FIX: Do NOT modify checkoutOrderDetails.totalAmount here.
//                 // It should hold the original total from checkout.
//             };
//         case APPLY_COUPON_FAILURE:
//             return {
//                 ...state,
//                 couponLoading: false,
//                 couponError: action.payload,
//                 appliedCoupon: null, // Clear applied coupon on failure
//             };
//         case CLEAR_APPLIED_COUPON:
//             // FIX: Simply clear the applied coupon.
//             // The component will re-calculate display totals based on originalTotalAmount.
//             return {
//                 ...state,
//                 appliedCoupon: null,
//                 couponLoading: false,
//                 couponError: null,
//                 // FIX: Do NOT modify checkoutOrderDetails.totalAmount here.
//                 // It should hold the original total from checkout.
//             };
//
//         default:
//             return state;
//     }
// };
//
// export default cartReducer;


import {
    FETCH_CART_REQUEST,
    FETCH_CART_SUCCESS,
    FETCH_CART_FAILURE,
    ADD_ITEM_TO_CART_REQUEST,
    ADD_ITEM_TO_CART_SUCCESS,
    ADD_ITEM_TO_CART_FAILURE,
    REMOVE_ITEM_FROM_CART_REQUEST,
    REMOVE_ITEM_FROM_CART_SUCCESS,
    REMOVE_ITEM_FROM_CART_FAILURE,
    UPDATE_CART_ITEM_QUANTITY_REQUEST,
    UPDATE_CART_ITEM_QUANTITY_SUCCESS,
    UPDATE_CART_ITEM_QUANTITY_FAILURE,
    CHECKOUT_CART_REQUEST,
    CHECKOUT_CART_SUCCESS,
    CHECKOUT_CART_FAILURE,
    CLEAR_CART_ONLY_REQUEST,
    CLEAR_CART_ONLY_SUCCESS,
    CLEAR_CART_ONLY_FAILURE,
    PROCESS_PAYMENT_REQUEST,
    PROCESS_PAYMENT_SUCCESS,
    PROCESS_PAYMENT_FAILURE,
    APPLY_COUPON_REQUEST,
    APPLY_COUPON_SUCCESS,
    APPLY_COUPON_FAILURE,
    CLEAR_APPLIED_COUPON,
} from './cartActions';

const initialState = {
    cart: null,
    loading: false,
    error: null,
    checkoutOrderDetails: null, // Contains orderId, checkedOutItems, totalAmount (initial)
    paymentSuccess: false,
    appliedCoupon: null, // Stores { code, discountPercentage }
    couponLoading: false,
    couponError: null,
};

const cartReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CART_REQUEST:
        case ADD_ITEM_TO_CART_REQUEST:
        case REMOVE_ITEM_FROM_CART_REQUEST:
        case UPDATE_CART_ITEM_QUANTITY_REQUEST:
        case CLEAR_CART_ONLY_REQUEST: // No need to reset coupon or checkout details on these
            return {
                ...state,
                loading: true,
                error: null,
            };

        case CHECKOUT_CART_REQUEST: // When initiating checkout
            return {
                ...state,
                loading: true,
                error: null,
                // Reset checkout/payment/coupon states on new checkout request
                checkoutOrderDetails: null,
                paymentSuccess: false,
                appliedCoupon: null, // Clear any previously applied coupon for a new checkout
                couponLoading: false,
                couponError: null,
            };

        case PROCESS_PAYMENT_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                paymentSuccess: false, // Reset payment success on new payment request
            };

        case FETCH_CART_SUCCESS:
            return {
                ...state,
                loading: false,
                cart: action.payload,
                error: null,
                // If fetching a cart, we're likely not in a checkout/payment flow. Reset these.
                paymentSuccess: false,
                checkoutOrderDetails: null,
                appliedCoupon: null,
            };
        case ADD_ITEM_TO_CART_SUCCESS:
        case UPDATE_CART_ITEM_QUANTITY_SUCCESS:
            return {
                ...state,
                loading: false,
                cart: action.payload,
                error: null,
                // Adding/updating items means previous checkout/payment state is likely invalid
                checkoutOrderDetails: null, // User is back to cart editing, clear checkout details
                paymentSuccess: false,
                appliedCoupon: null, // If cart items change, coupon calculation might be invalid
            };

        case REMOVE_ITEM_FROM_CART_SUCCESS:
            return {
                ...state,
                loading: false,
                cart: action.payload.cart, // Payload might contain 'cart' object
                error: null,
                checkoutOrderDetails: null, // User is back to cart editing, clear checkout details
                paymentSuccess: false,
                appliedCoupon: null, // If cart items change, coupon calculation might be invalid
            };

        case CHECKOUT_CART_SUCCESS:
            // FIX: Ensure originalTotalAmount is stored from the backend's initial checkout response.
            // totalAmount will initially be the same as originalTotalAmount.
            return {
                ...state,
                loading: false,
                cart: { items: [] }, // Clear cart after successful checkout (moved to orders)
                error: null,
                checkoutOrderDetails: {
                    ...action.payload,
                    // Use payload.totalAmount as both initial and current total from checkout
                    originalTotalAmount: parseFloat(action.payload.totalAmount),
                    totalAmount: parseFloat(action.payload.totalAmount), // This is the initial total
                },
                paymentSuccess: false, // Set to false, payment is still pending
                appliedCoupon: null, // Ensure coupon state is clean for this new checkout order
                couponLoading: false,
                couponError: null,
            };

        case CLEAR_CART_ONLY_SUCCESS:
            return {
                ...state,
                loading: false,
                cart: { items: [] }, // cart is cleared
                error: null,
                checkoutOrderDetails: null, // Clear checkout details too
                paymentSuccess: false, // Reset payment state
                appliedCoupon: null, // Reset coupon state
            };

        case PROCESS_PAYMENT_SUCCESS:
            // FIX: The backend now returns the final total after discount.
            // Update checkoutOrderDetails.totalAmount with the *final* amount from backend.
            return {
                ...state,
                loading: false,
                error: null,
                paymentSuccess: true, // ONLY place this should be true
                // Clear checkout details and cart after successful payment
                checkoutOrderDetails: null,
                cart: { items: [] },
                appliedCoupon: null, // Clear coupon once payment is successful
            };

        case FETCH_CART_FAILURE:
        case ADD_ITEM_TO_CART_FAILURE:
        case REMOVE_ITEM_FROM_CART_FAILURE:
        case UPDATE_CART_ITEM_QUANTITY_FAILURE:
        case CHECKOUT_CART_FAILURE:
        case CLEAR_CART_ONLY_FAILURE:
        case PROCESS_PAYMENT_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                paymentSuccess: false, // Always set to false on failure
            };
        case APPLY_COUPON_REQUEST:
            return {
                ...state,
                couponLoading: true,
                couponError: null,
            };
        case APPLY_COUPON_SUCCESS:
            // FIX: Only store coupon code and percentage. DO NOT update checkoutOrderDetails.totalAmount here.
            // The actual discounted total will be calculated in the component/selector for display,
            // and the final total will come from the backend during payment processing.
            return {
                ...state,
                couponLoading: false,
                appliedCoupon: {
                    code: action.payload.code,
                    discountPercentage: action.payload.discountPercentage,
                },
                couponError: null,
                // FIX: Do NOT modify checkoutOrderDetails.totalAmount here.
                // It should hold the original total from checkout.
            };
        case APPLY_COUPON_FAILURE:
            return {
                ...state,
                couponLoading: false,
                couponError: action.payload,
                appliedCoupon: null, // Clear applied coupon on failure
            };
        case CLEAR_APPLIED_COUPON:
            // FIX: Simply clear the applied coupon.
            // The component will re-calculate display totals based on originalTotalAmount.
            return {
                ...state,
                appliedCoupon: null,
                couponLoading: false,
                couponError: null,
                // FIX: Do NOT modify checkoutOrderDetails.totalAmount here.
                // It should hold the original total from checkout.
            };

        default:
            return state;
    }
};

export default cartReducer;