// src/store/features/vaccinationOrder/vaccinationOrderSelectors.js
import { createSelector } from '@reduxjs/toolkit'; 

const selectVaccinationOrderState = (state) => state.vaccinationOrder; 

    export const selectCreateOrderStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.createStatus 
);
export const selectCreateOrderError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.createError 
);

export const selectPatientOrders = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.patientOrders 
);
export const selectFetchPatientOrdersStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.fetchPatientOrdersStatus 
);
export const selectFetchPatientOrdersError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.fetchPatientOrdersError 
);

// Selectors for action statuses
export const selectMarkVaccinatedStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.markVaccinatedStatus 
);
export const selectMarkVaccinatedError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.markVaccinatedError 
);

// NEW Selectors for certificate email status
export const selectMarkVaccinatedEmailStatus = createSelector(
    selectVaccinationOrderState,
    (orderState) => orderState.markVaccinatedEmailStatus
);

export const selectMarkVaccinatedEmailMessage = createSelector(
    selectVaccinationOrderState,
    (orderState) => orderState.markVaccinatedEmailMessage
);

export const selectMarkPaidStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.markPaidStatus 
);
export const selectMarkPaidError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.markPaidError 
);
export const selectScheduleAppointmentStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.scheduleAppointmentStatus 
);
export const selectScheduleAppointmentError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.scheduleAppointmentError 
);
export const selectCancelOrderStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.cancelOrderStatus 
);
export const selectCancelOrderError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.cancelOrderError 
);

// Selectors for vaccinated persons by hospital
export const selectVaccinatedPersons = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.vaccinatedPersons 
);
export const selectFetchVaccinatedPersonsStatus = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.fetchVaccinatedPersonsStatus 
);
export const selectFetchVaccinatedPersonsError = createSelector( 
    selectVaccinationOrderState, 
    (orderState) => orderState.fetchVaccinatedPersonsError 
);



// // src/store/features/vaccinationOrder/vaccinationOrderSelectors.js
// import { createSelector } from '@reduxjs/toolkit';
//
// const selectVaccinationOrderState = (state) => state.vaccinationOrder;
//
// export const selectCreateOrderStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.createStatus
// );
//
// export const selectCreateOrderError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.createError
// );
//
// export const selectPatientOrders = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.patientOrders
// );
//
// export const selectFetchPatientOrdersStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.fetchPatientOrdersStatus
// );
//
// export const selectFetchPatientOrdersError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.fetchPatientOrdersError
// );
//
// // NEW Selectors for action statuses
// export const selectMarkVaccinatedStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.markVaccinatedStatus
// );
//
// export const selectMarkVaccinatedError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.markVaccinatedError
// );
//
// export const selectMarkPaidStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.markPaidStatus
// );
//
// export const selectMarkPaidError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.markPaidError
// );
//
// export const selectScheduleAppointmentStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.scheduleAppointmentStatus
// );
//
// export const selectScheduleAppointmentError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.scheduleAppointmentError
// );
//
// export const selectCancelOrderStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.cancelOrderStatus
// );
//
// export const selectCancelOrderError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.cancelOrderError
// );
//
// // NEW Selectors for vaccinated persons by hospital
// export const selectVaccinatedPersons = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.vaccinatedPersons
// );
//
// export const selectFetchVaccinatedPersonsStatus = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.fetchVaccinatedPersonsStatus
// );
//
// export const selectFetchVaccinatedPersonsError = createSelector(
//     selectVaccinationOrderState,
//     (orderState) => orderState.fetchVaccinatedPersonsError
// );
