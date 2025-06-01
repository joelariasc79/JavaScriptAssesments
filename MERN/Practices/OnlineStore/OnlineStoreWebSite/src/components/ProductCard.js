// src/components/ProductCard.js
import React, { useState } from 'react'; // Import useState hook
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../redux/cart/cartActions';
import './ProductCard.css';
import './ConfirmationModal.css'; // We'll create this CSS file for the modal

const ProductCard = ({ product, userId }) => {
    const dispatch = useDispatch();
    const [showConfirmationModal, setShowConfirmationModal] = useState(false); // State to control modal visibility

    const handleAddToCart = () => {
        // Dispatch the action to add the item to the cart
        dispatch(addItemToCart(userId, product._id, 1));
        // Immediately show the confirmation modal
        // NOTE: For true asynchronous success, you might want to link this
        // to a Redux state change (e.g., cart success flag) that gets set
        // after the addItemToCart API call completes successfully.
        // For simplicity and immediate feedback, we're showing it here.
        setShowConfirmationModal(true);
    };

    const closeConfirmationModal = () => {
        setShowConfirmationModal(false);
    };

    return (
        <div className="product-card">
            <h3>{product.name}</h3>
            <p>Price: ${product.price.toFixed(2)}</p>
            <p>{product.description}</p>
            {product.rating && <p>Rating: {product.rating}/5</p>}
            <button onClick={handleAddToCart}>Add to Cart</button>

            {showConfirmationModal && (
                <div className="modal-overlay" onClick={closeConfirmationModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing overlay */}
                        <h2>Item Added to Cart!</h2>
                        <p>
                            "<span className="product-name-highlight">{product.name}</span>"
                            has been successfully added to your cart.
                        </p>
                        <button onClick={closeConfirmationModal}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCard;