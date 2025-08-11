// src/store/features/vaccineStock/vaccineStockSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectVaccineStockState = (state) => state.vaccineStock;

export const selectCurrentStock = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.currentStock
);

export const selectLoadingStock = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.loadingStock
);

export const selectErrorStock = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.errorStock
);

export const selectUpdateStockStatus = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.updateStatus
);

export const selectUpdateStockError = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.updateError
);

// NEW: Selectors for create operation status and error
export const selectCreateStockStatus = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.createStatus
);

export const selectCreateStockError = createSelector(
    selectVaccineStockState,
    (stockState) => stockState.createError
);