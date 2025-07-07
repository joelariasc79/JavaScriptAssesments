// src/store/features/patients/patientSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService';

// Async Thunk for patient registration
export const registerPatient = createAsyncThunk(
    'patients/registerPatient',
    async (patientData, { rejectWithValue }) => {
        try {
            const response = await apiService.register(patientData);
            return response.data;
        } catch (error) {
            const errorMessage = error.response && error.response.data
                ? error.response.data
                : { message: error.message || 'An unexpected error occurred during patient registration.' };
            return rejectWithValue(errorMessage);
        }
    }
);

// You can add more thunks here for other patient-related operations like:
// export const fetchPatientDashboard = createAsyncThunk(
//     'patients/fetchPatientDashboard',
//     async (patientId, { rejectWithValue }) => {
//         try {
//             const response = await apiService.getPatientDashboard(patientId);
//             return response.data;
//         } catch (error) {
//             const errorMessage = error.response?.data?.message || error.message;
//             return rejectWithValue(errorMessage);
//         }
//     }
// );

const patientSlice = createSlice({
    name: 'patients',
    initialState: {
        // You can add other patient-specific state here if needed
        registrationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        registrationError: null,
        registeredPatient: null, // Stores data of the newly registered patient
        // patientDashboard: null, // For patient dashboard data
        // dashboardStatus: 'idle',
        // dashboardError: null,
    },
    reducers: {
        // Synchronous actions can be added here if needed
        clearRegistrationStatus: (state) => {
            state.registrationStatus = 'idle';
            state.registrationError = null;
            state.registeredPatient = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerPatient.pending, (state) => {
                state.registrationStatus = 'loading';
                state.registrationError = null;
            })
            .addCase(registerPatient.fulfilled, (state, action) => {
                state.registrationStatus = 'succeeded';
                state.registeredPatient = action.payload;
                state.registrationError = null;
            })
            .addCase(registerPatient.rejected, (state, action) => {
                state.registrationStatus = 'failed';
                state.registrationError = action.payload;
                state.registeredPatient = null;
            });
        // Add more cases for other thunks like fetchPatientDashboard if you implement them
        // .addCase(fetchPatientDashboard.pending, (state) => {
        //     state.dashboardStatus = 'loading';
        //     state.dashboardError = null;
        // })
        // .addCase(fetchPatientDashboard.fulfilled, (state, action) => {
        //     state.dashboardStatus = 'succeeded';
        //     state.patientDashboard = action.payload;
        //     state.dashboardError = null;
        // })
        // .addCase(fetchPatientDashboard.rejected, (state, action) => {
        //     state.dashboardStatus = 'failed';
        //     state.dashboardError = action.payload;
        //     state.patientDashboard = null;
        // });
    },
});

export const { clearRegistrationStatus } = patientSlice.actions; // Export synchronous actions
export default patientSlice.reducer;