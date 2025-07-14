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

                {/*<DashboardCard*/}
                {/*    title="Approve Vaccinations"*/}
                {/*    description="Review and approve patient vaccination requests for your hospital."*/}
                {/*    onClick={() => handleNavigation('/hospital/orders/create')}*/}
                {/*/>*/}

                {/* UPDATED DashboardCard for Approve Vaccination Orders */}
                <DashboardCard
                    title="Approve Vaccination Orders" // Changed title
                    description="Review and approve patient vaccination requests for your hospital." // Changed description
                    onClick={() => handleNavigation('/hospital/orders/pending-approval')} // Changed navigation path
                />

                {/* Keep Create Vaccination Order if Hospital Staff can still create orders for patients,
                    but based on previous discussion, the patient now creates their own.
                    If hospital staff should *also* be able to create orders, you would keep this,
                    but the previous `CreateVaccinationOrderPage` might be renamed to
                    `HospitalCreateVaccinationOrderPage` to avoid confusion with `PatientCreateVaccinationOrderPage`.
                    For now, I'm assuming the 'Create' card is removed from hospital dashboard,
                    as patients create their own, and staff 'approve'.
                    If hospital staff still needs a dedicated "Create Order" feature for *any* patient,
                    you'd need to create a new page for that.
                */}
                {/* <DashboardCard
                    title="Create Vaccination Order (Staff)" // Example if staff still needs to create
                    description="Initiate a new vaccination order for a patient."
                    onClick={() => handleNavigation('/hospital/orders/create-for-patient')} // New distinct path
                /> */}

                {/*<DashboardCard*/}
                {/*    title="Create Vaccination Order" // Updated title*/}
                {/*    description="Initiate a new vaccination order for a patient: approve patient vaccination" // Updated description*/}
                {/*    onClick={() => handleNavigation('/hospital/orders/create')}*/}
                {/*/>*/}

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
