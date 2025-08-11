// src/backend/routes/vaccinationOrderRoute.js
const express = require('express');
const mongoose = require('mongoose'); // For ObjectId validation
// const PDFDocument = require('pdfkit'); // Import PDFDocument for PDF generation
// const fs = require('fs'); // For file system operations (optional, for saving to disk)
// Cloudinary: Working In Progress:
const cloudinary = require('cloudinary').v2; // Import Cloudinary SDK
// To convert buffer to stream for Cloudinary upload
const streamifier = require('streamifier');
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateAndEmailCertificate } = require('../services/certificateService');

const vaccinationOrderRouter = express.Router({ strict: true, caseSensitive: true });
const VaccinationOrderModel = require('../dataModel/vaccinationOrderModel'); // Adjust path as needed
const VaccinationRecordModel = require('../dataModel/vaccinationRecordDataModel'); // NEW: For creating vaccination records
const VaccineStockModel = require('../dataModel/vaccineStockDataModel'); // NEW: For updating vaccine stock
const UserModel = require('../dataModel/userDataModel'); // For checking if user (patient) exists
const VaccineModel = require('../dataModel/vaccineDataModel'); // For checking if vaccine exists
const HospitalModel = require('../dataModel/hospitalDataModel'); // For checking if hospital exists


// --- Cloudinary Configuration ---
// IMPORTANT: Use environment variables for these credentials in production!
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * @route POST /api/vaccination-orders
 * @description Create a new vaccination order.
 * @body {string} userId (optional, only mandatory for Admin, Hospital Staff), {string} hospitalId, {string} vaccineId, {number} dose_number, {number} charge_to_be_paid
 * @access Protected (Patient, Admin, Hospital Staff)
 */
vaccinationOrderRouter.post('/api/vaccination-orders', authenticateToken, async (req, res) => {
    try {
        // Allow 'patient' role to create vaccination orders
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff' && req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. Only administrators, hospital staff, and patients can create vaccination orders.' });
        }

        // For patients, the userId for the order is implicitly the authenticated user's ID.
        // For admin/hospital_staff, the userId for the patient is expected in the body.
        const userId = req.user.role === 'patient' ? req.user.userId : req.body.userId;

        const { hospitalId, vaccineId, dose_number, charge_to_be_paid } = req.body;
        const createdBy = req.user.userId; // The ID of the user creating the order (patient, staff, or admin)

        // --- Input Validation ---
        // userId is now derived for patients, so it's not checked in req.body for missing fields.
        if (!hospitalId || !vaccineId || dose_number === undefined || dose_number === null || charge_to_be_paid === undefined || charge_to_be_paid === null) {
            return res.status(400).json({ message: 'Missing required fields: hospitalId, vaccineId, dose_number, charge_to_be_paid.' });
        }
        if (typeof dose_number !== 'number' || dose_number < 1) {
            return res.status(400).json({ message: 'Dose number must be a positive integer.' });
        }
        if (typeof charge_to_be_paid !== 'number' || charge_to_be_paid < 0) {
            return res.status(400).json({ message: 'Charge to be paid must be a non-negative number.' });
        }

        // Validate Object IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid ID format for user, hospital, or vaccine.' });
        }

        // --- Authorization Check (Hospital Staff specific - removed for patient) ---
        // This check is removed as patients can select any hospital.
        // If an admin or hospital staff creates an order, their existing specific checks would apply
        // (e.g., hospital staff can only create for their hospital, if that rule is desired).
        // For this update, we assume patients can choose any hospital.
        if (req.user.role === 'hospital_staff' && req.user.hospitalId.toString() !== hospitalId) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only create orders for their own hospital.' });
        }


        // --- Existence Checks for Referenced Documents ---
        const [userExists, hospitalExists, vaccineExists] = await Promise.all([
            UserModel.findById(userId), // Check if the patient (userId) exists
            HospitalModel.findById(hospitalId),
            VaccineModel.findById(vaccineId)
        ]);

        if (!userExists) return res.status(404).json({ message: 'Patient (User) not found.' });
        // Ensure the selected user (who is creating the order for themselves) is indeed a patient
        if (userExists.role !== 'patient') {
            return res.status(400).json({ message: 'The authenticated user is not registered as a patient.' });
        }
        if (!hospitalExists) return res.status(404).json({ message: 'Hospital not found.' });
        if (!vaccineExists) return res.status(404).json({ message: 'Vaccine not found.' });

        // --- Prevent Duplicate Pending/Active Orders ---
        const existingPendingOrActiveOrder = await VaccinationOrderModel.findOne({
            userId,
            hospitalId,
            vaccineId,
            dose_number,
            vaccinationStatus: { $nin: ['vaccinated', 'not_vaccinated', 'cancelled'] },
            paymentStatus: { $nin: ['cancelled', 'refunded'] }
        });

        if (existingPendingOrActiveOrder) {
            return res.status(409).json({ message: `A pending or active vaccination order for dose ${dose_number} of this vaccine already exists for you at this hospital.` });
        }

        // --- Create Vaccination Order ---
        const newOrder = new VaccinationOrderModel({
            userId, // Use the derived userId (authenticated patient's ID)
            hospitalId,
            vaccineId,
            dose_number,
            charge_to_be_paid,
            createdBy // The ID of the patient who created the order
        });

        const savedOrder = await newOrder.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(savedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');


        res.status(201).json({ message: 'Vaccination order created successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error creating vaccination order:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A similar pending vaccination order already exists for this patient, vaccine, and dose (possibly due to a database unique constraint).' });
        }
        res.status(500).json({ message: 'Internal server error creating vaccination order.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccination-orders/:id/approve
 * @description Approves a vaccination order by changing its vaccinationStatus to 'pending_vaccination'.
 * @param {string} id - The ID of the vaccination order to approve.
 * @access Protected (Admin, Hospital Staff)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/approve', authenticateToken, async (req, res) => {
    try {
        // Authorization check: Only admin or hospital staff can approve orders
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can approve vaccination orders.' });
        }

        const orderId = req.params.id;

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // Hospital staff specific authorization: Can only approve orders for their own hospital
        if (req.user.role === 'hospital_staff' && req.user.hospitalId.toString() !== order.hospitalId.toString()) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only approve orders for their assigned hospital.' });
        }

        // Check current status: Only orders that are 'pending_approval' can be approved
        if (order.vaccinationStatus !== 'pending_approval') {
            return res.status(400).json({ message: `Order cannot be approved. Current vaccination status is '${order.vaccinationStatus}'.` });
        }

        // Update the vaccination status
        order.vaccinationStatus = 'pending_vaccination'; // Set to 'pending_vaccination' after approval
        // appointmentStatus remains 'pending_scheduling' until patient schedules
        // paymentStatus remains 'pending_payment' until patient pays

        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: 'Vaccination order approved successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error approving vaccination order:', error);
        res.status(500).json({ message: 'Internal server error approving vaccination order.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccination-orders/:id/reject
 * @description Rejects a vaccination order by changing its vaccinationStatus to 'cancelled'.
 * @param {string} id - The ID of the vaccination order to reject.
 * @access Protected (Admin, Hospital Staff)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/reject', authenticateToken, async (req, res) => {
    try {
        // Authorization check: Only admin or hospital staff can reject orders
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can reject vaccination orders.' });
        }

        const orderId = req.params.id;

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // Hospital staff specific authorization: Can only reject orders for their own hospital
        if (req.user.role === 'hospital_staff' && req.user.hospitalId.toString() !== order.hospitalId.toString()) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only reject orders for their assigned hospital.' });
        }

        // Check current status: Only orders that are 'pending_approval' can be rejected
        if (order.vaccinationStatus !== 'pending_approval') {
            return res.status(400).json({ message: `Order cannot be rejected. Current vaccination status is '${order.vaccinationStatus}'.` });
        }

        // Update statuses to cancelled
        order.vaccinationStatus = 'cancelled';
        order.appointmentStatus = 'cancelled';
        order.paymentStatus = 'cancelled'; // If payment was pending, it's now cancelled

        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: 'Vaccination order rejected successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error rejecting vaccination order:', error);
        res.status(500).json({ message: 'Internal server error rejecting vaccination order.', error: error.message });
    }
});


