// route/notificationRoute.js (or add to an existing relevant router)
const express = require('express');
const router = express.Router();
const { createAndSendNotification, generateQrCodeBuffer } = require('../services/notificationService');

const UserModel = require('../dataModel/userDataModel'); // Assuming you use this to get patient email
const VaccinationOrderModel = require('../dataModel/vaccinationOrderModel');
const { authenticateToken } = require('../middleware/authMiddleware');

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


router.put('/api/vaccination-orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { newStatus } = req.body; // Assuming you pass the new status

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // --- Authorization check for updating status (similar to your GET route) ---
        // Example: Only hospital staff or admin can update status
        const loggedInUser = req.user;
        const isAdmin = loggedInUser.role === 'admin';
        const isHospitalStaff = loggedInUser.role === 'hospital_staff';

        // Assuming a hospital staff can only update orders for their hospital
        const canUpdate = isAdmin || (isHospitalStaff && order.hospitalId.toString() === loggedInUser.hospitalId.toString());

        if (!canUpdate) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to update this order status.' });
        }
        // --- End Authorization check ---


        // Update the status
        order.vaccinationStatus = newStatus;
        await order.save();

        // If the status is updated to 'vaccinated', trigger the email
        if (newStatus === 'vaccinated') {
            const { generateAndEmailCertificate } = require('../services/certificateService'); // Import the new service
            const emailResult = await generateAndEmailCertificate(orderId);
            if (emailResult.success) {
                console.log('Certificate email triggered successfully after vaccination status update.');
                // You might want to include a message in the response
                return res.status(200).json({
                    message: 'Vaccination order status updated to vaccinated. Certificate email sent.',
                    order,
                    emailStatus: 'sent'
                });
            } else {
                console.error('Failed to send certificate email after status update:', emailResult.message);
                return res.status(200).json({ // Still 200 because status updated, but warn about email
                    message: `Vaccination order status updated to vaccinated, but failed to send certificate email: ${emailResult.message}`,
                    order,
                    emailStatus: 'failed'
                });
            }
        }

        res.status(200).json({ message: 'Vaccination order status updated successfully.', order });

    } catch (error) {
        console.error('Error updating vaccination order status:', error);
        res.status(500).json({ message: 'Internal server error updating vaccination order status.', error: error.message });
    }
});

module.exports = router;