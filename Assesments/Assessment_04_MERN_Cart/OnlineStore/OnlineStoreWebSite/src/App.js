// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProducts } from './redux/product/allProductsActions';
import { fetchUser, logoutUser } from './redux/user/userActions'; // Import logoutUser
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client'; // Import Socket.IO client

// Notification Actions
import {
    fetchNotifications,
    markNotificationAsRead,
    addRealtimeNotification,
    updateNotificationCount,
    clearAllNotifications,
    fetchUnreadNotificationCount,
    markNotificationReadSuccess // Import synchronous success action for direct state update
} from './redux/notifications/notificationActions';

import CouponComponent from './components/cart/CouponComponent';
import ProductCard from './components/productCard/ProductCard';
import CartComponent from './components/cart/CartComponent';
import ProductForm from './components/products/ProductForm';
import UserManagement from './components/userManagement/UserManagement';
import LoginComponent from './components/login/LoginComponent';
import OrderComponent from './components/orders/OrderManagementComponent';
import './app.css';
import './notification.css';

// Tailwind CSS CDN for quick demo. In a real project, integrate via PostCSS.
const TailwindCDN = () => (
    <script src="https://cdn.tailwindcss.com"></script>
);

const API_BASE_URL = 'http://localhost:9000'; // Your backend server base URL

