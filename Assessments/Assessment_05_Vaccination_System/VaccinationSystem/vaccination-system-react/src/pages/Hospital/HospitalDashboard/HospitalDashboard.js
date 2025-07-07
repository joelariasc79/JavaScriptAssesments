/* src/pages/Hospital/HospitalDashboard.js */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

import DashboardCard from '../../../components/common/DashboardCard/DashboardCard';
import './HospitalDashboard.css';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="hospital-dashboard-container">
            <h2>Hospital Dashboard</h2>
            {currentUser && (
                <p>
                    <strong>Welcome, {currentUser.name}</strong> {/* Changed from currentUser.username to currentUser.name */}
                </p>
            )}

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
                    title="Approve Vaccinations"
                    description="Review and approve patient vaccination requests for your hospital."
                    onClick={() => handleNavigation('/hospital/patients/approve')}
                />

                <DashboardCard
                    title="View Vaccinated List"
                    description="See a list of vaccinated individuals at your hospital."
                    onClick={() => handleNavigation('/hospital/vaccinated-list')}
                />

                {/* Add more DashboardCard components as needed */}
            </div>
        </div>
    );
};

export default HospitalDashboard;
