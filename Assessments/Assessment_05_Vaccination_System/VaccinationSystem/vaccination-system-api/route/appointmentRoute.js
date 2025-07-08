// route/appointmentRoute.js
const express = require('express');
const appointmentRouter = express.Router({ strict: true, caseSensitive: true });
const AppointmentModel = require('../dataModel/appointmentDataModel');
const VaccineStockModel = require('../dataModel/vaccineStockDataModel');
const VaccineModel = require('../dataModel/vaccineDataModel');
const HospitalModel = require('../dataModel/hospitalDataModel');
const UserModel = require('../dataModel/userDataModel');
const mongoose = require('mongoose');
const QRCode = require('qrcode'); // Import the qrcode library

const { authenticateToken } = require('./userRoute');
const notificationService = require('../services/notificationService'); // Import the notification service

/**
 * @route POST /api/appointments
 * @description Book a new vaccination appointment.
 * @body {string} hospitalId, {string} vaccineId, {string} appointment_date (ISO string), {number} dose_number
 * @access Protected (Patient only)
 */
appointmentRouter.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. Only patients can book appointments.' });
        }

        const { hospitalId, vaccineId, appointment_date, dose_number } = req.body;
        const userId = req.user.userId;

        if (!hospitalId || !vaccineId || !appointment_date || dose_number === undefined || dose_number === null) {
            return res.status(400).json({ message: 'Missing required fields: hospitalId, vaccineId, appointment_date, dose_number.' });
        }
        if (typeof dose_number !== 'number' || dose_number < 1) {
            return res.status(400).json({ message: 'Dose number must be a number greater than or equal to 1.' });
        }

        if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid ID format for hospital, vaccine, or user.' });
        }

        const parsedAppointmentDate = new Date(appointment_date);
        if (isNaN(parsedAppointmentDate)) {
            return res.status(400).json({ message: 'Invalid appointment date format.' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedAppointmentDate < today) {
            return res.status(400).json({ message: 'Cannot book an appointment in the past.' });
        }

        const vaccineStock = await VaccineStockModel.findOne({ hospitalId, vaccineId });
        if (!vaccineStock || vaccineStock.quantity <= 0) {
            return res.status(404).json({ message: 'Vaccine not available at this hospital or out of stock.' });
        }

        const existingAppointment = await AppointmentModel.findOne({
            userId: userId,
            vaccineId: vaccineId,
            dose_number: dose_number,
            status: { $in: ['booked', 'confirmed'] }
        });
        if (existingAppointment) {
            return res.status(409).json({ message: `You already have an active appointment for dose ${dose_number} of this vaccine.` });
        }

        vaccineStock.quantity -= 1;
        await vaccineStock.save();

        const newAppointment = new AppointmentModel({
            userId,
            hospitalId,
            vaccineId,
            appointment_date: parsedAppointmentDate,
            dose_number,
            status: 'booked',
            payment_status: 'pending'
        });
        const savedAppointment = await newAppointment.save();

        const populatedAppointment = await AppointmentModel.findById(savedAppointment._id)
            .populate('userId', 'username email name contact_number') // Get contact_number for notification
            .populate('hospitalId', 'name address contact_number charges')
            .populate('vaccineId', 'name type doses_required price');

        // --- Send Notification for Appointment Booking ---
        if (populatedAppointment.userId && populatedAppointment.userId.contact_number) {
            const message = `Your appointment for ${populatedAppointment.vaccineId.name} (Dose ${populatedAppointment.dose_number}) at ${populatedAppointment.hospitalId.name} on ${populatedAppointment.appointment_date.toLocaleDateString()} has been booked.`;
            await notificationService.createAndSendNotification({
                userId: populatedAppointment.userId._id,
                type: 'SMS', // Or 'Email' if email is available
                message: message,
                recipient: populatedAppointment.userId.contact_number, // Use contact_number
                related_appointment_id: populatedAppointment._id
            });
        }


        res.status(201).json({ message: 'Appointment booked successfully!', appointment: populatedAppointment });

    } catch (error) {
        console.error('Error booking appointment:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'An appointment for this date, vaccine, and dose already exists for you.' });
        }
        res.status(500).json({ message: 'Internal server error booking appointment.', error: error.message });
    }
});

/**
 * @route GET /api/appointments/me
 * @description Get all appointments for the authenticated user.
 * This route is crucial for the "Schedule screen" to show upcoming/past appointments.
 * @access Protected (Patient only)
 */