function App() {
    const dispatch = useDispatch();

    const { products, loading: productsLoading, error: productsError } = useSelector(state => state.allProducts);
    const { token, currentUser, loading: userLoading, error: userError } = useSelector(state => state.user);
    const { notifications, unreadCount, loading: notificationsLoading, error: notificationsError } = useSelector(state => state.notifications);

    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const notificationRef = useRef(null);

    let currentUserId = null;
    let isAdmin = false;
    let username = null; // To store username for display

    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            currentUserId = decodedToken.userId;
            isAdmin = decodedToken.userId === 'admin';
            username = decodedToken.username || decodedToken.userId; // Assuming username is in JWT or default to userId
        } catch (e) {
            console.error("Error decoding token:", e);
            currentUserId = null;
            isAdmin = false;
            username = null;
        }
    }
    if (!currentUserId && currentUser) {
        currentUserId = currentUser.userId;
        username = currentUser.username || currentUser.userId;
    }

    const [activeSection, setActiveSection] = useState('products');
    const [socket, setSocket] = useState(null);

    // --- Socket.IO Connection and Event Listeners ---
    useEffect(() => {
        if (!currentUserId) {
            if (socket) {
                console.log('User logged out, disconnecting socket...');
                socket.disconnect();
                setSocket(null); // Clear socket state
            }
            return; // Only connect if a user ID is available
        }

        // Disconnect existing socket if it exists to avoid multiple connections
        if (socket && socket.connected) {
            socket.disconnect();
        }

        const newSocket = io(API_BASE_URL); // Connect to your backend

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server:', newSocket.id);
            newSocket.emit('setUserId', currentUserId);
        });

        newSocket.on('newNotification', (data) => {
            console.log('Received new notification via WebSocket:', data);
            dispatch(addRealtimeNotification(data));
            dispatch(fetchUnreadNotificationCount(currentUserId, token)); // Re-fetch count
        });

        newSocket.on('notificationCountUpdate', (data) => {
            console.log('Received notification count update from backend:', data.count);
            dispatch(updateNotificationCount(data.count));
        });

        newSocket.on('notificationRead', (data) => {
            console.log('Notification marked as read from backend trigger:', data.notificationId);
            dispatch(markNotificationReadSuccess(data.notificationId));
            dispatch(fetchUnreadNotificationCount(currentUserId, token)); // Re-fetch count to be safe
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err.message);
        });

        setSocket(newSocket);

        // Clean up on component unmount or currentUserId change
        return () => {
            if (newSocket) {
                newSocket.disconnect();
                console.log('Socket disconnected during cleanup.');
            }
        };
    }, [currentUserId, dispatch, token]);


    // Fetch initial notifications and count when user is available and token exists
    useEffect(() => {
        if (currentUserId && token) {
            dispatch(fetchNotifications(currentUserId, token));
        } else {
            dispatch(clearAllNotifications());
            dispatch(updateNotificationCount(0));
        }
    }, [currentUserId, token, dispatch]);


    useEffect(() => {
        if (activeSection === 'products') {
            dispatch(fetchAllProducts());
        }
    }, [dispatch, activeSection]);

    useEffect(() => {
        if (token && !currentUser && currentUserId) {
            dispatch(fetchUser(currentUserId, token));
        }
    }, [token, currentUser, currentUserId, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotificationDropdown && notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotificationDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotificationDropdown]);

    const handleNotificationClick = async (notificationId, notificationType, isRead) => {
        if (!isRead && token && currentUserId) {
            await dispatch(markNotificationAsRead(notificationId, token));
        }
        setShowNotificationDropdown(false);

        // Navigate based on notification type
        switch (notificationType) {
            case 'static_add_cart':
            case 'cart_item_added':
            case 'cart_item_removed':
            case 'cart_cleared':
                setActiveSection('cart');
                break;
            case 'static_onboarding':
            case 'static_add_product':
                setActiveSection('products');
                break;
            case 'static_review_cart':
                setActiveSection('cart');
                break;
            case 'static_make_payment':
                setActiveSection('ordersManagement');
                break;
            case 'static_assist_order':
            case 'order_cancelled':
            case 'order_reopened':
            case 'order_delivered':
            case 'order_reordered':
            case 'order_reviewed':
            case 'payment_success':
            case 'cart_checkout_complete':
                setActiveSection('ordersManagement');
                break;
            case 'newChatMessage':
                // Implement chat navigation if you have a chat section
                break;
            default:
                console.log(`No specific navigation for notification type: ${notificationType}`);
                break;
        }
    };

    const handleLogout = () => {
        dispatch(logoutUser()); // Dispatch the logout action
        setActiveSection('products'); // Optionally redirect to products or login page
        setShowNotificationDropdown(false); // Close dropdown on logout
    };

    const renderSection = () => {
        if (userLoading) {
            return (
                <section className="initial-load-message">
                    <p className="status-message loading">Loading user data...</p>
                </section>
            );
        }
        if (userError) {
            return (
                <section className="initial-load-message">
                    <p className="status-message error">Error loading user: {userError}. Please try logging in again.</p>
                </section>
            );
        }
        // IMPORTANT: LoginComponent is now always in the header.
        // This section should only display the "Please log in" message without a second LoginComponent.
        if (!token) {
            return (
                <section className="initial-load-message">
                    <p className="status-message info">Please log in to access the application features.</p>
                </section>
            );
        }

        switch (activeSection) {
            case 'coupons':
                return (
                    <section className="coupon-section">
                        <CouponComponent />
                    </section>
                );
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
                                    userId={currentUserId}
                                    authToken={token}
                                />
                            ))}
                        </div>
                    </section>
                );
            case 'cart':
                return (
                    <section className="cart-section">
                        <CartComponent
                            userId={currentUserId}
                            authToken={token}
                        />
                    </section>
                );
            case 'addProduct':
                return isAdmin ? (
                    <section className="add-product-section">
                        <ProductForm />
                    </section>
                ) : (
                    <section className="access-denied-message">
                        <p className="status-message error">Access Denied: You must be an administrator to add products.</p>
                    </section>
                );
            case 'userManagement':
                return isAdmin ? (
                    <section className="user-management-section">
                        <UserManagement />
                    </section>
                ) : (
                    <section className="access-denied-message">
                        <p className="status-message error">Access Denied: You must be an administrator to manage users.</p>
                    </section>
                );
            case 'ordersManagement':
                return (
                    <section className="orders-section">
                        <OrderComponent
                            userId={currentUserId}
                            authToken={token}
                        />
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="App">
            <TailwindCDN />
            <header className="App-header">
                <h1>My E-commerce App</h1>
                <nav className="main-nav">
                    <button onClick={() => setActiveSection('coupons')}
                            className={activeSection === 'coupons' ? 'active' : ''}>Coupons
                    </button>
                    <button onClick={() => setActiveSection('products')}
                            className={activeSection === 'products' ? 'active' : ''}>Products
                    </button>
                    <button onClick={() => setActiveSection('cart')}
                            className={activeSection === 'cart' ? 'active' : ''}>Cart
                    </button>
                    {isAdmin && (
                        <button onClick={() => setActiveSection('addProduct')}
                                className={activeSection === 'addProduct' ? 'active' : ''}>Add Product
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => setActiveSection('userManagement')}
                                className={activeSection === 'userManagement' ? 'active' : ''}>User Management
                        </button>
                    )}
                    <button onClick={() => setActiveSection('ordersManagement')}
                            className={activeSection === 'ordersManagement' ? 'active' : ''}>Order Management
                    </button>
                </nav>
                <div className="auth-area">
                    {/* Always render LoginComponent in the header */}
                    {!token && <LoginComponent />}

                    {/* Conditionally render welcome/logout/notifications when authenticated */}
                    {token && (
                        <>
                            <span className="welcome-message">Welcome, {username || 'User'}!</span>
                            <button onClick={handleLogout} className="logout-button">Logout</button>
                            {currentUserId && ( // Show notification icon only if user is logged in
                                <div className="notification-bell-container" ref={notificationRef}>
                                    <button
                                        className="notification-bell"
                                        onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                        aria-label={`You have ${unreadCount} new notifications`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.082 1.079 7.5 7.5 0 0 1-11.99 0 .75.75 0 0 1-.082-1.078A6.75 6.75 0 0 1 5.25 9.75V9Zm6 3a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm-3.75 0a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm7.5 0a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm-.45 9A8.962 8.962 0 0 1 12 21a8.962 8.962 0 0 1-6.75-3.09c.281.22.61.397.973.518A10.5 10.5 0 0 0 12 22.5c2.993 0 5.718-1.037 7.827-2.732.363-.121.692-.298.973-.518Z" clipRule="evenodd" />
                                        </svg>

                                        {unreadCount > 0 && (
                                            <span className="notification-badge">{unreadCount}</span>
                                        )}
                                    </button>

                                    {showNotificationDropdown && (
                                        <div className="notification-dropdown">
                                            {notificationsLoading ? (
                                                <div className="dropdown-message">Loading notifications...</div>
                                            ) : notificationsError ? (
                                                <div className="dropdown-message error-message">Error: {notificationsError}</div>
                                            ) : notifications.length === 0 ? (
                                                <div className="dropdown-message">No notifications.</div>
                                            ) : (
                                                <ul>
                                                    {notifications.map(notif => (
                                                        <li
                                                            key={notif._id}
                                                            className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                                                            onClick={() => handleNotificationClick(notif._id, notif.type, notif.read)}
                                                        >
                                                            <span className="notification-text">{notif.message}</span>
                                                            <span className="notification-date">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                        </li>
                                                    ))}
                                                    <li className="clear-all-notifications">
                                                        <button onClick={() => dispatch(clearAllNotifications())}>Clear All (Local)</button>
                                                    </li>
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </header>
            <main>
                {renderSection()}
            </main>
        </div>
    );
}

export default App;