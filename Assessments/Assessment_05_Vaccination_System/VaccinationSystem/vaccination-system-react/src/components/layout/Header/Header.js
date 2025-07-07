// components/layout/Header/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../../../store/features/auth/authSelectors';
import { logout } from '../../../store/features/auth/authSlice';

const Header = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
        // Redirect to login page after logout, if not handled by PrivateRoute
        // window.location.href = '/login';
    };

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="app-logo">
                    {isAuthenticated ? "Vaccination System Dashboard" : "Vaccination System"}
                </Link>
            </div>
            <nav className="header-nav">
                {isAuthenticated ? (
                    <>
                        <span className="welcome-message">Welcome, {currentUser ? currentUser.username : 'User'}!</span>
                        {/* Example navigation based on user role or general access */}
                        {currentUser && currentUser.role === 'ADMIN' && (
                            <Link to="/admin/hospitals" className="nav-link">Admin: Hospitals</Link>
                        )}
                        {/* Note: Based on your AppRoutes.js, HospitalDashboard is at /hospital, not /admin */}
                        {currentUser && currentUser.role === 'HOSPITAL_STAFF' && ( // Assuming role is HOSPITAL_STAFF
                            <Link to="/hospital" className="nav-link">Hospital Dashboard</Link>
                        )}
                        {currentUser && currentUser.role === 'PATIENT' && (
                            <Link to="/patient/dashboard" className="nav-link">Patient Dashboard</Link>
                        )}
                        {/* You mentioned HospitalListPage is for admin, but its route was /hospital/hospitals.
                            If an admin is supposed to see it from the header, the path and role need to match.
                            Adjust the path and role check below as per your final routing logic. */}
                        {currentUser && currentUser.role === 'ADMIN' && (
                            <Link to="/admin/hospitals" className="nav-link">Admin: Hospitals</Link>
                        )}

                        {/* <Link to="/watchlist" className="nav-link">Watchlist</Link> */} {/* Currently commented out in AppRoutes */}
                        <button onClick={handleLogout} className="nav-link logout-button">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="nav-link">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;