// src/services/notificationService.js
const NotificationModel = require('../dataModel/notificationDataModel');
const QRCode = require('qrcode'); // Already installed via `npm install qrcode`
const nodemailer = require('nodemailer'); // Install this: npm install nodemailer

// --- Simulation of SMS/Email sending (replace with real implementations as needed) ---

const sendSMS = async (to, message) => {
    // In a real application, you would use libraries like Twilio (SMS) here.
    console.log(`--- SIMULATING SMS SEND ---`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------------`);
    // Simulate success
    return { success: true, message: 'SMS simulated successfully.' };
    // Real Twilio example (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env):
    // try {
    //     const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    //     await client.messages.create({
    //         body: message,
    //         from: process.env.TWILIO_PHONE_NUMBER,
    //         to: to
    //     });
    //     return { success: true, message: 'SMS sent successfully.' };
    // } catch (error) {
    //     console.error("Error sending SMS via Twilio:", error);
    //     return { success: false, message: `Failed to send SMS: ${error.message}` };
    // }
};

// sendEmail function using Nodemailer
const sendEmail = async (to, subject, body, attachments = []) => {
    try {
        // Create a Nodemailer transporter using SMTP
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com', 'smtp.sendgrid.net'
            port: parseInt(process.env.EMAIL_PORT, 10), // e.g., 587 (TLS), 465 (SSL)
            secure: process.env.EMAIL_SECURE === 'true', // true for port 465 (SSL), false for other ports like 587 (TLS)
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app-specific password
            },
            // Optional: For debugging transporter issues, useful during setup
            // tls: {
            //     rejectUnauthorized: false // Use with caution in production if you're not sure about your SSL cert
            // }
        });

        // Map attachments to Nodemailer's expected format
        const nodemailerAttachments = attachments.map(att => ({
            filename: att.filename,
            content: att.content, // This should be a Buffer (e.g., from generateQrCodeBuffer) or a stream
            contentType: att.contentType || 'application/octet-stream', // Default content type if not provided
            cid: att.cid // Used for embedding images inline (e.g., <img src="cid:qrcode_image"/> in HTML body)
        }));

        // Send the email
        const info = await transporter.sendMail({
            from: `"Vaccination System" <${process.env.EMAIL_USER}>`, // Sender address, can include a friendly name
            to: to, // List of recipients
            subject: subject, // Subject line
            html: body, // HTML body content
            attachments: nodemailerAttachments, // Attachments array
        });

        console.log('Email sent: %s', info.messageId); // Log the message ID for tracking
        return { success: true, message: 'Email sent successfully.' };

    } catch (error) {
        console.error('Error sending email:', error);
        // Provide more detailed error message if available
        let errorMessage = 'Failed to send email.';
        if (error.responseCode) {
            errorMessage += ` SMTP Error Code: ${error.responseCode}.`;
        }
        if (error.response) {
            errorMessage += ` SMTP Response: ${error.response}.`;
        }
        return { success: false, message: errorMessage };
    }
};

// Function to generate QR code buffer
const generateQrCodeBuffer = async (text, size = 200) => {
    try {
        return await QRCode.toBuffer(text, {
            errorCorrectionLevel: 'H', // Error correction level (L, M, Q, H)
            width: size, // Width of the QR code image
            margin: 1, // Margin around the QR code
        });
    } catch (error) {
        console.error("Error generating QR code buffer:", error);
        throw new Error("Failed to generate QR code for email.");
    }
};

// createAndSendNotification now accepts an optional 'emailAttachments' array for email type
const createAndSendNotification = async ({ userId, type, message, recipient, related_appointment_id = null, emailAttachments = [], emailSubject = 'Vaccination Order Update' // Add default subject here
                                         }) => {
    try {
        let status = 'pending';
        let failureReason = null;
        let sendResult;

        if (type === 'SMS') {
            sendResult = await sendSMS(recipient, message);
        } else if (type === 'Email') {
            // --- CHANGE THIS LINE ---
            sendResult = await sendEmail(recipient, emailSubject, message, emailAttachments);
            // --- END CHANGE ---
        } else {
            sendResult = { success: true, message: 'In-App notification recorded.' };
        }

        // ... (rest of the function remains the same) ...
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
    createAndSendNotification,
    generateQrCodeBuffer // Export the QR code generation function
};