import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchCartItems,
    removeItemFromCart,
    checkoutCart,
    clearCart,
    processPayment,
    addItemToCart,
    applyCoupon,
    clearAppliedCoupon,
} from '../../redux/cart/cartActions';

import CartItemList from './CartItemList';
import './CartComponent.css';

function CartComponent({ userId }) {
    const dispatch = useDispatch();
    const cartState = useSelector((state) => state.cart);
    const { cart, loading, error, checkoutOrderDetails, paymentSuccess, appliedCoupon, couponLoading, couponError } = cartState;

    // NEW: Select currentUser from the user slice
    const { currentUser } = useSelector(state => state.user);

    const [couponCodeInput, setCouponCodeInput] = useState('');

    useEffect(() => {
        // Only fetch cart if not in a checkout/payment state
        if (!checkoutOrderDetails && !paymentSuccess) {
            dispatch(fetchCartItems(userId));
        }
    }, [dispatch, userId, checkoutOrderDetails, paymentSuccess]); // Added dependencies

    const handleRemoveItem = (productId) => {
        dispatch(removeItemFromCart(userId, productId));
    };

    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
        } else {
            dispatch(addItemToCart(userId, itemId, newQuantity));
            // It's good practice to fetch cart again after update to ensure consistency
            // but for simple cases, backend response might be enough.
            // If backend returns the updated cart directly, this fetch is redundant.
            // dispatch(fetchCartItems(userId));
        }
    };

    const handleCheckout = () => {
        dispatch(checkoutCart(userId));
    };

    const handleClearCart = () => {
        dispatch(clearCart(userId));
    };

    // FIX: Calculate display values (original, current, discount amount)
    const originalTotal = checkoutOrderDetails?.originalTotalAmount !== undefined && checkoutOrderDetails?.originalTotalAmount !== null
        ? parseFloat(checkoutOrderDetails.originalTotalAmount)
        : 0;

    const displayOriginalTotal = originalTotal.toFixed(2);

    const discountAmount = appliedCoupon?.discountPercentage !== undefined && appliedCoupon?.discountPercentage !== null
        ? (originalTotal * (appliedCoupon.discountPercentage / 100))
        : 0;
    // Ensure discount amount doesn't make total negative
    const displayDiscountAmount = Math.min(discountAmount, originalTotal).toFixed(2);


    const currentTotalAfterFrontendDiscount = (originalTotal - parseFloat(displayDiscountAmount)).toFixed(2);
    const displayCurrentTotal = parseFloat(currentTotalAfterFrontendDiscount) >= 0 ? currentTotalAfterFrontendDiscount : '0.00';


    const handleMakePayment = () => {
        if (checkoutOrderDetails) {
            const orderId = checkoutOrderDetails.orderId;
            // FIX: amountPaid sent to backend should be the amount the user is expected to pay now
            // which is the 'currentTotalAfterFrontendDiscount' we just calculated for display.
            const amountPaid = parseFloat(displayCurrentTotal); // Use the calculated display total

            if (isNaN(amountPaid)) {
                console.error("Payment amount is not a valid number:", amountPaid);
                alert("Error: Payment amount is invalid.");
                return;
            }

            const paymentData = {
                paymentMethod: 'Credit Card',
                transactionId: 'mock_txn_' + Date.now(),
                amountPaid: amountPaid, // The amount the client is "paying"
                userId: userId,
            };

            if (appliedCoupon) {
                // FIX: Only send the couponCode. Backend will handle discountPercentage and amountSaved.
                paymentData.couponCode = appliedCoupon.code;
            }

            dispatch(processPayment(orderId, paymentData));
        }
    };

    const handleApplyCoupon = () => {
        // FIX: No need to pass originalTotal to applyCoupon action
        if (couponCodeInput.trim() && originalTotal > 0) { // Ensure there's a total to apply to
            dispatch(applyCoupon(couponCodeInput.trim()));
        } else if (!couponCodeInput.trim()) {
            alert("Please enter a coupon code.");
        } else if (originalTotal <= 0) { // If total is 0 or less, can't apply coupon
            alert("Cannot apply coupon: No valid order total available or total is zero.");
        }
    };

    const handleClearAppliedCoupon = () => {
        dispatch(clearAppliedCoupon());
        setCouponCodeInput(''); // Reset coupon input field
    };

    if (paymentSuccess) {
        return (
            <div className="cart-container">
                <p className="cart-success-message">Thank you for the payment, your items are under process!</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="cart-container">
                <p className="cart-message">Loading cart items...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cart-container">
                <p className="cart-error-message">Error loading cart: {error}</p>
            </div>
        );
    }

    if (checkoutOrderDetails) {
        return (
            <div className="cart-container">
                <h1 className="cart-heading">Your Shopping Cart (User: {userId})</h1>
                <div className="checkout-details">
                    <h2>Order Confirmed!</h2>
                    <p><strong>Order ID:</strong> {checkoutOrderDetails.orderId}</p>

                    {/* NEW: Display User Details */}
                    {currentUser && (
                        <div className="user-checkout-info">
                            <h3>Customer Details:</h3>
                            <p><strong>Name:</strong> {currentUser.username}</p>
                            {currentUser.address && (
                                <div className="user-address-checkout">
                                    <p><strong>Address:</strong></p>
                                    <p>{currentUser.address.street}</p>
                                    <p>{currentUser.address.city}, {currentUser.address.state} {currentUser.address.zipCode}</p>
                                    <p>{currentUser.address.country}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FIX: Display calculated totals */}
                    <p><strong>Original Total:</strong> ${displayOriginalTotal}</p>

                    <div className="coupon-apply-section">
                        {!appliedCoupon ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    value={couponCodeInput}
                                    onChange={(e) => setCouponCodeInput(e.target.value)}
                                    className="coupon-input"
                                    disabled={couponLoading}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    className="apply-coupon-button"
                                    disabled={couponLoading || !couponCodeInput.trim()}
                                >
                                    {couponLoading ? 'Applying...' : 'Apply Coupon'}
                                </button>
                            </>
                        ) : (
                            <div className="applied-coupon-info">
                                <p>Coupon Applied: <strong>{appliedCoupon.code}</strong></p>
                                {/* FIX: Use appliedCoupon.discountPercentage for display */}
                                <p>Discount: <strong>{appliedCoupon.discountPercentage}%</strong> (Saved ${displayDiscountAmount})</p>
                                <button
                                    onClick={handleClearAppliedCoupon}
                                    className="clear-applied-coupon-button"
                                >
                                    Remove Coupon
                                </button>
                            </div>
                        )}
                        {couponError && (
                            <p className="coupon-error-message-inline">{couponError}</p>
                        )}
                    </div>
                    {/* FIX: Display Current Total always below coupon section */}
                    <p><strong>Final Amount Due:</strong> ${displayCurrentTotal}</p>

                    <h3>Checked Out Items:</h3>
                    <ul className="checked-out-items-list">
                        {checkoutOrderDetails.checkedOutItems.map((item, index) => (
                            <li key={index} className="checked-out-item">
                                {item.name} (x{item.quantity}) - ${item.price?.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
                {!paymentSuccess && (
                    <div className="cart-summary">
                        <button
                            onClick={handleMakePayment}
                            className="checkout-button"
                            disabled={loading || couponLoading} // Disable payment button if coupon is loading
                        >
                            Make Payment
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const cartItems = cart?.items || [];
    if (cartItems.length === 0) {
        return (
            <div className="cart-container">
                <p className="cart-message">Your cart is empty.</p>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1 className="cart-heading">Your Shopping Cart (User: {userId})</h1>

            <CartItemList
                cartItems={cartItems}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveItem}
            />

            <div className="cart-summary">
                <p className="total-text">
                    Total: ${
                    (cartItems.reduce((acc, item) => acc + (parseFloat(item.productId?.price) || 0) * (item.quantity || 0), 0) ?? 0).toFixed(2)
                }
                </p>
                <button
                    onClick={handleClearCart}
                    className="clear-cart-button"
                    disabled={loading}
                >
                    Clear Cart
                </button>

                <button
                    onClick={handleCheckout}
                    className="checkout-button"
                    disabled={loading}
                >
                    Cart Checkout
                </button>
            </div>
        </div>
    );
}

export default CartComponent;