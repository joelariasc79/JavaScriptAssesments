// components/logout/LogoutComponent.js
import React from 'react';

const LogoutComponent = () => {
    return (
        <div className="logout-container p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Logout Status</h2>
            <p className="text-green-600 text-xl font-semibold">You have been logged out successfully!</p>
            <p className="text-gray-600 mt-2">Thank you for visiting. Please log in again to continue shopping.</p>
        </div>
    );
};

export default LogoutComponent;