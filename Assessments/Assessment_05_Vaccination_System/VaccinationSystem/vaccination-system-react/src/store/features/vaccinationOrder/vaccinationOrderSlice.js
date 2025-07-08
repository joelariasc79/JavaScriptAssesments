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

// Thunk for fetching all users (patients) - needed for the dropdown
// This might ideally live in a 'users' slice, but for this specific request,
// we'll place it here or integrate if a 'users' slice already exists.
// Assuming for now it comes from vaccine slice if users are just patients
// If a general user management is needed, create a separate usersSlice.
// For simplicity and direct requirement, let's just make sure we fetch users.
// We will put this in a new usersSlice.js for better architecture.

const vaccinationOrderSlice = createSlice({
    name: 'vaccinationOrder',
    initialState: {
        orders: [], // To store a list of orders (if we implement fetching them)
        createStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        createError: null,
        // Add other states for payment, appointment, vaccination status if needed later
    },
    reducers: {
        clearCreateStatus(state) {
            state.createStatus = 'idle';
            state.createError = null;
        },
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
                // Optionally add the new order to the 'orders' array
                // state.orders.push(action.payload.order);
            })
            .addCase(createVaccinationOrder.rejected, (state, action) => {
                state.createStatus = 'failed';
                state.createError = action.payload;
            });
    },
});

export const { clearCreateStatus } = vaccinationOrderSlice.actions;
export default vaccinationOrderSlice.reducer;