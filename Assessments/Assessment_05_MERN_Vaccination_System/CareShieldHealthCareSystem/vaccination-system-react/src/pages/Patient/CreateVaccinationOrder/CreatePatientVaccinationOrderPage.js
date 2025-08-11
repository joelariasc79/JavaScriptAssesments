import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import { createVaccinationOrder, clearCreateStatus } from '../../../store/features/vaccinationOrder/vaccinationOrderSlice';
import { selectCreateOrderStatus, selectCreateOrderError } from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';

import { fetchHospitals } from '../../../store/features/hospitals/hospitalSlice';
import { selectHospitals, selectHospitalsLoading, selectHospitalsError } from '../../../store/features/hospitals/hospitalSelectors';

import { fetchAllVaccines, selectAllVaccines, selectFetchVaccinesStatus, selectFetchVaccinesError } from '../../../store/features/vaccines/vaccineSlice';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
import { isPositiveNumber } from '../../../utils/validators';

import './CreatePatientVaccinationOrderPage.css';

const CreatePatientVaccinationOrderPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const currentUser = useSelector(selectCurrentUser); // Although currentUser is not directly used for hospital selection now, it might be for other features or access control
    const hospitals = useSelector(selectHospitals);
    const hospitalsLoading = useSelector(selectHospitalsLoading);
    const hospitalsError = useSelector(selectHospitalsError);

    const vaccines = useSelector(selectAllVaccines);
    const vaccinesLoading = useSelector(selectFetchVaccinesStatus) === 'loading';
    const vaccinesError = useSelector(selectFetchVaccinesError);

    const createOrderStatus = useSelector(selectCreateOrderStatus);
    const createOrderError = useSelector(selectCreateOrderError);

    const [formData, setFormData] = useState({
        hospitalId: '',
        vaccineId: '',
        dose_number: '',
        charge_to_be_paid: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });

    useEffect(() => {
        dispatch(fetchHospitals()); // CORRECTED: Dispatch fetchHospitals
        dispatch(fetchAllVaccines());
    }, [dispatch]);

    // Effect to calculate charge based on selected hospital and vaccine
    useEffect(() => {
        if (formData.hospitalId && formData.vaccineId && hospitals.length > 0 && vaccines.length > 0) {
            const selectedHospital = hospitals.find(h => h._id === formData.hospitalId);
            const selectedVaccine = vaccines.find(v => v._id === formData.vaccineId);

            if (selectedHospital && selectedVaccine) {
                const vaccinePrice = selectedVaccine.price || 0;
                const hospitalCharges = selectedHospital.charges || 0;
                const calculatedCharge = vaccinePrice + hospitalCharges;
                setFormData(prevData => ({
                    ...prevData,
                    charge_to_be_paid: calculatedCharge.toFixed(2)
                }));
            } else {
                setFormData(prevData => ({
                    ...prevData,
                    charge_to_be_paid: ''
                }));
            }
        } else {
            setFormData(prevData => ({
                ...prevData,
                charge_to_be_paid: ''
            }));
        }
    }, [formData.hospitalId, formData.vaccineId, hospitals, vaccines]);


    useEffect(() => {
        if (createOrderStatus === 'succeeded') {
            setModalContent({
                title: 'Order Created!',
                message: 'Your vaccination order has been successfully created. You can now review it in your dashboard.'
            });
            setIsModalOpen(true);
            setFormData({
                hospitalId: '',
                vaccineId: '',
                dose_number: '',
                charge_to_be_paid: '',
            }); // Clear form
            dispatch(clearCreateStatus()); // Clear status after showing success
        } else if (createOrderStatus === 'failed') {
            setModalContent({
                title: 'Order Creation Failed',
                message: createOrderError || 'An unexpected error occurred. Please try again.'
            });
            setIsModalOpen(true);
            dispatch(clearCreateStatus()); // Clear status after showing error
        }
    }, [createOrderStatus, createOrderError, dispatch, navigate]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [id]: value
        }));
        if (formErrors[id]) {
            setFormErrors(prevErrors => ({
                ...prevErrors,
                [id]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.hospitalId) errors.hospitalId = 'Hospital is required.';
        if (!formData.vaccineId) errors.vaccineId = 'Vaccine is required.';
        // Ensure dose_number is a valid positive integer string before converting
        if (!formData.dose_number || !/^\d+$/.test(formData.dose_number) || parseInt(formData.dose_number) <= 0) {
            errors.dose_number = 'Dose number must be a positive integer.';
        }
        // Check if charge_to_be_paid is set (auto-calculated) and is a valid positive number
        if (!formData.charge_to_be_paid || isNaN(parseFloat(formData.charge_to_be_paid)) || parseFloat(formData.charge_to_be_paid) < 0) {
            errors.charge_to_be_paid = 'Charge must be a non-negative number and is calculated automatically.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const orderData = {
                userId: currentUser?._id, // Assuming currentUser._id is the patient ID for the order
                hospitalId: formData.hospitalId,
                vaccineId: formData.vaccineId,
                dose_number: Number(formData.dose_number),
                charge_to_be_paid: Number(formData.charge_to_be_paid),
            };
            dispatch(createVaccinationOrder(orderData));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        if (createOrderStatus === 'succeeded') {
            navigate('/patient/dashboard');
        }
    };

    return (
        <div className="create-order-page-container">
            <h2>Create New Vaccination Order</h2>
            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-group">
                    <label htmlFor="hospitalId" className="form-label">Select Hospital <span className="required-star">*</span></label>
                    {hospitalsLoading ? (
                        <p>Loading hospitals...</p>
                    ) : hospitalsError ? (
                        <p className="error-message">Error loading hospitals: {hospitalsError}</p>
                    ) : (
                        <select
                            id="hospitalId"
                            value={formData.hospitalId}
                            onChange={handleChange}
                            className={`form-select ${formErrors.hospitalId ? 'input-field--error' : ''}`}
                            required
                        >
                            <option value="">-- Select a Hospital --</option>
                            {hospitals.map(hospital => (
                                <option key={hospital._id} value={hospital._id}>
                                    {hospital.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {formErrors.hospitalId && <p className="input-error-message">{formErrors.hospitalId}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="vaccineId" className="form-label">Select Vaccine <span className="required-star">*</span></label>
                    {vaccinesLoading ? (
                        <p>Loading vaccines...</p>
                    ) : vaccinesError ? (
                        <p className="error-message">Error loading vaccines: {vaccinesError}</p>
                    ) : (
                        <select
                            id="vaccineId"
                            value={formData.vaccineId}
                            onChange={handleChange}
                            className={`form-select ${formErrors.vaccineId ? 'input-field--error' : ''}`}
                            required
                        >
                            <option value="">-- Select a Vaccine --</option>
                            {vaccines.map(vaccine => (
                                <option key={vaccine._id} value={vaccine._id}>
                                    {vaccine.name} ({vaccine.type})
                                </option>
                            ))}
                        </select>
                    )}
                    {formErrors.vaccineId && <p className="input-error-message">{formErrors.vaccineId}</p>}
                </div>

                <Input
                    label="Dose Number"
                    id="dose_number"
                    type="number"
                    value={formData.dose_number}
                    onChange={handleChange}
                    placeholder="e.g., 1, 2, 3"
                    required
                    error={formErrors.dose_number}
                    min="1"
                />

                <Input
                    label="Charge to be Paid (e.g., 50.00)"
                    id="charge_to_be_paid"
                    type="number"
                    value={formData.charge_to_be_paid}
                    readOnly // Make this read-only as it's auto-calculated
                    placeholder="Calculated automatically"
                    required
                    error={formErrors.charge_to_be_paid}
                    min="0"
                    step="0.01"
                />

                <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    disabled={createOrderStatus === 'loading' || hospitalsLoading || vaccinesLoading}
                >
                    {createOrderStatus === 'loading' ? 'Creating Order...' : 'Create Vaccination Order'}
                </Button>
            </form>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={modalContent.title}
                footer={<Button onClick={closeModal}>Close</Button>}
            >
                <p>{modalContent.message}</p>
            </Modal>
        </div>
    );
};

export default CreatePatientVaccinationOrderPage;