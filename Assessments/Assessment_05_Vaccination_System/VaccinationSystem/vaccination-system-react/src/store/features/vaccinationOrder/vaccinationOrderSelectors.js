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

// You can add more selectors here for orders list, payment status, etc. as needed