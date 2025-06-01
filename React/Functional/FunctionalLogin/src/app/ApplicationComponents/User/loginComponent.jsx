import React, { useState, useEffect } from 'react';

function Login() {
    const [loginDetails, setLoginDetails] = useState({
        username: '',
        password: '',
        securityQuestion: '',
        securityAnswer: '',
    });

    // const handleChange = (event) => {
    //     const { name, value } = event.target;
    //
    //     setLoginDetails(prevState => ({
    //         ...prevState,
    //         [name]: value,
    //     }));
    //
    //     console.log('Login Details:', loginDetails); // For demonstration of state change
    // };

    // const handleChange = (event) => {
    //     const { name, value } = event.target;
    //
    //     setLoginDetails(prevState => {
    //         const updatedState = {
    //             ...prevState,
    //             [name]: value,
    //         };
    //
    //         console.log('Login Details:', updatedState); // Print the updated state
    //         return updatedState;
    //     });
    // };


    // const handleChange = (event) => {
    //     const { name, value } = event.target;
    //
    //     setLoginDetails(
    //         prevState => ({
    //             ...prevState,
    //             [name]: value,
    //         }),
    //         () => {
    //             console.log('Login Details (after update):', loginDetails);
    //         }
    //     );
    // };


    const handleChange = (event) => {
        const { name, value } = event.target;
        setLoginDetails(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    useEffect(() => {
        console.log('Login Details (in useEffect):', loginDetails);
    }, [loginDetails]); // Run effect when loginDetails changes

    return (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <div>
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={loginDetails.username}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', margin: '5px 0', boxSizing: 'border-box' }}
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginDetails.password}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', margin: '5px 0', boxSizing: 'border-box' }}
                />
            </div>
            <div>
                <label htmlFor="securityQuestion">Security Question:</label>
                <input
                    type="text"
                    id="securityQuestion"
                    name="securityQuestion"
                    value={loginDetails.securityQuestion}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', margin: '5px 0', boxSizing: 'border-box' }}
                />
            </div>
            <div>
                <label htmlFor="securityAnswer">Security Answer:</label>
                <input
                    type="text"
                    id="securityAnswer"
                    name="securityAnswer"
                    value={loginDetails.securityAnswer}

                    // Inline code to directly update state (without event handler)
                    onFocus={() => {
                        setLoginDetails(prevState => ({
                            ...prevState,
                            securityAnswer: 'Inline Updated Answer',
                        }));

                        console.log('Security Answer Updated Inline:', loginDetails);
                    }}
                    style={{ width: '100%', padding: '8px', margin: '5px 0', boxSizing: 'border-box' }}
                />
            </div>
            <button style={{ padding: '10px', marginTop: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Login
            </button>
        </div>
    );
}

export default Login;