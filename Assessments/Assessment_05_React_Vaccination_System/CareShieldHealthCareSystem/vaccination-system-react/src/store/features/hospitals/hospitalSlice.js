// src/store/features/hospital/hospitalSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService'; // Assuming apiService handles API calls

// Async Thunk for fetching hospitals
export const fetchHospitals = createAsyncThunk(
    'hospital/fetchHospitals',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.getAllHospitals();
            return response.data; // apiService should return data directly
        } catch (error) {
            // Use rejectWithValue to pass the error message to the rejected action
            const message = error.response?.data?.message || error.message;
            return rejectWithValue(message);
        }
    }
);

const hospitalSlice = createSlice({
    name: 'hospital',
    initialState: {
        hospitals: [],
        loading: false,
        error: null,
    },
    reducers: {
        // You can add synchronous reducers here if needed (e.g., clearHospitals)
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHospitals.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHospitals.fulfilled, (state, action) => {
                state.loading = false;
                state.hospitals = action.payload;
            })
            .addCase(fetchHospitals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // action.payload contains the error message from rejectWithValue
            });
    },
});

// Export actions and reducer
export const { /* if any synchronous actions are added */ } = hospitalSlice.actions;
export default hospitalSlice.reducer;