/* src/pages/Auth/LoginPage.js */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../../store/features/auth/authSlice';
import { selectAuthStatus, selectAuthError, selectIsAuthenticated, selectCurrentUser } from '../../../store/features/auth/authSelectors';
import Input from '../../../components/common/Input/Input'; // Assuming your Input component is here
import Button from '../../../components/common/Button/Button'; // Assuming your Button component is here
import './LoginPage.css'; // For specific styles

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const authStatus = useSelector(selectAuthStatus);
    const authError = useSelector(selectAuthError);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser); // To determine redirect path based on role

    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState(''); // Local error for display

    useEffect(() => {
        if (isAuthenticated && currentUser) {
            // Redirect based on role after successful login
            switch (currentUser.role) {
                case 'admin': // Use lowercase to match your schema enum
                    navigate('/admin'); // If you create a separate admin PatientDashboard
                    break;
                case 'hospital_staff': // Use lowercase to match your schema enum
                    navigate('/hospital'); // Redirect hospital staff to the hospital PatientDashboard
                    break;
                case 'patient': // Use lowercase to match your schema enum
                    navigate('/patient/dashboard');
                    break;
                default:
                    navigate('/'); // Fallback
            }
        }
    }, [isAuthenticated, currentUser, navigate]);

    useEffect(() => {
        if (authStatus === 'failed' && authError) {
            // Display error from Redux state
            if (authError.message) {
                setFormError(authError.message);
            } else {
                setFormError('Login failed. Please check your credentials.');
            }
        } else if (authStatus === 'idle' || authStatus === 'loading') {
            setFormError(''); // Clear error when status changes
        }
    }, [authStatus, authError]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous errors

        if (!usernameOrEmail || !password) {
            setFormError('Both username/email and password are required.');
            return;
        }

        // Dispatch the loginUser async thunk
        dispatch(loginUser({ usernameOrEmail: usernameOrEmail, password }));
    };

    return (
        <div className="login-page-container">
            <div className="login-form-card">
                <h2>Login to Your Account</h2>
                <form onSubmit={handleSubmit}>
                    <Input
                        id="usernameOrEmail"
                        label="Username or Email"
                        type="text"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        placeholder="Enter your username or email"
                        required
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />

                    {formError && <p className="form-error-message">{formError}</p>}

                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        disabled={authStatus === 'loading'}
                    >
                        {authStatus === 'loading' ? 'Logging In...' : 'Login'}
                    </Button>
                </form>
                <p className="register-link-text">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;