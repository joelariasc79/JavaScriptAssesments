import { createSelector } from '@reduxjs/toolkit';

const selectVaccineState = (state) => state.vaccines; // Assuming 'vaccine' is the correct key in your root reducer

export const selectRegistrationStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.registrationStatus
);

export const selectRegistrationError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.registrationError
);

export const selectAllVaccines = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.vaccines
);

// NEW: Selectors for fetching all vaccines status and error
export const selectFetchVaccinesStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchStatus
);

export const selectFetchVaccinesError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchError
);