// src/components/common/DashboardCard/DashboardCard.js
import React from 'react';
import './DashboardCard.css'; // Create this CSS file for styling the reusable card

const DashboardCard = ({ title, description, onClick }) => {
    return (
        <div className="dashboard-card" onClick={onClick}>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
};

export default DashboardCard;