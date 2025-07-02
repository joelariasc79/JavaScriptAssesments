import React from 'react';
import './CartComponent.css'; // Re-use the existing CSS for styling

/**
 * CartItem component displays a single item in the shopping cart.
 * It includes product details and controls for quantity adjustment and removal.
 *
 * @param {object} props - The component props.
 * @param {object} props.item - The cart item object, containing productId (populated product details) and quantity.
 * @param {function} props.handleUpdateQuantity - Function to call when the item's quantity is updated.
 * @param {function} props.handleRemoveItem - Function to call when the item is to be removed.
 */
function CartItem({ item, handleUpdateQuantity, handleRemoveItem }) {
    const product = item.productId;
    const itemId = product?._id;

    // Defensive check: If product or its ID is missing, render nothing (or a placeholder)
    if (!itemId || !product) {
        console.warn("cart item data is incomplete or missing:", item);
        return null; // Don't render malformed items
    }

    return (
        <li className="cart-item">
            <div className="item-details">
                <span className="item-name">{product.name}</span>
                {product.description && <p className="item-description">{product.description}</p>}
                {/* Ensure price is parsed to float before formatting for display */}
                <span className="item-price">
                    ${product.price !== undefined && product.price !== null
                    ? parseFloat(product.price).toFixed(2)
                    : '0.00'}
                </span>
            </div>
            <div className="item-controls">
                <button
                    onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
                    className="control-button"
                >
                    -
                </button>
                <span className="item-quantity">{item.quantity}</span>
                <button
                    onClick={() => handleUpdateQuantity(itemId, item.quantity + 1)}
                    className="control-button"
                >
                    +
                </button>
                <button
                    onClick={() => handleRemoveItem(itemId)}
                    className="remove-button"
                >
                    Remove
                </button>
            </div>
        </li>
    );
}

export default CartItem;
