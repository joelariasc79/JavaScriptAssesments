// // src/store/features/auth/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService';

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ usernameOrEmail, password }, { dispatch, rejectWithValue }) => {
        try {
            const response = await apiService.login(usernameOrEmail, password);
            localStorage.setItem('jwtToken', response.data.token);

            dispatch(fetchUserProfile(response.data.user.userId));

            return response.data;
        } catch (error) {
            const errorMessage = error.response && error.response.data
                ? error.response.data
                : { message: error.message || 'An unexpected error occurred.' };
            return rejectWithValue(errorMessage);
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await apiService.getProfile(userId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: localStorage.getItem('jwtToken') || null,
        isAuthenticated: !!localStorage.getItem('jwtToken'),
        status: 'idle',
        error: null,
        profileStatus: 'idle',
        profileError: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.status = 'idle';
            state.error = null;
            state.profileStatus = 'idle';
            state.profileError = null;
            localStorage.removeItem('jwtToken');
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.status = 'succeeded';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;

                // --- FIX: Add a defensive check here to handle different API response structures ---
                // We'll set the patient object to either action.payload.patient OR the entire action.payload
                state.user = action.payload.user || action.payload;

            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                localStorage.removeItem('jwtToken');
            })
            .addCase(fetchUserProfile.pending, (state) => {
                state.profileStatus = 'loading';
                state.profileError = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.profileStatus = 'succeeded';
                state.user = action.payload;
                state.profileError = null;
                state.status = 'succeeded';
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.profileStatus = 'failed';
                state.profileError = action.payload;
            });
    },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;






// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import apiService from '../../../api/apiService'; // Import your API service
//
// // Async Thunk for login
// export const loginUser = createAsyncThunk(
//     'auth/loginUser',
//     async ({ usernameOrEmail, password }, { dispatch, rejectWithValue }) => { // Add dispatch here
//         try {
//             const response = await apiService.login(usernameOrEmail, password);
//             localStorage.setItem('jwtToken', response.data.token);
//
//             // After successful login, dispatch fetchUserProfile to get full patient details
//             // The userId is available in response.data.patient.userId
//             dispatch(fetchUserProfile(response.data.patient.userId));
//
//             return response.data; // Return login data
//         } catch (error) {
//             const errorMessage = error.response && error.response.data
//                 ? error.response.data
//                 : { message: error.message || 'An unexpected error occurred.' };
//             return rejectWithValue(errorMessage);
//         }
//     }
// );
//
// export const fetchUserProfile = createAsyncThunk(
//     'auth/fetchUserProfile',
//     async (userId, { rejectWithValue }) => {
//         try {
//             const response = await apiService.getProfile(userId);
//             return response.data; // This should contain the patient object with populated hospital
//         } catch (error) {
//             const message = error.response?.data?.message || error.message;
//             return rejectWithValue(message);
//         }
//     }
// );
//
// const authSlice = createSlice({
//     name: 'auth',
//     initialState: {
//         patient: null,
//         token: localStorage.getItem('jwtToken') || null,
//         isAuthenticated: !!localStorage.getItem('jwtToken'),
//         status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
//         error: null, // Stores error object, e.g., { message: 'Invalid credentials.' }
//         // NEW: Status specifically for profile fetching
//         profileStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
//         profileError: null,
//     },
//     reducers: {
//         logout: (state) => {
//             state.patient = null;
//             state.token = null;
//             state.isAuthenticated = false;
//             state.status = 'idle'; // Reset status on logout
//             state.error = null; // Clear any errors on logout
//             state.profileStatus = 'idle'; // Reset profile status
//             state.profileError = null; // Reset profile error
//             localStorage.removeItem('jwtToken');
//         },
//         // A synchronous action to set patient details if already available (e.g., from local storage after refresh)
//         // This is good practice if you rehydrate patient data from token on app load
//         setUser: (state, action) => {
//             state.patient = action.payload;
//             state.isAuthenticated = true; // Assume if patient is set, they are authenticated
//             state.status = 'succeeded'; // Reflect that patient data is available
//         }
//     },
//     extraReducers: (builder) => {
//         builder
//             // --- Login User Reducers ---
//             .addCase(loginUser.pending, (state) => {
//                 state.status = 'loading';
//                 state.error = null; // Clear any previous errors on new attempt
//             })
//             .addCase(loginUser.fulfilled, (state, action) => {
//                 // We're no longer setting `patient` here directly from `loginUser` payload
//                 // because `fetchUserProfile` will populate the `patient` state with full details.
//                 // We primarily set token and authentication status here.
//                 state.status = 'succeeded';
//                 state.token = action.payload.token;
//                 state.isAuthenticated = true;
//                 state.error = null;
//                 // Optionally, you might want to store basic patient info from login payload
//                 // if `fetchUserProfile` might take some time, but `fetchUserProfile`
//                 // will eventually overwrite this with a fuller profile.
//                 state.patient = action.payload.patient; // Basic patient info from login payload (userId, username, name, role)
//             })
//             .addCase(loginUser.rejected, (state, action) => {
//                 state.status = 'failed';
//                 state.error = action.payload;
//                 state.isAuthenticated = false;
//                 state.patient = null;
//                 state.token = null;
//                 localStorage.removeItem('jwtToken');
//             })
//             // --- Fetch User Profile Reducers ---
//             .addCase(fetchUserProfile.pending, (state) => {
//                 state.profileStatus = 'loading';
//                 state.profileError = null;
//             })
//             .addCase(fetchUserProfile.fulfilled, (state, action) => {
//                 state.profileStatus = 'succeeded';
//                 state.patient = action.payload; // Set the full patient profile including hospital
//                 state.profileError = null;
//                 // Also ensure main status is succeeded if profile fetch is central
//                 state.status = 'succeeded'; // Ensures overall auth state reflects success after profile load
//             })
//             .addCase(fetchUserProfile.rejected, (state, action) => {
//                 state.profileStatus = 'failed';
//                 state.profileError = action.payload;
//                 // You might want to decide if a failed profile fetch makes patient unauthenticated
//                 // For now, let's keep isAuthenticated based on token, but show profile error.
//                 // If you want to force logout on profile fetch failure, uncomment:
//                 // state.isAuthenticated = false;
//                 // state.patient = null;
//                 // state.token = null;
//                 // localStorage.removeItem('jwtToken');
//             });
//     },
// });
//
// export const { logout, setUser } = authSlice.actions; // Export setUser
// export default authSlice.reducer;