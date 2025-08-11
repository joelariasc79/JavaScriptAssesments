// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Using createRoot for React 18+
import { Provider } from 'react-redux'; // Import Provider from react-redux
import { store } from './store'; // Import your Redux store
import App from './App'; // Import the main App component
import './styles/index.css'; // Import global styles

// Create a root to render your React application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component wrapped with the Redux Provider
// The Provider makes the Redux store available to all connected components
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);