// /**
//  * @route PATCH /api/vaccination-orders/:id/mark-as-paid
//  * @description Mark a vaccination order as 'paid'.
//  * @access Protected (Admin, Hospital Staff) - NOT for direct patient use via frontend "Pay Now" button (unless modified for patient role).
//  * This endpoint is for hospital staff/admin to record a payment.
//  */
// vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-as-paid', authenticateToken, async (req, res) => {
//     try {
//         // Authorization check: Only admin or hospital staff can mark orders as paid
//         // If a patient is to initiate payment, this authorization needs to be adjusted
//         // or a separate payment gateway flow needs to be implemented.
//         if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
//             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can mark vaccination orders as paid.' });
//         }
//
//         const orderId = req.params.id;
//
//         // Validate order ID format
//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).json({ message: 'Invalid order ID format.' });
//         }
//
//         const order = await VaccinationOrderModel.findById(orderId);
//
//         // Check if the order exists
//         if (!order) {
//             return res.status(404).json({ message: 'Vaccination order not found.' });
//         }
//
//         // Hospital staff specific authorization: Can only mark as paid for their own hospital
//         if (req.user.role === 'hospital_staff' && order.hospitalId && req.user.hospitalId.toString() !== order.hospitalId.toString()) {
//             return res.status(403).json({ message: 'Access denied. Hospital staff can only mark orders as paid for their assigned hospital.' });
//         }
//
//         // Check current status: Only orders that are 'pending_payment' can be marked as paid
//         if (order.paymentStatus === 'paid') {
//             return res.status(400).json({ message: 'Order is already marked as paid.' });
//         }
//         if (order.paymentStatus === 'refunded' || order.paymentStatus === 'cancelled') {
//             return res.status(400).json({ message: `Order cannot be marked as paid. Current payment status is '${order.paymentStatus}'.` });
//         }
//
//         // Update the payment status
//         order.paymentStatus = 'paid';
//
//         const updatedOrder = await order.save();
//
//         // Populate essential fields for response
//         const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
//             .populate('userId', 'username name email')
//             .populate('hospitalId', 'name')
//             .populate('vaccineId', 'name type');
//
//         res.status(200).json({ message: 'Vaccination order marked as paid successfully!', order: populatedOrder });
//
//     } catch (error) {
//         console.error('Error marking vaccination order as paid:', error);
//         res.status(500).json({ message: 'Internal server error marking vaccination order as paid.', error: error.message });
//     }
// });


