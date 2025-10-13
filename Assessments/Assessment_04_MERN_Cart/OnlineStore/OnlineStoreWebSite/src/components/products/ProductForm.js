// src/components/ProductForm.js
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, clearProductStatus } from '../../redux/product/productActions';
import './ProductForm.css';

const ProductForm = () => {
    const dispatch = useDispatch();
    const { loading, error, successMessage, addedProduct } = useSelector(state => state.addProduct);

    const nameInputRef = useRef(null);

    const [productData, setProductData] = useState({
        name: '',
        description: '',
        rating: '',
        price: '',
        category: '',
    });

    // The useEffect hook runs its code whenever the values in its dependency array change?

    // This useEffect hook in a React component is designed to manage the display of status messages—specifically,
    // it makes a success or error message disappear after a certain period of time. It's a common pattern
    // for creating a good patient experience.
    // The code essentially says: "Anytime a success or error message appears, start a 5-second countdown.
    // When the countdown finishes, clear the message. But if a new message arrives before the countdown is over,
    // cancel the old countdown and start a brand new one."
    useEffect(() => {
        const timer = setTimeout(() => {
            if (successMessage || error) {
                dispatch(clearProductStatus());
            }
        }, 5000);

        // When the countdown finishes, clear the message.
        // This is the cleanup function for the useEffect hook. It's crucial for preventing memory leaks and unwanted behavior.
        // This function runs in two scenarios:
        //      1. When the component unmounts: It clears the timer, so the action to hide the message isn't called
        //      on a component that no longer exists.
        //      2. Before the next effect runs: If successMessage or error changes before the 5-second timer is up
        //          (e.g., the patient submits a form again), this function will first clear the old timer,
        //          so you don't end up with multiple timers racing each other. This ensures that the
        //          new message stays on screen for the full 5 seconds.
        return () => clearTimeout(timer);
    }, [successMessage, error, dispatch]);

    // This code says: "Whenever a successMessage appears, check if the name input field exists.
    // If it does, automatically put the cursor in that field so the patient can start typing right away."
    // The code inside this useEffect will only execute when the successMessage state changes.
    useEffect(() => {

        // nameInputRef.current: This part uses a React Ref (useRef). A ref is a way to get a direct reference
        // to a DOM element (like an input field). The .current property holds the actual DOM node.
        // This check ensures that the input field exists and has been rendered in the UI.
        if (successMessage && nameInputRef.current) {

            // This line uses the focus() method to programmatically set the cursor inside the nameInputRef input field
            // This is a common practice to improve patient experience, as it allows the patient to immediately start
            // typing in the field after a successful action (e.g., submitting a form).
            nameInputRef.current.focus();
        }
    }, [successMessage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData(prev => ({
            ...prev,
            [name]: (name === 'price' || name === 'rating') ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!productData.name || !productData.price || productData.rating === '' || !productData.category) {
            alert('Please fill in Name, Price, Rating, and Category.');
            return;
        }
        dispatch(addProduct(productData));
        setProductData({
            name: '',
            description: '',
            rating: '',
            price: '',
            category: '',
        });
    };

    return (
        <div className="product-form-container">
            <h2>Add New Product</h2>
            {loading && <p className="status-message loading">Adding product...</p>}
            {error && <p className="status-message error">Error: {error}</p>}
            {successMessage && <p className="status-message success">{successMessage}</p>}
            {addedProduct && (
                <div className="added-product-info">
                    <h4>Successfully Added:</h4>
                    <p><strong>Name:</strong> {addedProduct.name}</p>
                    <p><strong>Price:</strong> ${addedProduct.price?.toFixed(2)}</p>
                    <p><strong>Rating:</strong> {addedProduct.rating}</p>
                    <p><strong>Category:</strong> {addedProduct.category}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                    <label htmlFor="name">Product Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={productData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={productData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="price">Price:</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={productData.price}
                        onChange={handleChange}
                        step="0.01"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="rating">Rating (1-5):</label>
                    <input
                        type="number"
                        id="rating"
                        name="rating"
                        value={productData.rating}
                        onChange={handleChange}
                        min="1"
                        max="5"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        value={productData.category}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Add Product</button>
            </form>
        </div>
    );
};

export default ProductForm;
