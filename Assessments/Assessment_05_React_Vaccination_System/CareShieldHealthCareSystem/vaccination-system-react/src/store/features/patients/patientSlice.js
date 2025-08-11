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

// NEW: Async Thunk for fetching patient dashboard summary data
export const fetchPatientDashboard = createAsyncThunk(
    'patients/fetchPatientDashboard',
    async (patientId, { rejectWithValue }) => {
        try {
            const response = await apiService.getPatientDashboard(patientId);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return rejectWithValue(errorMessage);
        }
    }
);

// NEW: Async Thunk for fetching a patient's vaccination orders
export const fetchPatientVaccinationOrders = createAsyncThunk(
    'patients/fetchPatientVaccinationOrders',
    async (patientId, { rejectWithValue }) => {
        try {
            const response = await apiService.getPatientVaccinationOrders(patientId);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return rejectWithValue(errorMessage);
        }
    }
);

// NEW: Async Thunk for scheduling an appointment for an order
export const schedulePatientAppointment = createAsyncThunk(
    'patients/schedulePatientAppointment',
    async ({ orderId, appointmentData }, { rejectWithValue }) => {
        try {
            const response = await apiService.schedulePatientAppointment(orderId, appointmentData);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return rejectWithValue(errorMessage);
        }
    }
);

// NEW: Async Thunk for fetching approved appointments for a patient
export const fetchPatientApprovedAppointments = createAsyncThunk(
    'patients/fetchPatientApprovedAppointments',
    async (patientId, { rejectWithValue }) => {
        try {
            const response = await apiService.getPatientApprovedAppointments(patientId);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return rejectWithValue(errorMessage);
        }
    }
);

const patientSlice = createSlice({
    name: 'patients',
    initialState: {
        registrationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        registrationError: null,
        registeredPatient: null,

        patientDashboard: null, // NEW: Stores patient dashboard summary data
        dashboardStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        dashboardError: null,

        patientOrders: [], // Stores all vaccination orders for the patient
        patientOrdersStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        patientOrdersError: null,

        appointmentSchedulingStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        appointmentSchedulingError: null,

        approvedAppointments: [], // Stores scheduled/approved appointments
        approvedAppointmentsStatus: 'idle',
        approvedAppointmentsError: null,
    },
    reducers: {
        clearRegistrationStatus: (state) => {
            state.registrationStatus = 'idle';
            state.registrationError = null;
            state.registeredPatient = null;
        },
        // NEW: Clear dashboard status
        clearDashboardStatus: (state) => {
            state.dashboardStatus = 'idle';
            state.dashboardError = null;
            state.patientDashboard = null;
        },
        // Clear status for orders and appointments
        clearPatientOrdersStatus: (state) => {
            state.patientOrdersStatus = 'idle';
            state.patientOrdersError = null;
            state.patientOrders = [];
        },
        clearAppointmentSchedulingStatus: (state) => {
            state.appointmentSchedulingStatus = 'idle';
            state.appointmentSchedulingError = null;
        },
        clearApprovedAppointmentsStatus: (state) => {
            state.approvedAppointmentsStatus = 'idle';
            state.approvedAppointmentsError = null;
            state.approvedAppointments = [];
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
            })
            // NEW: Cases for fetchPatientDashboard
            .addCase(fetchPatientDashboard.pending, (state) => {
                state.dashboardStatus = 'loading';
                state.dashboardError = null;
            })
            .addCase(fetchPatientDashboard.fulfilled, (state, action) => {
                state.dashboardStatus = 'succeeded';
                state.patientDashboard = action.payload;
                state.dashboardError = null;
            })
            .addCase(fetchPatientDashboard.rejected, (state, action) => {
                state.dashboardStatus = 'failed';
                state.dashboardError = action.payload;
                state.patientDashboard = null;
            })
            // Cases for fetchPatientVaccinationOrders
            .addCase(fetchPatientVaccinationOrders.pending, (state) => {
                state.patientOrdersStatus = 'loading';
                state.patientOrdersError = null;
            })
            .addCase(fetchPatientVaccinationOrders.fulfilled, (state, action) => {
                state.patientOrdersStatus = 'succeeded';
                state.patientOrders = action.payload;
                state.patientOrdersError = null;
            })
            .addCase(fetchPatientVaccinationOrders.rejected, (state, action) => {
                state.patientOrdersStatus = 'failed';
                state.patientOrdersError = action.payload;
                state.patientOrders = [];
            })
            // Cases for schedulePatientAppointment
            .addCase(schedulePatientAppointment.pending, (state) => {
                state.appointmentSchedulingStatus = 'loading';
                state.appointmentSchedulingError = null;
            })
            .addCase(schedulePatientAppointment.fulfilled, (state, action) => {
                state.appointmentSchedulingStatus = 'succeeded';
                // Optionally update the specific order in patientOrders if needed
                state.appointmentSchedulingError = null;
            })
            .addCase(schedulePatientAppointment.rejected, (state, action) => {
                state.appointmentSchedulingStatus = 'failed';
                state.appointmentSchedulingError = action.payload;
            })
            // Cases for fetchPatientApprovedAppointments
            .addCase(fetchPatientApprovedAppointments.pending, (state) => {
                state.approvedAppointmentsStatus = 'loading';
                state.approvedAppointmentsError = null;
            })
            .addCase(fetchPatientApprovedAppointments.fulfilled, (state, action) => {
                state.approvedAppointmentsStatus = 'succeeded';
                state.approvedAppointments = action.payload;
                state.approvedAppointmentsError = null;
            })
            .addCase(fetchPatientApprovedAppointments.rejected, (state, action) => {
                state.approvedAppointmentsStatus = 'failed';
                state.approvedAppointmentsError = action.payload;
                state.approvedAppointments = [];
            });
    },
});

export const {
    clearRegistrationStatus,
    clearDashboardStatus, // Export new clear action
    clearPatientOrdersStatus,
    clearAppointmentSchedulingStatus,
    clearApprovedAppointmentsStatus
} = patientSlice.actions; // Export synchronous actions

export default patientSlice.reducer;