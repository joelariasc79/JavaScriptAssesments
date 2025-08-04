// import { createSelector } from '@reduxjs/toolkit';
//
// const selectVaccineState = (state) => state.vaccines; // Assuming 'vaccines' is the correct key in your root reducer
//
// export const selectRegistrationStatus = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.registrationStatus
// );
//
// export const selectRegistrationError = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.registrationError
// );
//
// export const selectAllVaccines = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.vaccines
// );
//
// export const selectFetchVaccinesStatus = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.fetchStatus
// );
//
// export const selectFetchVaccinesError = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.fetchError
// );
//
// export const selectSelectedVaccine = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.selectedVaccine
// );
//
// export const selectFetchVaccineByIdStatus = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.fetchByIdStatus
// );
//
// export const selectFetchVaccineByIdError = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.fetchByIdError
// );
//
// export const selectUpdateVaccineStatus = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.updateStatus
// );
//
// export const selectUpdateVaccineError = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.updateError
// );
//
// export const selectDeleteVaccineStatus = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.deleteStatus
// );
//
// export const selectDeleteVaccineError = createSelector(
//     selectVaccineState,
//     (vaccineState) => vaccineState.deleteError
// );





import { createSelector } from '@reduxjs/toolkit';

const selectVaccineState = (state) => state.vaccines; // Assuming 'vaccines' is the correct key in your root reducer

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

export const selectFetchVaccinesStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchStatus
);

export const selectFetchVaccinesError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchError
);

export const selectSelectedVaccine = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.selectedVaccine
);

export const selectFetchVaccineByIdStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchByIdStatus
);

export const selectFetchVaccineByIdError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.fetchByIdError
);

export const selectUpdateVaccineStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.updateStatus
);

export const selectUpdateVaccineError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.updateError
);

export const selectDeleteVaccineStatus = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.deleteStatus
);

export const selectDeleteVaccineError = createSelector(
    selectVaccineState,
    (vaccineState) => vaccineState.deleteError
);