/**
 * @route PATCH /api/vaccination-orders/:id/mark-as-paid
 * @description Mark a vaccination order as 'paid'.
 * @access Protected (Patient - for their own order, Admin, Hospital Staff - for their hospital's orders)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-as-paid', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const loggedInUser = req.user; // User from authenticated token

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // --- Authorization Check ---
        const isPatientOwner = order.userId.toString() === loggedInUser.userId;
        const isAdmin = loggedInUser.role === 'admin';
        const isHospitalStaff = loggedInUser.role === 'hospital_staff';

        if (isPatientOwner && loggedInUser.role === 'patient') {
            // Patient can mark their own order as paid
            // No additional hospital check needed here, as they own the order.
        } else if (isAdmin) {
            // Admin can mark any order as paid
        } else if (isHospitalStaff && order.hospitalId && loggedInUser.hospitalId.toString() === order.hospitalId.toString()) {
            // Hospital staff can mark orders as paid for their assigned hospital
        } else {
            return res.status(403).json({ message: 'Access denied. You are not authorized to mark this vaccination order as paid.' });
        }

        // Check current status: Only orders that are 'pending_payment' can be marked as paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already marked as paid.' });
        }
        if (order.paymentStatus === 'refunded' || order.paymentStatus === 'cancelled') {
            return res.status(400).json({ message: `Order cannot be marked as paid. Current payment status is '${order.paymentStatus}'.` });
        }
        // Also check vaccinationStatus to ensure it's not already completed/vaccinated/cancelled
        if (order.vaccinationStatus === 'vaccinated' || order.vaccinationStatus === 'cancelled' || order.appointmentStatus === 'completed') {
            return res.status(400).json({ message: `Order cannot be marked as paid. Vaccination or appointment status is '${order.vaccinationStatus}' or '${order.appointmentStatus}'.` });
        }


        // Update the payment status
        order.paymentStatus = 'paid';

        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: 'Vaccination order marked as paid successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error marking vaccination order as paid:', error);
        res.status(500).json({ message: 'Internal server error marking vaccination order as paid.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccination-orders/:id/cancel-by-patient
 * @description Allows a patient to cancel their pending vaccination order.
 * If payment was made, it will trigger a refund (paymentStatus to 'refunded').
 * @param {string} id - The ID of the vaccination order to cancel.
 * @access Protected (Patient - owner of the order)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/cancel-by-patient', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const patientId = req.user.userId; // The ID of the logged-in user (patient)

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // Authorization check: Ensure the logged-in user is the owner of the order
        if (order.userId.toString() !== patientId) {
            return res.status(403).json({ message: 'Access denied. You can only cancel your own vaccination orders.' });
        }

        // Check current status: Prevent cancellation if already vaccinated or not_vaccinated
        if (order.vaccinationStatus === 'vaccinated' || order.vaccinationStatus === 'not_vaccinated') {
            return res.status(400).json({ message: `Order cannot be cancelled. Vaccination has already been completed or marked as '${order.vaccinationStatus}'.` });
        }
        if (order.paymentStatus === 'refunded' || order.paymentStatus === 'cancelled') {
            return res.status(400).json({ message: `Order is already '${order.paymentStatus}'.` });
        }

        // Update statuses to cancelled
        order.vaccinationStatus = 'cancelled';
        order.appointmentStatus = 'cancelled';

        // If payment was already made, mark for refund
        if (order.paymentStatus === 'paid') {
            order.paymentStatus = 'refunded'; // Mark as refunded if payment was already made
            // In a real system, this would trigger an actual refund process
            res.status(200).json({ message: 'Vaccination order cancelled and marked for refund successfully!', order: order });
        } else {
            order.paymentStatus = 'cancelled'; // If payment was pending, simply cancel
            res.status(200).json({ message: 'Vaccination order cancelled successfully!', order: order });
        }

        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: 'Vaccination order cancelled successfully!', order: populatedOrder });


    } catch (error) {
        console.error('Error cancelling vaccination order by patient:', error);
        res.status(500).json({ message: 'Internal server error cancelling vaccination order.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccination-orders/:id/refund
 * @description Allows admin/hospital staff to process a refund for a paid order.
 * Sets paymentStatus to 'refunded' and cancels other statuses.
 * @param {string} id - The ID of the vaccination order to refund.
 * @access Protected (Admin, Hospital Staff)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/refund', authenticateToken, async (req, res) => {
    try {
        // Authorization check: Only admin or hospital staff can issue refunds
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can issue refunds.' });
        }

        const orderId = req.params.id;

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // Hospital staff specific authorization: Can only refund orders for their own hospital
        if (req.user.role === 'hospital_staff' && order.hospitalId && req.user.hospitalId.toString() !== order.hospitalId.toString()) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only refund orders for their assigned hospital.' });
        }

        // Check current status: Only 'paid' orders can be refunded
        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ message: `Order cannot be refunded. Current payment status is '${order.paymentStatus}'. Only 'paid' orders can be refunded.` });
        }

        // Update statuses to refunded/cancelled
        order.paymentStatus = 'refunded';
        order.vaccinationStatus = 'cancelled'; // If refunded, vaccination is cancelled
        order.appointmentStatus = 'cancelled'; // If refunded, appointment is cancelled

        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: 'Vaccination order refunded successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error refunding vaccination order:', error);
        res.status(500).json({ message: 'Internal server error refunding vaccination order.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccination-orders/:id/schedule-appointment
 * @description Allows a patient to schedule an appointment for an approved and paid order.
 * @param {string} id - The ID of the vaccination order.
 * @body {string} appointment_date - The desired appointment date (ISO string).
 * @access Protected (Patient - owner of the order)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/schedule-appointment', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const patientId = req.user.userId; // The ID of the logged-in user (patient)
        const { appointment_date } = req.body;

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }
        // Validate appointment_date
        if (!appointment_date || isNaN(new Date(appointment_date).getTime())) {
            return res.status(400).json({ message: 'Invalid or missing appointment date.' });
        }
        const parsedAppointmentDate = new Date(appointment_date);
        if (parsedAppointmentDate.getTime() < Date.now()) {
            return res.status(400).json({ message: 'Appointment date cannot be in the past.' });
        }


        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // Authorization check: Ensure the logged-in user is the owner of the order
        if (order.userId.toString() !== patientId) {
            return res.status(403).json({ message: 'Access denied. You can only schedule appointments for your own orders.' });
        }

        // Check current statuses: Order must be approved, paid, and pending scheduling
        if (order.vaccinationStatus !== 'pending_vaccination') {
            return res.status(400).json({ message: `Cannot schedule appointment. Vaccination order is not approved for vaccination (current status: '${order.vaccinationStatus}').` });
        }
        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ message: `Cannot schedule appointment. Payment status is '${order.paymentStatus}'. Order must be paid.` });
        }
        if (order.appointmentStatus !== 'pending_scheduling') {
            return res.status(400).json({ message: `Appointment already scheduled or cancelled (current status: '${order.appointmentStatus}').` });
        }

        // Update appointment details
        order.appointment_date = parsedAppointmentDate;
        order.appointmentStatus = 'scheduled';

        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type');

        res.status(200).json({ message: 'Appointment scheduled successfully!', order: populatedOrder });

    } catch (error) {
        console.error('Error scheduling appointment:', error);
        res.status(500).json({ message: 'Internal server error scheduling appointment.', error: error.message });
    }
});


// ////////////////////////////////////////////////////////////////////////////////////
// Implement later: Is not part of the Assessment requirements, but is the right way to do it
// ////////////////////////////////////////////////////////////////////////////////////

// /**
//  * @route PATCH /api/vaccination-orders/:id/mark-vaccinated
//  * @description Marks a vaccination order as 'vaccinated', creates a VaccinationRecord, and decrements vaccine stock.
//  * @param {string} id - The ID of the vaccination order to mark as vaccinated.
//  * @body {string} [vaccination_date] - Optional: The actual date of vaccination. Defaults to now.
//  * @access Protected (Admin, Hospital Staff)
//  */
// vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-vaccinated', authenticateToken, async (req, res) => {
//     try {
//         // Authorization check: Only admin or hospital staff can mark as vaccinated
//         if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
//             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can mark orders as vaccinated.' });
//         }
//
//         const orderId = req.params.id;
//         const { vaccination_date } = req.body; // Optional vaccination date
//         const administeredBy = req.user.userId; // The staff administering the vaccine
//
//         // Validate order ID format
//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).json({ message: 'Invalid order ID format.' });
//         }
//
//         const order = await VaccinationOrderModel.findById(orderId);
//
//         // Check if the order exists
//         if (!order) {
//             return res.status(404).json({ message: 'Vaccination order not found.' });
//         }
//
//         // Hospital staff specific authorization: Can only mark as vaccinated for their own hospital
//         if (req.user.role === 'hospital_staff' && order.hospitalId && req.user.hospitalId.toString() !== order.hospitalId.toString()) {
//             return res.status(403).json({ message: 'Access denied. Hospital staff can only mark orders as vaccinated for their assigned hospital.' });
//         }
//
//         // Check current status: Order must be scheduled, paid, and pending vaccination
//         if (order.vaccinationStatus !== 'pending_vaccination') {
//             return res.status(400).json({ message: `Cannot mark as vaccinated. Vaccination status is '${order.vaccinationStatus}'. Must be 'pending_vaccination'.` });
//         }
//         if (order.paymentStatus !== 'paid') {
//             return res.status(400).json({ message: `Cannot mark as vaccinated. Payment status is '${order.paymentStatus}'. Order must be paid.` });
//         }
//         if (order.appointmentStatus !== 'scheduled') {
//             return res.status(400).json({ message: `Cannot mark as vaccinated. Appointment status is '${order.appointmentStatus}'. Must be 'scheduled'.` });
//         }
//         if (!order.appointment_date) {
//             return res.status(400).json({ message: 'Cannot mark as vaccinated. Appointment date is not set.' });
//         }
//         // Optionally, ensure appointment date is in the past or present
//         if (order.appointment_date.getTime() > Date.now()) {
//             return res.status(400).json({ message: 'Cannot mark as vaccinated. Appointment date is in the future.' });
//         }
//
//
//         // --- Transaction-like operation: Decrement stock and create record ---
//         // 1. Decrement Vaccine Stock
//         const updatedStock = await VaccineStockModel.findOneAndUpdate(
//             { hospital: order.hospitalId, vaccine: order.vaccineId },
//             { $inc: { quantity: -1 }, $set: { lastUpdated: Date.now() } },
//             { new: true, runValidators: true } // runValidators will check min:0
//         );
//
//         if (!updatedStock || updatedStock.quantity < 0) {
//             // If stock update failed (e.g., quantity went below zero due to validator)
//             return res.status(400).json({ message: 'Failed to decrement vaccine stock. Not enough vaccine available or stock record issue.' });
//         }
//
//         // 2. Create Vaccination Record
//         const newVaccinationRecord = new VaccinationRecordModel({
//             userId: order.userId,
//             hospitalId: order.hospitalId,
//             vaccineId: order.vaccineId,
//             vaccinationOrderId: order._id,
//             dose_number: order.dose_number,
//             vaccination_date: vaccination_date ? new Date(vaccination_date) : new Date(),
//             administeredBy: administeredBy
//         });
//         const savedVaccinationRecord = await newVaccinationRecord.save();
//
//         // 3. Update Vaccination Order status and link to record
//         order.vaccinationStatus = 'vaccinated';
//         order.appointmentStatus = 'completed'; // Mark appointment as completed
//         order.vaccinationRecordId = savedVaccinationRecord._id;
//         const updatedOrder = await order.save();
//
//         // Populate essential fields for response
//         const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
//             .populate('userId', 'username name email')
//             .populate('hospitalId', 'name')
//             .populate('vaccineId', 'name type')
//             .populate('vaccinationRecordId'); // Populate the new record
//
//         res.status(200).json({ message: 'Vaccination order marked as vaccinated successfully!', order: populatedOrder, record: savedVaccinationRecord });
//
//     } catch (error) {
//         console.error('Error marking vaccination order as vaccinated:', error);
//         // If any part of the transaction fails, consider rolling back (e.g., re-incrementing stock)
//         // For a simple example, we rely on `try/catch` and `runValidators`.
//         if (error.name === 'ValidationError') { // Mongoose validation error
//             return res.status(400).json({ message: error.message });
//         }
//         if (error.code === 11000) { // Duplicate key error from VaccinationRecord unique index
//             return res.status(409).json({ message: 'A vaccination record for this order already exists.' });
//         }
//         res.status(500).json({ message: 'Internal server error marking vaccination order as vaccinated.', error: error.message });
//     }
// });



