// src/pages/Hospital/HospitalVaccinatedList/HospitalVaccinatedList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchVaccinatedPersonsByHospital,
    clearFetchVaccinatedPersonsStatus
} from '../../../store/features/vaccinationOrder/vaccinationOrderSlice';
import {
    selectVaccinatedPersons,
    selectFetchVaccinatedPersonsStatus,
    selectFetchVaccinatedPersonsError
} from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

import './HospitalVaccinatedListPage.css'; // Assuming you'll create this CSS file

const HospitalVaccinatedListPage = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser); // Get current user to access hospitalId

    const vaccinatedPersons = useSelector(selectVaccinatedPersons);
    const fetchStatus = useSelector(selectFetchVaccinatedPersonsStatus);
    const fetchError = useSelector(selectFetchVaccinatedPersonsError);

    // Get the hospitalId from the logged-in user
    const hospitalId = currentUser?.hospital?._id;
    const userRole = currentUser?.role;

    useEffect(() => {
        // Fetch vaccinated persons only if the user is hospital staff or admin and has a hospitalId
        if (hospitalId && (userRole === 'hospital_staff' || userRole === 'admin')) {
            dispatch(fetchVaccinatedPersonsByHospital(hospitalId));
        }

        // Cleanup function to clear status when component unmounts
        return () => {
            dispatch(clearFetchVaccinatedPersonsStatus());
        };
    }, [dispatch, hospitalId, userRole]); // Re-run effect if hospitalId or userRole changes

    if (!hospitalId) {
        return <div className="info-message">Please log in as hospital staff or admin associated with a hospital to view this page.</div>;
    }

    if (fetchStatus === 'loading') {
        return <div className="loading-message">Loading vaccinated persons data...</div>;
    }

    if (fetchError) {
        return <div className="error-message">Error fetching vaccinated persons: {fetchError}</div>;
    }

    return (
        <div className="vaccinated-list-container">
            <h2>Vaccinated Persons at {currentUser?.hospital?.name || 'Your Hospital'}</h2>

            {vaccinatedPersons.length === 0 ? (
                <p>No vaccination records found for this hospital yet.</p>
            ) : (
                <div className="table-responsive">
                    <table className="vaccinated-table">
                        <thead>
                        <tr>
                            <th>Patient Name</th>
                            <th>Email</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Contact</th>
                            <th>Address</th>
                            <th>Vaccine</th>
                            <th>Dose</th>
                            <th>Vaccination Date</th>
                            <th>Administered By</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vaccinatedPersons.map((record) => (
                            <tr key={record._id}>
                                <td>{record.userId?.name || 'N/A'}</td>
                                <td>{record.userId?.email || 'N/A'}</td>
                                <td>{record.userId?.age || 'N/A'}</td>
                                <td>{record.userId?.gender || 'N/A'}</td>
                                <td>{record.userId?.contact_number || 'N/A'}</td>
                                <td>
                                    {record.userId?.address ?
                                        `${record.userId.address.street}, ${record.userId.address.city}, ${record.userId.address.state}, ${record.userId.address.zipCode}`
                                        : 'N/A'}
                                </td>
                                <td>{record.vaccineId?.name || 'N/A'} ({record.vaccineId?.type || 'N/A'})</td>
                                <td>{record.dose_number}</td>
                                <td>{new Date(record.vaccination_date).toLocaleDateString()}</td>
                                <td>{record.administeredBy?.name || 'Self-recorded / N/A'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HospitalVaccinatedListPage;