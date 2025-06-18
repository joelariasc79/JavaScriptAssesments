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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (successMessage || error) {
                dispatch(clearProductStatus());
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [successMessage, error, dispatch]);

    useEffect(() => {
        if (successMessage && nameInputRef.current) {
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
