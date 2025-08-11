// src/store/features/pendingOrders/pendingOrdersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService'; // Adjust path as needed

// Async Thunk for fetching pending approval orders
export const fetchPendingApprovalOrders = createAsyncThunk(
    'pendingOrders/fetchPendingApprovalOrders',
    async (hospitalId, { rejectWithValue }) => {
        try {
            const response = await apiService.getPendingApprovalVaccinationOrders(hospitalId);
            return response.data.orders; // Assuming the API returns { message, orders: [...] }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// Async Thunk for approving an order
export const approveVaccinationOrder = createAsyncThunk(
    'pendingOrders/approveVaccinationOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await apiService.approveVaccinationOrder(`/api/vaccination-orders/${orderId}/approve`);
            return response.data.order;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

// Async Thunk for rejecting an order
export const rejectVaccinationOrder = createAsyncThunk(
    'pendingOrders/rejectVaccinationOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await apiService.rejectVaccinationOrder(`/api/vaccination-orders/${orderId}/reject`);
            return response.data.order;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);


const pendingOrdersSlice = createSlice({
    name: 'pendingOrders',
    initialState: {
        orders: [],
        loading: false,
        error: null,
        approveStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        approveError: null,
        rejectStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        rejectError: null,
    },
    reducers: {
        clearPendingOrdersStatus: (state) => {
            state.loading = false;
            state.error = null;
        },
        clearApproveStatus: (state) => {
            state.approveStatus = 'idle';
            state.approveError = null;
        },
        clearRejectStatus: (state) => {
            state.rejectStatus = 'idle';
            state.rejectError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch pending orders
            .addCase(fetchPendingApprovalOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingApprovalOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(fetchPendingApprovalOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Approve order
            .addCase(approveVaccinationOrder.pending, (state) => {
                state.approveStatus = 'loading';
                state.approveError = null;
            })
            .addCase(approveVaccinationOrder.fulfilled, (state, action) => {
                state.approveStatus = 'succeeded';
                // Remove the approved order from the list or update its status locally
                state.orders = state.orders.filter(order => order._id !== action.payload._id);
                // If you want to replace the order with the updated one, use map:
                // state.orders = state.orders.map(order =>
                //     order._id === action.payload._id ? action.payload : order
                // );
            })
            .addCase(approveVaccinationOrder.rejected, (state, action) => {
                state.approveStatus = 'failed';
                state.approveError = action.payload;
            })
            // Reject order
            .addCase(rejectVaccinationOrder.pending, (state) => {
                state.rejectStatus = 'loading';
                state.rejectError = null;
            })
            .addCase(rejectVaccinationOrder.fulfilled, (state, action) => {
                state.rejectStatus = 'succeeded';
                // Remove the rejected order from the list
                state.orders = state.orders.filter(order => order._id !== action.payload._id);
            })
            .addCase(rejectVaccinationOrder.rejected, (state, action) => {
                state.rejectStatus = 'failed';
                state.rejectError = action.payload;
            });
    },
});

export const { clearPendingOrdersStatus, clearApproveStatus, clearRejectStatus } = pendingOrdersSlice.actions;
export default pendingOrdersSlice.reducer;