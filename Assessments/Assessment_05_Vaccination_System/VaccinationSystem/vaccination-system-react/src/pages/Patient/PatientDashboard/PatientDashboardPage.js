// src/pages/Patient/PatientDashboard/PatientDashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

import DashboardCard from '../../../components/common/DashboardCard/DashboardCard';
import './PatientDashboardPage.css'; // Make sure to create this CSS file

const PatientDashboardPage = () => {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="patient-dashboard-container">
            <h2>Patient Dashboard</h2>
            {currentUser && (
                <p>
                    <strong>Welcome, {currentUser.name || currentUser.username}!</strong>
                </p>
            )}

            <div className="dashboard-grid">

                <DashboardCard
                    title="Create A Vaccination Order"
                    description="Request a new vaccination for yourself or a dependent."
                    onClick={() => handleNavigation('/patient/orders/create')}
                    // You'll need to create a component for this page
                    // Example: <CreatePatientVaccinationOrderPage />
                />

                <DashboardCard
                    title="Review Vaccination Orders"
                    description="View the status of your pending and completed vaccination requests."
                    onClick={() => handleNavigation('/patient/orders/review')}
                    // You'll need to create a component for this page
                    // Example: <ReviewPatientOrdersPage />
                />

                <DashboardCard
                    title="Schedule an Appointment"
                    description="Book an appointment for your approved vaccination orders."
                    onClick={() => handleNavigation('/patient/appointments/schedule')}
                    // You'll need to create a component for this page
                    // Example: <ScheduleAppointmentPage />
                />

                <DashboardCard
                    title="View Approved Appointments"
                    description="See details of your scheduled and approved vaccination appointments."
                    onClick={() => handleNavigation('/patient/appointments/view')}
                    // You'll need to create a component for this page
                    // Example: <ViewApprovedAppointmentsPage />
                />

                {/* Add more DashboardCard components as needed for patient features */}
            </div>
        </div>
    );
};

export default PatientDashboardPage;