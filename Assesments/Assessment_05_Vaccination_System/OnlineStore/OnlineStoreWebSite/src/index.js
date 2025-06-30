// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './app.css'; // Your global CSS
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store'; // Import your Redux store

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);