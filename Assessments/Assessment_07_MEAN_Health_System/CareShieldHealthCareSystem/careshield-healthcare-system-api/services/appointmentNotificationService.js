// src/services/appointmentNotificationService.js

// Imports needed for service logic (assuming correct relative paths)
const { createAndSendNotification } = require('./notificationService');
const AppointmentModel = require('../dataModel/appointmentDataModel');

// 💡 This is the refactored, reusable function
async function sendAppointmentConfirmationEmail(appointmentId) {
    try {
        // 1. Fetch the appointment and related patient data
        // Populate here to get all necessary details for the email body
        const appointment = await AppointmentModel.findById(appointmentId)
            .populate('patientId', 'name email') // Select necessary patient fields
            .populate('doctorId', 'name specialty') // Select necessary doctor fields
            .populate('hospitalId', 'name address')
            .exec();

        if (!appointment || !appointment.patientId || !appointment.doctorId) {
            console.warn(`[Notification Service] Skipping email: Appointment or related user data not found for ID: ${appointmentId}`);
            return { success: false, message: 'Missing appointment or patient data.' };
        }

        const patient = appointment.patientId;
        const doctor = appointment.doctorId;
        const hospital = appointment.hospitalId;

        // 2. Format email body
        const formattedStartTime = new Date(appointment.startTime).toLocaleString();
        const formattedEndTime = new Date(appointment.endTime).toLocaleString();

        const locationDetails = hospital
            ? `<li><strong>Location:</strong> ${hospital.name}</li>
               <li><strong>Address:</strong> ${hospital.address.street}, ${hospital.address.city}</li>`
            : '<li><strong>Location:</strong> General Practice.</li>';

        const emailBody = `
            <h1>Appointment Confirmation</h1>
            <p>Hello ${patient.name},</p>
            <p>Your appointment with Dr. ${doctor.name} is confirmed!</p>
            <ul>
                <li><strong>Doctor:</strong> Dr. ${doctor.name} (${doctor.specialty || 'N/A'})</li>
                <li><strong>Date & Time:</strong> ${formattedStartTime} - ${formattedEndTime}</li>
                ${locationDetails}
                <li><strong>Reason for Visit:</strong> ${appointment.reasonForVisit}</li>
                <li><strong>Fee:</strong> $${(appointment.feeAmount / 100).toFixed(2)}</li>
                <li><strong>Status:</strong> ${appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}</li>
            </ul>
            <p>Please arrive 15 minutes before your scheduled time.</p>
            <p>Thank you.</p>
        `;

        // 3. Send the email notification
        const notificationResult = await createAndSendNotification({
            userId: patient._id,
            type: 'Email',
            message: emailBody,
            recipient: patient.email,
            related_appointment_id: appointment._id,
            emailSubject: 'Your Confirmed Appointment Details',
            emailAttachments: []
        });

        // 4. Update status and return result
        if (notificationResult.success) {
            // Update appointment status to 'confirmed' if needed
            if (appointment.status === 'pending') {
                appointment.status = 'confirmed';
                await appointment.save();
            }
            return { success: true, notificationId: notificationResult.notification._id };
        } else {
            return { success: false, message: notificationResult.message };
        }

    } catch (error) {
        console.error('[sendAppointmentConfirmationEmail Error]:', error);
        return { success: false, message: `Service error: ${error.message}` };
    }
}

module.exports = {
    sendAppointmentConfirmationEmail
};