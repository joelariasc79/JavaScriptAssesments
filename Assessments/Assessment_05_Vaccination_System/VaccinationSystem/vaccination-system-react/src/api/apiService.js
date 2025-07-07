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

    // Example: Admin/Hospital Endpoints (uncomment and implement as needed)
    getAllHospitals: () => axiosInstance.get('/api/hospitals'),
    registerVaccine: (vaccineData) => axiosInstance.post('/api/vaccines', vaccineData),
    getAllVaccines: () => axiosInstance.get('/api/vaccines'),
    getVaccineStock: (hospitalId, vaccineId) => axiosInstance.get(`/api/vaccine-stock/${hospitalId}/${vaccineId}`),
    updateVaccineStock: (hospitalId, vaccineId, changeQty) =>
        axiosInstance.patch(`/api/vaccine-stock/${hospitalId}/${vaccineId}`, { changeQty }),

    // approveVaccineToPatient: (hospitalId, patientId, vaccineId, doseNumber) =>
    //     axiosInstance.post(`/api/hospitals/${hospitalId}/approve-vaccine`, { patientId, vaccineId, doseNumber }),
    // getHospitalVaccinatedPersons: (hospitalId) =>
    //     axiosInstance.get(`/api/hospitals/${hospitalId}/vaccinated-persons`),

    // Example: Patient Endpoints (uncomment and implement as needed)
    // registerPatient: (patientData) => axiosInstance.post('/api/patients/register', patientData),
    // getPatientDashboard: (patientId) => axiosInstance.get(`/api/patients/${patientId}/dashboard`),
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