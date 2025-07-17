// Functions for interacting with backend endpoints
// src/api/apiService.js
import axiosInstance from './axiosInstance';

// Centralized API service for all backend interactions
const apiService = {
    // Auth Endpoints
    // Corrected parameter name to usernameOrEmail to match backend
    login: (usernameOrEmail, password) => axiosInstance.post('/api/auth/login', { usernameOrEmail, password }),
    register: (userData) => axiosInstance.post('/api/auth/register', userData),
    getProfile: (userId) => axiosInstance.get(`/api/users/${userId}`),
    getAllUsers: () => axiosInstance.get('/api/users'),

    // Example: Admin/Hospital Endpoints (uncomment and implement as needed)
    getAllHospitals: () => axiosInstance.get('/api/hospitals'),
    registerVaccine: (vaccineData) => axiosInstance.post('/api/vaccines', vaccineData),
    getAllVaccines: () => axiosInstance.get('/api/vaccines'),
    getVaccineStock: (hospitalId, vaccineId) => axiosInstance.get(`/api/vaccine-stock/${hospitalId}/${vaccineId}`),
    updateVaccineStock: (hospitalId, vaccineId, changeQty) =>
        axiosInstance.patch(`/api/vaccine-stock/${hospitalId}/${vaccineId}`, { changeQty }),
    createVaccinationOrder: (orderData) => axiosInstance.post('/api/vaccination-orders', orderData),
    getPendingApprovalVaccinationOrders: (hospitalId) =>
        axiosInstance.get(`/api/vaccination-orders/hospital/${hospitalId}/pending-approval`),
    // //////////////////////////////////////////////////////////////////////////////////////////
    // This is used by approveVaccineOrderPage, update name from patch to approveVaccineStock
    patch: (url, data) => axiosInstance.patch(url, data),
    // //////////////////////////////////////////////////////////////////////////////////////////
    getVaccinatedPersonsByHospital: (hospitalId) => axiosInstance.get(`/api/vaccination-records/hospital/${hospitalId}/vaccinated-persons`),


    // Patient Endpoints (Updated and New)
    getPatientDashboard: (patientId) => axiosInstance.get(`/api/patients/${patientId}/dashboard`),
    getPatientVaccinationOrders: () => axiosInstance.get('/api/vaccination-orders/patient'),
    schedulePatientAppointment: (orderId, appointmentData) => axiosInstance.patch(`/api/vaccination-orders/${orderId}/schedule-appointment`, appointmentData),
    getPatientApprovedAppointments: (patientId) => axiosInstance.get(`/api/vaccination-orders/user/${patientId}/scheduled`),
    markOrderAsVaccinated: (orderId, vaccinationDate) => axiosInstance.patch(`/api/vaccination-orders/${orderId}/mark-vaccinated`, { vaccination_date: vaccinationDate }),
    markOrderAsPaid: (orderId) => axiosInstance.patch(`/api/vaccination-orders/${orderId}/mark-as-paid`),
    cancelOrderByPatient: (orderId) => axiosInstance.patch(`/api/vaccination-orders/${orderId}/cancel-by-patient`),


    // //////////////////////////////////////////////////////////////////////////////////////////
    // Reporting endpoints:

    /**
     * Fetches user demographic reports grouped by a specified criterion.
     * @param {string} groupBy - The field to group by (e.g., 'age_group', 'gender', 'pre_existing_disease', 'medical_practitioner').
     * @returns {Promise} Axios promise resolving to report data.
     */
    getUserDemographicsReport: (groupBy) => axiosInstance.get('/api/reports/user-demographics', { params: { groupBy } }),

    // You can uncomment and add the other two reporting endpoints here as well:
    /**
     * Fetches the number of doses administered daily.
     * @param {object} [filters] - Optional object with startDate, endDate, hospitalId.
     * @returns {Promise} Axios promise resolving to daily doses data.
     */
    getDosesDailyReport: (filters) => axiosInstance.get('/api/reports/doses-daily', { params: filters }),

    /**
     * Fetches population coverage report.
     * @param {object} [filters] - Optional object with hospitalId.
     * @returns {Promise} Axios promise resolving to coverage data.
     */
    getPopulationCoverageReport: (filters) => axiosInstance.get('/api/reports/population-coverage', { params: filters }),


    // Example: Watchlist/Public Data Endpoints (uncomment and implement as needed)
    // getVaccinationSummary: () => axiosInstance.get('/api/public/vaccination-summary'),

    // Example: QR Code related (if handled by backend)
    // generateQRCodeData: (paymentId) => axiosInstance.get(`/api/payments/${paymentId}/qrcode-data`),
};

export default apiService;