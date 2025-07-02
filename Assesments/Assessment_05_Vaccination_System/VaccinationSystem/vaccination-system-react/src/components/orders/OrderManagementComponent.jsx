// src/components/OrderManagementComponent.js
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//     fetchRecentOrdersForUser,
//     cancelOrder,
//     reopenOrder,
//     deliverOrder,
//     deleteOrder,
//     reorderToCart,
//     submitOrderReview,
// } from '../../redux/orders/orderActions';
// import ProductReviewForm from '../productReview/ProductReviewForm';
// import './OrderManagement.css'; // Existing CSS for the component
//
// // NEW: A simple modal component for confirmations, replacing window.confirm
// const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
//     return (
//         <div className="modal-overlay">
//             <div className="modal-content">
//                 <p className="modal-message">{message}</p>
//                 <div className="modal-actions">
//                     <button onClick={onConfirm} className="btn btn-primary">Confirm</button>
//                     <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
//
// export default function OrderManagementComponentWrapper({ userId, authToken }) {
//     // This wrapper is primarily for Redux setup and initial render context if needed
//     // The actual component is passed the props
//     return (
//         <div className="app-container">
//             <div className="order-management-wrapper">
//                 <h1 className="main-title">Your Recent Orders</h1>
//                 <p className="user-info-text">
//                     Displaying orders for user: <span className="user-id-highlight">{userId}</span>
//                     <br />
//                     <span className="note-text">
//                         Note: User ID and Token are managed by App.js for consistency.
//                     </span>
//                 </p>
//                 <OrderManagementComponent currentUserId={userId} authToken={authToken} />
//             </div>
//         </div>
//     );
// }
//
//
// function OrderManagementComponent({ currentUserId, authToken }) {
//     const dispatch = useDispatch();
//
//     const { orders, loading, error, operationSuccess, reviewLoading: orderReviewLoading, reviewError: orderReviewError } = useSelector((state) => state.orders);
//     const { loading: productReviewLoading, error: productReviewError, operationSuccess: productReviewSuccess } = useSelector((state) => state.productReview);
//
//     const [uiMessage, setUiMessage] = useState(null);
//     const [isUiError, setIsUiError] = useState(false);
//     const [reorderMergeBehavior, setReorderMergeBehavior] = useState('merge');
//
//     const [showOrderReviewModal, setShowOrderReviewModal] = useState(false);
//     const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
//     const [orderReviewRating, setOrderReviewRating] = useState(0);
//     const [orderReviewComment, setOrderReviewComment] = useState('');
//
//     const [showProductReviewModal, setShowProductReviewModal] = useState(false);
//     const [selectedProductIdForReview, setSelectedProductIdForReview] = useState(null);
//
//     // Confirmation modal state
//     const [showConfirmModal, setShowConfirmModal] = useState(false);
//     const [confirmModalMessage, setConfirmModalMessage] = useState('');
//     const [confirmAction, setConfirmAction] = useState(() => () => {}); // Stores the function to call on confirm
//
//     // Effect to fetch recent orders when the component mounts or currentUserId changes
//     useEffect(() => {
//         if (currentUserId) {
//             dispatch(fetchRecentOrdersForUser(currentUserId, 10));
//         } else {
//             setUiMessage('User ID is missing to fetch recent orders.');
//             setIsUiError(true);
//         }
//     }, [dispatch, currentUserId]);
//
//     // UPDATED: Effect to auto-deliver orders upon component load if past cancellation window
//     useEffect(() => {
//         // Ensure orders have loaded and are available
//         if (!loading && orders.length > 0) {
//             // Get current time to compare against order dates
//             const now = new Date();
//             const twoDaysAgo = new Date(now);
//             twoDaysAgo.setDate(now.getDate() - 2);
//
//             orders.forEach(order => {
//                 const orderDate = new Date(order.orderDate);
//                 const canCancel = orderDate >= twoDaysAgo; // True if within 2 days, false if older
//
//                 // Conditions for auto-delivery:
//                 // 1. Order is not already Delivered or Cancelled
//                 // 2. Order is older than 2 days (i.e., canCancel is false)
//                 // 3. Order is NOT 'Shipped' (implies it's still 'Pending' or 'Processing' and passed 2 days)
//                 const shouldAttemptAutoDeliver =
//                     order.status !== 'Delivered' &&
//                     order.status !== 'Cancelled' &&
//                     order.status !== 'Shipped' && // Added to prevent delivering already shipped orders prematurely
//                     !canCancel;
//
//                 if (shouldAttemptAutoDeliver) {
//                     // Use localStorage to prevent re-attempting delivery for the same order in the same session
//                     const hasBeenAutoDeliveredAttempted = localStorage.getItem(`autoDeliveredAttempt_${order._id}`);
//
//                     if (!hasBeenAutoDeliveredAttempted) {
//                         console.log(`Attempting to auto-deliver order: ${order._id} (past cancellation window)`);
//                         // Pass userId to deliverOrder, as backend now requires it in body
//                         dispatch(deliverOrder(order._id, currentUserId, authToken));
//                         // Mark this order as having had an auto-delivery attempt to prevent repeated calls
//                         localStorage.setItem(`autoDeliveredAttempt_${order._id}`, 'true');
//                     }
//                 }
//             });
//         }
//     }, [orders, loading, dispatch, currentUserId, authToken]); // Re-run when orders or loading state changes
//
//     // Effect to handle successful operations and refresh orders
//     useEffect(() => {
//         if ((operationSuccess && !loading && !orderReviewLoading) || (productReviewSuccess && !productReviewLoading)) {
//             if (currentUserId) {
//                 dispatch(fetchRecentOrdersForUser(currentUserId));
//             }
//             if (uiMessage) {
//                 setUiMessage(null);
//                 setIsUiError(false);
//             }
//             if (showProductReviewModal && productReviewSuccess) {
//                 setShowProductReviewModal(false);
//                 setSelectedProductIdForReview(null);
//             }
//             if (showOrderReviewModal && operationSuccess) {
//                 setShowOrderReviewModal(false);
//                 setSelectedOrderForReview(null);
//                 setOrderReviewRating(0);
//                 setOrderReviewComment('');
//             }
//         }
//     }, [operationSuccess, loading, orderReviewLoading, productReviewSuccess, productReviewLoading, dispatch, currentUserId, uiMessage, showOrderReviewModal, showProductReviewModal]);
//
//     // Effect to show general errors (for order operations)
//     useEffect(() => {
//         if (error) {
//             setUiMessage(`Order Error: ${error}`);
//             setIsUiError(true);
//             const timer = setTimeout(() => setUiMessage(null), 5000);
//             return () => clearTimeout(timer);
//         }
//     }, [error]);
//
//     // Effect to show order-specific review errors
//     useEffect(() => {
//         if (orderReviewError) {
//             setUiMessage(`Order Review Error: ${orderReviewError}`);
//             setIsUiError(true);
//             const timer = setTimeout(() => setUiMessage(null), 5000);
//             return () => clearTimeout(timer);
//         }
//     }, [orderReviewError]);
//
//     // Effect to show product-specific review errors
//     useEffect(() => {
//         if (productReviewError) {
//             setUiMessage(`Product Review Error: ${productReviewError}`);
//             setIsUiError(true);
//             const timer = setTimeout(() => setUiMessage(null), 5000);
//             return () => clearTimeout(timer)
//         }
//     }, [productReviewError]);
//
//     // Centralized confirmation handler
//     const handleConfirm = () => {
//         confirmAction(); // Execute the stored action
//         setShowConfirmModal(false); // Close modal
//     };
//
//     const handleCancelConfirm = () => {
//         setShowConfirmModal(false); // Close modal
//     };
//
//     const triggerConfirmation = (message, action) => {
//         setConfirmModalMessage(message);
//         setConfirmAction(() => action); // Store the action to be executed
//         setShowConfirmModal(true); // Show the modal
//     };
//
//     const handleCancelOrder = (orderId) => {
//         setUiMessage(null);
//         setIsUiError(false);
//         if (!authToken) {
//             setUiMessage('Authentication token is required to cancel orders.');
//             setIsUiError(true);
//             return;
//         }
//         triggerConfirmation(`Are you sure you want to cancel order ${orderId}?`, () => {
//             dispatch(cancelOrder(orderId, currentUserId));
//         });
//     };
//
//     const handleReopenOrder = (orderId) => {
//         setUiMessage(null);
//         setIsUiError(false);
//         if (!authToken) {
//             setUiMessage('Authentication token is required to reopen orders.');
//             setIsUiError(true);
//             return;
//         }
//         triggerConfirmation(`Are you sure you want to reopen order ${orderId}?`, () => {
//             dispatch(reopenOrder(orderId, currentUserId));
//         });
//     };
//
//     const handleDeliverOrder = (orderId) => {
//         setUiMessage(null);
//         setIsUiError(false);
//         if (!authToken) {
//             setUiMessage('Authentication token is required to mark orders as delivered.');
//             setIsUiError(true);
//             return;
//         }
//         triggerConfirmation(`Are you sure you want to mark order ${orderId} as delivered?`, () => {
//             dispatch(deliverOrder(orderId, currentUserId, authToken)); // Pass userId
//         });
//     };
//
//     const handleDeleteOrder = (orderId) => {
//         setUiMessage(null);
//         setIsUiError(false);
//         if (!authToken) {
//             setUiMessage('Authentication token is required to delete orders.');
//             setIsUiError(true);
//             return;
//         }
//         triggerConfirmation(`Are you sure you want to PERMANENTLY DELETE order ${orderId}? This cannot be undone.`, () => {
//             dispatch(deleteOrder(orderId, authToken));
//         });
//     };
//
//     const handleReorderToCart = async (orderId) => {
//         setUiMessage(null);
//         setIsUiError(false);
//         if (!currentUserId) {
//             setUiMessage('User ID is missing to reorder to cart.');
//             setIsUiError(true);
//             return;
//         }
//
//         const confirmMessage = `Reorder items from Order ${orderId} to your cart?\n` +
//             `(Behavior: ${reorderMergeBehavior === 'replace' ? 'Replace current cart' : 'Merge with current cart'})`;
//
//         triggerConfirmation(confirmMessage, async () => {
//             try {
//                 const successMsg = await dispatch(reorderToCart(orderId, currentUserId, reorderMergeBehavior));
//                 setUiMessage(successMsg || `Order ${orderId} successfully reordered to cart!`);
//                 setIsUiError(false);
//             } catch (err) {
//                 setUiMessage(`Failed to reorder order ${orderId}: ${err.message}`);
//                 setIsUiError(true);
//             }
//         });
//     };
//
//     const handleOpenOrderReviewModal = (order) => {
//         setSelectedOrderForReview(order);
//         setOrderReviewRating(order.isReviewed && order.rating ? order.rating : 0);
//         setOrderReviewComment(order.isReviewed && order.comment ? order.comment : '');
//         setShowOrderReviewModal(true);
//     };
//
//     const handleSubmitOrderReview = async () => {
//         if (!selectedOrderForReview || !currentUserId || !authToken) {
//             setUiMessage('Missing order, user ID, or auth token for review submission.');
//             setIsUiError(true);
//             return;
//         }
//         if (orderReviewRating === 0) {
//             setUiMessage('Please provide a rating for the order.');
//             setIsUiError(true);
//             return;
//         }
//
//         setUiMessage(null);
//         setIsUiError(false);
//         try {
//             const successMsg = await dispatch(submitOrderReview(
//                 selectedOrderForReview._id,
//                 currentUserId,
//                 orderReviewRating,
//                 orderReviewComment,
//                 authToken
//             ));
//             setUiMessage(successMsg);
//             setIsUiError(false);
//         } catch (err) {
//             setUiMessage(`Failed to submit order review: ${err.message}`);
//             setIsUiError(true);
//         }
//     };
//
//     const handleOpenProductReviewModal = (productId) => {
//         console.log("productId", productId);
//         setSelectedProductIdForReview(productId);
//         setShowProductReviewModal(true);
//     };
//
//     const handleCloseProductReviewModal = () => {
//         setShowProductReviewModal(false);
//         setSelectedProductIdForReview(null);
//     };
//
//     const getStatusBadgeClass = (status) => {
//         switch (status) {
//             case 'Delivered': return 'badge-green';
//             case 'Processing': return 'badge-yellow';
//             case 'Pending': return 'badge-blue';
//             case 'Cancelled': return 'badge-red';
//             case 'Shipped': return 'badge-orange';
//             default: return 'badge-gray';
//         }
//     };
//
//     const renderStars = (rating) => {
//         const stars = [];
//         const fullStars = Math.floor(rating);
//         const hasHalfStar = rating % 1 !== 0;
//
//         for (let i = 1; i <= 5; i++) {
//             let className = 'star-icon';
//             if (i <= fullStars) {
//                 className += ' filled';
//             } else if (hasHalfStar && i === fullStars + 1) {
//                 className += ' half-filled';
//             }
//             stars.push(
//                 <span key={i} className={className}>
//                     &#9733;
//                 </span>
//             );
//         }
//         return <div className="rating-stars">{stars}</div>;
//     };
//
//     const renderStarsInput = (currentRating, setRatingFunction, isDisabled) => {
//         const stars = [];
//         for (let i = 1; i <= 5; i++) {
//             stars.push(
//                 <span
//                     key={i}
//                     className={`star-icon-input ${i <= currentRating ? 'filled' : ''}`}
//                     onClick={() => !isDisabled && setRatingFunction(i)}
//                     style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
//                 >
//                     &#9733;
//                 </span>
//             );
//         }
//         return <div className="star-rating-input">{stars}</div>;
//     };
//
//     if (loading && orders.length === 0) {
//         return (
//             <div className="loading-container">
//                 <div className="spinner"></div>
//                 <p className="loading-text">Loading your orders...</p>
//             </div>
//         );
//     }
//
//     if (uiMessage && !loading && !orderReviewLoading && !productReviewLoading && !showConfirmModal) {
//         // Only show UI message if no confirmation modal is active
//         return (
//             <div className={`ui-message ${isUiError ? 'ui-error' : 'ui-success'}`}>
//                 {uiMessage}
//             </div>
//         );
//     }
//
//     if (orders.length === 0 && !loading) {
//         return (
//             <div className="no-orders-found">
//                 <strong className="no-orders-title">No Orders Found:</strong>
//                 <span className="no-orders-message">No orders available for this user.</span>
//             </div>
//         );
//     }
//
//     return (
//         <div className="orders-list-container">
//             {showConfirmModal && (
//                 <ConfirmationModal
//                     message={confirmModalMessage}
//                     onConfirm={handleConfirm}
//                     onCancel={handleCancelConfirm}
//                 />
//             )}
//
//             <div className="reorder-options">
//                 <label htmlFor="mergeBehavior">Reorder Behavior:</label>
//                 <select
//                     id="mergeBehavior"
//                     value={reorderMergeBehavior}
//                     onChange={(e) => setReorderMergeBehavior(e.target.value)}
//                     disabled={loading}
//                 >
//                     <option value="merge">Merge with existing cart</option>
//                     <option value="replace">Replace current cart</option>
//                 </select>
//             </div>
//
//             {orders.map((order) => {
//                 const orderDate = new Date(order.orderDate);
//                 const twoDaysAgo = new Date();
//                 twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
//                 const canCancel = orderDate >= twoDaysAgo;
//                 const showOrderReviewButton = order.status === 'Delivered';
//
//                 return (
//                     <div key={order._id} className="order-card">
//                         <div className="order-header">
//                             <div>
//                                 <h2 className="order-id">Order ID: <span className="order-id-value">{order._id}</span></h2>
//                                 <p className="order-meta">User ID: <span className="order-meta-value">{order.userId}</span></p>
//                                 <p className="order-meta">Order Date: <span className="order-meta-value">{new Date(order.orderDate).toLocaleString()}</span></p>
//                             </div>
//                             <span className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
//                                 {order.status}
//                             </span>
//                         </div>
//
//                         <div className="order-items-section">
//                             <h3 className="order-items-title">Items:</h3>
//                             <ul className="order-items-list">
//                                 {order.items.map((item, index) => (
//                                     <li key={item.productId?._id || `item-${order._id}-${index}`} className="order-item">
//                                         <span>{item.quantity} x {item.name}</span>
//                                         <span className="order-item-price">${item.price?.toFixed(2) || '0.00'}</span>
//                                         {item.productId && order.status === 'Delivered' && (
//                                             <button
//                                                 onClick={() => handleOpenProductReviewModal(item.productId)}
//                                                 className="btn btn-product-review"
//                                                 disabled={loading || productReviewLoading}
//                                             >
//                                                 Review Product
//                                             </button>
//                                         )}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//
//                         {order.isReviewed && typeof order.rating === 'number' && order.rating > 0 && (
//                             <div className="order-review-details">
//                                 <h4 className="review-title">Your Order Review:</h4>
//                                 <div className="review-rating-display">
//                                     {renderStars(order.rating)}
//                                     <span className="rating-value">{order.rating.toFixed(1)} / 5 Stars</span>
//                                 </div>
//                                 {order.comment && (
//                                     <p className="review-comment">{order.comment}</p>
//                                 )}
//                             </div>
//                         )}
//
//                         <div className="order-footer">
//                             <p className="order-total">Total: ${order.totalAmount?.toFixed(2) || '0.00'}</p>
//                             <div className="order-actions">
//                                 {canCancel && (order.status === 'Processing' || order.status === 'Pending' || order.status === 'Shipped') ? (
//                                     <button
//                                         onClick={() => handleCancelOrder(order._id)}
//                                         className="btn btn-cancel"
//                                         disabled={loading}
//                                     >
//                                         Cancel Order
//                                     </button>
//                                 ) : null}
//
//                                 {order.status === 'Cancelled' ? (
//                                     <button
//                                         onClick={() => handleReopenOrder(order._id)}
//                                         className="btn btn-reopen"
//                                         disabled={loading}
//                                     >
//                                         Reopen Order
//                                     </button>
//                                 ) : null}
//
//                                 {order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Shipped' ? (
//                                     <button
//                                         onClick={() => handleDeliverOrder(order._id)}
//                                         className="btn btn-deliver"
//                                         disabled={loading}
//                                     >
//                                         Mark Delivered
//                                     </button>
//                                 ) : null}
//
//                                 <button
//                                     onClick={() => handleReorderToCart(order._id)}
//                                     className="btn btn-reorder"
//                                     disabled={loading}
//                                 >
//                                     Reorder to Cart
//                                 </button>
//
//                                 {showOrderReviewButton && (
//                                     <button
//                                         onClick={() => handleOpenOrderReviewModal(order)}
//                                         className="btn btn-review"
//                                         disabled={loading || orderReviewLoading}
//                                     >
//                                         {order.isReviewed ? 'Edit Order Review' : 'Write Order Review'}
//                                     </button>
//                                 )}
//
//                                 <button
//                                     onClick={() => handleDeleteOrder(order._id)}
//                                     className="btn btn-delete"
//                                     disabled={loading}
//                                 >
//                                     Delete Order
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 );
//             })}
//
//             {showOrderReviewModal && selectedOrderForReview && (
//                 <div className="review-modal-overlay">
//                     <div className="review-modal">
//                         <h3>{selectedOrderForReview.isReviewed ? 'Edit Your Order Review' : 'Write a Review'} for Order: {selectedOrderForReview._id}</h3>
//                         <p>Items: {selectedOrderForReview.items.map(item => item.name).join(', ')}</p>
//
//                         <div className="form-group">
//                             <label htmlFor="orderRating">Order Rating:</label>
//                             {renderStarsInput(orderReviewRating, setOrderReviewRating, orderReviewLoading)}
//                             {orderReviewRating === 0 && (
//                                 <p className="validation-message">Please select a rating.</p>
//                             )}
//                         </div>
//
//                         <div className="form-group">
//                             <label htmlFor="orderComment">Comment (optional, max 1000 chars):</label>
//                             <textarea
//                                 id="orderComment"
//                                 className="form-control"
//                                 rows="4"
//                                 value={orderReviewComment}
//                                 onChange={(e) => setOrderReviewComment(e.target.value)}
//                                 maxLength="1000"
//                                 disabled={orderReviewLoading}
//                             ></textarea>
//                         </div>
//
//                         <div className="modal-actions">
//                             <button
//                                 onClick={handleSubmitOrderReview}
//                                 className="btn btn-primary"
//                                 disabled={orderReviewLoading || orderReviewRating === 0}
//                             >
//                                 {orderReviewLoading ? 'Submitting...' : 'Submit Order Review'}
//                             </button>
//                             <button
//                                 onClick={() => setShowOrderReviewModal(false)}
//                                 className="btn btn-secondary"
//                                 disabled={orderReviewLoading}
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                         {orderReviewError && <p className="modal-error-message">{orderReviewError}</p>}
//                     </div>
//                 </div>
//             )}
//
//             {showProductReviewModal && selectedProductIdForReview && (
//                 <ProductReviewForm
//                     productId={selectedProductIdForReview}
//                     userId={currentUserId}
//                     onClose={handleCloseProductReviewModal}
//                 />
//             )}
//         </div>
//     );
// }