/**
 * @route PATCH /api/vaccination-orders/:id/mark-vaccinated
 * @description Marks a vaccination order as 'vaccinated', creates a VaccinationRecord, and decrements vaccine stock.
 * This API can be called by the patient (owner of the order) or authorized staff.
 * @param {string} id - The ID of the vaccination order to mark as vaccinated.
 * @body {string} [vaccination_date] - Optional: The actual date of vaccination. Defaults to now.
 * @access Protected (Admin, Hospital Staff, or Patient - owner of the order)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-vaccinated1', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const loggedInUser = req.user; // The logged-in user (admin, hospital_staff, or patient)
        const { vaccination_date } = req.body; // Optional vaccination date

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // --- Authorization Check ---
        const isPatientOwner = order.userId.toString() === loggedInUser.userId;
        const isAdminOrHospitalStaff = loggedInUser.role === 'admin' || loggedInUser.role === 'hospital_staff';

        if (!isPatientOwner && !isAdminOrHospitalStaff) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to mark this vaccination order as vaccinated.' });
        }

        // If hospital staff, ensure they belong to the correct hospital
        if (loggedInUser.role === 'hospital_staff' && order.hospitalId && loggedInUser.hospitalId.toString() !== order.hospitalId.toString()) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only mark orders as vaccinated for their assigned hospital.' });
        }

        // Check current status: Order must be scheduled, paid, and pending vaccination
        if (order.vaccinationStatus !== 'pending_vaccination') {
            return res.status(400).json({ message: `Cannot mark as vaccinated. Vaccination status is '${order.vaccinationStatus}'. Must be 'pending_vaccination'.` });
        }
        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ message: `Cannot mark as vaccinated. Payment status is '${order.paymentStatus}'. Order must be paid.` });
        }
        if (order.appointmentStatus !== 'scheduled') {
            return res.status(400).json({ message: `Cannot mark as vaccinated. Appointment status is '${order.appointmentStatus}'. Must be 'scheduled'.` });
        }
        if (!order.appointment_date) {
            return res.status(400).json({ message: 'Cannot mark as vaccinated. Appointment date is not set.' });
        }

        // IMPORTANT CHECK: Ensure current date is on or after the appointment date.
        if (order.appointment_date.getTime() > Date.now()) {
            return res.status(400).json({ message: `Cannot mark as vaccinated. Appointment date (${order.appointment_date.toISOString().split('T')[0]}) is in the future.` });
        }

        // --- Transaction-like operation: Decrement stock and create record ---
        // Only decrement stock if the action is performed by hospital staff/admin,
        // as inventory management is not a patient's role.
        if (isAdminOrHospitalStaff) {
            const updatedStock = await VaccineStockModel.findOneAndUpdate(
                { hospital: order.hospitalId, vaccine: order.vaccineId },
                { $inc: { quantity: -1 }, $set: { lastUpdated: Date.now() } },
                { new: true, runValidators: true } // runValidators will check min:0
            );

            if (!updatedStock || updatedStock.quantity < 0) {
                // If stock update failed (e.g., quantity went below zero due to validator)
                // This might indicate a race condition or insufficient stock
                return res.status(400).json({ message: 'Failed to decrement vaccine stock. Not enough vaccine available or stock record issue. Please contact administration if you are a patient trying to confirm.' });
            }
        } else {
            // If patient is confirming, and stock hasn't been decremented by staff yet,
            // this might indicate a workflow issue or that stock decrement is handled elsewhere.
            // For this academic assessment, we proceed without stock decrement if patient initiates.
            // In a real system, the official record creation and stock decrement would ideally be staff-triggered.
            console.warn(`Patient (${loggedInUser.userId}) is marking order ${orderId} as vaccinated. Stock will not be decremented by this action.`);
        }


        // 2. Create Vaccination Record
        // AdministeredBy will be the logged-in staff user, or null if patient is updating.
        const administeredById = isAdminOrHospitalStaff ? loggedInUser.userId : null;

        const newVaccinationRecord = new VaccinationRecordModel({
            userId: order.userId,
            hospitalId: order.hospitalId,
            vaccineId: order.vaccineId,
            vaccinationOrderId: order._id,
            dose_number: order.dose_number,
            vaccination_date: vaccination_date ? new Date(vaccination_date) : new Date(),
            administeredBy: administeredById // Set based on who is calling the API
        });
        const savedVaccinationRecord = await newVaccinationRecord.save();

        // 3. Update Vaccination Order status and link to record
        order.vaccinationStatus = 'vaccinated';
        order.appointmentStatus = 'completed'; // Mark appointment as completed
        order.vaccinationRecordId = savedVaccinationRecord._id;
        const updatedOrder = await order.save();

        // Populate essential fields for response
        const populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
            .populate('userId', 'username name email')
            .populate('hospitalId', 'name')
            .populate('vaccineId', 'name type')
            .populate('vaccinationRecordId'); // Populate the new record

        res.status(200).json({ message: 'Vaccination order marked as vaccinated successfully!', order: populatedOrder, record: savedVaccinationRecord });

    } catch (error) {
        console.error('Error marking vaccination order as vaccinated:', error);
        // If any part of the transaction fails, consider rolling back (e.g., re-incrementing stock)
        // For a simple example, we rely on `try/catch` and `runValidators`.
        if (error.name === 'ValidationError') { // Mongoose validation error
            return res.status(400).json({ message: error.message });
        }
        if (error.code === 11000) { // Duplicate key error from VaccinationRecord unique index
            return res.status(409).json({ message: 'A vaccination record for this order already exists.' });
        }
        res.status(500).json({ message: 'Internal server error marking vaccination order as vaccinated.', error: error.message });
    }
});

/**
 * @route PATCH /api/vaccination-orders/:id/mark-vaccinated
 * @description Marks a vaccination order as 'vaccinated', creates a VaccinationRecord, and decrements vaccine stock.
 * This API can be called by the patient (owner of the order) or authorized staff.
 * @param {string} id - The ID of the vaccination order to mark as vaccinated.
 * @body {string} [vaccination_date] - Optional: The actual date of vaccination in ISO string format (e.g., "2025-07-24T10:00:00.000Z"). Defaults to now.
 * @access Protected (Admin, Hospital Staff, or Patient - owner of the order)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-vaccinated', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const loggedInUser = req.user;
        const { vaccination_date } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await VaccinationOrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        const isPatientOwner = order.userId.toString() === loggedInUser.userId;
        const isAdminOrHospitalStaff = loggedInUser.role === 'admin' || loggedInUser.role === 'hospital_staff';

        if (!isPatientOwner && !isAdminOrHospitalStaff) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to mark this vaccination order as vaccinated.' });
        }

        if (loggedInUser.role === 'hospital_staff' && order.hospitalId && loggedInUser.hospitalId.toString() !== order.hospitalId.toString()) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only mark orders as vaccinated for their assigned hospital.' });
        }

        // --- PRIMARY IDEMPOTENCY CHECK: If already fully marked as vaccinated and linked ---
        if (order.vaccinationStatus === 'vaccinated' && order.vaccinationRecordId) {
            const populatedOrder = await VaccinationOrderModel.findById(order._id)
                .populate('userId', 'username name email')
                .populate('hospitalId', 'name')
                .populate('vaccineId', 'name type')
                .populate('vaccinationRecordId');

            return res.status(200).json({
                message: 'Vaccination order is already marked as vaccinated and certificate processed.',
                order: populatedOrder,
                record: populatedOrder.vaccinationRecordId,
                emailStatus: 'sent', // Assume email was sent with the original marking
                emailMessage: 'Certificate email was already sent for this vaccination.'
            });
        }

        // --- SECONDARY IDEMPOTENCY CHECK / RECONCILIATION ---
        // This handles cases where a VaccinationRecord exists but the order's
        // vaccinationRecordId field wasn't updated (e.g., partial failure),
        // or if VaccinationRecord has other unique indices (e.g., on user/vaccine/dose).
        let savedVaccinationRecord = null; // Will hold the new or existing record
        let populatedOrder = null; // Will hold the final populated order for response

        // 1. Try to find an existing VaccinationRecord linked to this specific order ID first
        let existingRecordInDb = await VaccinationRecordModel.findOne({ vaccinationOrderId: order._id });
        console.log("existingRecordInDb: ", existingRecordInDb);

        // 2. If not found by orderId, try to find by user, vaccine, and dose number.
        //    This addresses potential unique indexes on VaccinationRecord like {userId, vaccineId, dose_number}
        //    that might prevent a new record creation even if vaccinationOrderId isn't linked yet.
        if (!existingRecordInDb) {
            existingRecordInDb = await VaccinationRecordModel.findOne({
                userId: order.userId,
                vaccineId: order.vaccineId,
                dose_number: order.dose_number
            });
        }

        if (existingRecordInDb) {
            // A VaccinationRecord for this order (or this user/vaccine/dose) already exists.
            // This means the vaccination was recorded, but the order document itself
            // might not have been fully updated or linked. Reconcile the order document.
            console.warn(`Reconciling order ${order._id}: Found existing VaccinationRecord (${existingRecordInDb._id}) for order/user/vaccine/dose. Correcting order status.`);
            savedVaccinationRecord = existingRecordInDb;

            // Update the Vaccination Order document to reflect the existing record
            // Ensure we only update if the order is still 'pending_vaccination' or not linked
            if (order.vaccinationStatus === 'pending_vaccination' || !order.vaccinationRecordId) {
                order.vaccinationStatus = 'vaccinated';
                order.appointmentStatus = 'completed';
                order.vaccinationRecordId = savedVaccinationRecord._id;
                await order.save(); // Save the corrected order
            }

            // Populate the order for response
            populatedOrder = await VaccinationOrderModel.findById(order._id)
                .populate('userId', 'username name email')
                .populate('hospitalId', 'name')
                .populate('vaccineId', 'name type')
                .populate('vaccinationRecordId');

            // Assume the certificate was sent during the initial successful record creation.
            return res.status(200).json({
                message: 'Vaccination order reconciled and marked as vaccinated. Certificate was likely processed.',
                order: populatedOrder,
                record: savedVaccinationRecord,
                emailStatus: 'sent',
                emailMessage: 'Certificate email was previously sent for this vaccination.'
            });

        } else {
            // No existing VaccinationRecord found for this order ID or user/vaccine/dose.
            // Proceed with the normal flow of creating a new record.

            // --- Status Checks before proceeding with NEW vaccination ---
            if (order.vaccinationStatus !== 'pending_vaccination') {
                return res.status(400).json({ message: `Cannot mark as vaccinated. Vaccination status is '${order.vaccinationStatus}'. Must be 'pending_vaccination'.` });
            }
            if (order.paymentStatus !== 'paid') {
                return res.status(400).json({ message: `Cannot mark as vaccinated. Payment status is '${order.paymentStatus}'. Order must be paid.` });
            }
            if (order.appointmentStatus !== 'scheduled') {
                return res.status(400).json({ message: `Cannot mark as vaccinated. Appointment status is '${order.appointmentStatus}'. Must be 'scheduled'.` });
            }
            if (!order.appointment_date) {
                return res.status(400).json({ message: 'Cannot mark as vaccinated. Appointment date is not set.' });
            }

            if (order.appointment_date.getTime() > Date.now()) {
                return res.status(400).json({ message: `Cannot mark as vaccinated. Appointment date (${order.appointment_date.toISOString().split('T')[0]}) is in the future.` });
            }

            // --- Transaction-like operation: Decrement stock and create record ---
            if (isAdminOrHospitalStaff) {
                const updatedStock = await VaccineStockModel.findOneAndUpdate(
                    { hospital: order.hospitalId, vaccine: order.vaccineId },
                    { $inc: { quantity: -1 }, $set: { lastUpdated: Date.now() } },
                    { new: true, runValidators: true }
                );

                if (!updatedStock || updatedStock.quantity < 0) {
                    return res.status(400).json({ message: 'Failed to decrement vaccine stock. Not enough vaccine available or stock record issue. Please contact administration if you are a patient trying to confirm.' });
                }
            } else {
                console.warn(`Patient (${loggedInUser.userId}) is marking order ${orderId} as vaccinated. Stock will not be decremented by this action.`);
            }

            // 2. Create Vaccination Record (Only if no existing record found)
            const administeredById = isAdminOrHospitalStaff ? loggedInUser.userId : null;

            const newVaccinationRecord = new VaccinationRecordModel({
                userId: order.userId,
                hospitalId: order.hospitalId,
                vaccineId: order.vaccineId,
                vaccinationOrderId: order._id,
                dose_number: order.dose_number,
                vaccination_date: vaccination_date ? new Date(vaccination_date) : new Date(),
                administeredBy: administeredById
            });
            savedVaccinationRecord = await newVaccinationRecord.save();

            // 3. Update Vaccination Order status and link to record
            order.vaccinationStatus = 'vaccinated';
            order.appointmentStatus = 'completed';
            order.vaccinationRecordId = savedVaccinationRecord._id;
            const updatedOrder = await order.save();

            // Populate essential fields for response (for the newly created case)
            populatedOrder = await VaccinationOrderModel.findById(updatedOrder._id)
                .populate('userId', 'username name email')
                .populate('hospitalId', 'name')
                .populate('vaccineId', 'name type')
                .populate('vaccinationRecordId');


            // --- Trigger certificate email after marking as vaccinated ---
            let emailStatus = 'not_attempted';
            let emailMessage = 'Certificate email not attempted.';

            try {
                const emailResult = await generateAndEmailCertificate(updatedOrder._id); // Use updatedOrder._id
                if (emailResult.success) {
                    emailStatus = 'sent';
                    emailMessage = 'Certificate email sent successfully.';
                    console.log(`Certificate email sent for order ${updatedOrder._id}`);
                } else {
                    emailStatus = 'failed';
                    emailMessage = `Failed to send certificate email: ${emailResult.message}`;
                    console.error(`Failed to send certificate email for order ${updatedOrder._id}: ${emailResult.message}`);
                }
            } catch (emailError) {
                emailStatus = 'failed';
                emailMessage = `An unexpected error occurred while trying to send certificate email: ${emailError.message}`;
                console.error(`Unexpected error during certificate email for order ${updatedOrder._id}: ${emailError.message}`);
            }

            // Respond for the newly created case
            return res.status(200).json({
                message: 'Vaccination order marked as vaccinated successfully!',
                order: populatedOrder,
                record: savedVaccinationRecord,
                emailStatus: emailStatus,
                emailMessage: emailMessage
            });
        }

    } catch (error) {
        console.error('Error marking vaccination order as vaccinated:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        // This general 11000 check remains for any other unique index violations
        // that might occur (e.g., if the VaccinationOrder model has other unique indices not related
        // to vaccinationRecordId, or if the primary idempotency checks failed for some reason).
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A duplicate entry already exists in the database (e.g., another unique index violation).' });
        }
        res.status(500).json({
            message: 'Internal server error marking vaccination order as vaccinated.',
            error: error.message,
            emailStatus: 'failed',
            emailMessage: 'Email not sent due to server error during vaccination marking.'
        });
    }
});

/**
 * @route GET /api/vaccination-orders/hospital/:hospitalId/pending-approval
 * @description Get all vaccination orders with 'pending_approval' status for a specific hospital.
 * @param {string} hospitalId - The ID of the hospital.
 * @access Protected (Admin, Hospital Staff - for their own hospital)
 */
