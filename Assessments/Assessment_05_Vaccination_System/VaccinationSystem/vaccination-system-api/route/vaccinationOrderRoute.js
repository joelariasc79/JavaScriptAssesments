// src/backend/routes/vaccinationOrderRoute.js
const express = require('express');
const mongoose = require('mongoose'); // For ObjectId validation

const vaccinationOrderRouter = express.Router({ strict: true, caseSensitive: true });
const VaccinationOrderModel = require('../dataModel/vaccinationOrderModel'); // Adjust path as needed
const VaccinationRecordModel = require('../dataModel/vaccinationRecordDataModel'); // NEW: For creating vaccination records
const VaccineStockModel = require('../dataModel/vaccineStockDataModel'); // NEW: For updating vaccine stock
const UserModel = require('../dataModel/userDataModel'); // For checking if user (patient) exists
const VaccineModel = require('../dataModel/vaccineDataModel'); // For checking if vaccine exists
const HospitalModel = require('../dataModel/hospitalDataModel'); // For checking if hospital exists


// Assuming authenticateToken is exported from userRoute.js or authMiddleware.js
// const { authenticateToken } = require('../middleware/authMiddleware'); // Adjust path if needed
const { authenticateToken } = require('./userRoute'); // Adjust path if needed

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


/**
 * @route PATCH /api/vaccination-orders/:id/mark-as-paid
 * @description Marks a vaccination order's paymentStatus as 'paid'.
 * @param {string} id - The ID of the vaccination order to mark as paid.
 * @access Protected (Admin, Hospital Staff)
 */
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-as-paid', authenticateToken, async (req, res) => {
    try {
        // Authorization check: Only admin or hospital staff can mark orders as paid
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can mark vaccination orders as paid.' });
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

        // Hospital staff specific authorization: Can only mark as paid for their own hospital
        if (req.user.role === 'hospital_staff' && order.hospitalId && req.user.hospitalId.toString() !== order.hospitalId.toString()) {
            return res.status(403).json({ message: 'Access denied. Hospital staff can only mark orders as paid for their assigned hospital.' });
        }

        // Check current status: Only orders that are 'pending_payment' can be marked as paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already marked as paid.' });
        }
        if (order.paymentStatus === 'refunded' || order.paymentStatus === 'cancelled') {
            return res.status(400).json({ message: `Order cannot be marked as paid. Current payment status is '${order.paymentStatus}'.` });
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
// Implement later: Is not part of the Assesment requirements, but is the right way to do it
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
vaccinationOrderRouter.patch('/api/vaccination-orders/:id/mark-vaccinated', authenticateToken, async (req, res) => {
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

module.exports = vaccinationOrderRouter;