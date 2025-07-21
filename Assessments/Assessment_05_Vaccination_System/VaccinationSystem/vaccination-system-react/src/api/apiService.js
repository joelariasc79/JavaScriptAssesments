// Functions for interacting with backend endpoints
// src/api/apiService.js
import axiosInstance from './axiosInstance';

// Centralized API service for all backend interactions
const apiService = {
    // Auth Endpoints
    /**
     * Fetches the watchlist summary report, including age and gender distribution, and overall population coverage.
     * @returns {Promise} Axios promise resolving to the summary data.
     */

    // Auth
    login: (usernameOrEmail, password) => axiosInstance.post('/api/auth/login', { usernameOrEmail, password }),
    register: (userData) => axiosInstance.post('/api/auth/register', userData),
    getProfile: (userId) => axiosInstance.get(`/api/users/${userId}`),
    getAllUsers: () => axiosInstance.get('/api/users'),

    // Admin/Hospital Endpoints (uncomment and implement as needed)
    getAllHospitals: () => axiosInstance.get('/api/hospitals'),
    registerVaccine: (vaccineData) => axiosInstance.post('/api/vaccines', vaccineData),
    getAllVaccines: () => axiosInstance.get('/api/vaccines'),

    getVaccineById: (vaccineId) => axiosInstance.get(`/api/vaccines/${vaccineId}`),
    updateVaccine: (vaccineId, vaccineData) => axiosInstance.put(`/api/vaccines/${vaccineId}`, vaccineData),
    deleteVaccine: (vaccineId) => axiosInstance.delete(`/api/vaccines/${vaccineId}`),
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
    getUserDemographicsReport: (groupBy) => axiosInstance.get('/api/reports/user-demographics', { params: { groupBy } }),
    getDosesDailyReport: (filters) => axiosInstance.get('/api/reports/doses-daily', { params: filters }),
    getPopulationCoverageReport: (filters) => axiosInstance.get('/api/reports/population-coverage', { params: filters }),


    // Watchlist/Public Data Endpoints (uncomment and implement as needed)
    getWatchlistSummary: () => axiosInstance.get('/api/reports/watchlist-summary'),

    // --- NEW: Notification Endpoints ---
    /**
     * Sends a QR code email to the patient for a vaccination order payment.
     * @param {string} orderId The ID of the vaccination order.
     * @param {string} patientId The ID of the patient.
     * @param {string} paymentPageUrl The URL for the simulated payment page (used to generate QR).
     * @returns {Promise} Axios promise resolving to the notification status.
     */
    sendQrCodeEmail: (orderId, patientId, paymentPageUrl) => {
        return axiosInstance.post('/api/notifications/send-qr-email', {
            orderId,
            patientId,
            paymentPageUrl
        });
    }
};

export default apiService;