// src/components/ProductReviewForm.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchProductDetails,
    submitProductReview,
    clearProductReviewStatus
} from '../../redux/productReview/productReviewActions'; // Assuming this path
import './ProductReviewForm.css'; // Create this CSS file for styling

// Helper to render stars (can be reused from OrderManagementComponent if desired)
const renderStarsInput = (currentRating, setRating, isSubmitting) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span
                key={i}
                className={`star-icon-input ${i <= currentRating ? 'filled' : ''}`}
                onClick={() => !isSubmitting && setRating(i)} // Disable click if submitting
                style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
                &#9733; {/* Unicode star character */}
            </span>
        );
    }
    return <div className="star-rating-input">{stars}</div>;
};

// Component to display current average rating (can be reused from OrderManagementComponent if desired)
const renderProductRatingDisplay = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
        let className = 'star-icon';
        if (i <= fullStars) {
            className += ' filled';
        } else if (hasHalfStar && i === fullStars + 1) {
            className += ' half-filled'; // You might need a CSS class for half-filled stars
        }
        stars.push(
            <span key={i} className={className}>
                &#9733;
            </span>
        );
    }
    return <div className="rating-stars">{stars}</div>;
};


export default function ProductReviewForm({ productId, userId, onClose }) {
    const dispatch = useDispatch();
    const {
        selectedProduct,
        loadingProduct, // Renamed from loading to loadingProduct to avoid conflict
        productError,   // Renamed from error to productError to avoid conflict
        reviewSubmitting,
        reviewSubmissionSuccess,
        reviewSubmissionError,
    } = useSelector((state) => state.productReview); // <--- FIXED: Changed from state.products to state.productReview

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [uiMessage, setUiMessage] = useState(null);
    const [isUiError, setIsUiError] = useState(false);

    // Effect to fetch product details when component mounts or productId changes
    useEffect(() => {
        if (productId) {
            dispatch(fetchProductDetails(productId));
        } else {
            setUiMessage('Product ID is missing to fetch details for review.');
            setIsUiError(true);
        }
        // Clear any previous review status on mount
        dispatch(clearProductReviewStatus());
    }, [dispatch, productId]);

    // Effect to handle success or error messages for review submission
    useEffect(() => {
        if (reviewSubmissionSuccess) {
            setUiMessage('Review submitted successfully!');
            setIsUiError(false);
            // Optionally clear form or close modal after a short delay
            const timer = setTimeout(() => {
                setUiMessage(null);
                onClose(); // Close the modal/page
            }, 2000);
            return () => clearTimeout(timer);
        } else if (reviewSubmissionError) {
            setUiMessage(`Review Error: ${reviewSubmissionError}`);
            setIsUiError(true);
            const timer = setTimeout(() => setUiMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [reviewSubmissionSuccess, reviewSubmissionError, onClose]);

    // Effect to handle initial product fetch errors
    useEffect(() => {
        if (productError) {
            setUiMessage(`Error fetching product: ${productError}`);
            setIsUiError(true);
        }
    }, [productError]);


    const handleSubmit = async () => {
        if (rating === 0) {
            setUiMessage('Please provide a rating.');
            setIsUiError(true);
            return;
        }
        if (!userId) {
            setUiMessage('User ID is missing for review submission.');
            setIsUiError(true);
            return;
        }

        setUiMessage(null); // Clear previous messages
        setIsUiError(false);

        try {
            // Dispatch the action to submit the product review
            await dispatch(submitProductReview(productId, userId, rating, comment));
            // Success handled by useEffect, which will close the modal
        } catch (err) {
            // Error handled by useEffect(reviewSubmissionError)
            console.error('Failed to submit product review:', err);
        }
    };

    // Adjusted loading state check to use `loadingProduct` instead of `loading`
    if (loadingProduct) {
        return <div className="product-review-loading">Loading product details...</div>;
    }

    // Adjusted error display
    if (productError && !selectedProduct) { // Only show this error if product couldn't be loaded at all
        return <div className="product-review-error">Error: {productError}</div>;
    }

    if (!selectedProduct) {
        return <div className="product-review-error">Product details not found.</div>;
    }

    return (
        <div className="product-review-modal-overlay">
            <div className="product-review-modal">
                <h3>Rate and Review: {selectedProduct.name}</h3>
                <p>Product ID: {selectedProduct._id}</p>
                {selectedProduct.description && <p>{selectedProduct.description}</p>}
                {selectedProduct.imageUrl && <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="product-review-image" />}

                {selectedProduct.rating !== undefined && ( // Display existing average product rating
                    <div className="current-avg-rating">
                        <strong>Current Average Rating:</strong> {renderProductRatingDisplay(selectedProduct.rating)}
                        <span>{selectedProduct.rating.toFixed(1)} / 5 Stars</span>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="rating">Your Rating:</label>
                    {renderStarsInput(rating, setRating, reviewSubmitting)}
                    {rating === 0 && (
                        <p className="validation-message">Please select a rating.</p>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="comment">Your Comment (optional, max 1000 chars):</label>
                    <textarea
                        id="comment"
                        className="form-control"
                        rows="4"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength="1000"
                        disabled={reviewSubmitting}
                    ></textarea>
                </div>

                <div className="modal-actions">
                    <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={reviewSubmitting || rating === 0}
                    >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={reviewSubmitting}
                    >
                        Cancel
                    </button>
                </div>
                {uiMessage && (
                    <p className={`ui-message ${isUiError ? 'ui-error' : 'ui-success'}`}>
                        {uiMessage}
                    </p>
                )}
            </div>
        </div>
    );
}



// // src/components/ProductReviewForm.js
//
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//     fetchProductDetails,
//     submitProductReview,
//     clearProductReviewStatus
// } from '../../redux/productReview/productReviewActions'; // Assuming this path
// import './ProductReviewForm.css'; // Create this CSS file for styling
//
// // Helper to render stars (can be reused from OrderManagementComponent if desired)
// const renderStarsInput = (currentRating, setRating, isSubmitting) => {
//     const stars = [];
//     for (let i = 1; i <= 5; i++) {
//         stars.push(
//             <span
//                 key={i}
//                 className={`star-icon-input ${i <= currentRating ? 'filled' : ''}`}
//                 onClick={() => !isSubmitting && setRating(i)} // Disable click if submitting
//                 style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
//             >
//                 &#9733; {/* Unicode star character */}
//             </span>
//         );
//     }
//     return <div className="star-rating-input">{stars}</div>;
// };
//
// // Component to display current average rating (can be reused from OrderManagementComponent if desired)
// const renderProductRatingDisplay = (rating) => {
//     const stars = [];
//     const fullStars = Math.floor(rating);
//     const hasHalfStar = rating % 1 !== 0;
//
//     for (let i = 1; i <= 5; i++) {
//         let className = 'star-icon';
//         if (i <= fullStars) {
//             className += ' filled';
//         } else if (hasHalfStar && i === fullStars + 1) {
//             className += ' half-filled'; // You might need a CSS class for half-filled stars
//         }
//         stars.push(
//             <span key={i} className={className}>
//                 &#9733;
//             </span>
//         );
//     }
//     return <div className="rating-stars">{stars}</div>;
// };
//
//
// export default function ProductReviewForm({ productId, userId, onClose }) {
//     const dispatch = useDispatch();
//     const {
//         selectedProduct,
//         loadingProduct,
//         productError,
//         reviewSubmitting,
//         reviewSubmissionSuccess,
//         reviewSubmissionError,
//     } = useSelector((state) => state.products); // Assuming 'products' slice
//
//     const [rating, setRating] = useState(0);
//     const [comment, setComment] = useState('');
//     const [uiMessage, setUiMessage] = useState(null);
//     const [isUiError, setIsUiError] = useState(false);
//
//     // Effect to fetch product details when component mounts or productId changes
//     useEffect(() => {
//         if (productId) {
//             dispatch(fetchProductDetails(productId));
//         } else {
//             setUiMessage('Product ID is missing to fetch details for review.');
//             setIsUiError(true);
//         }
//         // Clear any previous review status on mount
//         dispatch(clearProductReviewStatus());
//     }, [dispatch, productId]);
//
//     // Effect to handle success or error messages for review submission
//     useEffect(() => {
//         if (reviewSubmissionSuccess) {
//             setUiMessage('Review submitted successfully!');
//             setIsUiError(false);
//             // Optionally clear form or close modal after a short delay
//             const timer = setTimeout(() => {
//                 setUiMessage(null);
//                 onClose(); // Close the modal/page
//             }, 2000);
//             return () => clearTimeout(timer);
//         } else if (reviewSubmissionError) {
//             setUiMessage(`Review Error: ${reviewSubmissionError}`);
//             setIsUiError(true);
//             const timer = setTimeout(() => setUiMessage(null), 5000);
//             return () => clearTimeout(timer);
//         }
//     }, [reviewSubmissionSuccess, reviewSubmissionError, onClose]);
//
//     // Effect to handle initial product fetch errors
//     useEffect(() => {
//         if (productError) {
//             setUiMessage(`Error fetching product: ${productError}`);
//             setIsUiError(true);
//         }
//     }, [productError]);
//
//
//     const handleSubmit = async () => {
//         if (rating === 0) {
//             setUiMessage('Please provide a rating.');
//             setIsUiError(true);
//             return;
//         }
//         if (!userId) {
//             setUiMessage('User ID is missing for review submission.');
//             setIsUiError(true);
//             return;
//         }
//
//         setUiMessage(null); // Clear previous messages
//         setIsUiError(false);
//
//         try {
//             // Dispatch the action to submit the product review
//             await dispatch(submitProductReview(productId, userId, rating, comment));
//             // Success handled by useEffect, which will close the modal
//         } catch (err) {
//             // Error handled by useEffect(reviewSubmissionError)
//             console.error('Failed to submit product review:', err);
//         }
//     };
//
//     if (loadingProduct) {
//         return <div className="product-review-loading">Loading product details...</div>;
//     }
//
//     if (productError && !selectedProduct) { // Only show this error if product couldn't be loaded at all
//         return <div className="product-review-error">Error: {productError}</div>;
//     }
//
//     if (!selectedProduct) {
//         return <div className="product-review-error">Product details not found.</div>;
//     }
//
//     return (
//         <div className="product-review-modal-overlay">
//             <div className="product-review-modal">
//                 <h3>Rate and Review: {selectedProduct.name}</h3>
//                 <p>Product ID: {selectedProduct._id}</p>
//                 {selectedProduct.description && <p>{selectedProduct.description}</p>}
//                 {selectedProduct.imageUrl && <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="product-review-image" />}
//
//                 {selectedProduct.rating !== undefined && ( // Display existing average product rating
//                     <div className="current-avg-rating">
//                         <strong>Current Average Rating:</strong> {renderProductRatingDisplay(selectedProduct.rating)}
//                         <span>{selectedProduct.rating.toFixed(1)} / 5 Stars</span>
//                     </div>
//                 )}
//
//                 <div className="form-group">
//                     <label htmlFor="rating">Your Rating:</label>
//                     {renderStarsInput(rating, setRating, reviewSubmitting)}
//                     {rating === 0 && (
//                         <p className="validation-message">Please select a rating.</p>
//                     )}
//                 </div>
//
//                 <div className="form-group">
//                     <label htmlFor="comment">Your Comment (optional, max 1000 chars):</label>
//                     <textarea
//                         id="comment"
//                         className="form-control"
//                         rows="4"
//                         value={comment}
//                         onChange={(e) => setComment(e.target.value)}
//                         maxLength="1000"
//                         disabled={reviewSubmitting}
//                     ></textarea>
//                 </div>
//
//                 <div className="modal-actions">
//                     <button
//                         onClick={handleSubmit}
//                         className="btn btn-primary"
//                         disabled={reviewSubmitting || rating === 0}
//                     >
//                         {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
//                     </button>
//                     <button
//                         onClick={onClose}
//                         className="btn btn-secondary"
//                         disabled={reviewSubmitting}
//                     >
//                         Cancel
//                     </button>
//                 </div>
//                 {uiMessage && (
//                     <p className={`ui-message ${isUiError ? 'ui-error' : 'ui-success'}`}>
//                         {uiMessage}
//                     </p>
//                 )}
//             </div>
//         </div>
//     );
// }