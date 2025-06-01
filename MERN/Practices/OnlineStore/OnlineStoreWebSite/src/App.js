// src/App.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProducts } from './redux/product/allProductsActions';
// Removed: import { fetchUser } from './redux/user/userActions'; // No longer needed for App.js itself

import ProductCard from './components/ProductCard';
import CartComponent from './components/CartComponent';
import ProductForm from './components/ProductForm';
import UserManagement from './components/UserManagement';
import './app.css';

function App() {
    const dispatch = useDispatch();

    // Select products, loading state, and error from the 'allProducts' slice of state
    const { products, loading: productsLoading, error: productsError } = useSelector(state => state.allProducts);

    // Removed: Select current user, loading state, and error from the 'user' slice
    // const { currentUser, loading: userLoading, error: userError } = useSelector(state => state.user);

    // Set currentUserId back to the hardcoded value
    const currentUserId = "user123";

    const [activeSection, setActiveSection] = useState('products');

    // Removed: Effect to fetch initial user data on component mount
    // useEffect(() => {
    //     dispatch(fetchUser("joeD137"));
    // }, [dispatch]);

    // Fetch products when the component mounts or when the 'products' section is active
    useEffect(() => {
        if (activeSection === 'products') {
            dispatch(fetchAllProducts());
        }
    }, [dispatch, activeSection]); // Re-fetch if activeSection changes to 'products'

    const renderSection = () => {
        // Removed: Conditional rendering for user loading/error
        // if (userLoading) {
        //     return (
        //         <section className="initial-load-message">
        //             <p className="status-message loading">Loading user data...</p>
        //         </section>
        //     );
        // }
        // if (userError) {
        //     return (
        //         <section className="initial-load-message">
        //             <p className="status-message error">Error loading user: {userError}. Please ensure user "joeD137" exists.</p>
        //             <p>Proceeding without a logged-in user for some functionalities.</p>
        //         </section>
        //     );
        // }

        switch (activeSection) {
            case 'products':
                return (
                    <section className="products-section">
                        <h2>Available Products</h2>
                        {productsLoading && <p className="status-message loading">Loading products...</p>}
                        {productsError && <p className="status-message error">Error: {productsError}</p>}
                        {!productsLoading && !productsError && products.length === 0 && (
                            <p className="no-products-message">No products available.</p>
                        )}
                        <div className="product-list">
                            {!productsLoading && !productsError && products.map(product => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    userId={currentUserId} // Pass the hardcoded userId
                                />
                            ))}
                        </div>
                    </section>
                );
            case 'cart':
                return (
                    <section className="cart-section">
                        {/* No longer conditional, directly uses currentUserId */}
                        <CartComponent userId={currentUserId} />
                    </section>
                );
            case 'addProduct':
                return (
                    <section className="add-product-section">
                        <ProductForm />
                    </section>
                );
            case 'userManagement':
                return (
                    <section className="user-management-section">
                        <UserManagement />
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>My E-commerce App</h1>
                <nav className="main-nav">
                    <button onClick={() => setActiveSection('products')} className={activeSection === 'products' ? 'active' : ''}>Products</button>
                    <button onClick={() => setActiveSection('cart')} className={activeSection === 'cart' ? 'active' : ''}>Cart</button>
                    <button onClick={() => setActiveSection('addProduct')} className={activeSection === 'addProduct' ? 'active' : ''}>Add Product</button>
                    <button onClick={() => setActiveSection('userManagement')} className={activeSection === 'userManagement' ? 'active' : ''}>User Management</button>
                </nav>
            </header>
            <main>
                {renderSection()}
            </main>
        </div>
    );
}

export default App;