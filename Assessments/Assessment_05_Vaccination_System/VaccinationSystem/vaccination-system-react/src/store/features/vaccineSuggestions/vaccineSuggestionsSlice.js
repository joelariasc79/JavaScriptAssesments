// src/store/features/vaccineSuggestions/vaccineStockSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService'; // Assuming the path to your apiService

// Async thunk to fetch vaccine suggestions from the backend
export const fetchVaccineSuggestions = createAsyncThunk(
    'suggestions/fetchVaccineSuggestions',
    async (patientId, { rejectWithValue }) => {
        try {
            const response = await apiService.getVaccineSuggestions(patientId);
            // The API response is { success: true, data: [...] }
            // We return the entire response object so the reducer can access both 'success' and 'data'
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch suggestions');
        }
    }
);

const initialState = {
    data: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const vaccineSuggestionsSlice = createSlice({
    name: 'suggestions',
    initialState,
    reducers: {
        // ...
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVaccineSuggestions.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchVaccineSuggestions.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Now, we'll assign the data array directly from the payload.
                // We use a defensive check to ensure 'action.payload.data' exists.
                state.data = action.payload?.data || [];
                state.error = null; // Clear any previous errors
            })
            .addCase(fetchVaccineSuggestions.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.data = []; // Clear data on failure
                console.error('Failed to fetch vaccine suggestions:', action.payload);
            });
    },
});


export const { clearSuggestions } = vaccineSuggestionsSlice.actions;
export default vaccineSuggestionsSlice.reducer;