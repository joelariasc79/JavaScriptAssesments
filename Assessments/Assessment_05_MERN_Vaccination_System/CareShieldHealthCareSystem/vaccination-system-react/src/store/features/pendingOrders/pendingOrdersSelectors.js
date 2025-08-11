// src/store/features/pendingOrders/pendingOrdersSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectPendingOrdersState = (state) => state.pendingOrders;

export const selectPendingApprovalOrders = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.orders
);

export const selectPendingApprovalOrdersLoading = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.loading
);

export const selectPendingApprovalOrdersError = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.error
);

export const selectApproveStatus = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.approveStatus
);

export const selectApproveError = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.approveError
);

export const selectRejectStatus = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.rejectStatus
);

export const selectRejectError = createSelector(
    selectPendingOrdersState,
    (pendingOrdersState) => pendingOrdersState.rejectError
);