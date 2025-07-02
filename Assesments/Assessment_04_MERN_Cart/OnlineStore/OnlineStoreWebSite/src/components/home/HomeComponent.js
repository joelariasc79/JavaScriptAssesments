// components/home/HomeComponent.js
import React from 'react';
import { useSelector } from 'react-redux';

const HomeComponent = () => {
    const { currentUser } = useSelector(state => state.user);
    const username = currentUser?.username || currentUser?.userId || 'Guest';

    return (
        <div className="home-container">
            <h2 className="text-3xl font-bold mb-4">Welcome to My E-commerce App!</h2>
            <p className="text-lg mb-2">Hello, <span className="font-semibold text-blue-600">{username}</span>!</p>
            <p className="text-md text-gray-700">
                Explore our wide range of products, manage your cart, track your orders, and much more.
            </p>
            <p className="text-md text-gray-700 mt-2">
                Use the navigation bar above to get started.
            </p>
        </div>
    );
};

export default HomeComponent;