vaccinationOrderRouter.get('/api/vaccination-orders/hospital/:hospitalId/pending-approval', authenticateToken, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const loggedInUser = req.user;

        // Validate hospitalId format
        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        // Authorization check
        if (loggedInUser.role !== 'admin' && loggedInUser.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view pending approval orders.' });
        }

        // Hospital staff can only view orders for their assigned hospital
        if (loggedInUser.role === 'hospital_staff' && loggedInUser.hospitalId.toString() !== hospitalId) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only view pending approval orders for their assigned hospital.' });
        }

        // Find orders with the specified hospitalId and pending_approval status
        const pendingOrders = await VaccinationOrderModel.find({
            hospitalId: hospitalId,
            vaccinationStatus: 'pending_approval'
        })
            .populate('userId', 'username name email') // Populate patient details
            .populate('hospitalId', 'name') // Populate hospital name
            .populate('vaccineId', 'name type manufacturer'); // Populate vaccine details

        res.status(200).json({ message: 'Pending approval vaccination orders fetched successfully!', orders: pendingOrders });

    } catch (error) {
        console.error('Error fetching pending approval vaccination orders:', error);
        res.status(500).json({ message: 'Internal server error fetching pending approval vaccination orders.', error: error.message });
    }
});

/**
 * @route GET /api/vaccination-orders/patient
 * @description Get all vaccination orders with 'pending_approval', 'pending_vaccination', 'vaccinated' status
 * for the current authenticated patient.
 * @access Protected (Patient)
 */