appointmentRouter.get('/api/appointments/me', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. Only patients can view their own appointments this way.' });
        }

        const appointments = await AppointmentModel.find({ userId: req.user.userId })
            .populate('hospitalId', 'name address contact_number charges')
            .populate('vaccineId', 'name type doses_required price other_info')
            .sort({ appointment_date: 1 }); // Sort by date to easily distinguish upcoming/past

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({ message: 'Internal server error fetching appointments.', error: error.message });
    }
});

/**
 * @route PATCH /api/appointments/:id/confirm-payment
 * @description Confirm payment for a specific appointment.
 * This is the "Pay click with confirmation" endpoint.
 * Generates a QR code for the payment confirmation.
 * @body {string} [payment_method], {string} [transaction_id] - Optional payment details
 * @access Protected (Patient who owns the appointment)
 */
appointmentRouter.patch('/api/appointments/:id/confirm-payment', authenticateToken, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }

        const appointment = await AppointmentModel.findById(appointmentId)
            .populate('userId', 'username email name contact_number')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name price');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        if (appointment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied. You can only confirm payment for your own appointments.' });
        }

        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return res.status(400).json({ message: `Cannot confirm payment for an appointment with status: ${appointment.status}.` });
        }
        if (appointment.payment_status === 'paid' || appointment.payment_status === 'waived') {
            return res.status(400).json({ message: 'Payment for this appointment has already been confirmed.' });
        }

        appointment.payment_status = 'paid';
        const updatedAppointment = await appointment.save();

        // --- Generate QR Code for Payment Confirmation ---
        // The data encoded in the QR code could be a unique payment ID, appointment ID, or a URL.
        // For simplicity, we'll encode a confirmation message and appointment details.
        const qrData = JSON.stringify({
            type: 'VaccinationPaymentConfirmation',
            appointmentId: updatedAppointment._id,
            userId: updatedAppointment.userId._id,
            vaccine: updatedAppointment.vaccineId.name,
            hospital: updatedAppointment.hospitalId.name,
            amount: updatedAppointment.vaccineId.price, // Assuming vaccine price is the charge
            date: updatedAppointment.appointment_date.toISOString().split('T')[0],
            status: 'Paid'
        });

        const qrCodeImage = await QRCode.toDataURL(qrData); // Generates a base64 data URL

        // --- Send Notification for Payment Confirmation ---
        if (updatedAppointment.userId && updatedAppointment.userId.contact_number) {
            const message = `Payment for your appointment for ${updatedAppointment.vaccineId.name} at ${updatedAppointment.hospitalId.name} on ${updatedAppointment.appointment_date.toLocaleDateString()} has been confirmed.`;
            await notificationService.createAndSendNotification({
                userId: updatedAppointment.userId._id,
                type: 'SMS',
                message: message,
                recipient: updatedAppointment.userId.contact_number,
                related_appointment_id: updatedAppointment._id
            });
        }


        res.status(200).json({
            message: 'Payment confirmed successfully!',
            appointment: updatedAppointment,
            qrCode: qrCodeImage // Send the base64 QR code image back to the client
        });

    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Internal server error confirming payment.', error: error.message });
    }
});


/**
 * @route GET /api/appointments/hospital/:hospitalId
 * @description Get all appointments for a specific hospital.
 * @access Protected (Admin or Hospital Staff)
 */
appointmentRouter.get('/api/appointments/hospital/:hospitalId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view hospital appointments.' });
        }

        const hospitalId = req.params.hospitalId;
        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        const appointments = await AppointmentModel.find({ hospitalId })
            .populate('userId', 'username email name contact_number age gender')
            .populate('vaccineId', 'name type doses_required');

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching hospital appointments:', error);
        res.status(500).json({ message: 'Internal server error fetching hospital appointments.', error: error.message });
    }
});

/**
 * @route GET /api/appointments
 * @description Get all appointments in the system.
 * @access Protected (Admin only)
 */
appointmentRouter.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can view all appointments.' });
        }

        const appointments = await AppointmentModel.find({})
            .populate('userId', 'username email name')
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type');

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ message: 'Internal server error fetching appointments.', error: error.message });
    }
});

/**
 * @route PATCH /api/appointments/:id/status
 * @description Update the status of an appointment.
 * @body {string} status - New status (e.g., 'confirmed', 'completed', 'cancelled')
 * @access Protected (Admin or Hospital Staff)
 */
