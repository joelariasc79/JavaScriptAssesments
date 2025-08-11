// src/pages/Hospital/VaccinationDashboardPage/VaccinationDashboardPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchAllVaccines,
    deleteVaccine,
    clearDeleteStatus, // For clearing delete success/error messages
    clearFetchStatus,  // For clearing fetch status if needed on unmount
} from '../../../../store/features/vaccines/vaccineSlice';
import {
    selectAllVaccines,
    selectFetchVaccinesStatus,
    selectFetchVaccinesError,
    selectDeleteVaccineStatus,
    selectDeleteVaccineError,
} from '../../../../store/features/vaccines/vaccineSelectors';

import Button from '../../../../components/common/Button/Button';
import './VaccinationDashboardPage.css'; // You'll create this CSS file for styling

const VaccinationDashboardPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const vaccines = useSelector(selectAllVaccines);
    const fetchStatus = useSelector(selectFetchVaccinesStatus);
    const fetchError = useSelector(selectFetchVaccinesError);
    const deleteStatus = useSelector(selectDeleteVaccineStatus);
    const deleteError = useSelector(selectDeleteVaccineError);

    useEffect(() => {
        // Fetch all vaccines when the component mounts
        dispatch(fetchAllVaccines());

        // Cleanup function
        return () => {
            dispatch(clearFetchStatus());
            dispatch(clearDeleteStatus());
        };
    }, [dispatch]);

    // Handle delete success/failure
    useEffect(() => {
        if (deleteStatus === 'succeeded') {
            alert('Vaccine deleted successfully!');
            dispatch(clearDeleteStatus());
            dispatch(fetchAllVaccines()); // Refresh the list after deletion
        } else if (deleteStatus === 'failed') {
            alert(`Error deleting vaccine: ${deleteError}`);
            dispatch(clearDeleteStatus());
        }
    }, [deleteStatus, deleteError, dispatch]);

    const handleCreateNewVaccine = () => {
        navigate('/hospital/vaccines/register');
    };

    const handleUpdateVaccine = (vaccineId) => {
        navigate(`/hospital/vaccines/register/${vaccineId}`);
    };

    const handleDeleteVaccine = (vaccineId, vaccineName) => {
        if (window.confirm(`Are you sure you want to delete vaccine: ${vaccineName}?`)) {
            dispatch(deleteVaccine(vaccineId));
        }
    };

    if (fetchStatus === 'loading') {
        return <div className="loading-message">Loading vaccines...</div>;
    }

    if (fetchError) {
        return <div className="error-message">Error loading vaccines: {fetchError}</div>;
    }

    return (
        <div className="manage-vaccines-container">
            <h2>Manage Vaccine Types</h2>

            <div className="actions-section">
                <Button onClick={handleCreateNewVaccine} variant="primary">
                    Register New Vaccine
                </Button>
            </div>

            {vaccines.length === 0 ? (
                <p>No vaccines registered yet. Click "Register New Vaccine" to add one.</p>
            ) : (
                <div className="vaccines-list">
                    <table>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Manufacturer</th>
                            <th>Type</th>
                            <th>Price</th>
                            <th>Doses Required</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vaccines.map((vaccine) => (
                            <tr key={vaccine._id}>
                                <td>{vaccine.name}</td>
                                <td>{vaccine.manufacturer}</td>
                                <td>{vaccine.type}</td>
                                <td>${vaccine.price ? vaccine.price.toFixed(2) : 'N/A'}</td>
                                <td>{vaccine.doses_required}</td>
                                <td>
                                    <Button
                                        onClick={() => handleUpdateVaccine(vaccine._id)}
                                        variant="secondary"
                                        className="action-button update-button"
                                    >
                                        Update
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteVaccine(vaccine._id, vaccine.name)}
                                        variant="danger"
                                        className="action-button delete-button"
                                        disabled={deleteStatus === 'loading'}
                                    >
                                        {deleteStatus === 'loading' ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VaccinationDashboardPage;