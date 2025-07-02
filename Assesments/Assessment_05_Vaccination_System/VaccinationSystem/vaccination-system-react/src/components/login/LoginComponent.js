import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, logoutUser, clearUserStatus } from '../../redux/user/userActions';
import '../userManagement/UserManagement.css'; // Re-use the existing CSS for styling

const LoginComponent = () => {
    const dispatch = useDispatch();
    const { token, loading, error, successMessage } = useSelector(state => state.user);

    const [loginCredentials, setLoginCredentials] = useState({
        usernameOrEmail: '',
        password: '',
    });

    useEffect(() => {
        // Clear status messages when component mounts or unmounts, or after a certain time
        const timer = setTimeout(() => {
            if (successMessage || error) {
                dispatch(clearUserStatus());
            }
        }, 5000); // Clear after 5 seconds

        return () => clearTimeout(timer);
    }, [successMessage, error, dispatch]);

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (!loginCredentials.usernameOrEmail || !loginCredentials.password) {
            alert('Please enter username/email and password for login.');
            return;
        }
        dispatch(loginUser(loginCredentials));
        setLoginCredentials(prev => ({ ...prev, password: '' })); // Clear password field
    };

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <div className="section auth-section">
            <h3>Login</h3>
            {loading && <p className="status-message loading">Logging in...</p>}
            {error && <p className="status-message error">Error: {error}</p>}
            {successMessage && <p className="status-message success">{successMessage}</p>}

            {!token ? ( // Show login form if not logged in
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="loginUsernameEmail">Username or Email:</label>
                        <input
                            type="text"
                            id="loginUsernameEmail"
                            name="usernameOrEmail"
                            value={loginCredentials.usernameOrEmail}
                            onChange={handleLoginChange}
                            placeholder="username or email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="loginPassword">Password:</label>
                        <input
                            type="password"
                            id="loginPassword"
                            name="password"
                            value={loginCredentials.password}
                            onChange={handleLoginChange}
                            placeholder="********"
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
            ) : ( // Show logout button and token info if logged in
                <div className="auth-status">
                    <p><strong>Logged In!</strong></p> {/* Removed token display */}
                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}
            {!token && !loading && !error && <p className="status-message info">Not logged in.</p>}
        </div>
    );
};

export default LoginComponent;