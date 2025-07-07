// src/store/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService'; // Import your API service

// Async Thunk for login
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ usernameOrEmail, password }, { dispatch, rejectWithValue }) => { // Add dispatch here
        try {
            const response = await apiService.login(usernameOrEmail, password);
            localStorage.setItem('jwtToken', response.data.token);

            // After successful login, dispatch fetchUserProfile to get full user details
            // The userId is available in response.data.user.userId
            dispatch(fetchUserProfile(response.data.user.userId));

            return response.data; // Return login data
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
            return response.data; // This should contain the user object with populated hospital
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
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null, // Stores error object, e.g., { message: 'Invalid credentials.' }
        // NEW: Status specifically for profile fetching
        profileStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        profileError: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.status = 'idle'; // Reset status on logout
            state.error = null; // Clear any errors on logout
            state.profileStatus = 'idle'; // Reset profile status
            state.profileError = null; // Reset profile error
            localStorage.removeItem('jwtToken');
        },
        // A synchronous action to set user details if already available (e.g., from local storage after refresh)
        // This is good practice if you rehydrate user data from token on app load
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true; // Assume if user is set, they are authenticated
            state.status = 'succeeded'; // Reflect that user data is available
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Login User Reducers ---
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null; // Clear any previous errors on new attempt
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                // We're no longer setting `user` here directly from `loginUser` payload
                // because `fetchUserProfile` will populate the `user` state with full details.
                // We primarily set token and authentication status here.
                state.status = 'succeeded';
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
                // Optionally, you might want to store basic user info from login payload
                // if `fetchUserProfile` might take some time, but `fetchUserProfile`
                // will eventually overwrite this with a fuller profile.
                state.user = action.payload.user; // Basic user info from login payload (userId, username, name, role)
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                localStorage.removeItem('jwtToken');
            })
            // --- Fetch User Profile Reducers ---
            .addCase(fetchUserProfile.pending, (state) => {
                state.profileStatus = 'loading';
                state.profileError = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.profileStatus = 'succeeded';
                state.user = action.payload; // Set the full user profile including hospital
                state.profileError = null;
                // Also ensure main status is succeeded if profile fetch is central
                state.status = 'succeeded'; // Ensures overall auth state reflects success after profile load
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.profileStatus = 'failed';
                state.profileError = action.payload;
                // You might want to decide if a failed profile fetch makes user unauthenticated
                // For now, let's keep isAuthenticated based on token, but show profile error.
                // If you want to force logout on profile fetch failure, uncomment:
                // state.isAuthenticated = false;
                // state.user = null;
                // state.token = null;
                // localStorage.removeItem('jwtToken');
            });
    },
});

export const { logout, setUser } = authSlice.actions; // Export setUser
export default authSlice.reducer;