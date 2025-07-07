// src/pages/Hospital/RegisterVaccinePage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerVaccine, clearRegistrationStatus } from '../../../store/features/vaccines/vaccineSlice';
import { selectRegistrationStatus, selectRegistrationError } from '../../../store/features/vaccines/vaccineSelectors';

import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import './RegisterVaccinePage.css'; // Create this CSS file for styling

const RegisterVaccinePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const registrationStatus = useSelector(selectRegistrationStatus);
    const registrationError = useSelector(selectRegistrationError);

    // State variables for all vaccine fields from the backend router
    const [name, setName] = useState('');
    const [manufacturer, setManufacturer] = useState(''); // NEW STATE FIELD FOR MANUFACTURER
    const [type, setType] = useState('');
    const [price, setPrice] = useState('');
    const [sideEffect, setSideEffect] = useState('');
    const [origin, setOrigin] = useState('');
    const [dosesRequired, setDosesRequired] = useState('');
    const [timeBetweenDosesDays, setTimeBetweenDosesDays] = useState('');
    const [otherInfo, setOtherInfo] = useState('');
    const [strainsCovered, setStrainsCovered] = useState('');

    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (registrationStatus === 'succeeded') {
            alert('Vaccine registered successfully!');
            dispatch(clearRegistrationStatus()); // Clear status after success
            // Clear form fields after successful registration
            setName('');
            setManufacturer('');
            setType('');
            setPrice('');
            setSideEffect('');
            setOrigin('');
            setDosesRequired('');
            setTimeBetweenDosesDays('');
            setOtherInfo('');
            setStrainsCovered('');

            navigate('/hospital'); // Redirect to hospital dashboard or vaccine list
        } else if (registrationStatus === 'failed') {
            setFormError(registrationError || 'Vaccine registration failed. Please try again.');
        }
    }, [registrationStatus, registrationError, dispatch, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous form errors

        const parsedPrice = parseFloat(price);
        const parsedDosesRequired = parseInt(dosesRequired);
        const parsedTimeBetweenDosesDays = timeBetweenDosesDays !== '' ? parseInt(timeBetweenDosesDays) : null;


        // Validate all required fields based on your instruction "Assume all fields are required"
        if (!name || !manufacturer || !type || price === '' || !dosesRequired) {
            setFormError('name, manufacturer, type, price and dosesRequired  are required.');
            return;
        }

        // Validate number fields

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
            price: parsedPrice, // Use parsed value
            side_effect: sideEffect,
            origin: origin,
            doses_required: parsedDosesRequired, // Use parsed value
            // Send time_between_doses_days as null if it's an empty string, otherwise parse it
            time_between_doses_days: timeBetweenDosesDays !== '' ? parseInt(timeBetweenDosesDays) : null,
            other_info: otherInfo,
            // Split comma-separated strains; filter(s => s !== '') removes empty strings from splitting
            strains_covered: strainsCovered.split(',').map(s => s.trim()).filter(s => s !== '').join(', '),
        };

        dispatch(registerVaccine(vaccineData));
    };

    return (
        <div className="register-vaccine-container">
            <h2>Register New Vaccine Type</h2>
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
                    label="Manufacturer" // NEW INPUT FIELD FOR MANUFACTURER
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
                    label="Country/Region of Origin" // Clarified label for 'origin'
                    id="origin"
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g., USA, Germany"
                    // required
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
                    // required
                    min="0"
                />
                <Input
                    label="Side Effect"
                    id="sideEffect"
                    type="text"
                    value={sideEffect}
                    onChange={(e) => setSideEffect(e.target.value)}
                    placeholder="e.g., Fever, fatigue, arm soreness"
                    // required
                />
                <Input
                    label="Other Info"
                    id="otherInfo"
                    type="text"
                    value={otherInfo}
                    onChange={(e) => setOtherInfo(e.target.value)}
                    placeholder="e.g., Store at -70°C"
                    // required
                />
                <Input
                    label="Strains Covered (comma-separated)"
                    id="strainsCovered"
                    type="text"
                    value={strainsCovered}
                    onChange={(e) => setStrainsCovered(e.target.value)}
                    placeholder="e.g., Alpha, Delta, Omicron"
                    // required
                />

                {formError && <p className="form-error-message">{formError}</p>}
                {registrationStatus === 'loading' && <p>Registering vaccine...</p>}

                <Button type="submit" variant="primary" disabled={registrationStatus === 'loading'}>
                    Register Vaccine
                </Button>
            </form>
        </div>
    );
};

export default RegisterVaccinePage;