// src/store/features/users/usersSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectUsersState = (state) => state.users;

export const selectAllUsers = createSelector(
    selectUsersState,
    (usersState) => usersState.users
);

export const selectUsersLoading = createSelector(
    selectUsersState,
    (usersState) => usersState.loading
);

export const selectUsersError = createSelector(
    selectUsersState,
    (usersState) => usersState.error
);

// Selects only users with 'patient' role
export const selectAllPatients = createSelector(
    selectAllUsers,
    (users) => users.filter(user => user.role === 'patient')
);