// src/pages/Admin/HospitalList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHospitals } from '../../store/features/hospitals/hospitalSlice';
import {
    selectHospitals,
    selectHospitalsLoading,
    selectHospitalsError
} from '../../store/features/hospitals/hospitalSelectors';

import Table from '../../components/common/Table/Table'; // Reusing your Table component
import Button from '../../components/common/Button/Button'; // Assuming you might need a button (e.g., for "Add Hospital")
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
        // Add more columns as needed, e.g., for actions like 'Edit', 'Delete'
        {
            header: 'Actions',
            accessor: (row) => (
                <div className="hospital-actions">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => console.log('Edit hospital:', row._id)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="small"
                        onClick={() => console.log('Delete hospital:', row._id)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
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
            <div className="actions-bar">
                <Button variant="primary" onClick={() => console.log('Navigate to Add Hospital')}>
                    Add New Hospital
                </Button>
            </div>
            <Table data={hospitals} columns={columns} />
        </div>
    );
};

export default HospitalListPage;