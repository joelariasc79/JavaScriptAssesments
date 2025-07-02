// src/components/CouponComponent.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateCoupon } from '../../redux/coupon/couponActions';
import './CouponComponent.css'; // This will now contain all the styling

const CouponComponent = () => {
    const dispatch = useDispatch();
    const { couponValue, loading, error } = useSelector(state => state.coupon);

    const handleGenerateCoupon = () => {
        dispatch(generateCoupon());
    };

    return (
        <div className="coupon-container">
            <h2 className="coupon-heading">Coupon Generator</h2>

            <button
                onClick={handleGenerateCoupon}
                className="generate-coupon-button"
                disabled={loading} // Disable button while the API call is in progress
            >
                {loading ? 'Generating...' : 'Generate Coupon'}
            </button>

            {/* Display error messages if any */}
            {error && (
                <div className="coupon-error-message">
                    Error: {error}
                </div>
            )}

            {/* Display the generated coupon and its discount if available and not loading */}
            {couponValue && !loading && (
                <div className="coupon-display">
                    <p className="coupon-display-text">Your Generated Coupon:</p>
                    <p className="coupon-code">
                        {couponValue.code}
                    </p>
                    <p className="coupon-discount">
                        Discount: <span className="discount-value">{couponValue.discountPercentage}% OFF</span>
                    </p>
                    <p className="coupon-note">
                        (This coupon has been stored in the database.)
                    </p>
                </div>
            )}
        </div>
    );
};

export default CouponComponent;