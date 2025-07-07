// src/store/features/vaccineStock/vaccineStockSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService';

// Async Thunk to fetch vaccine stock for a specific hospital and vaccine
export const fetchVaccineStock = createAsyncThunk(
    'vaccineStock/fetchVaccineStock',
    async ({ hospitalId, vaccineId }, { rejectWithValue }) => {
        try {
            // This assumes a GET endpoint like /api/vaccine-stock/:hospitalId/:vaccineId
            const response = await apiService.getVaccineStock(hospitalId, vaccineId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            // If stock record doesn't exist, the backend should ideally return quantity: 0.
            // If it returns a 404, we'll catch it here and return a default 0 quantity.
            if (error.response?.status === 404) {
                return { hospital: hospitalId, vaccine: vaccineId, quantity: 0, message: 'No stock record found, quantity defaulted to 0.' };
            }
            return rejectWithValue(message);
        }
    }
);

// Async Thunk to update vaccine stock
export const updateVaccineStock = createAsyncThunk(
    'vaccineStock/updateVaccineStock',
    async ({ hospitalId, vaccineId, changeQty }, { rejectWithValue }) => {
        try {
            // This assumes a PATCH endpoint like /api/vaccine-stock/:hospitalId/:vaccineId
            // The backend will ADD changeQty to current stock.
            const response = await apiService.updateVaccineStock(hospitalId, vaccineId, changeQty);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

const vaccineStockSlice = createSlice({
    name: 'vaccineStock',
    initialState: {
        currentStock: null, // Stores the fetched stock for the selected vaccine/hospital
        loadingStock: false,
        errorStock: null,
        updateStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        updateError: null,
    },
    reducers: {
        clearStockStatus(state) {
            state.loadingStock = false;
            state.errorStock = null;
            state.updateStatus = 'idle';
            state.updateError = null;
        },
        clearCurrentStock(state) {
            state.currentStock = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Vaccine Stock
            .addCase(fetchVaccineStock.pending, (state) => {
                state.loadingStock = true;
                state.errorStock = null;
                state.currentStock = null; // Clear previous stock when fetching new one
            })
            .addCase(fetchVaccineStock.fulfilled, (state, action) => {
                state.loadingStock = false;
                state.currentStock = action.payload; // Payload should contain { quantity: X, ... }
            })
            .addCase(fetchVaccineStock.rejected, (state, action) => {
                state.loadingStock = false;
                state.errorStock = action.payload;
                state.currentStock = null;
            })
            // Update Vaccine Stock
            .addCase(updateVaccineStock.pending, (state) => {
                state.updateStatus = 'loading';
                state.updateError = null;
            })
            .addCase(updateVaccineStock.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                state.currentStock = action.payload.stock; // Update current stock with the new value
            })
            .addCase(updateVaccineStock.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.updateError = action.payload;
            });
    },
});

export const { clearStockStatus, clearCurrentStock } = vaccineStockSlice.actions;
export default vaccineStockSlice.reducer;