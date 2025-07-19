// route/notificationRoute.js (or add to an existing relevant router)
const express = require('express');
const router = express.Router();
const { createAndSendNotification, generateQrCodeBuffer } = require('../services/notificationService');
const UserModel = require('../dataModel/userDataModel'); // Assuming you use this to get user email
// const { authenticateToken } = require('../middleware/authMiddleware'); // Your auth middleware
const { authenticateToken } = require('./userRoute');

// Endpoint to send QR code email for a vaccination order
router.post('/api/notifications/send-qr-email', authenticateToken, async (req, res) => {
    const { orderId, patientId, paymentPageUrl } = req.body;

    if (!orderId || !patientId || !paymentPageUrl) {
        return res.status(400).json({ message: 'Missing required fields: orderId, patientId, paymentPageUrl' });
    }

    try {
        const patient = await UserModel.findById(patientId, null, null);

        if (!patient || !patient.email) {
            return res.status(404).json({ message: 'Patient not found or email not available.' });
        }

        // Generate QR code buffer on the backend
        const qrCodeBuffer = await generateQrCodeBuffer(paymentPageUrl, 200);

        const emailSubject = `Your Vaccination Payment QR Code for Order #${orderId.substring(orderId.length - 6)}`;
        // Define the full HTML body with the embedded QR code
        const emailHtmlBody = `
            <p>Dear ${patient.fullName || patient.username},</p>
            <p>Thank you for your recent vaccination order. Please find attached your QR code for payment. You can scan this QR code to proceed with the payment for order #...${orderId.substring(orderId.length - 6)}.</p> 
            <p>Alternatively, you can visit the payment page directly by clicking here: <a href="${paymentPageUrl}">${paymentPageUrl}</a></p> 
            <p>Best regards,</p>
            <p>The Vaccination System Team</p>
            <img src="cid:qrcode_image" alt="QR Code for Payment" width="200" height="200"/> 
        `;

        const attachments = [{
            filename: `qr_code_order_${orderId.substring(orderId.length - 6)}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png',
            cid: 'qrcode_image' // Used for embedding the image inline in the HTML body
        }];

        const notificationResult = await createAndSendNotification({
            userId: patientId,
            type: 'Email',
            // --- CHANGE THIS LINE ---
            message: emailHtmlBody, // Pass the full HTML body here
            // --- END CHANGE ---
            recipient: patient.email,
        related_appointment_id: orderId,
        emailAttachments: attachments,
        // --- ADD THIS LINE TO PASS THE SUBJECT EXPLICITLY ---
        emailSubject: emailSubject // Pass the subject here
        // --- END ADDITION ---
    });

        if (notificationResult.success) {
            res.status(200).json({ message: 'QR code email sent successfully!', notification: notificationResult.notification });
        } else {
            res.status(500).json({ message: notificationResult.message || 'Failed to send QR code email.' });
        }

    } catch (error) {
        console.error('Error sending QR code email:', error);
        res.status(500).json({ message: 'Internal server error while sending QR code email.' });
    }
});

module.exports = router;