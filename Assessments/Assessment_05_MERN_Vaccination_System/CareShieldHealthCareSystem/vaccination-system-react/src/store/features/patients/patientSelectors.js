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

// NEW: Selectors for patient dashboard summary data
export const selectPatientDashboard = createSelector(
    selectPatientState,
    (patientState) => patientState.patientDashboard
);
export const selectDashboardStatus = createSelector(
    selectPatientState,
    (patientState) => patientState.dashboardStatus
);
export const selectDashboardError = createSelector(
    selectPatientState,
    (patientState) => patientState.dashboardError
);

// Selectors for patient orders
export const selectPatientOrders = createSelector(
    selectPatientState,
    (patientState) => patientState.patientOrders
);
export const selectPatientOrdersStatus = createSelector(
    selectPatientState,
    (patientState) => patientState.patientOrdersStatus
);
export const selectPatientOrdersError = createSelector(
    selectPatientState,
    (patientState) => patientState.patientOrdersError
);

// Selectors for appointment scheduling
export const selectAppointmentSchedulingStatus = createSelector(
    selectPatientState,
    (patientState) => patientState.appointmentSchedulingStatus
);
export const selectAppointmentSchedulingError = createSelector(
    selectPatientState,
    (patientState) => patientState.appointmentSchedulingError
);

// Selectors for approved appointments
export const selectApprovedAppointments = createSelector(
    selectPatientState,
    (patientState) => patientState.approvedAppointments
);
export const selectApprovedAppointmentsStatus = createSelector(
    selectPatientState,
    (patientState) => patientState.approvedAppointmentsStatus
);
export const selectApprovedAppointmentsError = createSelector(
    selectPatientState,
    (patientState) => patientState.approvedAppointmentsError
);