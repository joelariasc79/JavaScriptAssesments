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