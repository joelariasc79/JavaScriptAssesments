const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');
const AppointmentModel = require('../dataModel/appointmentDataModel');
// const WeeklyScheduleModel = require('../dataModel/weeklyScheduleDataModel');
const UserModel = require('../dataModel/userDataModel');
const HospitalModel = require('../dataModel/hospitalDataModel');

// Create a new router instance for appointment routes
const appointmentEfficiencyKPIsRouter = express.Router({ strict: true, caseSensitive: true });
//
// /* -------------------------------------------
//  * Auxiliary Functions (Omitted for brevity)
//  * ------------------------------------------- */


/* -------------------------------------------
 * Appointment Efficiency Endpoints
 * ------------------------------------------- */


/**
 * GET /api/appointmentEfficiency/cancellation-rate
 * Calculates the combined no-show and patient-cancellation rate for the user's selected hospital.
 * Formula: (No-Show + Canceled by Patient) / Total Appointments * 100
 *
 * Auth: Requires authenticateToken. Restricted to 'hospital_admin' and 'doctor' roles with a selected hospital.
 */
appointmentEfficiencyKPIsRouter.get('/cancellation-rate', authenticateToken, async (req, res) => {
    try {
        // Extract necessary user info from the token payload
        const { role, selectedHospitalId } = req.user;

        // 1. Authorization Check: Ensure the user is hospital staff and has a selected hospital
        if (!selectedHospitalId || (role !== 'hospital_admin' && role !== 'doctor')) {
            return res.status(403).json({ message: "Access denied. Must be a hospital staff member associated with a selected hospital." });
        }

        // 2. Define the base filter for the hospital
        const hospitalFilter = { hospitalId: selectedHospitalId };

        // 3. Count total appointments for the selected hospital
        const totalAppointmentsCount = await AppointmentModel.countDocuments(hospitalFilter);

        if (totalAppointmentsCount === 0) {
            return res.status(200).json({
                hospitalId: selectedHospitalId,
                cancellationRate: 0,
                totalAppointments: 0,
                problemAppointments: 0,
                message: "No appointments found for this hospital yet."
            });
        }

        // 4. Count 'problem' appointments (status is 'no_show' OR 'canceled_by_patient')
        const problemFilter = {
            ...hospitalFilter,
            status: { $in: ['no_show', 'canceled_by_patient'] }
        };
        const problemAppointmentsCount = await AppointmentModel.countDocuments(problemFilter);

        // 5. Calculate the rate and format to two decimal places
        const cancellationRate = (problemAppointmentsCount / totalAppointmentsCount) * 100;

        // 6. Return the KPI data
        return res.status(200).json({
            hospitalId: selectedHospitalId,
            cancellationRate: parseFloat(cancellationRate.toFixed(2)),
            totalAppointments: totalAppointmentsCount,
            problemAppointments: problemAppointmentsCount,
            unit: "%"
        });

    } catch (error) {
        console.error('Error calculating cancellation rate:', error);
        res.status(500).json({ message: 'Internal server error while calculating KPI.', error: error.message });
    }
});


/**
 * GET /api/appointmentEfficiency/no-show-rate
 * Calculates the percentage of appointments that were recorded as 'no_show' for the user's selected hospital.
 * Formula: (No-Show Appointments) / Total Appointments * 100
 *
 * Auth: Requires authenticateToken. Restricted to 'hospital_admin' and 'doctor' roles with a selected hospital.
 *
 * NOTE: Response keys updated to 'noShowRate' and 'noShowAppointments' for clarity.
 */
appointmentEfficiencyKPIsRouter.get('/no-show-rate', authenticateToken, async (req, res) => {
    try {
        // Extract necessary user info from the token payload
        const { role, selectedHospitalId } = req.user;

        // 1. Authorization Check: Ensure the user is hospital staff and has a selected hospital
        if (!selectedHospitalId || (role !== 'hospital_admin' && role !== 'doctor')) {
            return res.status(403).json({ message: "Access denied. Must be a hospital staff member associated with a selected hospital." });
        }

        // 2. Define the base filter for the hospital
        const hospitalFilter = { hospitalId: selectedHospitalId };

        // 3. Count total appointments for the selected hospital
        const totalAppointmentsCount = await AppointmentModel.countDocuments(hospitalFilter);

        if (totalAppointmentsCount === 0) {
            // Corrected keys for zero case
            return res.status(200).json({
                hospitalId: selectedHospitalId,
                noShowRate: 0,
                totalAppointments: 0,
                noShowAppointments: 0,
                message: "No appointments found for this hospital yet."
            });
        }

        // 4. Count 'no_show' appointments (status is 'no_show')
        const noShowFilter = {
            ...hospitalFilter,
            status: { $in: ['no_show'] }
        };
        const noShowAppointmentsCount = await AppointmentModel.countDocuments(noShowFilter);

        // 5. Calculate the rate and format to two decimal places
        const noShowRateValue = (noShowAppointmentsCount / totalAppointmentsCount) * 100;

        // 6. Return the KPI data
        return res.status(200).json({
            hospitalId: selectedHospitalId,
            noShowRate: parseFloat(noShowRateValue.toFixed(2)),
            totalAppointments: totalAppointmentsCount,
            noShowAppointments: noShowAppointmentsCount, // Corrected key
            unit: "%"
        });

    } catch (error) {
        console.error('Error calculating no show rate:', error);
        res.status(500).json({ message: 'Internal server error while calculating KPI.', error: error.message });
    }
});

module.exports = appointmentEfficiencyKPIsRouter;
