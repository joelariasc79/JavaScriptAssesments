// server.js

const express = require('express');
const app = express();

const http = require('http');
// const { Server } = require('socket.io');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const bodyParser = require('body-parser');
const path = require('path');

const { userRouter } = require("./route/userRoute");
const { authenticateToken } = require('./middleware/authMiddleware');
const hospitalRouter = require("./route/hospitalRoute");
const patientScreeningRouter = require("./route/patientScreeningRoute");
const weeklyScheduleRouter = require("./route/weeklyScheduleRoute");
const doctorBlockoutRouter = require("./route/doctorBlockoutRoute");
const doctorAvailabilityRouter = require("./route/doctorAvailabiltyRoute");
const appointmentRouter = require("./route/appointmentRoute");
const paymentRouter = require("./route/paymentRoute");
const clinicalEncounterRouter = require("./route/clinicalEncounterRoute");
const doctorFeedbackRouter = require("./route/doctorFeedbackRoute");
// Importing ES Module default export into a CommonJS file using destructuring
const { default: diseaseRouter } = require("./route/disease.routes");
const { default: specialtyRouter } = require("./route/specialty.routes");

const appointmentEfficiencyKPIsRouter  = require("./route/appointmentEfficiencyKPIsRoute");



const cors = require("cors");

globalThis.rootPath = __dirname;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:9000', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json({limit:'2mb', extended:false}));
app.use(express.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_system';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected successfully!');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Use all the routers
app.use(userRouter);
app.use(hospitalRouter);
app.use('/api/patients/patientScreening', patientScreeningRouter);
app.use(weeklyScheduleRouter);
app.use(doctorBlockoutRouter);
app.use(appointmentRouter);
app.use('/api/doctors/availability', doctorAvailabilityRouter);
app.use('/api/payments', paymentRouter);
app.use(clinicalEncounterRouter);
app.use('/api/doctor-feedback', doctorFeedbackRouter);

// app.use(diseaseRouter);
app.use('/api/diseases', diseaseRouter);
app.use('/api/specialties', specialtyRouter);
app.use('/api/appointmentEfficiency', appointmentEfficiencyKPIsRouter);

// app.use(reportRouter);
// app.use(patientRouter);


// protected-data api:
app.get('/api/protected-data', authenticateToken, (req, res) => {
    res.status(200).json({ message: `Access granted! Welcome, ${req.user.username}. This is protected data.` });
});

app.get('/', (req, res) => {
    res.send('Vaccination System API is running!');
});

// app.use(express.static(path.join(__dirname, '../frontend/build')));
// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
// });

const PORT = process.env.PORT || 9200;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});