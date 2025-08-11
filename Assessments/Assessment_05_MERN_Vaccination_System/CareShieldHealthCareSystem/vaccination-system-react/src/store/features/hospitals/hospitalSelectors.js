// src/store/features/hospital/hospitalSelectors.js
import { createSelector } from '@reduxjs/toolkit';

// Corrected: Access state.hospitals (plural) to match the store configuration
const selectHospitalState = (state) => state.hospitals;

export const selectHospitals = createSelector(
    selectHospitalState,
    (hospitalState) => hospitalState.hospitals
);

export const selectHospitalsLoading = createSelector(
    selectHospitalState,
    (hospitalState) => hospitalState.loading
);

export const selectHospitalsError = createSelector(
    selectHospitalState,
    (hospitalState) => hospitalState.error
);