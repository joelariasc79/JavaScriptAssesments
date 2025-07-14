// src/store/features/vaccinationOrder/vaccinationOrderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService';

// Thunk for creating a vaccination order
export const createVaccinationOrder = createAsyncThunk(
    'vaccinationOrder/createVaccinationOrder',
    async (orderData, { rejectWithValue }) => {
        try {
            const response = await apiService.createVaccinationOrder(orderData);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// Thunk for fetching all vaccination orders for the current patient
export const fetchPatientVaccinationOrders = createAsyncThunk(
    'vaccinationOrder/fetchPatientVaccinationOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.getPatientVaccinationOrders();
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Thunk for marking an order as vaccinated
export const markOrderAsVaccinated = createAsyncThunk(
    'vaccinationOrder/markOrderAsVaccinated',
    async ({ orderId, vaccinationDate }, { rejectWithValue }) => {
        try {
            const response = await apiService.markOrderAsVaccinated(orderId, vaccinationDate);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Thunk for marking an order as paid
export const markOrderAsPaid = createAsyncThunk(
    'vaccinationOrder/markOrderAsPaid',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await apiService.markOrderAsPaid(orderId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Thunk for scheduling an appointment
export const scheduleAppointment = createAsyncThunk(
    'vaccinationOrder/scheduleAppointment',
    async ({ orderId, appointmentDate }, { rejectWithValue }) => {
        try {
            const response = await apiService.schedulePatientAppointment(orderId, { appointment_date: appointmentDate });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Thunk for patient to cancel an order
export const cancelOrderByPatient = createAsyncThunk(
    'vaccinationOrder/cancelOrderByPatient',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await apiService.cancelOrderByPatient(orderId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// NEW Thunk for fetching vaccinated persons by hospital
export const fetchVaccinatedPersonsByHospital = createAsyncThunk(
    'vaccinationOrder/fetchVaccinatedPersonsByHospital',
    async (hospitalId, { rejectWithValue }) => {
        try {
            const response = await apiService.getVaccinatedPersonsByHospital(hospitalId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);


const vaccinationOrderSlice = createSlice({
    name: 'vaccinationOrder',
    initialState: {
        orders: [],
        createStatus: 'idle',
        createError: null,

        patientOrders: [],
        fetchPatientOrdersStatus: 'idle',
        fetchPatientOrdersError: null,

        markVaccinatedStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        markVaccinatedError: null,

        markPaidStatus: 'idle',
        markPaidError: null,

        scheduleAppointmentStatus: 'idle',
        scheduleAppointmentError: null,

        cancelOrderStatus: 'idle',
        cancelOrderError: null,

        vaccinatedPersons: [], // NEW: State to store vaccinated persons data
        fetchVaccinatedPersonsStatus: 'idle', // NEW: Status for fetching vaccinated persons
        fetchVaccinatedPersonsError: null, // NEW: Error for fetching vaccinated persons
    },
    reducers: {
        clearCreateStatus(state) {
            state.createStatus = 'idle';
            state.createError = null;
        },
        clearFetchPatientOrdersStatus(state) {
            state.fetchPatientOrdersStatus = 'idle';
            state.fetchPatientOrdersError = null;
        },
        clearMarkVaccinatedStatus(state) {
            state.markVaccinatedStatus = 'idle';
            state.markVaccinatedError = null;
        },
        clearMarkPaidStatus(state) {
            state.markPaidStatus = 'idle';
            state.markPaidError = null;
        },
        clearScheduleAppointmentStatus(state) {
            state.scheduleAppointmentStatus = 'idle';
            state.scheduleAppointmentError = null;
        },
        clearCancelOrderStatus(state) {
            state.cancelOrderStatus = 'idle';
            state.cancelOrderError = null;
        },
        clearFetchVaccinatedPersonsStatus(state) { // NEW: Clear action for vaccinated persons status
            state.fetchVaccinatedPersonsStatus = 'idle';
            state.fetchVaccinatedPersonsError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle Create Vaccination Order
            .addCase(createVaccinationOrder.pending, (state) => {
                state.createStatus = 'loading';
                state.createError = null;
            })
            .addCase(createVaccinationOrder.fulfilled, (state, action) => {
                state.createStatus = 'succeeded';
            })
            .addCase(createVaccinationOrder.rejected, (state, action) => {
                state.createStatus = 'failed';
                state.createError = action.payload;
            })
            // Handle Fetch Patient Vaccination Orders
            .addCase(fetchPatientVaccinationOrders.pending, (state) => {
                state.fetchPatientOrdersStatus = 'loading';
                state.fetchPatientOrdersError = null;
            })
            .addCase(fetchPatientVaccinationOrders.fulfilled, (state, action) => {
                state.fetchPatientOrdersStatus = 'succeeded';
                state.patientOrders = action.payload.orders;
            })
            .addCase(fetchPatientVaccinationOrders.rejected, (state, action) => {
                state.fetchPatientOrdersStatus = 'failed';
                state.fetchPatientOrdersError = action.payload;
                state.patientOrders = [];
            })
            // Handle Mark Order As Vaccinated
            .addCase(markOrderAsVaccinated.pending, (state) => {
                state.markVaccinatedStatus = 'loading';
                state.markVaccinatedError = null;
            })
            .addCase(markOrderAsVaccinated.fulfilled, (state, action) => {
                state.markVaccinatedStatus = 'succeeded';
                // Update the specific order in the PatientVaccinationOrders list
                state.patientOrders = state.patientOrders.map(order =>
                    order._id === action.payload.order._id ? action.payload.order : order
                );
            })
            .addCase(markOrderAsVaccinated.rejected, (state, action) => {
                state.markVaccinatedStatus = 'failed';
                state.markVaccinatedError = action.payload;
            })
            // Handle Mark Order As Paid
            .addCase(markOrderAsPaid.pending, (state) => {
                state.markPaidStatus = 'loading';
                state.markPaidError = null;
            })
            .addCase(markOrderAsPaid.fulfilled, (state, action) => {
                state.markPaidStatus = 'succeeded';
                state.patientOrders = state.patientOrders.map(order =>
                    order._id === action.payload.order._id ? action.payload.order : order
                );
            })
            .addCase(markOrderAsPaid.rejected, (state, action) => {
                state.markPaidStatus = 'failed';
                state.markPaidError = action.payload;
            })
            // Handle Schedule Appointment
            .addCase(scheduleAppointment.pending, (state) => {
                state.scheduleAppointmentStatus = 'loading';
                state.scheduleAppointmentError = null;
            })
            .addCase(scheduleAppointment.fulfilled, (state, action) => {
                state.scheduleAppointmentStatus = 'succeeded';
                state.patientOrders = state.patientOrders.map(order =>
                    order._id === action.payload.order._id ? action.payload.order : order
                );
            })
            .addCase(scheduleAppointment.rejected, (state, action) => {
                state.scheduleAppointmentStatus = 'failed';
                state.scheduleAppointmentError = action.payload;
            })
            // Handle Cancel Order By Patient
            .addCase(cancelOrderByPatient.pending, (state) => {
                state.cancelOrderStatus = 'loading';
                state.cancelOrderError = null;
            })
            .addCase(cancelOrderByPatient.fulfilled, (state, action) => {
                state.cancelOrderStatus = 'succeeded';
                // Remove the cancelled order from the list
                state.patientOrders = state.patientOrders.filter(order =>
                    order._id !== action.payload.order._id
                );
            })
            .addCase(cancelOrderByPatient.rejected, (state, action) => {
                state.cancelOrderStatus = 'failed';
                state.cancelOrderError = action.payload;
            })
            // Handle Fetch Vaccinated Persons By Hospital
            .addCase(fetchVaccinatedPersonsByHospital.pending, (state) => {
                state.fetchVaccinatedPersonsStatus = 'loading';
                state.fetchVaccinatedPersonsError = null;
            })
            .addCase(fetchVaccinatedPersonsByHospital.fulfilled, (state, action) => {
                state.fetchVaccinatedPersonsStatus = 'succeeded';
                state.vaccinatedPersons = action.payload.records; // Assuming the API returns a 'records' array
            })
            .addCase(fetchVaccinatedPersonsByHospital.rejected, (state, action) => {
                state.fetchVaccinatedPersonsStatus = 'failed';
                state.fetchVaccinatedPersonsError = action.payload;
                state.vaccinatedPersons = []; // Clear data on failure
            });
    },
});

export const {
    clearCreateStatus,
    clearFetchPatientOrdersStatus,
    clearMarkVaccinatedStatus,
    clearMarkPaidStatus,
    clearScheduleAppointmentStatus,
    clearCancelOrderStatus,
    clearFetchVaccinatedPersonsStatus // NEW: Export the new clear action
} = vaccinationOrderSlice.actions;
export default vaccinationOrderSlice.reducer;
