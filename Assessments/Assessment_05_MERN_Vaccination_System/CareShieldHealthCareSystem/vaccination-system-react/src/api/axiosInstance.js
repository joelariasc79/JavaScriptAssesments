// Configured Axios instance
// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
    // IMPORTANT: Ensure this baseURL matches your backend's actual root URL
    // If your backend routes are like 'http://localhost:9100/auth/login', then baseURL: 'http://localhost:9100' is correct.
    // If your backend routes are like 'http://localhost:9100/api/auth/login', then baseURL: 'http://localhost:9100/api'
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9100',
    timeout: 10000, // 10 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration or 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access, e.g., redirect to login
            console.error('Unauthorized access. Please log in again.');
            // You might dispatch a logout action here (requires access to Redux store)
            // Example if you have access to the store:
            // import store from '../../store'; // Adjust path as needed
            // store.dispatch(logout()); // You would import logout from authSlice
            // window.location.href = '/login'; // Or use navigate hook if within a React component
        }
        return Promise.reject(error);
    }
);

// This 'authService' object was out of place in this file. It's now removed.
// The primary export of this file should just be the configured axios instance.

export default axiosInstance;