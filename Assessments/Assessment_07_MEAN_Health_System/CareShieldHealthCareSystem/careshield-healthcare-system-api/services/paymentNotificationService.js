// src/services/paymentNotificationService.js

// Imports needed for service logic
const { createAndSendNotification } = require('./notificationService'); // Assuming this exists
const AppointmentModel = require('../dataModel/appointmentDataModel');
const PDFDocument = require("pdfkit");

function generatePaymentReceipt(appointment) {
    const doc = new PDFDocument();
    const pdfBufferChunks = [];
    doc.on('data', chunk => pdfBufferChunks.push(chunk));

    return new Promise((resolve) => {
        doc.on('end', () => {
            resolve(Buffer.concat(pdfBufferChunks));
        });

        const patient = appointment.patientId;
        const hospital = appointment.hospitalId;
        const feeAmount = (appointment.feeAmount).toFixed(2);
        const transactionId = appointment.paymentTransactionId || 'N/A';
        const formattedDate = new Date(appointment.startTime).toLocaleDateString();
        const formattedTime = new Date().toLocaleString(); // Time of payment processing

        // --- PDF Content Generation ---
        doc.info.Title = 'Payment Receipt';

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('OFFICIAL PAYMENT RECEIPT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).text(`Receipt Date: ${formattedTime}`, { align: 'right' });
        doc.moveDown(1);

        // Transaction Summary
        doc.fontSize(18)
            .font('Helvetica-Bold')
            // Removed continued: true here
            .text(`AMOUNT PAID: $${feeAmount}`, { align: 'center', backgroundColor: '#F0F0F0' })
            .fillColor('black');
        doc.moveDown(1);


        // 💡 FIX 3: Patient Details - Ensure each label-value pair ends the line
        doc.fontSize(14).font('Helvetica-Bold').text('Paid By: ', { continued: true }).font('Helvetica').text(`${patient.name}`);
        // The original issue was likely here or in the following line's rendering
        doc.font('Helvetica-Bold').text('Patient ID: ', { continued: true }).font('Helvetica').text(`${patient._id.toString()}`);
        doc.font('Helvetica-Bold').text('Email: ', { continued: true }).font('Helvetica').text(`${patient.email}`);
        doc.moveDown(1);

        // Transaction Details
        doc.fontSize(14).font('Helvetica-Bold').text('Transaction Details:', { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Transaction ID: ', { continued: true }).font('Helvetica').text(`${transactionId}`);
        doc.font('Helvetica-Bold').text('Method: ', { continued: true }).font('Helvetica').text(`${appointment.paymentMethod || 'N/A'}`);
        doc.font('Helvetica-Bold').text('Status: ', { continued: true }).font('Helvetica').text(`PAID`);
        doc.moveDown(1);

        // Appointment Context
        doc.fontSize(14).font('Helvetica-Bold').text('For Appointment:', { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Appointment Date: ', { continued: true }).font('Helvetica').text(`${formattedDate}`);
        doc.font('Helvetica-Bold').text('Service Provider: ', { continued: true }).font('Helvetica').text(`${hospital ? hospital.name : 'N/A'}`);
        doc.moveDown(2);

        // Footer
        doc.fontSize(10).font('Helvetica').text('Thank you for your business. This is your official payment record.', { align: 'center' });


        doc.end();
    });
}

async function sendPaymentConfirmationEmailWithReceipt(appointment) {
    try {

        if (!appointment || !appointment.patientId || !appointment.patientId.email) {
            // Log the state if possible to aid debugging
            console.error('Missing required populated data in appointment object for email notification.');
            return { success: false, message: 'Missing appointment or patient email data.' };
        }

        const patient = appointment.patientId;
        // Use appointment._id.toString() for consistency
        const appointmentIdStr = appointment._id.toString();

        const feeAmount = (appointment.feeAmount).toFixed(2);
        const transactionId = appointment.paymentTransactionId || 'N/A';

        // 1. GENERATE THE RECEIPT PDF BUFFER
        // NOTE: generatePaymentReceipt must now be designed to handle the populated object.
        const receiptBuffer = await generatePaymentReceipt(appointment);

        // Use the consistent string ID
        const receiptFilename = `Payment_Receipt_${appointmentIdStr.substring(appointmentIdStr.length - 6)}.pdf`;


        // 2. Format email body (no changes needed here)
        const emailBody = `
            <h1>Payment Confirmation Successful</h1>
            <p>Dear ${patient.name},</p>
            <p>This confirms that your payment of <strong>$${feeAmount}</strong> for your upcoming appointment has been successfully processed.</p>
            <p>Please find your official Payment Receipt attached.</p>
            
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Appointment Date:</strong> ${new Date(appointment.startTime).toLocaleDateString()}</p>

            <p>You can view your full appointment details in your patient portal.</p>
            <p>Thank you.</p>
        `;

        // 3. Prepare attachments (no changes needed here)
        const attachments = [{
            filename: receiptFilename,
            content: receiptBuffer,
            contentType: 'application/pdf'
        }];

        // 4. Send the email notification
        const notificationResult = await createAndSendNotification({
            userId: patient._id,
            type: 'Email',
            message: emailBody,
            recipient: patient.email,
            related_appointment_id: appointment._id,
            emailSubject: `Payment Confirmation and Receipt: $${feeAmount} Paid`,
            emailAttachments: attachments
        });

        if (!notificationResult.success) {
            console.error(`Failed to send payment email with receipt for Appointment ID ${appointment._id}: ${notificationResult.message}`);
        }

        return notificationResult;

    } catch (error) {
        console.error('[sendPaymentConfirmationEmailWithReceipt Error]:', error);
        return { success: false, message: `Service error: ${error.message}` };
    }
}

module.exports = {
    sendPaymentConfirmationEmailWithReceipt
};