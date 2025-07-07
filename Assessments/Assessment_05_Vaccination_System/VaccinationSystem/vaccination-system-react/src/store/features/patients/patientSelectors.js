// src/store/features/patients/patientSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectPatientState = (state) => state.patients;

export const selectRegistrationStatus = createSelector(
    selectPatientState,
    (patientState) => patientState.registrationStatus
);

export const selectRegistrationError = createSelector(
    selectPatientState,
    (patientState) => patientState.registrationError
);

export const selectRegisteredPatient = createSelector(
    selectPatientState,
    (patientState) => patientState.registeredPatient
);

// If you implement other patient-specific data, you'd add selectors here too, e.g.:
// export const selectPatientDashboard = createSelector(
//     selectPatientState,
//     (patientState) => patientState.patientDashboard
// );

// export const selectDashboardStatus = createSelector(
//     selectPatientState,
//     (patientState) => patientState.dashboardStatus
// );

// export const selectDashboardError = createSelector(
//     selectPatientState,
//     (patientState) => patientState.dashboardError
// );