// src/pages/Hospital/SaveVaccine.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import {
    registerVaccine,
    updateVaccine, // Import updateVaccine thunk
    fetchVaccineById, // Import fetchVaccineById thunk
    clearRegistrationStatus,
    clearUpdateStatus,      // Import clearUpdateStatus
    clearFetchByIdStatus,   // Import clearFetchByIdStatus
} from '../../../../store/features/vaccines/vaccineSlice'; // Corrected path to vaccineSlice
import {
    selectRegistrationStatus,
    selectRegistrationError,
    selectSelectedVaccine,       // Import new selectors
    selectFetchVaccineByIdStatus,
    selectFetchVaccineByIdError,
    selectUpdateVaccineStatus,
    selectUpdateVaccineError,
} from '../../../../store/features/vaccines/vaccineSelectors'; // Corrected path to vaccineSelectors

import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import './SaveVaccinePage.css'; // Create this CSS file for styling

const SaveVaccinePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { vaccineId } = useParams(); // Get vaccineId from URL parameters

    const registrationStatus = useSelector(selectRegistrationStatus);
    const registrationError = useSelector(selectRegistrationError);
    const selectedVaccine = useSelector(selectSelectedVaccine); // For fetching existing vaccine
    const fetchByIdStatus = useSelector(selectFetchVaccineByIdStatus);
    const fetchByIdError = useSelector(selectFetchVaccineByIdError);
    const updateStatus = useSelector(selectUpdateVaccineStatus); // For update operation
    const updateError = useSelector(selectUpdateVaccineError);

    // State variables for all vaccine fields
    const [name, setName] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [type, setType] = useState('');
    const [price, setPrice] = useState('');
    const [sideEffect, setSideEffect] = useState('');
    const [origin, setOrigin] = useState('');
    const [dosesRequired, setDosesRequired] = useState('');
    const [timeBetweenDosesDays, setTimeBetweenDosesDays] = useState('');
    const [otherInfo, setOtherInfo] = useState('');
    const [strainsCovered, setStrainsCovered] = useState('');

    const [formError, setFormError] = useState('');

    const isEditing = !!vaccineId; // True if vaccineId exists, meaning we are in "edit" mode

    // Effect to fetch vaccine data if in edit mode
    useEffect(() => {
        if (isEditing && fetchByIdStatus === 'idle') {
            dispatch(fetchVaccineById(vaccineId));
        }
    }, [isEditing, vaccineId, fetchByIdStatus, dispatch]);

    // Effect to populate form fields with fetched vaccine data
    useEffect(() => {
        if (isEditing && fetchByIdStatus === 'succeeded' && selectedVaccine) {
            setName(selectedVaccine.name || '');
            setManufacturer(selectedVaccine.manufacturer || '');
            setType(selectedVaccine.type || '');
            setPrice(selectedVaccine.price !== undefined ? selectedVaccine.price.toString() : '');
            setSideEffect(selectedVaccine.side_effect || '');
            setOrigin(selectedVaccine.origin || '');
            setDosesRequired(selectedVaccine.doses_required !== undefined ? selectedVaccine.doses_required.toString() : '');
            setTimeBetweenDosesDays(selectedVaccine.time_between_doses_days !== undefined && selectedVaccine.time_between_doses_days !== null ? selectedVaccine.time_between_doses_days.toString() : '');
            setOtherInfo(selectedVaccine.other_info || '');
            setStrainsCovered(selectedVaccine.strains_covered || '');
        }
    }, [isEditing, fetchByIdStatus, selectedVaccine]);

    // Effect for handling registration/update success
    useEffect(() => {
        const currentStatus = isEditing ? updateStatus : registrationStatus;
        const currentError = isEditing ? updateError : registrationError;

        if (currentStatus === 'succeeded') {
            alert(isEditing ? 'Vaccine updated successfully!' : 'Vaccine registered successfully!');
            // Clear relevant status after success
            if (isEditing) {
                dispatch(clearUpdateStatus());
            } else {
                dispatch(clearRegistrationStatus());
            }
            // Navigate back to the manage vaccines page after success
            navigate('/hospital/vaccines');
        } else if (currentStatus === 'failed') {
            setFormError(currentError || (isEditing ? 'Vaccine update failed.' : 'Vaccine registration failed.'));
        }
    }, [registrationStatus, registrationError, updateStatus, updateError, isEditing, dispatch, navigate]);

    // Effect for handling fetch by ID errors
    useEffect(() => {
        if (fetchByIdStatus === 'failed') {
            setFormError(fetchByIdError || 'Failed to load vaccine data for update.');
            // Optionally redirect if vaccine not found or error occurs
            // navigate('/hospital/vaccines');
        }
    }, [fetchByIdStatus, fetchByIdError, navigate]);


    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(clearRegistrationStatus());
            dispatch(clearUpdateStatus());
            dispatch(clearFetchByIdStatus());
        };
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous form errors

        const parsedPrice = parseFloat(price);
        const parsedDosesRequired = parseInt(dosesRequired);
        const parsedTimeBetweenDosesDays = timeBetweenDosesDays !== '' ? parseInt(timeBetweenDosesDays) : null;

        // Basic validation for required fields
        if (!name || !manufacturer || !type || price === '' || !dosesRequired) {
            setFormError('Name, Manufacturer, Type, Price, and Doses Required are mandatory.');
            return;
        }

        if (isNaN(parsedPrice) || parsedPrice < 0) {
            setFormError('Price must be a non-negative number.');
            return;
        }

        if (isNaN(parsedDosesRequired) || parsedDosesRequired <= 0) {
            setFormError('Doses Required must be a positive number.');
            return;
        }

        if (timeBetweenDosesDays !== '' && (isNaN(parsedTimeBetweenDosesDays) || parsedTimeBetweenDosesDays < 0)) {
            setFormError('Time Between Doses must be a non-negative number if provided.');
            return;
        }

        const vaccineData = {
            name,
            manufacturer,
            type,
            price: parsedPrice,
            side_effect: sideEffect,
            origin: origin,
            doses_required: parsedDosesRequired,
            time_between_doses_days: parsedTimeBetweenDosesDays,
            other_info: otherInfo,
            strains_covered: strainsCovered.split(',').map(s => s.trim()).filter(s => s !== '').join(', '),
        };

        if (isEditing) {
            dispatch(updateVaccine({ vaccineId, vaccineData }));
        } else {
            dispatch(registerVaccine(vaccineData));
        }
    };

    const isLoading = registrationStatus === 'loading' || updateStatus === 'loading' || fetchByIdStatus === 'loading';
    const currentTitle = isEditing ? 'Update Vaccine Type' : 'Register New Vaccine Type';
    const buttonText = isEditing ? 'Update Vaccine' : 'Register Vaccine';

    return (
        <div className="register-vaccine-container">
            <h2>{currentTitle}</h2>
            {(isEditing && fetchByIdStatus === 'loading') && <p>Loading vaccine data...</p>}
            {(isEditing && fetchByIdStatus === 'failed') && <p className="form-error-message">{fetchByIdError || "Could not load vaccine data."}</p>}

            {!(isEditing && fetchByIdStatus === 'loading') && ( // Only show form if not loading existing data
                <form onSubmit={handleSubmit} className="register-vaccine-form">
                    <Input
                        label="Vaccine Name"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Pfizer-BioNTech"
                        required
                    />
                    <Input
                        label="Manufacturer"
                        id="manufacturer"
                        type="text"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        placeholder="e.g., BioNTech, Moderna"
                        required
                    />
                    <Input
                        label="Type"
                        id="type"
                        type="text"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="e.g., mRNA, Inactivated, Viral Vector"
                        required
                    />
                    <Input
                        label="Price ($)"
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 20.00"
                        required
                        min="0"
                        step="0.01"
                    />
                    <Input
                        label="Country/Region of Origin"
                        id="origin"
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="e.g., USA, Germany"
                    />
                    <Input
                        label="Doses Required"
                        id="dosesRequired"
                        type="number"
                        value={dosesRequired}
                        onChange={(e) => setDosesRequired(e.target.value)}
                        placeholder="e.g., 2"
                        required
                        min="1"
                    />
                    <Input
                        label="Time Between Doses (Days)"
                        id="timeBetweenDosesDays"
                        type="number"
                        value={timeBetweenDosesDays}
                        onChange={(e) => setTimeBetweenDosesDays(e.target.value)}
                        placeholder="e.g., 21 (days between doses), 0 for single dose"
                        min="0"
                    />
                    <Input
                        label="Side Effect"
                        id="sideEffect"
                        type="text"
                        value={sideEffect}
                        onChange={(e) => setSideEffect(e.target.value)}
                        placeholder="e.g., Fever, fatigue, arm soreness"
                    />
                    <Input
                        label="Other Info"
                        id="otherInfo"
                        type="text"
                        value={otherInfo}
                        onChange={(e) => setOtherInfo(e.target.value)}
                        placeholder="e.g., Store at -70°C"
                    />
                    <Input
                        label="Strains Covered (comma-separated)"
                        id="strainsCovered"
                        type="text"
                        value={strainsCovered}
                        onChange={(e) => setStrainsCovered(e.target.value)}
                        placeholder="e.g., Alpha, Delta, Omicron"
                    />

                    {formError && <p className="form-error-message">{formError}</p>}
                    {isLoading && <p>{isEditing ? 'Updating vaccine...' : 'Registering vaccine...'}</p>}

                    <Button type="submit" variant="primary" disabled={isLoading}>
                        {buttonText}
                    </Button>
                </form>
            )}
        </div>
    );
};

export default SaveVaccinePage;