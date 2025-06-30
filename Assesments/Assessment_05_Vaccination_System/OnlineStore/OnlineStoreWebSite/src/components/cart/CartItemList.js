import React from 'react';
import CartItem from './CartItem'; // NEW: Import the new CartItem subcomponent
import './CartComponent.css'; // Re-use the existing CSS for styling

/**
 * CartItemList component displays a list of items in the shopping cart.
 * It now uses the CartItem subcomponent for individual item rendering.
 *
 * @param {object} props - The component props.
 * @param {Array} props.cartItems - An array of cart item objects.
 * @param {function} props.handleUpdateQuantity - Function to call when an item's quantity is updated.
 * @param {function} props.handleRemoveItem - Function to call when an item is to be removed.
 */
function CartItemList({ cartItems, handleUpdateQuantity, handleRemoveItem }) {
    return (
        <ul className="cart-list">
            {cartItems.map((item) => (
                <CartItem
                    key={item.productId?._id || item._id} // Use product ID or item subdocument ID as key
                    item={item}
                    handleUpdateQuantity={handleUpdateQuantity}
                    handleRemoveItem={handleRemoveItem}
                />
            ))}
        </ul>
    );
}

export default CartItemList;