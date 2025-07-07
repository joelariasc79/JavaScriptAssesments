// components/about/AboutComponent.js
import React from 'react';

const AboutComponent = () => {
    return (
        <div className="about-container p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">About Our E-commerce App</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to our innovative e-commerce platform! We are dedicated to providing you with a seamless and enjoyable shopping experience, offering a wide array of high-quality products from various categories.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
                Our mission is to connect customers with the best products, ensuring satisfaction through easy navigation, secure transactions, and reliable delivery. We continuously strive to improve our services and expand our product offerings to meet your evolving needs.
            </p>
            <p className="text-gray-700 leading-relaxed">
                Thank you for choosing us for your online shopping needs. We hope you have a fantastic experience!
            </p>
        </div>
    );
};

export default AboutComponent;