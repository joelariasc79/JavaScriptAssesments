// src/store/features/auth/authSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectAuthState = (state) => state.auth;

export const selectIsAuthenticated = createSelector(
    selectAuthState,
    (authState) => authState.isAuthenticated
);

export const selectCurrentUser = createSelector(
    selectAuthState,
    (authState) => authState.user
);

export const selectAuthStatus = createSelector(
    selectAuthState,
    (authState) => authState.status
);

export const selectAuthError = createSelector(
    selectAuthState,
    (authState) => authState.error
);

// NEW: Select profile loading status and error
export const selectProfileStatus = createSelector(
    selectAuthState,
    (authState) => authState.profileStatus
);

export const selectProfileError = createSelector(
    selectAuthState,
    (authState) => authState.profileError
);

export const selectCurrentUserHospital = createSelector(
    selectCurrentUser,
    (user) => user?.hospital || null // Return hospital object or null
);

export const selectCurrentUserRole = createSelector(
    selectCurrentUser,
    (user) => user?.role || null
);