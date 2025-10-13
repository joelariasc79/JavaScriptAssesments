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

const { userRouter, authenticateToken } = require("./route/userRoute");
const hospitalRouter = require("./route/hospitalRoute");
const vaccineRouter = require("./route/vaccineRoute");
const vaccineStockRouter = require("./route/vaccineStockRoute");
const appointmentRouter = require("./route/appointmentRoute");
const vaccinationOrderRouter = require('./route/vaccinationOrderRoute');

const reportRouter = require("./route/reportRoute");
const notificationRouter = require("./route/notificationRoute");
const patientRouter = require('./route/patientRoute');

const cors = require("cors");

globalThis.rootPath = __dirname;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:9000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json({limit:'2mb', extended:false}));
app.use(express.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vaccination_system';

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
app.use(vaccineRouter);
app.use(vaccineStockRouter);
app.use(appointmentRouter);
app.use(vaccinationOrderRouter);
app.use(reportRouter);
app.use(notificationRouter);
app.use(patientRouter);


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

const PORT = process.env.PORT || 9100;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});