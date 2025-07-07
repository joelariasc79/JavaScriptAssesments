// src/pages/Admin/HospitalListPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHospitals } from '../../../store/features/hospitals/hospitalSlice';
import {
    selectHospitals,
    selectHospitalsLoading,
    selectHospitalsError
} from '../../../store/features/hospitals/hospitalSelectors';

import Table from '../../../components/common/Table/Table'; // Reusing your Table component
// Button import is no longer needed if no buttons are used on this page
// import Button from '../../components/common/Button/Button';
import './HospitalListPage.css'; // Create this CSS file for specific page styling

const HospitalListPage = () => {
    const dispatch = useDispatch();
    const hospitals = useSelector(selectHospitals);
    const loading = useSelector(selectHospitalsLoading);
    const error = useSelector(selectHospitalsError);

    useEffect(() => {
        dispatch(fetchHospitals());
    }, [dispatch]);

    // Define table columns
    const columns = [
        { header: 'Name', accessor: 'name' },
        {
            header: 'Address',
            accessor: (row) => `${row.address.street}, ${row.address.city}, ${row.address.state} ${row.address.zipCode}`
        },
        { header: 'Type', accessor: 'type' },
        { header: 'Contact', accessor: 'contact_number' },
        { header: 'Charges ($)', accessor: 'charges' },
        // The 'Actions' column has been removed as per your request
    ];

    if (loading) {
        return <div className="hospital-list-container">Loading hospitals...</div>;
    }

    if (error) {
        return <div className="hospital-list-container error-message">Error: {error}</div>;
    }

    return (
        <div className="hospital-list-container">
            <h2>Hospital List</h2>
            {/* The 'actions-bar' div and its content have been removed */}
            <Table data={hospitals} columns={columns} />
        </div>
    );
};

export default HospitalListPage;