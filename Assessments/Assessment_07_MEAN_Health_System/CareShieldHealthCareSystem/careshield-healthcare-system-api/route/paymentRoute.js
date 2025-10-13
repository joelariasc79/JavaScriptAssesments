const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');
const AppointmentModel = require('../dataModel/appointmentDataModel');
const UserModel = require('../dataModel/userDataModel');
const ClinicalEncounterModel = require('../dataModel/clinicalEncounterDataModel');
const { sendPaymentConfirmationEmailWithReceipt } = require('../services/paymentNotificationService');

const paymentRouter = express.Router({ strict: true, caseSensitive: true });

/**
 * @route PUT /api/payment/:id
 * @description Update the payment status/details for an existing Appointment by its unique ID (_id).
 * @access Protected (Owner, Admin, Hospital Admin)
 */
paymentRouter.put('/:id', authenticateToken, async (req, res) => {
    // TRANSACTION REMOVED: Running in standalone MongoDB environment
    try {
        const appointmentId = req.params.id;
        const updates = req.body;

        // Check appointment existence
        const appointment = await AppointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const originalPaymentStatus = appointment.paymentStatus;

        // --- PREVENT CRITICAL FIELD UPDATE ---
        delete updates.patientId;
        delete updates.hospitalId;

        // 2. Execute Update (Non-Transactional)
        let updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            { $set: updates },
            { new: true, runValidators: true }
        )
            // Populate references
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialty')
            .populate('hospitalId', 'name address');

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found after update.' });
        }

        // 💡 INTEGRATION CHECK
        const isNowPaid = updatedAppointment.paymentStatus === 'paid';
        const wasPreviouslyUnpaid = originalPaymentStatus !== 'paid';

        if (isNowPaid && wasPreviouslyUnpaid) {
            let missingRefs = [];
            if (!updatedAppointment.hospitalId) missingRefs.push('Hospital');
            if (!updatedAppointment.patientId) missingRefs.push('Patient');
            if (!updatedAppointment.doctorId) missingRefs.push('Doctor');

            // --- CRITICAL SAFETY CHECK ---
            if (missingRefs.length > 0) {
                const message = `Data Integrity Error: Cannot proceed. Appointment references are broken for: ${missingRefs.join(', ')}.`;
                console.error(`DATA INTEGRITY ERROR: ${message} Appointment ID: ${updatedAppointment._id}`);

                return res.status(500).json({
                    message: message,
                    appointment: updatedAppointment
                });
            }
            // -----------------------------

            // 3. Create placeholder Clinical Encounter record (Asynchronous)
            const newEncounterData = {
                appointmentId: updatedAppointment._id,
                patientId: updatedAppointment.patientId._id,
                doctorId: updatedAppointment.doctorId._id,
                hospitalId: updatedAppointment.hospitalId._id,
                startTime: updatedAppointment.startTime,
                endTime: updatedAppointment.endTime,
                durationMinutes: updatedAppointment.durationMinutes,
                reasonForVisit: updatedAppointment.reasonForVisit
            };

            ClinicalEncounterModel.create(newEncounterData)
                .then(encounter => {
                    console.log(`Clinical encounter created successfully for appointment ${updatedAppointment._id}`);

                    // 4. SIDE EFFECT: Send Email Only after successful Encounter Creation
                    sendPaymentConfirmationEmailWithReceipt(updatedAppointment).catch(err => {
                        console.error('ASYNCHRONOUS PAYMENT CONFIRMATION EMAIL FAILED (Post-Encounter Creation):', err);
                    });
                })
                .catch(err => {
                    // Handle the case where an encounter might already exist (code 11000 is unique constraint error)
                    if (err.code !== 11000) {
                        console.error('ASYNCHRONOUS CLINICAL ENCOUNTER CREATION FAILED:', err);
                    } else {
                        console.warn(`Clinical encounter already exists for appointment ${updatedAppointment._id}. Skipping creation.`);
                        // If encounter already exists, still try to send the email
                        sendPaymentConfirmationEmailWithReceipt(updatedAppointment).catch(err => {
                            console.error('ASYNCHRONOUS PAYMENT CONFIRMATION EMAIL FAILED (Post-Skip):', err);
                        });
                    }
                });
        }

        // --- Response ---
        res.status(200).json({
            message: isNowPaid && wasPreviouslyUnpaid
                ? 'Payment updated and follow-up actions (email/record creation) initiated.'
                : 'Appointment payment details updated successfully.',
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error(`Error updating appointment payment with ID ${req.params.id}:`, error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed.', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error during appointment payment update.', error: error.message });
    }
});

module.exports = paymentRouter;
