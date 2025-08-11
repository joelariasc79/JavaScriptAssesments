// src/store/features/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import hospitalsReducer from './features/hospitals/hospitalSlice';
import vaccinesReducer from './features/vaccines/vaccineSlice';
import vaccineStockReducer from './features/vaccineStock/vaccineStockSlice';
import patientsReducer from './features/patients/patientSlice';
import vaccinationOrderReducer from './features/vaccinationOrder/vaccinationOrderSlice';
import usersReducer from './features/users/usersSlice';
import pendingOrdersReducer from './features/pendingOrders/pendingOrdersSlice';
import reportsReducer from './features/reports/reportsSlice';
import suggestionsReducer from './features/vaccineSuggestions/vaccineSuggestionsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        hospitals: hospitalsReducer,
        vaccines: vaccinesReducer,
        vaccineStock: vaccineStockReducer,
        patients: patientsReducer,
        suggestions: suggestionsReducer,
        vaccinationOrder: vaccinationOrderReducer,
        users: usersReducer,
        pendingOrders: pendingOrdersReducer,
        reports: reportsReducer
    },
    // Middleware can be added here. Redux Toolkit includes redux-thunk by default.
    // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(myCustomMiddleware),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools only in development
});