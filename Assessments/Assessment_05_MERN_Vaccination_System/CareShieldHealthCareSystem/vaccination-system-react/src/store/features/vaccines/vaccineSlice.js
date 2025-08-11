// src/store/features/vaccine/vaccineSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService';

// Import selectors from the selectors file to re-export them
import {
    selectAllVaccines,
    selectFetchVaccinesStatus,
    selectFetchVaccinesError
} from './vaccineSelectors'; // Adjust path if your selectors file is not in the same directory

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

// NEW Async Thunk for fetching a single vaccine by ID
export const fetchVaccineById = createAsyncThunk(
    'vaccine/fetchVaccineById',
    async (vaccineId, { rejectWithValue }) => {
        try {
            const response = await apiService.getVaccineById(vaccineId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Async Thunk for updating a vaccine
export const updateVaccine = createAsyncThunk(
    'vaccine/updateVaccine',
    async ({ vaccineId, vaccineData }, { rejectWithValue }) => {
        try {
            const response = await apiService.updateVaccine(vaccineId, vaccineData);
            return response.data; // Expecting { message, vaccine }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Async Thunk for deleting a vaccine
export const deleteVaccine = createAsyncThunk(
    'vaccine/deleteVaccine',
    async (vaccineId, { rejectWithValue }) => {
        try {
            const response = await apiService.deleteVaccine(vaccineId);
            return response.data; // Expecting { message, vaccine: { _id, name } }
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
        fetchStatus: 'idle', // Existing status for fetching ALL vaccines
        fetchError: null,    // Existing error for fetching ALL vaccines
        updateStatus: 'idle',// Existing, now used for updateVaccine
        updateError: null,   // Existing, now used for updateVaccine
        selectedVaccine: null, // NEW: State to hold a single fetched vaccine
        fetchByIdStatus: 'idle', // NEW: Status for fetching a vaccine by ID
        fetchByIdError: null, // NEW: Error for fetching a vaccine by ID
        deleteStatus: 'idle', // NEW: Status for deleting a vaccine
        deleteError: null,    // NEW: Error for deleting a vaccine
    },
    reducers: {
        clearRegistrationStatus(state) {
            state.registrationStatus = 'idle';
            state.registrationError = null;
        },
        clearUpdateStatus(state) { // This existing action will now apply to updateVaccine
            state.updateStatus = 'idle';
            state.updateError = null;
        },
        clearFetchStatus(state) { // Existing action for fetching ALL vaccines
            state.fetchStatus = 'idle';
            state.fetchError = null;
        },
        // NEW clear actions
        clearFetchByIdStatus(state) {
            state.fetchByIdStatus = 'idle';
            state.fetchByIdError = null;
            state.selectedVaccine = null;
        },
        clearDeleteStatus(state) {
            state.deleteStatus = 'idle';
            state.deleteError = null;
        },
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
                // Optionally add the new vaccine to the list if desired, or refetch all
                // state.vaccines.push(action.payload.vaccine); // Assuming payload has a 'vaccine' key
            })
            .addCase(registerVaccine.rejected, (state, action) => {
                state.registrationStatus = 'failed';
                state.registrationError = action.payload;
            })
            // Handle fetching all vaccines (Existing logic, no changes here)
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
            })
            // NEW: Handle fetching vaccine by ID
            .addCase(fetchVaccineById.pending, (state) => {
                state.fetchByIdStatus = 'loading';
                state.fetchByIdError = null;
                state.selectedVaccine = null;
            })
            .addCase(fetchVaccineById.fulfilled, (state, action) => {
                state.fetchByIdStatus = 'succeeded';
                state.selectedVaccine = action.payload;
                state.fetchByIdError = null;
            })
            .addCase(fetchVaccineById.rejected, (state, action) => {
                state.fetchByIdStatus = 'failed';
                state.fetchByIdError = action.payload;
                state.selectedVaccine = null;
            })
            // NEW: Handle updating a vaccine (using existing updateStatus/Error)
            .addCase(updateVaccine.pending, (state) => {
                state.updateStatus = 'loading';
                state.updateError = null;
            })
            .addCase(updateVaccine.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                state.updateError = null;
                const updatedVaccine = action.payload.vaccine;
                if (updatedVaccine) {
                    // Update the vaccine in the all-vaccines list if it exists
                    state.vaccines = state.vaccines.map(v =>
                        v._id === updatedVaccine._id ? updatedVaccine : v
                    );
                    // If the updated vaccine is also the currently selected one, update it
                    if (state.selectedVaccine && state.selectedVaccine._id === updatedVaccine._id) {
                        state.selectedVaccine = updatedVaccine;
                    }
                }
            })
            .addCase(updateVaccine.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.updateError = action.payload;
            })
            // NEW: Handle deleting a vaccine
            .addCase(deleteVaccine.pending, (state) => {
                state.deleteStatus = 'loading';
                state.deleteError = null;
            })
            .addCase(deleteVaccine.fulfilled, (state, action) => {
                state.deleteStatus = 'succeeded';
                state.deleteError = null;
                const deletedId = action.payload.vaccine._id; // Assuming payload has vaccine._id
                state.vaccines = state.vaccines.filter(v => v._id !== deletedId);
                // If the deleted vaccine was the selected one, clear it
                if (state.selectedVaccine && state.selectedVaccine._id === deletedId) {
                    state.selectedVaccine = null;
                }
            })
            .addCase(deleteVaccine.rejected, (state, action) => {
                state.deleteStatus = 'failed';
                state.deleteError = action.payload;
            });
    },
});

// Export synchronous actions directly from the slice
export const {
    clearRegistrationStatus,
    clearUpdateStatus, // Existing, now used for updateVaccine
    clearFetchStatus,  // Existing for fetchAllVaccines
    clearFetchByIdStatus,
    clearDeleteStatus,
} = vaccineSlice.actions;

// Re-export selectors from the selectors file for convenience (to satisfy existing imports)
export { selectAllVaccines, selectFetchVaccinesStatus, selectFetchVaccinesError };


// The default export should typically be the last line for clarity
export default vaccineSlice.reducer;