vaccinationOrderRouter.get('/api/vaccination-orders/patient', authenticateToken, async (req, res) => {
    try {
        const patientId = req.user.userId; // Get the patient's ID from the authenticated token

        // Authorization check: Only patients can access their own approved orders
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. This endpoint is for patients only.' });
        }

        // Find orders for the authenticated patient that are in 'pending_vaccination' status
        const approvedOrders = await VaccinationOrderModel.find({
            userId: patientId,
            vaccinationStatus:    ['pending_approval', 'pending_vaccination', 'vaccinated'],
        })
            .populate('hospitalId', 'name address phone email') // Populate hospital details
            .populate('vaccineId', 'name type manufacturer description') // Populate vaccine details
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json({ message: 'Vaccination orders fetched successfully!', orders: approvedOrders });

    } catch (error) {
        console.error('Error fetching vaccination orders for patient:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccination orders.', error: error.message });
    }
});


// /**
//  * @route GET /api/vaccination-orders/patient/approved-for-vaccination
//  * @description Get all vaccination orders with 'pending_vaccination' status for the current authenticated patient.
//  * These are orders that have been approved by hospital staff.
//  * @access Protected (Patient)
//  */
// // vaccinationOrderRouter.get('/api/vaccination-orders/patient/approved-for-vaccination', authenticateToken, async (req, res) => {
//     try {
//         const patientId = req.user.userId; // Get the patient's ID from the authenticated token
//
//         // Authorization check: Only patients can access their own approved orders
//         if (req.user.role !== 'patient') {
//             return res.status(403).json({ message: 'Access denied. This endpoint is for patients only.' });
//         }
//
//         // Find orders for the authenticated patient that are in 'pending_vaccination' status
//         const approvedOrders = await VaccinationOrderModel.find({
//             userId: patientId,
//             vaccinationStatus: 'pending_vaccination'
//             // ,
//             // paymentStatus: 'pending_payment',
//             // appointmentStatus: 'pending_scheduling'
//
//         })
//             .populate('hospitalId', 'name address phone email') // Populate hospital details
//             .populate('vaccineId', 'name type manufacturer description') // Populate vaccine details
//             .sort({ createdAt: -1 }); // Sort by newest first
//
//         res.status(200).json({ message: 'Approved vaccination orders fetched successfully!', orders: approvedOrders });
//
//     } catch (error) {
//         console.error('Error fetching approved vaccination orders for patient:', error);
//         res.status(500).json({ message: 'Internal server error fetching approved vaccination orders.', error: error.message });
//     }
// });

/**
 * @route GET /api/vaccination-records/hospital/:hospitalId/vaccinated-persons
 * @description Get all vaccination records (and associated patient info) for a specific hospital.
 * @param {string} hospitalId - The ID of the hospital.
 * @access Protected (Admin, Hospital Staff - for their own hospital)
 */
