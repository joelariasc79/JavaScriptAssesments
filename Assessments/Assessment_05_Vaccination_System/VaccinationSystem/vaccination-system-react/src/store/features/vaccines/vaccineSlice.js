// src/store/features/vaccine/vaccineSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'; // Make sure createSelector is imported here
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

// Async Thunk for fetching all vaccines
export const fetchAllVaccines = createAsyncThunk(
    'vaccine/fetchAllVaccines',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.getAllVaccines();
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

const vaccineSlice = createSlice({
    name: 'vaccine',
    initialState: {
        vaccines: [],
        registrationStatus: 'idle',
        registrationError: null,
        fetchStatus: 'idle',
        fetchError: null,
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
            })
            .addCase(registerVaccine.rejected, (state, action) => {
                state.registrationStatus = 'failed';
                state.registrationError = action.payload;
            })
            // Handle fetching all vaccines
            .addCase(fetchAllVaccines.pending, (state) => {
                state.fetchStatus = 'loading';
                state.fetchError = null;
            })
            .addCase(fetchAllVaccines.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.vaccines = action.payload;
                state.fetchError = null;
            })
            .addCase(fetchAllVaccines.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.fetchError = action.payload;
                state.vaccines = [];
            });
    },
});

// Export synchronous actions directly from the slice
export const { clearRegistrationStatus, clearUpdateStatus, clearFetchStatus } = vaccineSlice.actions;

// --- IMPORTANT: Move all selector exports here, before the default export ---
const selectVaccineState = (state) => state.vaccines; // Assuming 'vaccine' is the correct key in your root reducer

export const selectRegistrationStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.registrationStatus
);

export const selectRegistrationError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.registrationError
);

export const selectAllVaccines = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.vaccines
);

// Selectors for fetching all vaccines status and error
export const selectFetchVaccinesStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchStatus
);

export const selectFetchVaccinesError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchError
);
// --- End of selector exports ---

// The default export should typically be the last line for clarity
export default vaccineSlice.reducer;

