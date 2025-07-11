// src/store/features/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import hospitalsReducer from './features/hospitals/hospitalSlice';
import vaccinesReducer from './features/vaccines/vaccineSlice';
import vaccineStockReducer from './features/vaccineStock/vaccineStockSlice';
import patientsReducer from './features/patients/patientSlice';
import vaccinationOrderReducer from './features/vaccinationOrder/vaccinationOrderSlice';
import usersReducer from './features/users/usersSlice';
import pendingOrdersReducer from './features/pendingOrders/pendingOrdersSlice'; // NEW: Import the new reducer


// import bookingsReducer from './features/bookings/bookingsSlice';
// import paymentsReducer from './features/payments/paymentsSlice';
// import reportsReducer from './features/reports/reportsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        hospitals: hospitalsReducer,
        vaccines: vaccinesReducer,
        vaccineStock: vaccineStockReducer,
        patients: patientsReducer,
        vaccinationOrder: vaccinationOrderReducer,
        users: usersReducer,
        pendingOrders: pendingOrdersReducer
        // ,
        // bookings: bookingsReducer,
        // payments: paymentsReducer,
        // reports: reportsReducer,
    },
    // Middleware can be added here. Redux Toolkit includes redux-thunk by default.
    // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(myCustomMiddleware),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools only in development
});