vaccinationOrderRouter.get('/api/vaccination-records/hospital/:hospitalId/vaccinated-persons', authenticateToken, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const loggedInUser = req.user;

        // Validate hospitalId format
        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        // Authorization check
        if (loggedInUser.role !== 'admin' && loggedInUser.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view vaccinated persons information.' });
        }

        // Hospital staff can only view records for their assigned hospital
        if (loggedInUser.role === 'hospital_staff' && loggedInUser.hospitalId.toString() !== hospitalId) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only view vaccinated persons for their assigned hospital.' });
        }

        // Find vaccination records for the specified hospitalId
        const vaccinatedPersons = await VaccinationRecordModel.find({
            hospitalId: hospitalId
        })
            .populate('userId', 'username name email age gender contact_number address') // Populate patient details
            .populate('vaccineId', 'name type manufacturer') // Populate vaccine details
            .populate('hospitalId', 'name') // Populate hospital name
            .sort({ vaccination_date: -1 }); // Sort by newest vaccination date first

        // Filter out records where userId might be null (if patient was deleted, though schema says required)
        const filteredVaccinatedPersons = vaccinatedPersons.filter(record => record.userId !== null);


        res.status(200).json({
            message: 'Vaccinated persons information fetched successfully!',
            records: filteredVaccinatedPersons
        });

    } catch (error) {
        console.error('Error fetching vaccinated persons information:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccinated persons information.', error: error.message });
    }
});

/**
 * @route GET /api/vaccination-orders/:id/certificate
 * @description Generates and emails a vaccination certificate PDF for a completed vaccination order.
 * This endpoint *does not* provide a direct download.
 * @param {string} id - The ID of the vaccination order.
 * @access Protected (Patient - owner of the order, Admin, Hospital Staff - for their hospital's orders)
 */
vaccinationOrderRouter.get('/api/vaccination-orders/:id/certificate', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const loggedInUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        // Find the vaccination order and populate all necessary details
        const order = await VaccinationOrderModel.findById(orderId)
        .populate('userId', 'name email username age gender contact_number address')
        .populate('hospitalId', 'name address contact_number')
        .populate('vaccineId', 'name manufacturer type doses_required')
        .populate('vaccinationRecordId', 'vaccination_date administeredBy'); // Populate the linked vaccination record

        if (!order) {
            return res.status(404).json({ message: 'Vaccination order not found.' });
        }

        // --- Authorization Check ---
        const isPatientOwner = order.userId._id.toString() === loggedInUser.userId;
        const isAdmin = loggedInUser.role === 'admin';
        const isHospitalStaff = loggedInUser.role === 'hospital_staff';

        if (!isPatientOwner && !isAdmin && !(isHospitalStaff && order.hospitalId._id.toString() === loggedInUser.hospitalId.toString())) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to view this vaccination certificate.' });
        }

        // --- Status Check: Only generate certificate for 'vaccinated' orders ---
            if (order.vaccinationStatus !== 'vaccinated') {
            return res.status(400).json({ message: `Cannot generate certificate. Vaccination status is '${order.vaccinationStatus}'. A certificate can only be generated for 'vaccinated' orders.` });
        }

        if (!order.vaccinationRecordId) {
            return res.status(400).json({ message: 'Vaccination record not found for this order. Cannot generate certificate.' });
        }

        // Call the service function to generate and email the certificate
        const emailResult = await generateAndEmailCertificate(orderId); // NEW: Use the service directly

        if (emailResult.success) {
            res.status(200).json({ message: 'Vaccination certificate email sent successfully!', emailStatus: 'sent' });
        } else {
            res.status(500).json({ message: `Failed to send vaccination certificate email: ${emailResult.message}`, emailStatus: 'failed' });
        }

        } catch (error) { 
        console.error('Error generating vaccination certificate:', error); 
        // Ensure that a response is always sent, even if an error occurs during PDF generation or email sending
        if (!res.headersSent) { 
            res.status(500).json({ message: 'Internal server error generating vaccination certificate.', error: error.message }); 
        }
    }
});


// /**
//  * @route GET /api/vaccination-orders/:id/certificate
//  * @description Generates a vaccination certificate PDF for a completed vaccination order and uploads it to Cloudinary.
//  * Returns the Cloudinary URL.
//  * @param {string} id - The ID of the vaccination order.
//  * @access Protected (Patient - owner of the order, Admin, Hospital Staff - for their hospital's orders)
//  */
// vaccinationOrderRouter.get('/api/vaccination-orders/:id/certificate', authenticateToken, async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const loggedInUser = req.user;
//
//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).json({ message: 'Invalid order ID format.' });
//         }
//
//         // Find the vaccination order and populate all necessary details
//         const order = await VaccinationOrderModel.findById(orderId)
//             .populate('userId', 'name email username age gender contact_number address')
//             .populate('hospitalId', 'name address contact_number')
//             .populate('vaccineId', 'name manufacturer type doses_required')
//             .populate('vaccinationRecordId', 'vaccination_date administeredBy'); // Populate the linked vaccination record
//
//         if (!order) {
//             return res.status(404).json({ message: 'Vaccination order not found.' });
//         }
//
//         // --- Authorization Check ---
//         const isPatientOwner = order.userId._id.toString() === loggedInUser.userId;
//         const isAdmin = loggedInUser.role === 'admin';
//         const isHospitalStaff = loggedInUser.role === 'hospital_staff';
//
//         if (!isPatientOwner && !isAdmin && !(isHospitalStaff && order.hospitalId._id.toString() === loggedInUser.hospitalId.toString())) {
//             return res.status(403).json({ message: 'Access denied. You are not authorized to view this vaccination certificate.' });
//         }
//
//         // --- Status Check: Only generate certificate for 'vaccinated' orders ---
//         if (order.vaccinationStatus !== 'vaccinated') {
//             return res.status(400).json({ message: `Cannot generate certificate. Vaccination status is '${order.vaccinationStatus}'. A certificate can only be generated for 'vaccinated' orders.` });
//         }
//
//         if (!order.vaccinationRecordId) {
//             return res.status(400).json({ message: 'Vaccination record not found for this order. Cannot generate certificate.' });
//         }
//
//         // Extract data for the PDF
//         const patient = order.userId;
//         const hospital = order.hospitalId;
//         const vaccine = order.vaccineId;
//         const vaccinationRecord = order.vaccinationRecordId;
//
//         const doc = new PDFDocument();
//         let buffers = [];
//
//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', async () => {
//             let pdfBuffer = Buffer.concat(buffers);
//
//             // Upload to Cloudinary
//             cloudinary.uploader.upload_stream(
//                 {
//                     resource_type: 'raw', // Treat as a raw file (PDF)
//                     folder: 'vaccination_certificates', // Optional: folder in Cloudinary
//                     public_id: `certificate_${orderId}`, // Unique ID for the file
//                     format: 'pdf' // Ensure it's stored as PDF
//                 },
//                 (error, result) => {
//                     if (error) {
//                         console.error('Cloudinary upload error:', error);
//                         return res.status(500).json({ message: 'Failed to upload certificate to Cloudinary.', error: error.message });
//                     }
//                     // Return the Cloudinary URL
//                     res.status(200).json({
//                         message: 'Vaccination certificate generated and uploaded successfully!',
//                         certificateUrl: result.secure_url // Use secure_url for HTTPS
//                     });
//                 }
//             ).end(pdfBuffer);
//         });
//
//         // --- PDF Content ---
//         doc.info.Title = 'Vaccination Certificate';
//         doc.info.Author = 'Vaccination System';
//
//         doc.fontSize(24).text('Vaccination Certificate', { align: 'center' });
//         doc.moveDown();
//
//         doc.fontSize(16).text('This certifies that:', { align: 'left' });
//         doc.moveDown(0.5);
//
//         doc.fontSize(14)
//             .text(`Name: ${patient.name}`)
//             .text(`Email: ${patient.email}`)
//             .text(`Gender: ${patient.gender || 'N/A'}`)
//             .text(`Contact: ${patient.contact_number || 'N/A'}`)
//             .text(`Address: ${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''}, ${patient.address.zipCode || ''}, ${patient.address.country || ''}`);
//         doc.moveDown();
//
//         doc.fontSize(16).text('Has received the following vaccination:', { align: 'left' });
//         doc.moveDown(0.5);
//
//         doc.fontSize(14)
//             .text(`Vaccine: ${vaccine.name} (${vaccine.manufacturer})`)
//             .text(`Type: ${vaccine.type}`)
//             .text(`Dose Number: ${order.dose_number} of ${vaccine.doses_required}`)
//             .text(`Vaccination Date: ${new Date(vaccinationRecord.vaccination_date).toLocaleDateString()}`);
//         doc.moveDown();
//
//         doc.fontSize(16).text('Administered at:', { align: 'left' });
//         doc.moveDown(0.5);
//
//         doc.fontSize(14)
//             .text(`Hospital: ${hospital.name}`)
//             .text(`Address: ${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state}, ${hospital.address.zipCode}, ${hospital.address.country}`)
//             .text(`Contact: ${hospital.contact_number}`);
//         doc.moveDown();
//
//         doc.fontSize(12).text(`Order ID: ${order._id}`, { align: 'right' });
//         doc.fontSize(12).text(`Charge Paid: $${order.charge_to_be_paid.toFixed(2)}`, { align: 'right' });
//         doc.moveDown();
//
//         doc.fontSize(10).text('This certificate is for informational purposes only and may be subject to verification.', { align: 'center' });
//
//         doc.end(); // Finalize the PDF generation, triggering the 'end' event
//     } catch (error) {
//         console.error('Error generating or uploading vaccination certificate:', error);
//         res.status(500).json({ message: 'Internal server error generating or uploading vaccination certificate.', error: error.message });
//     }
// });


