// src/store/features/vaccineSuggestions/vaccineStockSelectors.js

import { createSelector } from '@reduxjs/toolkit';

// A simple selector to get the entire suggestions state object
export const selectSuggestionsState = (state) => state.suggestions;

// A memoized selector to get the data array
export const selectVaccineSuggestions = createSelector(
    [selectSuggestionsState],
    (suggestions) => suggestions?.data // Use optional chaining for safety
);

// A memoized selector to get the loading status
export const selectSuggestionsStatus = createSelector(
    [selectSuggestionsState],
    (suggestions) => suggestions?.status
);

// A memoized selector to get the error message
export const selectSuggestionsError = createSelector(
    [selectSuggestionsState],
    (suggestions) => suggestions?.error
);

