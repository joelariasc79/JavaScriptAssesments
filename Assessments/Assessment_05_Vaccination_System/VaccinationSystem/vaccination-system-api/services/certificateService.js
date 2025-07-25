// src/services/certificateService.js
const PDFDocument = require('pdfkit');
const { createAndSendNotification } = require('./notificationService');
const VaccinationOrderModel = require('../dataModel/vaccinationOrderModel');

async function generateAndEmailCertificate(orderId) {
    try {
        const order = await VaccinationOrderModel.findById(orderId)
            .populate('userId', 'name email username age gender contact_number address')
            .populate('hospitalId', 'name address contact_number')
            .populate('vaccineId', 'name manufacturer type doses_required')
            .populate('vaccinationRecordId', 'vaccination_date administeredBy');


        if (!order || order.vaccinationStatus !== 'vaccinated' || !order.vaccinationRecordId) {
            console.warn(`Cannot generate/email certificate for order ${orderId}: invalid status or missing record.`);
            return { success: false, message: 'Invalid order status or missing vaccination record.' };
        }

        const patient = order.userId;
        const hospital = order.hospitalId;
        const vaccine = order.vaccineId;
        const vaccinationRecord = order.vaccinationRecordId;

        const doc = new PDFDocument();
        const filename = `Vaccination_Certificate_${patient.username}_${orderId.toString().substring(orderId.toString().length - 6)}.pdf`;

        const pdfBufferChunks = [];
        doc.on('data', chunk => pdfBufferChunks.push(chunk));

        return new Promise((resolve, reject) => {
            doc.on('end', async () => {
                const pdfBuffer = Buffer.concat(pdfBufferChunks);

                if (patient.email) {
                    const emailSubject = `Your Vaccination Certificate for Order #${orderId.toString().substring(orderId.toString().length - 6)}`;
                    const emailHtmlBody = `
                        <p>Dear ${patient.name},</p>
                        <p>Your vaccination for Order #...${orderId.toString().substring(orderId.toString().length - 6)} is now complete! Please find your official Vaccination Certificate attached to this email.</p>
                        <p>Thank you for getting vaccinated.</p>
                        <p>Best regards,</p>
                        <p>The Vaccination System Team</p>
                    `;

                    const attachments = [{
                        filename: filename,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }];

                    const notificationResult = await createAndSendNotification({
                        userId: patient._id,
                        type: 'Email',
                        message: emailHtmlBody,
                        recipient: patient.email,
                        related_appointment_id: orderId,
                        emailAttachments: attachments,
                        emailSubject: emailSubject
                    });

                    if (notificationResult.success) {
                        console.log(`Vaccination certificate email sent successfully to ${patient.email}`);
                        resolve({ success: true, message: 'Certificate generated and email sent.' });
                    } else {
                        console.error(`Failed to send vaccination certificate email to ${patient.email}: ${notificationResult.message}`);
                        resolve({ success: false, message: `Failed to send email: ${notificationResult.message}` });
                    }
                } else {
                    console.warn(`Patient ${patient.name} (${patient._id}) does not have an email address. Certificate not emailed.`);
                    resolve({ success: false, message: 'Patient email not available for sending certificate.' });
                }
            });

            // --- PDF Content Generation ---
            doc.info.Title = 'Vaccination Certificate';
            doc.info.Author = 'Vaccination System';

            // Main Title
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text('Vaccination Certificate', { align: 'center' });
            doc.moveDown();

            // Section: This certifies that:
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('This certifies that:', { align: 'left' });
            doc.moveDown(0.5);

            // Patient Details with bold labels and regular values
            doc.fontSize(14)
                .font('Helvetica-Bold').text(`Name: `, { continued: true })
                .font('Helvetica').text(`${patient.name}`);
            doc.font('Helvetica-Bold').text(`Email: `, { continued: true })
                .font('Helvetica').text(`${patient.email}`);
            doc.font('Helvetica-Bold').text(`Gender: `, { continued: true })
                .font('Helvetica').text(`${patient.gender || 'N/A'}`);
            doc.font('Helvetica-Bold').text(`Contact: `, { continued: true })
                .font('Helvetica').text(`${patient.contact_number || 'N/A'}`);
            doc.font('Helvetica-Bold').text(`Address: `, { continued: true })
                .font('Helvetica').text(`${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''}, ${patient.address.zipCode || ''}, ${patient.address.country || ''}`);
            doc.moveDown();

            // Section: Has received the following vaccination:
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('Has received the following vaccination:', { align: 'left' });
            doc.moveDown(0.5);

            // Vaccination Details with bold labels and regular values
            doc.fontSize(14)
                .font('Helvetica-Bold').text(`Vaccine: `, { continued: true })
                .font('Helvetica').text(`${vaccine.name} (${vaccine.manufacturer})`);
            doc.font('Helvetica-Bold').text(`Type: `, { continued: true })
                .font('Helvetica').text(`${vaccine.type}`);
            doc.font('Helvetica-Bold').text(`Dose Number: `, { continued: true })
                .font('Helvetica').text(`${order.dose_number} of ${vaccine.doses_required}`);
            doc.font('Helvetica-Bold').text(`Vaccination Date: `, { continued: true })
                .font('Helvetica').text(`${new Date(vaccinationRecord.vaccination_date).toLocaleDateString()}`);
            doc.moveDown();

            // Section: Administered at:
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('Administered at:', { align: 'left' });
            doc.moveDown(0.5);

            // Hospital Details with bold labels and regular values
            doc.fontSize(14)
                .font('Helvetica-Bold').text(`Hospital: `, { continued: true })
                .font('Helvetica').text(`${hospital.name}`);
            doc.font('Helvetica-Bold').text(`Address: `, { continued: true })
                .font('Helvetica').text(`${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state}, ${hospital.address.zipCode}, ${hospital.address.country}`);
            doc.font('Helvetica-Bold').text(`Contact: `, { continued: true })
                .font('Helvetica').text(`${hospital.contact_number}`);
            doc.moveDown();

            // Footer (keeping regular font)
            doc.fontSize(12).font('Helvetica').text(`Order ID: ${order._id.toString()}`, { align: 'right' });
            doc.fontSize(12).font('Helvetica').text(`Charge Paid: $${order.charge_to_be_paid.toFixed(2)}`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text('This certificate is for informational purposes only and may be subject to verification.', { align: 'center' });

            doc.end();
        });

    } catch (error) {
        console.error('Error in generateAndEmailCertificate:', error);
        return { success: false, message: error.message };
    }
}

module.exports = { generateAndEmailCertificate };