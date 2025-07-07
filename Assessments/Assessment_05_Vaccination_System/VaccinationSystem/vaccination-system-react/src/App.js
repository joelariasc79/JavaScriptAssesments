// src/App.js
import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from './store/features/auth/authSelectors';
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter here

import AppRoutes from './routes/AppRoutes';
import Header from './components/layout/Header/Header';
import Footer from './components/layout/Footer/Footer';
import Sidebar from './components/layout/Sidebar/Sidebar';

const App = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);

    const shouldShowSidebar = () => {
        if (isAuthenticated && currentUser) {
            const rolesWithSidebar = ['ADMIN', 'HOSPITAL', 'PATIENT'];
            return rolesWithSidebar.includes(currentUser.role);
        }
        return false;
    };

    return (
        // Wrap your entire application structure with BrowserRouter
        <Router>
            <div className="app-container">
                {/* Header, Sidebar, Main Content (with AppRoutes), and Footer are now all within the Router context */}
                <Header />

                <div className="content-wrapper" style={{ display: 'flex', flexGrow: 1 }}>
                    {shouldShowSidebar() && <Sidebar />}
                    <main className="app-main-content" style={{ flexGrow: 1 }}>
                        <AppRoutes /> {/* AppRoutes now only contains <Routes> */}
                    </main>
                </div>

                <Footer />
            </div>
        </Router>
    );
};

export default App;