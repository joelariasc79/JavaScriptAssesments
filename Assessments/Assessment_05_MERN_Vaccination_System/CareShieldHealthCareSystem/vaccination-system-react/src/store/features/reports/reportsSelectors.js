// src/store/features/reports/reportsSelectors.js

export const selectUserDemographicsReport = (state) => state.reports.userDemographics;
export const selectDosesDailyReport = (state) => state.reports.dosesDaily;
export const selectPopulationCoverageReport = (state) => state.reports.populationCoverage;
export const selectReportsStatus = (state) => state.reports.status;
export const selectReportsError = (state) => state.reports.error;
export const selectWatchlistSummary = (state) => state.reports.watchlistSummary;