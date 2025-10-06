// // route/patientRoute.js
//
//
// const express = require('express');
// const router = express.Router();
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { getVaccineSuggestions } = require('../controllers/vaccineSuggestionController');
//
// // --- UPDATE: Import the new middleware from userRoute ---
// // Note: The path assumes userRoute.js is in the same directory.
// // const { authenticateToken } = require('./userRoute');
//
// // Route to get vaccine suggestions for a specific patient
// // The ':userId' parameter is the patient's ID
// // Now using the new authenticateToken middleware
// router.get('/api/patients/:userId/vaccine-suggestions', authenticateToken, getVaccineSuggestions);
//
// module.exports = router;