// src/components/OrderManagementComponent.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchRecentOrdersForUser,
    cancelOrder,
    reopenOrder,
    deliverOrder, // The action to dispatch
    deleteOrder,
    reorderToCart,
    submitOrderReview,
} from '../../redux/orders/orderActions'; // Adjust path as per your project structure

import ProductReviewForm from '../productReview/ProductReviewForm';
import './OrderManagement.css';

export default function App({ userId, authToken }) {
    return (
        <div className="app-container">
            <div className="order-management-wrapper">
                <h1 className="main-title">Your Recent Orders</h1>
                <p className="user-info-text">
                    Displaying orders for user: <span className="user-id-highlight">{userId}</span>
                    <br />
                    <span className="note-text">
                        Note: User ID and Token are hardcoded for demo. In production, use a secure auth flow.
                    </span>
                </p>
                <OrderManagementComponent currentUserId={userId} authToken={authToken} />
            </div>
        </div>
    );
}

function OrderManagementComponent({ currentUserId, authToken }) {
    const dispatch = useDispatch();

    const { orders, loading, error, operationSuccess, reviewLoading: orderReviewLoading, reviewError: orderReviewError } = useSelector((state) => state.orders);
    const { loading: productReviewLoading, error: productReviewError, operationSuccess: productReviewSuccess } = useSelector((state) => state.productReview);

    const [uiMessage, setUiMessage] = useState(null);
    const [isUiError, setIsUiError] = useState(false);
    const [reorderMergeBehavior, setReorderMergeBehavior] = useState('merge');

    const [showOrderReviewModal, setShowOrderReviewModal] = useState(false);
    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
    const [orderReviewRating, setOrderReviewRating] = useState(0);
    const [orderReviewComment, setOrderReviewComment] = useState('');

    const [showProductReviewModal, setShowProductReviewModal] = useState(false);
    const [selectedProductIdForReview, setSelectedProductIdForReview] = useState(null);

    // Effect to fetch recent orders when the component mounts or currentUserId changes
    useEffect(() => {
        if (currentUserId) {
            dispatch(fetchRecentOrdersForUser(currentUserId, 10));
        } else {
            setUiMessage('User ID is missing to fetch recent orders.');
            setIsUiError(true);
        }
    }, [dispatch, currentUserId]);

    // UPDATED: Effect to auto-deliver orders upon component load if past cancellation window
    useEffect(() => {
        // Ensure orders have loaded and are available
        if (!loading && orders.length > 0) {
            // Get current time to compare against order dates
            const now = new Date();
            const twoDaysAgo = new Date(now);
            twoDaysAgo.setDate(now.getDate() - 2);

            orders.forEach(order => {
                const orderDate = new Date(order.orderDate);
                const canCancel = orderDate >= twoDaysAgo; // True if within 2 days, false if older

                // Conditions for auto-delivery:
                // 1. Order is not already Delivered or Cancelled
                // 2. Order is older than 2 days (i.e., canCancel is false)
                const shouldAttemptAutoDeliver =
                    order.status !== 'Delivered' &&
                    order.status !== 'Cancelled' &&
                    !canCancel;

                if (shouldAttemptAutoDeliver) {
                    // Use localStorage to prevent re-attempting delivery for the same order in the same session
                    const hasBeenAutoDeliveredAttempted = localStorage.getItem(`autoDeliveredAttempt_${order._id}`);

                    if (!hasBeenAutoDeliveredAttempted) {
                        console.log(`Attempting to auto-deliver order: ${order._id} (past cancellation window)`);
                        dispatch(deliverOrder(order._id, authToken));
                        // Mark this order as having had an auto-delivery attempt to prevent repeated calls
                        localStorage.setItem(`autoDeliveredAttempt_${order._id}`, 'true');
                    }
                }
            });
        }
    }, [orders, loading, dispatch, authToken]); // Re-run when orders or loading state changes

    // Effect to handle successful operations and refresh orders
    useEffect(() => {
        if ((operationSuccess && !loading && !orderReviewLoading) || (productReviewSuccess && !productReviewLoading)) {
            if (currentUserId) {
                dispatch(fetchRecentOrdersForUser(currentUserId));
            }
            if (uiMessage) {
                setUiMessage(null);
                setIsUiError(false);
            }
            if (showProductReviewModal && productReviewSuccess) {
                setShowProductReviewModal(false);
                setSelectedProductIdForReview(null);
            }
            if (showOrderReviewModal && operationSuccess) {
                setShowOrderReviewModal(false);
                setSelectedOrderForReview(null);
                setOrderReviewRating(0);
                setOrderReviewComment('');
            }
        }
    }, [operationSuccess, loading, orderReviewLoading, productReviewSuccess, productReviewLoading, dispatch, currentUserId, uiMessage, showOrderReviewModal, showProductReviewModal]);

    // Effect to show general errors (for order operations)
    useEffect(() => {
        if (error) {
            setUiMessage(`Order Error: ${error}`);
            setIsUiError(true);
            const timer = setTimeout(() => setUiMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Effect to show order-specific review errors
    useEffect(() => {
        if (orderReviewError) {
            setUiMessage(`Order Review Error: ${orderReviewError}`);
            setIsUiError(true);
            const timer = setTimeout(() => setUiMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [orderReviewError]);

    // Effect to show product-specific review errors
    useEffect(() => {
        if (productReviewError) {
            setUiMessage(`Product Review Error: ${productReviewError}`);
            setIsUiError(true);
            const timer = setTimeout(() => setUiMessage(null), 5000);
            return () => clearTimeout(timer)
        }
    }, [productReviewError]);

    const handleCancelOrder = (orderId) => {
        setUiMessage(null);
        setIsUiError(false);
        if (!authToken) {
            setUiMessage('Authentication token is required to cancel orders.');
            setIsUiError(true);
            return;
        }
        if (window.confirm(`Are you sure you want to cancel order ${orderId}?`)) {
            dispatch(cancelOrder(orderId, currentUserId));
        }
    };

    const handleReopenOrder = (orderId) => {
        setUiMessage(null);
        setIsUiError(false);
        if (!authToken) {
            setUiMessage('Authentication token is required to reopen orders.');
            setIsUiError(true);
            return;
        }
        if (window.confirm(`Are you sure you want to reopen order ${orderId}?`)) {
            dispatch(reopenOrder(orderId, currentUserId));
        }
    };

    const handleDeliverOrder = (orderId) => {
        setUiMessage(null);
        setIsUiError(false);
        if (!authToken) {
            setUiMessage('Authentication token is required to mark orders as delivered.');
            setIsUiError(true);
            return;
        }
        if (window.confirm(`Are you sure you want to mark order ${orderId} as delivered?`)) {
            dispatch(deliverOrder(orderId, authToken));
        }
    };

    const handleDeleteOrder = (orderId) => {
        setUiMessage(null);
        setIsUiError(false);
        if (!authToken) {
            setUiMessage('Authentication token is required to delete orders.');
            setIsUiError(true);
            return;
        }
        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE order ${orderId}? This cannot be undone.`)) {
            dispatch(deleteOrder(orderId, authToken));
        }
    };

    const handleReorderToCart = async (orderId) => {
        setUiMessage(null);
        setIsUiError(false);
        if (!currentUserId) {
            setUiMessage('User ID is missing to reorder to cart.');
            setIsUiError(true);
            return;
        }

        const confirmMessage = `Reorder items from Order ${orderId} to your cart?\n` +
            `(Behavior: ${reorderMergeBehavior === 'replace' ? 'Replace current cart' : 'Merge with current cart'})`;
        if (window.confirm(confirmMessage)) {
            try {
                const successMsg = await dispatch(reorderToCart(orderId, currentUserId, reorderMergeBehavior));
                setUiMessage(successMsg || `Order ${orderId} successfully reordered to cart!`);
                setIsUiError(false);
            } catch (err) {
                setUiMessage(`Failed to reorder order ${orderId}: ${err.message}`);
                setIsUiError(true);
            }
        }
    };

    const handleOpenOrderReviewModal = (order) => {
        setSelectedOrderForReview(order);
        setOrderReviewRating(order.isReviewed && order.rating ? order.rating : 0);
        setOrderReviewComment(order.isReviewed && order.comment ? order.comment : '');
        setShowOrderReviewModal(true);
    };

    const handleSubmitOrderReview = async () => {
        if (!selectedOrderForReview || !currentUserId || !authToken) {
            setUiMessage('Missing order, user ID, or auth token for review submission.');
            setIsUiError(true);
            return;
        }
        if (orderReviewRating === 0) {
            setUiMessage('Please provide a rating for the order.');
            setIsUiError(true);
            return;
        }

        setUiMessage(null);
        setIsUiError(false);
        try {
            const successMsg = await dispatch(submitOrderReview(
                selectedOrderForReview._id,
                currentUserId,
                orderReviewRating,
                orderReviewComment,
                authToken
            ));
            setUiMessage(successMsg);
            setIsUiError(false);
        } catch (err) {
            setUiMessage(`Failed to submit order review: ${err.message}`);
            setIsUiError(true);
        }
    };

    const handleOpenProductReviewModal = (productId) => {
        console.log("productId", productId);
        setSelectedProductIdForReview(productId);
        setShowProductReviewModal(true);
    };

    const handleCloseProductReviewModal = () => {
        setShowProductReviewModal(false);
        setSelectedProductIdForReview(null);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Delivered': return 'badge-green';
            case 'Processing': return 'badge-yellow';
            case 'Pending': return 'badge-blue';
            case 'Cancelled': return 'badge-red';
            case 'Shipped': return 'badge-orange';
            default: return 'badge-gray';
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 1; i <= 5; i++) {
            let className = 'star-icon';
            if (i <= fullStars) {
                className += ' filled';
            } else if (hasHalfStar && i === fullStars + 1) {
                className += ' half-filled';
            }
            stars.push(
                <span key={i} className={className}>
                    &#9733;
                </span>
            );
        }
        return <div className="rating-stars">{stars}</div>;
    };

    const renderStarsInput = (currentRating, setRatingFunction, isDisabled) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={`star-icon-input ${i <= currentRating ? 'filled' : ''}`}
                    onClick={() => !isDisabled && setRatingFunction(i)}
                    style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                >
                    &#9733;
                </span>
            );
        }
        return <div className="star-rating-input">{stars}</div>;
    };

    if (loading && orders.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading your orders...</p>
            </div>
        );
    }

    if (uiMessage && !loading && !orderReviewLoading && !productReviewLoading) {
        return (
            <div className={`ui-message ${isUiError ? 'ui-error' : 'ui-success'}`}>
                {uiMessage}
            </div>
        );
    }

    if (orders.length === 0 && !loading) {
        return (
            <div className="no-orders-found">
                <strong className="no-orders-title">No Orders Found:</strong>
                <span className="no-orders-message">No orders available for this user.</span>
            </div>
        );
    }

    return (
        <div className="orders-list-container">
            <div className="reorder-options">
                <label htmlFor="mergeBehavior">Reorder Behavior:</label>
                <select
                    id="mergeBehavior"
                    value={reorderMergeBehavior}
                    onChange={(e) => setReorderMergeBehavior(e.target.value)}
                    disabled={loading}
                >
                    <option value="merge">Merge with existing cart</option>
                    <option value="replace">Replace current cart</option>
                </select>
            </div>

            {orders.map((order) => {
                const orderDate = new Date(order.orderDate);
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const canCancel = orderDate >= twoDaysAgo;
                const showOrderReviewButton = order.status === 'Delivered';

                return (
                    <div key={order._id} className="order-card">
                        <div className="order-header">
                            <div>
                                <h2 className="order-id">Order ID: <span className="order-id-value">{order._id}</span></h2>
                                <p className="order-meta">User ID: <span className="order-meta-value">{order.userId}</span></p>
                                <p className="order-meta">Order Date: <span className="order-meta-value">{new Date(order.orderDate).toLocaleString()}</span></p>
                            </div>
                            <span className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="order-items-section">
                            <h3 className="order-items-title">Items:</h3>
                            <ul className="order-items-list">
                                {order.items.map((item, index) => (
                                    <li key={item.productId?._id || `item-${order._id}-${index}`} className="order-item">
                                        <span>{item.quantity} x {item.name}</span>
                                        <span className="order-item-price">${item.price?.toFixed(2) || '0.00'}</span>
                                        {item.productId && order.status === 'Delivered' && (
                                            <button
                                                onClick={() => handleOpenProductReviewModal(item.productId)}
                                                className="btn btn-product-review"
                                                disabled={loading || productReviewLoading}
                                            >
                                                Review Product
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {order.isReviewed && typeof order.rating === 'number' && order.rating > 0 && (
                            <div className="order-review-details">
                                <h4 className="review-title">Your Order Review:</h4>
                                <div className="review-rating-display">
                                    {renderStars(order.rating)}
                                    <span className="rating-value">{order.rating.toFixed(1)} / 5 Stars</span>
                                </div>
                                {order.comment && (
                                    <p className="review-comment">{order.comment}</p>
                                )}
                            </div>
                        )}

                        <div className="order-footer">
                            <p className="order-total">Total: ${order.totalAmount?.toFixed(2) || '0.00'}</p>
                            <div className="order-actions">
                                {canCancel && (order.status === 'Processing' || order.status === 'Pending' || order.status === 'Shipped') ? (
                                    <button
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="btn btn-cancel"
                                        disabled={loading}
                                    >
                                        Cancel Order
                                    </button>
                                ) : null}

                                {order.status === 'Cancelled' ? (
                                    <button
                                        onClick={() => handleReopenOrder(order._id)}
                                        className="btn btn-reopen"
                                        disabled={loading}
                                    >
                                        Reopen Order
                                    </button>
                                ) : null}

                                {order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Shipped' ? (
                                    <button
                                        onClick={() => handleDeliverOrder(order._id)}
                                        className="btn btn-deliver"
                                        disabled={loading}
                                    >
                                        Mark Delivered
                                    </button>
                                ) : null}

                                <button
                                    onClick={() => handleReorderToCart(order._id)}
                                    className="btn btn-reorder"
                                    disabled={loading}
                                >
                                    Reorder to Cart
                                </button>

                                {showOrderReviewButton && (
                                    <button
                                        onClick={() => handleOpenOrderReviewModal(order)}
                                        className="btn btn-review"
                                        disabled={loading || orderReviewLoading}
                                    >
                                        {order.isReviewed ? 'Edit Order Review' : 'Write Order Review'}
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDeleteOrder(order._id)}
                                    className="btn btn-delete"
                                    disabled={loading}
                                >
                                    Delete Order
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {showOrderReviewModal && selectedOrderForReview && (
                <div className="review-modal-overlay">
                    <div className="review-modal">
                        <h3>{selectedOrderForReview.isReviewed ? 'Edit Your Order Review' : 'Write a Review'} for Order: {selectedOrderForReview._id}</h3>
                        <p>Items: {selectedOrderForReview.items.map(item => item.name).join(', ')}</p>

                        <div className="form-group">
                            <label htmlFor="orderRating">Order Rating:</label>
                            {renderStarsInput(orderReviewRating, setOrderReviewRating, orderReviewLoading)}
                            {orderReviewRating === 0 && (
                                <p className="validation-message">Please select a rating.</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="orderComment">Comment (optional, max 1000 chars):</label>
                            <textarea
                                id="orderComment"
                                className="form-control"
                                rows="4"
                                value={orderReviewComment}
                                onChange={(e) => setOrderReviewComment(e.target.value)}
                                maxLength="1000"
                                disabled={orderReviewLoading}
                            ></textarea>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={handleSubmitOrderReview}
                                className="btn btn-primary"
                                disabled={orderReviewLoading || orderReviewRating === 0}
                            >
                                {orderReviewLoading ? 'Submitting...' : 'Submit Order Review'}
                            </button>
                            <button
                                onClick={() => setShowOrderReviewModal(false)}
                                className="btn btn-secondary"
                                disabled={orderReviewLoading}
                            >
                                Cancel
                            </button>
                        </div>
                        {orderReviewError && <p className="modal-error-message">{orderReviewError}</p>}
                    </div>
                </div>
            )}

            {showProductReviewModal && selectedProductIdForReview && (
                <ProductReviewForm
                    productId={selectedProductIdForReview}
                    userId={currentUserId}
                    onClose={handleCloseProductReviewModal}
                />
            )}
        </div>
    );
}
