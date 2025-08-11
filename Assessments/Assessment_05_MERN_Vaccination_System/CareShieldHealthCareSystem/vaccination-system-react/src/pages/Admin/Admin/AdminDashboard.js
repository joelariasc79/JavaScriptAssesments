import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Assuming you might want to display user info
import { selectCurrentUser } from '../../../store/features/auth/authSelectors'; // Assuming you have this selector

import './AdminDashboard.css'; // Create this CSS file for styling

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser); // Get current user details

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="admin-dashboard-container">
            <h2>Admin Dashboard</h2>
            {currentUser && <p>Welcome, {currentUser.username} ({currentUser.role})</p>}

            <div className="dashboard-grid">
                <div className="dashboard-card" onClick={() => handleNavigation('/admin/hospitals')}>
                    <h3>Manage Hospitals</h3>
                    <p>View, add, and update hospital information.</p>
                </div>

                <div className="dashboard-card" onClick={() => handleNavigation('/admin/vaccines/register')}>
                    <h3>Register New Vaccine</h3>
                    <p>Add new vaccine types to the system.</p>
                </div>

                <div className="dashboard-card" onClick={() => handleNavigation('/admin/vaccines/stock')}>
                    <h3>Update Vaccine Stock</h3>
                    <p>Adjust vaccine quantities for hospitals.</p>
                </div>

                <div className="dashboard-card" onClick={() => handleNavigation('/admin/patients/approve')}>
                    <h3>Approve Vaccinations</h3>
                    <p>Review and approve patient vaccination requests.</p>
                </div>

                <div className="dashboard-card" onClick={() => handleNavigation('/admin/vaccinated-list')}>
                    <h3>View Vaccinated List</h3>
                    <p>See a list of vaccinated individuals per hospital.</p>
                </div>

                {/* Add more cards for other admin functionalities as they are developed */}
            </div>
        </div>
    );
};

export default AdminDashboard;