import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchCartItems,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart, // Import clearCart for checkout
    processPayment, // Import processPayment
} from '../redux/cart/cartActions';

function CartComponent() {
    const dispatch = useDispatch();
    const cartState = useSelector((state) => state.cart);
    const { cart, loading, error, checkoutOrderDetails, paymentSuccess } = cartState;

    const userId = 'user123'; // Hardcoded userId

    useEffect(() => {
        dispatch(fetchCartItems(userId));
    }, [dispatch, userId]);

    // Use item.productId._id for actions that require product ID
    const handleRemoveItem = (productId) => {
        dispatch(removeItemFromCart(userId, productId));
    };

    const handleUpdateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveItem(productId);
            return;
        }
        dispatch(updateCartItemQuantity(userId, productId, newQuantity));
    };

    const handleCheckout = () => {
        // This will call the /api/cart/checkout endpoint
        dispatch(clearCart(userId));
    };

    const handleMakePayment = () => {
        if (checkoutOrderDetails) {
            const orderId = checkoutOrderDetails.orderId;
            const paymentData = {
                paymentMethod: 'Credit Card', // Example, would come from patient input in a real app
                transactionId: 'mock_txn_' + Date.now(), // Generate a unique transaction ID
                amountPaid: checkoutOrderDetails.totalAmount, // Use the total amount from checkout
                userId: userId // Pass userId for refetching cart
            };
            // Call processPayment with orderId and paymentData
            dispatch(processPayment(orderId, paymentData));
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <p style={styles.message}>Loading cart items...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <p style={styles.errorMessage}>Error loading cart: {error}</p>
            </div>
        );
    }

    // --- SOLUTION: Prioritize payment success message and checkout details ---
    if (paymentSuccess) {
        return (
            <div style={styles.container}>
                <p style={styles.successMessage}>Thank you for the payment, your items are under process!</p>
            </div>
        );
    }

    // After payment success, the cart and checkoutOrderDetails are cleared.
    // So, if we reach here AND checkoutOrderDetails is present, it means we are in the
    // "orders confirmed, awaiting payment" state.
    if (checkoutOrderDetails) {
        return (
            <div style={styles.container}>
                <h1 style={styles.heading}>Your Shopping Cart (User: {userId})</h1>
                <div style={styles.checkoutDetails}>
                    <h2>Order Confirmed!</h2>
                    <p><strong>Order ID:</strong> {checkoutOrderDetails.orderId}</p>
                    <p><strong>Total Amount:</strong> ${checkoutOrderDetails.totalAmount?.toFixed(2)}</p>
                    <h3>Checked Out Items:</h3>
                    <ul style={styles.checkedOutItemsList}>
                        {checkoutOrderDetails.checkedOutItems.map((item, index) => (
                            <li key={index} style={styles.checkedOutItem}>
                                {item.name} (x{item.quantity}) - ${item.price?.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Show "Make Payment" button after successful checkout (when checkoutOrderDetails is present) */}
                {!paymentSuccess && ( // Added !paymentSuccess just for clarity, though it's already checked above
                    <div style={styles.cartSummary}>
                        <button
                            onClick={handleMakePayment}
                            style={styles.checkoutButton}
                            disabled={loading}
                        >
                            Make Payment
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Now, if we reach here, it means no loading, no error, no paymentSuccess, and no checkoutOrderDetails.
    // So, we can safely determine if the cart is truly empty for regular shopping.
    const cartItems = cart?.items || [];
    if (cartItems.length === 0) {
        return (
            <div style={styles.container}>
                <p style={styles.message}>Your cart is empty.</p>
            </div>
        );
    }

    // If none of the above, then we must have items in the cart and no checkout in progress.
    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Your Shopping Cart (User: {userId})</h1>

            <ul style={styles.cartList}>
                {cartItems.map((item) => {
                    console.log("Rendering cart item (from API):", item);

                    const product = item.productId;
                    const itemId = product?._id;

                    if (!itemId) {
                        console.warn("cart item missing productId or _id:", item);
                        return null;
                    }

                    return (
                        <li key={itemId} style={styles.cartItem}>
                            <div style={styles.itemDetails}>
                                <span style={styles.itemName}>{product.name}</span>
                                {product.description && <p style={styles.itemDescription}>{product.description}</p>}
                                <span style={styles.itemPrice}>${product.price?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div style={styles.itemControls}>
                                <button
                                    onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
                                    style={styles.controlButton}
                                >
                                    -
                                </button>
                                <span style={styles.itemQuantity}>{item.quantity}</span>
                                <button
                                    onClick={() => handleUpdateQuantity(itemId, item.quantity + 1)}
                                    style={styles.controlButton}
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => handleRemoveItem(itemId)}
                                    style={styles.removeButton}
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div style={styles.cartSummary}>
                <p style={styles.totalText}>
                    Total: ${cartItems
                    ? cartItems.reduce((acc, item) => acc + (item.productId?.price || 0) * (item.quantity || 0), 0).toFixed(2)
                    : '0.00'}
                </p>

                <button
                    onClick={handleCheckout}
                    style={styles.checkoutButton}
                    disabled={loading}
                >
                    Cart Checkout
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
    },
    heading: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
    },
    message: {
        textAlign: 'center',
        color: '#666',
        padding: '20px',
        border: '1px dashed #ccc',
        borderRadius: '5px',
    },
    errorMessage: {
        textAlign: 'center',
        color: 'red',
        padding: '20px',
        border: '1px dashed red',
        borderRadius: '5px',
    },
    successMessage: {
        textAlign: 'center',
        color: 'green',
        padding: '20px',
        border: '1px dashed green',
        borderRadius: '5px',
        marginTop: '20px',
        fontWeight: 'bold',
        fontSize: '1.2em',
    },
    cartList: {
        listStyle: 'none',
        padding: 0,
        margin: '0 0 20px 0',
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #eee',
    },
    itemDetails: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    itemName: {
        fontWeight: 'bold',
        marginBottom: '5px',
        fontSize: '1.1em',
    },
    itemDescription: {
        fontSize: '0.9em',
        color: '#777',
        marginBottom: '5px',
        lineHeight: '1.4',
    },
    itemPrice: {
        color: '#555',
        fontSize: '1em',
        fontWeight: 'bold',
    },
    itemControls: {
        display: 'flex',
        alignItems: 'center',
    },
    controlButton: {
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1em',
        margin: '0 5px',
    },
    removeButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9em',
        marginLeft: '10px',
    },
    itemQuantity: {
        padding: '0 8px',
        minWidth: '20px',
        textAlign: 'center',
    },
    cartSummary: {
        borderTop: '1px solid #eee',
        paddingTop: '15px',
        textAlign: 'right',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '20px',
    },
    totalText: {
        fontSize: '1.2em',
        fontWeight: 'bold',
        margin: 0,
    },
    checkoutButton: {
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1.1em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
    },
    checkoutButtonHover: {
        backgroundColor: '#218838',
    },
    checkoutButtonDisabled: {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed',
    },
    checkoutDetails: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
    },
    checkedOutItemsList: {
        listStyle: 'disc',
        marginLeft: '20px',
        padding: 0,
    },
    checkedOutItem: {
        marginBottom: '5px',
    }
};

export default CartComponent;


// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//     fetchCartItems,
//     removeItemFromCart,
//     updateCartItemQuantity,
//     clearCart, // Import clearCart for checkout
//     processPayment, // Import processPayment
// } from '../redux/cart/cartActions';
//
// function CartComponent() {
//     const dispatch = useDispatch();
//     const cartState = useSelector((state) => state.cart);
//     const { cart, loading, error, checkoutOrderDetails, paymentSuccess } = cartState;
//
//     const userId = 'user123'; // Hardcoded userId
//
//     useEffect(() => {
//         dispatch(fetchCartItems(userId));
//     }, [dispatch, userId]);
//
//     // Use item.productId._id for actions that require product ID
//     const handleRemoveItem = (productId) => {
//         dispatch(removeItemFromCart(userId, productId));
//     };
//
//     const handleUpdateQuantity = (productId, newQuantity) => {
//         if (newQuantity < 1) {
//             handleRemoveItem(productId);
//             return;
//         }
//         dispatch(updateCartItemQuantity(userId, productId, newQuantity));
//     };
//
//     const handleCheckout = () => {
//         // This will call the /api/cart/checkout endpoint
//         dispatch(clearCart(userId));
//     };
//
//     const handleMakePayment = () => {
//         if (checkoutOrderDetails) {
//             const orderId = checkoutOrderDetails.orderId;
//             const paymentData = {
//                 paymentMethod: 'Credit Card', // Example, would come from patient input in a real app
//                 transactionId: 'mock_txn_' + Date.now(), // Generate a unique transaction ID
//                 amountPaid: checkoutOrderDetails.totalAmount, // Use the total amount from checkout
//                 userId: userId // Pass userId for refetching cart
//             };
//             // Call processPayment with orderId and paymentData
//             dispatch(processPayment(orderId, paymentData));
//         }
//     };
//
//     if (loading) {
//         return (
//             <div style={styles.container}>
//                 <p style={styles.message}>Loading cart items...</p>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div style={styles.container}>
//                 <p style={styles.errorMessage}>Error loading cart: {error}</p>
//             </div>
//         );
//     }
//
//     const cartItems = cart?.items || [];
//
//     // --- NEW LOGIC: Prioritize payment success message ---
//     if (paymentSuccess) {
//         return (
//             <div style={styles.container}>
//                 <p style={styles.successMessage}>Thank you for the payment, your items are under process!</p>
//             </div>
//         );
//     }
//     // --- END NEW LOGIC ---
//
//     return (
//         <div style={styles.container}>
//             <h1 style={styles.heading}>Your Shopping cart (User: {userId})</h1>
//
//             {/* Display cart items or empty message IF NO CHECKOUT DETAILS */}
//             {cartItems.length === 0 && !checkoutOrderDetails ? (
//                 <p style={styles.message}>Your cart is empty.</p>
//             ) : (
//                 <>
//                     {/* Render cart items only if there are items and no successful checkout yet */}
//                     {cartItems.length > 0 && !checkoutOrderDetails && (
//                         <ul style={styles.cartList}>
//                             {cartItems.map((item) => {
//                                 console.log("Rendering cart item (from API):", item);
//
//                                 const product = item.productId;
//                                 const itemId = product?._id;
//
//                                 if (!itemId) {
//                                     console.warn("cart item missing productId or _id:", item);
//                                     return null;
//                                 }
//
//                                 return (
//                                     <li key={itemId} style={styles.cartItem}>
//                                         <div style={styles.itemDetails}>
//                                             <span style={styles.itemName}>{product.name}</span>
//                                             {product.description && <p style={styles.itemDescription}>{product.description}</p>}
//                                             <span style={styles.itemPrice}>${product.price?.toFixed(2) || '0.00'}</span>
//                                         </div>
//                                         <div style={styles.itemControls}>
//                                             <button
//                                                 onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
//                                                 style={styles.controlButton}
//                                             >
//                                                 -
//                                             </button>
//                                             <span style={styles.itemQuantity}>{item.quantity}</span>
//                                             <button
//                                                 onClick={() => handleUpdateQuantity(itemId, item.quantity + 1)}
//                                                 style={styles.controlButton}
//                                             >
//                                                 +
//                                             </button>
//                                             <button
//                                                 onClick={() => handleRemoveItem(itemId)}
//                                                 style={styles.removeButton}
//                                             >
//                                                 Remove
//                                             </button>
//                                         </div>
//                                     </li>
//                                 );
//                             })}
//                         </ul>
//                     )}
//
//                     {/* Display checkout details if available */}
//                     {checkoutOrderDetails && (
//                         <div style={styles.checkoutDetails}>
//                             <h2>Order Confirmed!</h2>
//                             <p><strong>Order ID:</strong> {checkoutOrderDetails.orderId}</p>
//                             <p><strong>Total Amount:</strong> ${checkoutOrderDetails.totalAmount?.toFixed(2)}</p>
//                             <h3>Checked Out Items:</h3>
//                             <ul style={styles.checkedOutItemsList}>
//                                 {checkoutOrderDetails.checkedOutItems.map((item, index) => (
//                                     <li key={index} style={styles.checkedOutItem}>
//                                         {item.name} (x{item.quantity}) - ${item.price?.toFixed(2)}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     )}
//                 </>
//             )}
//
//             <div style={styles.cartSummary}>
//                 {/* Only show total if there are cart items and no checkout details yet */}
//                 {cartItems.length > 0 && !checkoutOrderDetails && (
//                     <p style={styles.totalText}>
//                         Total: ${cartItems
//                         ? cartItems.reduce((acc, item) => acc + (item.productId?.price || 0) * (item.quantity || 0), 0).toFixed(2)
//                         : '0.00'}
//                     </p>
//                 )}
//
//                 {/* Show "cart Checkout" button if there are items and no successful checkout yet */}
//                 {cartItems.length > 0 && !checkoutOrderDetails && (
//                     <button
//                         onClick={handleCheckout}
//                         style={styles.checkoutButton}
//                         disabled={loading}
//                     >
//                         cart Checkout
//                     </button>
//                 )}
//
//                 {/* Show "Make Payment" button after successful checkout (when checkoutOrderDetails is present) */}
//                 {checkoutOrderDetails && !paymentSuccess && (
//                     <button
//                         onClick={handleMakePayment}
//                         style={styles.checkoutButton}
//                         disabled={loading}
//                     >
//                         Make Payment
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }
//
// const styles = {
//     container: {
//         maxWidth: '800px',
//         margin: '20px auto',
//         padding: '20px',
//         border: '1px solid #ddd',
//         borderRadius: '8px',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//         fontFamily: 'Arial, sans-serif',
//     },
//     heading: {
//         textAlign: 'center',
//         color: '#333',
//         marginBottom: '20px',
//     },
//     message: {
//         textAlign: 'center',
//         color: '#666',
//         padding: '20px',
//         border: '1px dashed #ccc',
//         borderRadius: '5px',
//     },
//     errorMessage: {
//         textAlign: 'center',
//         color: 'red',
//         padding: '20px',
//         border: '1px dashed red',
//         borderRadius: '5px',
//     },
//     successMessage: {
//         textAlign: 'center',
//         color: 'green',
//         padding: '20px',
//         border: '1px dashed green',
//         borderRadius: '5px',
//         marginTop: '20px',
//         fontWeight: 'bold',
//         fontSize: '1.2em',
//     },
//     cartList: {
//         listStyle: 'none',
//         padding: 0,
//         margin: '0 0 20px 0',
//     },
//     cartItem: {
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         padding: '10px 0',
//         borderBottom: '1px solid #eee',
//     },
//     itemDetails: {
//         flexGrow: 1,
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'flex-start',
//     },
//     itemName: {
//         fontWeight: 'bold',
//         marginBottom: '5px',
//         fontSize: '1.1em',
//     },
//     itemDescription: {
//         fontSize: '0.9em',
//         color: '#777',
//         marginBottom: '5px',
//         lineHeight: '1.4',
//     },
//     itemPrice: {
//         color: '#555',
//         fontSize: '1em',
//         fontWeight: 'bold',
//     },
//     itemControls: {
//         display: 'flex',
//         alignItems: 'center',
//     },
//     controlButton: {
//         backgroundColor: '#007bff',
//         color: 'white',
//         border: 'none',
//         padding: '5px 10px',
//         borderRadius: '4px',
//         cursor: 'pointer',
//         fontSize: '1em',
//         margin: '0 5px',
//     },
//     removeButton: {
//         backgroundColor: '#dc3545',
//         color: 'white',
//         border: 'none',
//         padding: '5px 10px',
//         borderRadius: '4px',
//         cursor: 'pointer',
//         fontSize: '0.9em',
//         marginLeft: '10px',
//     },
//     itemQuantity: {
//         padding: '0 8px',
//         minWidth: '20px',
//         textAlign: 'center',
//     },
//     cartSummary: {
//         borderTop: '1px solid #eee',
//         paddingTop: '15px',
//         textAlign: 'right',
//         display: 'flex',
//         justifyContent: 'flex-end',
//         alignItems: 'center',
//         gap: '20px',
//     },
//     totalText: {
//         fontSize: '1.2em',
//         fontWeight: 'bold',
//         margin: 0,
//     },
//     checkoutButton: {
//         backgroundColor: '#28a745',
//         color: 'white',
//         border: 'none',
//         padding: '12px 20px',
//         borderRadius: '5px',
//         cursor: 'pointer',
//         fontSize: '1.1em',
//         fontWeight: 'bold',
//         transition: 'background-color 0.3s ease',
//     },
//     checkoutButtonHover: {
//         backgroundColor: '#218838',
//     },
//     checkoutButtonDisabled: {
//         backgroundColor: '#cccccc',
//         cursor: 'not-allowed',
//     },
//     checkoutDetails: {
//         backgroundColor: '#f9f9f9',
//         border: '1px solid #e0e0e0',
//         borderRadius: '8px',
//         padding: '20px',
//         marginBottom: '20px',
//     },
//     checkedOutItemsList: {
//         listStyle: 'disc',
//         marginLeft: '20px',
//         padding: 0,
//     },
//     checkedOutItem: {
//         marginBottom: '5px',
//     }
// };
//
// export default CartComponent;