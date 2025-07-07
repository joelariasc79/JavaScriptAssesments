import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    registerPatient,
    clearRegistrationStatus,
} from '../../store/features/patients/patientSlice';
import {
    selectRegistrationStatus,
    selectRegistrationError,
    selectRegisteredPatient,
}
    from '../../store/features/patients/patientSelectors';
import {
    isEmpty,
    isValidEmail,
    isValidPassword,
    doStringsMatch,
    isPositiveNumber,
} from '../../utils/validators';

// Import the new CSS file
import './RegisterPage.css';

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Selectors for Redux state
    const registrationStatus = useSelector(selectRegistrationStatus);
    const registrationError = useSelector(selectRegistrationError);
    const registeredPatient = useSelector(selectRegisteredPatient);

    // Form data state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '', // For client-side validation
        name: '',
        age: '', // Keep as string for input, convert to number before dispatch
        profession: '',
        contact_number: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
        gender: '', // This will be "" if not selected
        pre_existing_disease: '',
        medical_certificate_url: '',
    });

    // Error state for form fields
    const [errors, setErrors] = useState({});

    // Modal state for success/error messages
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData((prevData) => ({
                ...prevData,
                address: {
                    ...prevData.address,
                    [addressField]: value,
                },
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
        // Clear error for the field as user types
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    // Client-side form validation
    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        // Required fields validation
        if (isEmpty(formData.username)) {
            newErrors.username = 'Username is required.';
            isValid = false;
        }
        if (isEmpty(formData.email)) {
            newErrors.email = 'Email is required.';
            isValid = false;
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email format.';
            isValid = false;
        }
        if (isEmpty(formData.password)) {
            newErrors.password = 'Password is required.';
            isValid = false;
        } else if (!isValidPassword(formData.password, 6)) {
            newErrors.password = 'Password must be at least 6 characters.';
            isValid = false;
        }
        if (isEmpty(formData.confirmPassword)) {
            newErrors.confirmPassword = 'Confirm password is required.';
            isValid = false;
        } else if (!doStringsMatch(formData.password, formData.confirmPassword)) {
            newErrors.confirmPassword = 'Passwords do not match.';
            isValid = false;
        }
        if (isEmpty(formData.name)) {
            newErrors.name = 'Name is required.';
            isValid = false;
        }
        if (isEmpty(formData.contact_number)) {
            newErrors.contact_number = 'Contact number is required.';
            isValid = false;
        }
        if (isEmpty(formData.address.street)) {
            newErrors['address.street'] = 'Street is required.';
            isValid = false;
        }
        if (isEmpty(formData.address.city)) {
            newErrors['address.city'] = 'City is required.';
            isValid = false;
        }
        if (isEmpty(formData.address.state)) {
            newErrors['address.state'] = 'State is required.';
            isValid = false;
        }
        if (isEmpty(formData.address.zipCode)) {
            newErrors['address.zipCode'] = 'Zip Code is required.';
            isValid = false;
        }

        // Age validation (if provided)
        if (formData.age !== '' && (!isPositiveNumber(Number(formData.age)) || Number(formData.age) < 0)) {
            newErrors.age = 'Age must be a positive number.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Prepare data for dispatch, converting age to number
            const dataToRegister = {
                ...formData,
                age: formData.age === '' ? undefined : Number(formData.age), // Send as number or undefined if empty
                confirmPassword: undefined, // Don't send to backend
                // IMPORTANT CHANGE HERE: Send gender as undefined if it's an empty string
                gender: formData.gender === '' ? undefined : formData.gender,
            };
            dispatch(registerPatient(dataToRegister));
        }
    };

    // Effect to handle registration status changes
    useEffect(() => {
        if (registrationStatus === 'succeeded') {
            setModalTitle('Registration Successful');
            setModalContent(`User ${registeredPatient?.user?.username || ''} registered successfully! You can now log in.`);
            setIsModalOpen(true);
        } else if (registrationStatus === 'failed') {
            setModalTitle('Registration Failed');
            setModalContent(registrationError?.message || 'An unknown error occurred during registration.');
            setIsModalOpen(true);
        }
    }, [registrationStatus, registrationError, registeredPatient]);

    // Cleanup on component unmount or when status is reset
    useEffect(() => {
        return () => {
            dispatch(clearRegistrationStatus());
        };
    }, [dispatch]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalContent('');
        setModalTitle('');
        if (registrationStatus === 'succeeded') {
            navigate('/login'); // Navigate to login only after successful registration and modal close
        }
    };

    return (
        <div className="register-page-container">
            <div className="register-page-card">
                <h2>Register</h2>
                <form onSubmit={handleSubmit} className="register-page-form">
                    <Input
                        label="Username"
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        required
                        error={errors.username}
                    />
                    <Input
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        error={errors.email}
                    />
                    <Input
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        error={errors.password}
                    />
                    <Input
                        label="Confirm Password"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        error={errors.confirmPassword}
                    />
                    <Input
                        label="Full Name"
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                        error={errors.name}
                    />
                    <Input
                        label="Age (Optional)"
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Enter your age"
                        error={errors.age}
                    />
                    <Input
                        label="Profession (Optional)"
                        id="profession"
                        name="profession"
                        type="text"
                        value={formData.profession}
                        onChange={handleChange}
                        placeholder="Enter your profession"
                    />
                    <Input
                        label="Contact Number"
                        id="contact_number"
                        name="contact_number"
                        type="text"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="Enter your contact number"
                        required
                        error={errors.contact_number}
                    />

                    <h3>Address</h3>
                    <Input
                        label="Street"
                        id="address.street"
                        name="address.street"
                        type="text"
                        value={formData.address.street}
                        onChange={handleChange}
                        placeholder="Street"
                        required
                        error={errors['address.street']}
                    />
                    <Input
                        label="City"
                        id="address.city"
                        name="address.city"
                        type="text"
                        value={formData.address.city}
                        onChange={handleChange}
                        placeholder="City"
                        required
                        error={errors['address.city']}
                    />
                    <Input
                        label="State"
                        id="address.state"
                        name="address.state"
                        type="text"
                        value={formData.address.state}
                        onChange={handleChange}
                        placeholder="State"
                        required
                        error={errors['address.state']}
                    />
                    <Input
                        label="Zip Code"
                        id="address.zipCode"
                        name="address.zipCode"
                        type="text"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        placeholder="Zip Code"
                        required
                        error={errors['address.zipCode']}
                    />

                    <div className="input-group">
                        <label htmlFor="gender" className="input-label">Gender (Optional)</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="input-field" /* Use input-field class for consistent styling */
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>

                    <Input
                        label="Pre-existing Disease (Optional)"
                        id="pre_existing_disease"
                        name="pre_existing_disease"
                        type="text"
                        value={formData.pre_existing_disease}
                        onChange={handleChange}
                        placeholder="Any pre-existing medical conditions?"
                    />
                    <Input
                        label="Medical Certificate URL (Optional)"
                        id="medical_certificate_url"
                        name="medical_certificate_url"
                        type="url"
                        value={formData.medical_certificate_url}
                        onChange={handleChange}
                        placeholder="URL to your medical certificate"
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        disabled={registrationStatus === 'loading'}
                    >
                        {registrationStatus === 'loading' ? 'Registering...' : 'Register'}
                    </Button>
                </form>
                <p className="login-link-text">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                    >
                        Login here
                    </button>
                </p>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={modalTitle}
            >
                <p>{modalContent}</p>
            </Modal>
        </div>
    );
};

export default RegisterPage;
