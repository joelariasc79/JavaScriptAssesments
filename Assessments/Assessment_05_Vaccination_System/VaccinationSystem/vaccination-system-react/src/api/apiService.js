// Functions for interacting with backend endpoints
// src/api/apiService.js
import axiosInstance from './axiosInstance';

// Centralized API service for all backend interactions
const apiService = {
    // Auth Endpoints
    // Corrected parameter name to usernameOrEmail to match backend
    login: (usernameOrEmail, password) => axiosInstance.post('/api/auth/login', { usernameOrEmail, password }),
    register: (userData) => axiosInstance.post('/api/auth/register', userData), // Example: register method
    getProfile: (userId) => axiosInstance.get(`/api/users/${userId}`),
    getAllUsers: () => axiosInstance.get('/api/users'), // <-- NEW: Fetch all users (for patient selection)

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
    patch: (url, data) => axiosInstance.patch(url, data),

    // // NEW: Fetch all vaccination orders (for admin/hospital use, potentially for patients too)
    // getAllVaccinationOrders: () => axiosInstance.get('/api/vaccination-orders'),
    // // NEW: Update a specific vaccination order (e.g., for scheduling)
    // updateVaccinationOrder: (orderId, updateData) => axiosInstance.patch(`/api/vaccination-orders/${orderId}`, updateData),
    // // getHospitalVaccinatedPersons: (hospitalId) =>
    // //     axiosInstance.get(`/api/hospitals/${hospitalId}/vaccinated-persons`),


    // //////////////////////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////////////////////
    // Patient Endpoints (Updated and New)
    getPatientDashboard: (patientId) => axiosInstance.get(`/api/patients/${patientId}/dashboard`),
    // NEW: Get all vaccination orders for a specific patient
    getPatientVaccinationOrders: (patientId) => axiosInstance.get(`/api/vaccination-orders/user/${patientId}`),
    // NEW: Endpoint to schedule an appointment for an existing order (might be a PATCH on order)
    // Assuming backend will have a route like /api/vaccination-orders/:orderId/schedule
    schedulePatientAppointment: (orderId, appointmentData) => axiosInstance.patch(`/api/vaccination-orders/${orderId}/schedule`, appointmentData),
    // NEW: Get approved/scheduled appointments for a patient
    getPatientApprovedAppointments: (patientId) => axiosInstance.get(`/api/vaccination-orders/user/${patientId}/scheduled`),

    // Example: Patient Endpoints (uncomment and implement as needed)
    // registerPatient: (patientData) => axiosInstance.post('/api/patients/register', patientData),
    // scheduleAppointment: (appointmentDetails) => axiosInstance.post('/api/appointments/schedule', appointmentDetails),
    // makePayment: (paymentDetails) => axiosInstance.post('/api/payments/process', paymentDetails),






    // Example: Reporting Endpoints (uncomment and implement as needed)
    // getReportByAgeGender: (filters) => axiosInstance.get('/api/reports/age-gender', { params: filters }),
    // getDosesAdministeredReport: () => axiosInstance.get('/api/reports/doses-administered'),
    // getPopulationCoverageReport: () => axiosInstance.get('/api/reports/population-coverage'),

    // Example: Watchlist/Public Data Endpoints (uncomment and implement as needed)
    // getVaccinationSummary: () => axiosInstance.get('/api/public/vaccination-summary'),

    // Example: QR Code related (if handled by backend)
    // generateQRCodeData: (paymentId) => axiosInstance.get(`/api/payments/${paymentId}/qrcode-data`),
};

export default apiService;