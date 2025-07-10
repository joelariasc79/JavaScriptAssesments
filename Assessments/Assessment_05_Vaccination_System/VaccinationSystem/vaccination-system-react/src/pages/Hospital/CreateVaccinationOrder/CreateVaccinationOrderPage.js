// src/pages/Hospital/CreateVaccinationOrderPage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    createVaccinationOrder,
    clearCreateStatus
} from '../../../store/features/vaccinationOrder/vaccinationOrderSlice';
import {
    selectCreateOrderStatus,
    selectCreateOrderError
} from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors'; // To get hospital ID

import { fetchAllVaccines } from '../../../store/features/vaccines/vaccineSlice'; // Thunk/action from slice
import { selectAllVaccines } from '../../../store/features/vaccines/vaccineSelectors'; // Selector from selectors file

import { fetchAllUsers } from '../../../store/features/users/usersSlice'; // Thunk/action from slice
import { selectAllPatients } from '../../../store/features/users/usersSelectors'; // Selector from usersSelectors file

import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import './CreateVaccinationOrderPage.css'; // Create this CSS file for styling

const CreateVaccinationOrderPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const currentUser = useSelector(selectCurrentUser);
    const allVaccines = useSelector(selectAllVaccines);
    const allPatients = useSelector(selectAllPatients); // This will filter users with role 'patient'
    const createOrderStatus = useSelector(selectCreateOrderStatus);
    const createOrderError = useSelector(selectCreateOrderError);

    // State for form fields
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedVaccineId, setSelectedVaccineId] = useState('');
    const [doseNumber, setDoseNumber] = useState('');
    const [chargeToBePaid, setChargeToBePaid] = useState(''); // This will be calculated automatically
    const [formError, setFormError] = useState('');

    const hospitalId = currentUser?.hospital?._id; // Get hospital ID from the logged-in user

    // Fetch necessary data on component mount
    useEffect(() => {
        dispatch(fetchAllVaccines());
        dispatch(fetchAllUsers()); // Fetch all users to select patients from
    }, [dispatch]);

    // Handle order creation status
    useEffect(() => {
        if (createOrderStatus === 'succeeded') {
            alert('Vaccination order created successfully!');
            dispatch(clearCreateStatus());
            // Clear form fields
            setSelectedPatientId('');
            setSelectedVaccineId('');
            setDoseNumber('');
            setChargeToBePaid(''); // Reset calculated charge
            setFormError('');
            // Redirect to the hospital PatientDashboard after creation
            navigate('/hospital'); // Changed navigation target here
        } else if (createOrderStatus === 'failed') {
            setFormError(createOrderError || 'Failed to create vaccination order. Please try again.');
        }
    }, [createOrderStatus, createOrderError, dispatch, navigate]);

    // NEW: Calculate chargeToBePaid based on selected vaccine and hospital charges
    useEffect(() => {
        if (selectedVaccineId && currentUser?.hospital?.charges !== undefined) {
            const vaccine = allVaccines.find(v => v._id === selectedVaccineId);
            if (vaccine) {
                const vaccinePrice = vaccine.price || 0; // Default to 0 if price is not set
                const hospitalCharges = currentUser.hospital.charges || 0; // Default to 0 if charges are not set

                const calculatedCharge = vaccinePrice + hospitalCharges;
                setChargeToBePaid(calculatedCharge.toFixed(2)); // Format to 2 decimal places
            } else {
                setChargeToBePaid(''); // Clear if vaccine not found (e.g., initial state)
            }
        } else {
            setChargeToBePaid(''); // Clear if no vaccine selected or hospital info unavailable
        }
    }, [selectedVaccineId, allVaccines, currentUser?.hospital?.charges]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous errors

        if (!hospitalId) {
            setFormError('Hospital information not found for the current user.');
            return;
        }
        // Removed `chargeToBePaid === ''` check here as it's now auto-calculated.
        // The check for parsedChargeToBePaid will ensure it's a valid number.
        if (!selectedPatientId || !selectedVaccineId || !doseNumber) {
            setFormError('All fields are required: Patient, Vaccine, and Dose Number.');
            return;
        }

        const parsedDoseNumber = parseInt(doseNumber);
        // Parse the calculated chargeToBePaid
        const parsedChargeToBePaid = parseFloat(chargeToBePaid);

        if (isNaN(parsedDoseNumber) || parsedDoseNumber <= 0) {
            setFormError('Dose Number must be a positive integer.');
            return;
        }
        // Check if the calculated charge is valid
        if (isNaN(parsedChargeToBePaid) || parsedChargeToBePaid < 0) {
            setFormError('Calculated charge is invalid. Please select a valid vaccine.');
            return;
        }

        const orderData = {
            userId: selectedPatientId,
            hospitalId: hospitalId,
            vaccineId: selectedVaccineId,
            dose_number: parsedDoseNumber,
            charge_to_be_paid: parsedChargeToBePaid,
        };

        dispatch(createVaccinationOrder(orderData));
    };

    if (!currentUser || !currentUser.hospital) {
        return (
            <div className="create-vaccination-order-container">
                <p>Loading user or hospital information...</p>
                {currentUser && !currentUser.hospital && <p className="error-message">You are not assigned to a hospital. Cannot create orders.</p>}
            </div>
        );
    }

    return (
        <div className="create-vaccination-order-container">
            <h2>Create New Vaccination Order</h2>
            <p>Hospital: <strong>{currentUser.hospital.name}</strong></p>

            <form onSubmit={handleSubmit} className="create-order-form">
                <div className="form-group">
                    <label htmlFor="patientSelect">Select Patient:</label>
                    <select
                        id="patientSelect"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        required
                        className="select-box"
                    >
                        <option value="">-- Select a Patient --</option>
                        {allPatients.map((patient) => (
                            <option key={patient._id} value={patient._id}>
                                {patient.name} ({patient.username} - {patient.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="vaccineSelect">Select Vaccine:</label>
                    <select
                        id="vaccineSelect"
                        value={selectedVaccineId}
                        onChange={(e) => setSelectedVaccineId(e.target.value)}
                        required
                        className="select-box"
                    >
                        <option value="">-- Select a Vaccine --</option>
                        {allVaccines.map((vaccine) => (
                            <option key={vaccine._id} value={vaccine._id}>
                                {vaccine.name} ({vaccine.manufacturer})
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Dose Number"
                    id="doseNumber"
                    type="number"
                    value={doseNumber}
                    onChange={(e) => setDoseNumber(e.target.value)}
                    placeholder="e.g., 1, 2"
                    required
                    min="1"
                />

                <Input
                    label="Charge to be Paid ($)"
                    id="chargeToBePaid"
                    type="number"
                    value={chargeToBePaid}
                    readOnly // Made read-only as it's now calculated
                    // onChange removed
                    placeholder="Calculated automatically" // Updated placeholder
                    required
                    min="0"
                    step="0.01"
                />

                {formError && <p className="form-error-message">{formError}</p>}
                {createOrderStatus === 'loading' && <p>Creating order...</p>}

                <Button type="submit" variant="primary" disabled={createOrderStatus === 'loading'}>
                    Create Order
                </Button>
            </form>
        </div>
    );
};

export default CreateVaccinationOrderPage;

