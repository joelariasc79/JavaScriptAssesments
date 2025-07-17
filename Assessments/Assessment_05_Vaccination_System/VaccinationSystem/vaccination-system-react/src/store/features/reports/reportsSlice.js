import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../../api/apiService'; // Adjust path as necessary

// Async Thunks for fetching reports
export const fetchUserDemographicsReport = createAsyncThunk(
    'reports/fetchUserDemographicsReport',
    async (groupBy, { rejectWithValue }) => {
        try {
            const response = await apiService.getUserDemographicsReport(groupBy);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchDosesDailyReport = createAsyncThunk(
    'reports/fetchDosesDailyReport',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const response = await apiService.getDosesDailyReport(filters);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchPopulationCoverageReport = createAsyncThunk(
    'reports/fetchPopulationCoverageReport',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const response = await apiService.getPopulationCoverageReport(filters);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const reportsSlice = createSlice({
    name: 'reports',
    initialState: {
        userDemographics: null, // Will store data for demographics report
        dosesDaily: null,       // Will store data for daily doses report
        populationCoverage: null, // Will store data for population coverage report
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        clearReportsStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        },
        clearAllReportsData: (state) => {
            state.userDemographics = null;
            state.dosesDaily = null;
            state.populationCoverage = null;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Handle fetchUserDemographicsReport
        builder
            .addCase(fetchUserDemographicsReport.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchUserDemographicsReport.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.userDemographics = action.payload;
            })
            .addCase(fetchUserDemographicsReport.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch user demographics report.';
            });

        // Handle fetchDosesDailyReport
        builder
            .addCase(fetchDosesDailyReport.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDosesDailyReport.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.dosesDaily = action.payload;
            })
            .addCase(fetchDosesDailyReport.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch daily doses report.';
            });

        // Handle fetchPopulationCoverageReport
        builder
            .addCase(fetchPopulationCoverageReport.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchPopulationCoverageReport.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.populationCoverage = action.payload;
            })
            .addCase(fetchPopulationCoverageReport.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to fetch population coverage report.';
            });
    },
});

export const { clearReportsStatus, clearAllReportsData } = reportsSlice.actions;

export default reportsSlice.reducer;