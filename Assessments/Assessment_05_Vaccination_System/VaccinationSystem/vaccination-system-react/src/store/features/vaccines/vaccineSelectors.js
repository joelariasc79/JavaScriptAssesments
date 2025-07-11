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


export const selectFetchVaccinesStatus = createSelector( // Corrected name
    selectVaccineState,
    (vaccineState) => vaccineState.fetchStatus
);

export const selectFetchVaccinesError = createSelector( // Corrected name
    selectVaccineState,
    (vaccineState) => vaccineState.fetchError
);