// For Admin/Hospital dashboard
// components/layout/Sidebar/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

const Sidebar = () => {
    const currentUser = useSelector(selectCurrentUser);

    // Determine sidebar links based on user role
    const getSidebarLinks = () => {
        if (!currentUser) {
            return [];
        }

        switch (currentUser.role) {
            case 'ADMIN':
                return [
                    { path: '/admin', label: 'Admin Dashboard' },
                    { path: '/admin/hospitals', label: 'Manage Hospitals' },
                    { path: '/admin/vaccines/register', label: 'Register Vaccine' },
                    { path: '/reports', label: 'View Reports' },
                ];
            case 'HOSPITAL':
                return [
                    { path: '/admin', label: 'Hospital Dashboard' },
                    { path: '/admin/vaccines/stock', label: 'Update Vaccine Stock' },
                    { path: '/admin/patients/approve', label: 'Approve Vaccines' },
                    { path: '/admin/vaccinated-list', label: 'Vaccinated Persons' },
                ];
            case 'PATIENT':
                return [
                    { path: '/patient/dashboard', label: 'Patient Dashboard' },
                    { path: '/patient/register', label: 'Register Patient' },
                    { path: '/patient/schedule', label: 'Schedule Appointment' },
                    { path: '/patient/payment', label: 'Make Payment' },
                ];
            default:
                return [];
        }
    };

    const sidebarLinks = getSidebarLinks();

    if (sidebarLinks.length === 0) {
        return null; // Don't render sidebar if no links are applicable
    }

    return (
        <aside className="sidebar">
            <nav>
                <ul className="sidebar-nav-list">
                    {sidebarLinks.map((link) => (
                        <li key={link.path} className="sidebar-nav-item">
                            <Link to={link.path} className="sidebar-nav-link">
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;