import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import {
//     fetchUser,
//     createUser,
//     clearUserStatus
// } from '../../redux/patient/userActions';

import {
    fetchUser,
    createUser,
    clearUserStatus
} from '../../redux/user/userActions';
import './UserManagement.css'; // Add some basic styling

const UserManagement = () => {
    const dispatch = useDispatch();
    // Keep token here as it's needed for handleFetchUser
    const { currentUser, token, loading, error, successMessage } = useSelector(state => state.user);

    const [fetchId, setFetchId] = useState('');
    const [newUserData, setNewUserData] = useState({
        userId: '',
        username: '',
        email: '',
        password: '', // Password for registration
        address: { // Nested address object
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
        }
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (successMessage || error) {
                dispatch(clearUserStatus());
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [successMessage, error, dispatch]);


    const handleFetchUser = () => {
        if (!token) { // Check if token exists before fetching protected data
            alert('Please log in to fetch patient details.');
            return;
        }
        if (fetchId) {
            dispatch(fetchUser(fetchId, token)); // Pass token to fetchUser action
        } else {
            alert('Please enter a User ID to fetch.');
        }
    };

    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value,
            }
        }));
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        if (!newUserData.userId || !newUserData.username || !newUserData.email || !newUserData.password ||
            !newUserData.address.street || !newUserData.address.city ||
            !newUserData.address.state || !newUserData.address.zipCode ||
            !newUserData.address.country) {
            alert('Please fill in all required patient details, password, and address fields.');
            return;
        }
        dispatch(createUser(newUserData));
        setNewUserData({
            userId: '',
            username: '',
            email: '',
            password: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
            }
        });
    };

    return (
        <div className="user-management-container">
            <h2>User Management</h2>

            {/* Display loading, error, success messages here as they are global to patient state */}
            {loading && <p className="status-message loading">Loading...</p>}
            {error && <p className="status-message error">Error: {error}</p>}
            {successMessage && <p className="status-message success">{successMessage}</p>}

            {/* Login Section - Now handled by LoginComponent */}


            {/* Fetch User Section */}
            <div className="section">
                <h3>Fetch User by ID (Requires Login)</h3>
                <input
                    type="text"
                    placeholder="Enter User ID (e.g., joeD137)"
                    value={fetchId}
                    onChange={(e) => setFetchId(e.target.value)}
                />
                <button onClick={handleFetchUser} disabled={!token}>Fetch User</button>

                {currentUser && (
                    <div className="user-details">
                        <h4>Current User Details:</h4>
                        <p><strong>ID:</strong> {currentUser.userId}</p>
                        <p><strong>Username:</strong> {currentUser.username}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                        {currentUser.address && (
                            <div className="user-address-details">
                                <strong>Address:</strong>
                                <p>{currentUser.address.street}</p>
                                <p>{currentUser.address.city}, {currentUser.address.state} {currentUser.address.zipCode}</p>
                                <p>{currentUser.address.country}</p>
                            </div>
                        )}
                        {!currentUser.address && <p><strong>Address:</strong> N/A</p>}
                    </div>
                )}
            </div>

            {/* Create New User Section */}
            <div className="section">
                <h3>Register New User</h3>
                <form onSubmit={handleCreateUser} className="create-user-form">
                    <div className="form-group">
                        <label htmlFor="newUserId">User ID:</label>
                        <input
                            type="text"
                            id="newUserId"
                            name="userId"
                            value={newUserData.userId}
                            onChange={handleNewUserChange}
                            placeholder="e.g., newuser456"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newUsername">Username:</label>
                        <input
                            type="text"
                            id="newUsername"
                            name="username"
                            value={newUserData.username}
                            onChange={handleNewUserChange}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newEmail">Email:</label>
                        <input
                            type="email"
                            id="newEmail"
                            name="email"
                            value={newUserData.email}
                            onChange={handleNewUserChange}
                            placeholder="john.doe@example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="password"
                            value={newUserData.password}
                            onChange={handleNewUserChange}
                            placeholder="********"
                            required
                        />
                    </div>

                    {/* Address Fields */}
                    <h4>Address Details:</h4>
                    <div className="form-group">
                        <label htmlFor="street">Street:</label>
                        <input
                            type="text"
                            id="street"
                            name="street"
                            value={newUserData.address.street}
                            onChange={handleAddressChange}
                            placeholder="123 Main St"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="city">City:</label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            value={newUserData.address.city}
                            onChange={handleAddressChange}
                            placeholder="Anytown"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="state">State:</label>
                        <input
                            type="text"
                            id="state"
                            name="state"
                            value={newUserData.address.state}
                            onChange={handleAddressChange}
                            placeholder="CA"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="zipCode">Zip Code:</label>
                        <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            value={newUserData.address.zipCode}
                            onChange={handleAddressChange}
                            placeholder="90210"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country">Country:</label>
                        <input
                            type="text"
                            id="country"
                            name="country"
                            value={newUserData.address.country}
                            onChange={handleAddressChange}
                            placeholder="US"
                            required
                        />
                    </div>

                    <button type="submit">Register User</button>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;