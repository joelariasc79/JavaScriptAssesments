// src/store/features/vaccine/vaccineSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService';

// Async Thunk for registering a new vaccine
export const registerVaccine = createAsyncThunk(
    'vaccine/registerVaccine',
    async (vaccineData, { rejectWithValue }) => {
        try {
            const response = await apiService.registerVaccine(vaccineData);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW: Async Thunk for fetching all vaccines
export const fetchAllVaccines = createAsyncThunk(
    'vaccine/fetchAllVaccines',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.getAllVaccines(); // Assuming apiService.getAllVaccines exists and works
            return response.data; // This should be an array of vaccine objects
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

const vaccineSlice = createSlice({
    name: 'vaccine',
    initialState: {
        vaccines: [], // To store a list of vaccines if fetched later
        registrationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        registrationError: null,
        fetchStatus: 'idle', // NEW: Status for fetching all vaccines
        fetchError: null,    // NEW: Error for fetching all vaccines
        updateStatus: 'idle',
        updateError: null,
    },
    reducers: {
        clearRegistrationStatus(state) {
            state.registrationStatus = 'idle';
            state.registrationError = null;
        },
        clearUpdateStatus(state) {
            state.updateStatus = 'idle';
            state.updateError = null;
        },
        // Optionally, clear fetch status as well
        clearFetchStatus(state) {
            state.fetchStatus = 'idle';
            state.fetchError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle vaccine registration
            .addCase(registerVaccine.pending, (state) => {
                state.registrationStatus = 'loading';
                state.registrationError = null;
            })
            .addCase(registerVaccine.fulfilled, (state, action) => {
                state.registrationStatus = 'succeeded';
                // If you want new vaccines to appear in the list immediately
                // state.vaccines.push(action.payload.vaccine);
            })
            .addCase(registerVaccine.rejected, (state, action) => {
                state.registrationStatus = 'failed';
                state.registrationError = action.payload;
            })
            // NEW: Handle fetching all vaccines
            .addCase(fetchAllVaccines.pending, (state) => {
                state.fetchStatus = 'loading';
                state.fetchError = null;
            })
            .addCase(fetchAllVaccines.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.vaccines = action.payload; // Set the fetched array of vaccines
                state.fetchError = null;
            })
            .addCase(fetchAllVaccines.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.fetchError = action.payload;
                state.vaccines = []; // Clear vaccines on error, or keep previous state if preferred
            });
    },
});

export const { clearRegistrationStatus, clearUpdateStatus, clearFetchStatus } = vaccineSlice.actions; // Export new action
export default vaccineSlice.reducer;