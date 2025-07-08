// service/notificationService.js
const NotificationModel = require('../dataModel/notificationDataModel');
const UserModel = require('../dataModel/userDataModel'); // To get user's contact info

// --- Simulation of SMS/Email sending ---
// In a real application, you would use libraries like Twilio (SMS) or Nodemailer/SendGrid (Email) here.

const sendSMS = async (to, message) => {
    console.log(`--- SIMULATING SMS SEND ---`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------------`);
    // Simulate success
    return { success: true, message: 'SMS simulated successfully.' };
    // In real world:
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // return client.messages.create({
    //     body: message,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: to
    // });
};

const sendEmail = async (to, subject, body) => {
    console.log(`--- SIMULATING EMAIL SEND ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log(`--------------------------`);
    // Simulate success
    return { success: true, message: 'Email simulated successfully.' };
    // In real world:
    // const nodemailer = require('nodemailer');
    // let transporter = nodemailer.createTransport({ ... });
    // return transporter.sendMail({
    //     from: '"Vaccination System" <noreply@example.com>',
    //     to: to,
    //     subject: subject,
    //     html: body
    // });
};

const createAndSendNotification = async ({ userId, type, message, recipient, related_appointment_id = null }) => {
    try {
        let status = 'pending';
        let failureReason = null;
        let sendResult;

        if (type === 'SMS') {
            sendResult = await sendSMS(recipient, message);
        } else if (type === 'Email') {
            sendResult = await sendEmail(recipient, 'Vaccination Appointment Update', message);
        } else {
            // For 'In-App' notifications, you might just save to DB and let frontend poll/websocket
            sendResult = { success: true, message: 'In-App notification recorded.' };
        }

        if (sendResult.success) {
            status = 'sent';
        } else {
            status = 'failed';
            failureReason = sendResult.message || 'Unknown failure';
        }

        const newNotification = new NotificationModel({
            userId,
            type,
            message,
            recipient,
            status,
            related_appointment_id,
            failure_reason: failureReason
        });
        await newNotification.save();
        return { success: true, notification: newNotification };

    } catch (error) {
        console.error(`Error creating/sending ${type} notification for user ${userId}:`, error);
        // Record failure in DB even if sending failed
        const failedNotification = new NotificationModel({
            userId,
            type,
            message,
            recipient,
            status: 'failed',
            related_appointment_id,
            failure_reason: error.message || 'Service error during sending'
        });
        await failedNotification.save();
        return { success: false, message: `Failed to send notification: ${error.message}` };
    }
};

module.exports = {
    createAndSendNotification
};