// Delete:
// vaccinationOrderRouter.get('/api/vaccination-orders/:id/certificate', authenticateToken, async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const loggedInUser = req.user;
//
//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).json({ message: 'Invalid order ID format.' });
//         }
//
//         // Find the vaccination order and populate all necessary details
//         const order = await VaccinationOrderModel.findById(orderId)
//             .populate('userId', 'name email username age gender contact_number address')
//             .populate('hospitalId', 'name address contact_number')
//             .populate('vaccineId', 'name manufacturer type doses_required')
//             .populate('vaccinationRecordId', 'vaccination_date administeredBy'); // Populate the linked vaccination record
//
//         if (!order) {
//             return res.status(404).json({ message: 'Vaccination order not found.' });
//         }
//
//         // --- Authorization Check ---
//         const isPatientOwner = order.userId._id.toString() === loggedInUser.userId;
//         const isAdmin = loggedInUser.role === 'admin';
//         const isHospitalStaff = loggedInUser.role === 'hospital_staff';
//
//         if (!isPatientOwner && !isAdmin && !(isHospitalStaff && order.hospitalId._id.toString() === loggedInUser.hospitalId.toString())) {
//             return res.status(403).json({ message: 'Access denied. You are not authorized to view this vaccination certificate.' });
//         }
//
//         // --- Status Check: Only generate certificate for 'vaccinated' orders ---
//         if (order.vaccinationStatus !== 'vaccinated') {
//             return res.status(400).json({ message: `Cannot generate certificate. Vaccination status is '${order.vaccinationStatus}'. A certificate can only be generated for 'vaccinated' orders.` });
//         }
//
//         if (!order.vaccinationRecordId) {
//             return res.status(400).json({ message: 'Vaccination record not found for this order. Cannot generate certificate.' });
//         }
//
//         // Extract data for the PDF
//         const patient = order.userId;
//         const hospital = order.hospitalId;
//         const vaccine = order.vaccineId;
//         const vaccinationRecord = order.vaccinationRecordId;
//
//         const doc = new PDFDocument();
//         const filename = `Vaccination_Certificate_${patient.username}_${orderId.substring(orderId.length - 6)}.pdf`;
//
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//
//         doc.pipe(res); // Pipe the PDF to the response stream
//
//         // --- PDF Content ---
//         doc.info.Title = 'Vaccination Certificate';
//         doc.info.Author = 'Vaccination System';
//
//         doc.fontSize(24).text('Vaccination Certificate', { align: 'center' });
//         doc.moveDown();
//
//         doc.fontSize(16).text('This certifies that:', { align: 'left' });
//         doc.moveDown(0.5);
//
//         doc.fontSize(14)
//             .text(`Name: ${patient.name}`)
//             .text(`Email: ${patient.email}`)
//             .text(`Gender: ${patient.gender || 'N/A'}`)
//             .text(`Contact: ${patient.contact_number || 'N/A'}`)
//             .text(`Address: ${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''}, ${patient.address.zipCode || ''}, ${patient.address.country || ''}`);
//         doc.moveDown();
//
//         doc.fontSize(16).text('Has received the following vaccination:', { align: 'left' });
//         doc.moveDown(0.5);
//
//         doc.fontSize(14)
//             .text(`Vaccine: ${vaccine.name} (${vaccine.manufacturer})`)
//             .text(`Type: ${vaccine.type}`)
//             .text(`Dose Number: ${order.dose_number} of ${vaccine.doses_required}`)
//             .text(`Vaccination Date: ${new Date(vaccinationRecord.vaccination_date).toLocaleDateString()}`);
//         doc.moveDown();
//
//         doc.fontSize(16).text('Administered at:', { align: 'left' });
//         doc.moveDown(0.5);
//
//         doc.fontSize(14)
//             .text(`Hospital: ${hospital.name}`)
//             .text(`Address: ${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state}, ${hospital.address.zipCode}, ${hospital.address.country}`)
//             .text(`Contact: ${hospital.contact_number}`);
//         doc.moveDown();
//
//         doc.fontSize(12).text(`Order ID: ${order._id}`, { align: 'right' });
//         doc.fontSize(12).text(`Charge Paid: $${order.charge_to_be_paid.toFixed(2)}`, { align: 'right' });
//         doc.moveDown();
//
//         doc.fontSize(10).text('This certificate is for informational purposes only and may be subject to verification.', { align: 'center' });
//
//         doc.end(); // Finalize the PDF and send it
//
//     } catch (error) {
//         console.error('Error generating vaccination certificate:', error);
//         res.status(500).json({ message: 'Internal server error generating vaccination certificate.', error: error.message });
//     }
// });

module.exports = vaccinationOrderRouter;