appointmentRouter.patch('/api/appointments/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can update appointment status.' });
        }

        const appointmentId = req.params.id;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }
        if (!status || !['booked', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid or missing status. Must be one of: booked, confirmed, completed, cancelled.' });
        }

        const appointment = await AppointmentModel.findById(appointmentId)
            .populate('userId', 'username contact_number'); // Populate user for notification

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Logic for stock adjustment if status changes to cancelled
        if (status === 'cancelled' && appointment.status !== 'cancelled') {
            const vaccineStock = await VaccineStockModel.findOne({
                hospitalId: appointment.hospitalId,
                vaccineId: appointment.vaccineId
            });
            if (vaccineStock) {
                vaccineStock.quantity += 1; // Increment stock
                await vaccineStock.save();
            }
            // Send cancellation notification
            if (appointment.userId && appointment.userId.contact_number) {
                const message = `Your appointment for ${appointment.vaccineId.name} on ${appointment.appointment_date.toLocaleDateString()} has been CANCELLED.`;
                await notificationService.createAndSendNotification({
                    userId: appointment.userId._id,
                    type: 'SMS',
                    message: message,
                    recipient: appointment.userId.contact_number,
                    related_appointment_id: appointment._id
                });
            }
        }
        // Logic for stock adjustment if status changes from cancelled to active (e.g., re-booking),
        // would require checking current stock and decrementing. (More complex)

        appointment.status = status;
        const updatedAppointment = await appointment.save();

        // Send confirmation notification if status becomes 'confirmed'
        if (status === 'confirmed' && updatedAppointment.userId && updatedAppointment.userId.contact_number) {
            const message = `Your appointment for ${updatedAppointment.vaccineId.name} on ${updatedAppointment.appointment_date.toLocaleDateString()} is now CONFIRMED.`;
            await notificationService.createAndSendNotification({
                userId: updatedAppointment.userId._id,
                type: 'SMS',
                message: message,
                recipient: updatedAppointment.userId.contact_number,
                related_appointment_id: updatedAppointment._id
            });
        }


        // Populate for response
        const populatedAppointment = await AppointmentModel.findById(updatedAppointment._id)
            .populate('userId', 'username email name')
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: `Appointment status updated to ${status}!`, appointment: populatedAppointment });

    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ message: 'Internal server error updating appointment status.', error: error.message });
    }
});

/**
 * @route PATCH /api/appointments/:id/payment-status
 * @description Update the payment status of an appointment.
 * This route is now primarily for internal/admin use, as /confirm-payment is for patient-initiated payment.
 * @body {string} payment_status - New payment status (e.g., 'pending', 'paid', 'waived')
 * @access Protected (Admin only)
 */
appointmentRouter.patch('/api/appointments/:id/payment-status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can update payment status.' });
        }

        const appointmentId = req.params.id;
        const { payment_status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }
        if (!payment_status || !['pending', 'paid', 'waived'].includes(payment_status)) {
            return res.status(400).json({ message: 'Invalid or missing payment status. Must be one of: pending, paid, waived.' });
        }

        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            { payment_status: payment_status },
            { new: true, runValidators: true }
        )
            .populate('userId', 'username email name')
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type');

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        res.status(200).json({ message: `Appointment payment status updated to ${payment_status}!`, appointment: updatedAppointment });

    } catch (error) {
        console.error('Error updating appointment payment status:', error);
        res.status(500).json({ message: 'Internal server error updating appointment payment status.', error: error.message });
    }
});

/**
 * @route DELETE /api/appointments/:id
 * @description Delete an appointment. This should be used carefully, ideally, status update is preferred.
 * @access Protected (Admin only, potentially hospital_staff if linked to appointment status changes)
 */
appointmentRouter.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete appointments.' });
        }

        const appointmentId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID format.' });
        }

        const deletedAppointment = await AppointmentModel.findByIdAndDelete(appointmentId);

        if (!deletedAppointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // If a booked/confirmed appointment is directly deleted, its stock should be returned
        if (deletedAppointment.status === 'booked' || deletedAppointment.status === 'confirmed') {
            const vaccineStock = await VaccineStockModel.findOne({
                hospitalId: deletedAppointment.hospitalId,
                vaccineId: deletedAppointment.vaccineId
            });
            if (vaccineStock) {
                vaccineStock.quantity += 1; // Increment stock
                await vaccineStock.save();
            }
        }

        res.status(200).json({ message: 'Appointment deleted successfully!', appointment: { _id: deletedAppointment._id } });

    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ message: 'Internal server error deleting appointment.', error: error.message });
    }
});


module.exports = appointmentRouter;