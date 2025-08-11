// components/layout/Footer/Footer.js
import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <p>&copy; {new Date().getFullYear()} Government Vaccination System. All rights reserved.</p>
            <div className="footer-links">
                <a href="/privacy" className="footer-link">Privacy Policy</a>
                <a href="/terms" className="footer-link">Terms of Service</a>
                <a href="/contact" className="footer-link">Contact Us</a>
            </div>
        </footer>
    );
};

export default Footer;