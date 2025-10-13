// src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchUser,
    createUser,
    clearUserStatus
} from '../redux/user/userActions';
import './UserManagement.css'; // Add some basic styling

const UserManagement = () => {
    const dispatch = useDispatch();
    const { currentUser, loading, error, successMessage } = useSelector(state => state.user);

    const [fetchId, setFetchId] = useState('');
    const [newUserData, setNewUserData] = useState({
        userId: '',
        username: '',
        email: '',
        address: { // Nested address object
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
        }
    });

    useEffect(() => {
        // Clear status messages when component mounts or unmounts, or after a certain time
        const timer = setTimeout(() => {
            if (successMessage || error) {
                dispatch(clearUserStatus());
            }
        }, 5000); // Clear after 5 seconds

        return () => clearTimeout(timer);
    }, [successMessage, error, dispatch]);


    const handleFetchUser = () => {
        if (fetchId) {
            dispatch(fetchUser(fetchId));
        } else {
            alert('Please enter a User ID to fetch.');
        }
    };

    // Handler for top-level patient data fields
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for nested address fields
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
        e.preventDefault(); // Prevent default form submission
        // Basic validation (can be more robust)
        if (!newUserData.userId || !newUserData.username || !newUserData.email ||
            !newUserData.address.street || !newUserData.address.city ||
            !newUserData.address.state || !newUserData.address.zipCode ||
            !newUserData.address.country) {
            alert('Please fill in all required patient details and address fields.');
            return;
        }
        dispatch(createUser(newUserData));
        // Optionally clear the form after submission
        setNewUserData({
            userId: '',
            username: '',
            email: '',
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

            {loading && <p className="status-message loading">Loading...</p>}
            {error && <p className="status-message error">Error: {error}</p>}
            {successMessage && <p className="status-message success">{successMessage}</p>}

            <div className="section">
                <h3>Fetch User by ID</h3>
                <input
                    type="text"
                    placeholder="Enter User ID (e.g., joeD137)"
                    value={fetchId}
                    onChange={(e) => setFetchId(e.target.value)}
                />
                <button onClick={handleFetchUser}>Fetch User</button>

                {currentUser && (
                    <div className="user-details">
                        <h4>Current User:</h4>
                        <p><strong>ID:</strong> {currentUser.userId}</p>
                        <p><strong>Username:</strong> {currentUser.username}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                        {/* Displaying nested address */}
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

            <div className="section">
                <h3>Create New User</h3>
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

                    <button type="submit">Create User</button>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;