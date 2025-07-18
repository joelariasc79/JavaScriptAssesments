/* src/pages/Hospital/HospitalDashboard/HospitalDashboard.js */ // Corrected path in comment
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

import DashboardCard from '../../../components/common/DashboardCard/DashboardCard';
import WatchlistDisplayPage from '../../Watchlist/WatchlistDisplayPage'; // Import the WatchlistDisplayPage
import './HospitalDashboard.css';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="hospital-dashboard-container">
            <div className="dashboard-watchlist-banner">
                <WatchlistDisplayPage/>
            </div>
            <h2>Hospital Dashboard</h2>
            {currentUser && (
                <p>
                    <strong>Welcome, {currentUser.name}</strong>
                </p>
            )}

            {/*<div className="dashboard-watchlist-banner">*/}
            {/*    <WatchlistDisplayPage />*/}
            {/*</div>*/}

            <div className="dashboard-grid">

                <DashboardCard
                    title="List of Hospitals"
                    description="List of Hospitals."
                    onClick={() => handleNavigation('/hospital/hospitals')}
                />

                <DashboardCard
                    title="Register New Vaccine Type"
                    description="Add new vaccine types available at your hospital (if allowed)."
                    onClick={() => handleNavigation('/hospital/vaccines/register')}
                />

                <DashboardCard
                    title="Update Vaccine Stock"
                    description="Adjust vaccine quantities for your hospital."
                    onClick={() => handleNavigation('/hospital/vaccines/stock')}
                />

                <DashboardCard
                    title="Approve Vaccination Orders"
                    description="Review and approve patient vaccination requests for your hospital."
                    onClick={() => handleNavigation('/hospital/orders/pending-approval')}
                />

                <DashboardCard
                    title="View Vaccinated List"
                    description="See a list of vaccinated individuals at your hospital."
                    onClick={() => handleNavigation('/hospital/vaccinated-list')}
                />

                <DashboardCard
                    title="View Reports"
                    description="Access various reports on patient demographics and vaccination data."
                    onClick={() => handleNavigation('/reports')}
                />
            </div>
        </div>
    );
};

export default HospitalDashboard;
