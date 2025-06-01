// routes/orderRoute.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // For ObjectId validation

// Import your OrderModel
const OrderModel = require('../DataModel/orderDataModel'); // Adjust path as per your project structure

// API endpoint to pay for an order
// POST /api/orders/:orderId/pay
router.post('/api/orders/:orderId/pay', async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, transactionId, amountPaid } = req.body; // Payment details from the client

    // 1. Validate orderId format
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }

    try {
        // 2. Find the order by its ID
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // 3. Check current order status
        if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ message: `Order is already in a final state (${order.status}) and cannot be paid again.` });
        }
        if (order.status === 'Processing') { // Assuming 'Processing' might mean it's already paid/being processed
            return res.status(400).json({ message: 'Order is already being processed or has been paid.' });
        }

        // 4. Simulate Payment Processing (In a real app, you'd integrate with a payment gateway here)
        // For demonstration, we'll assume success.
        console.log(`Processing payment for Order ID: ${order._id} with method: ${paymentMethod}`);
        console.log(`Transaction ID: ${transactionId}, Amount Paid: ${amountPaid || order.totalAmount}`);

        // You might add checks here, e.g., if amountPaid matches order.totalAmount
        if (amountPaid && amountPaid < order.totalAmount) {
            return res.status(400).json({ message: 'Amount paid is less than the total order amount.' });
        }

        // 5. Update Order Status to reflect payment
        // Your OrderModel enum for status is ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].
        // 'Processing' is a good status to signify successful payment and initiation of fulfillment.
        order.status = 'Processing'; // Or 'Paid' if you add that to your Order schema enum

        // You could also store payment details on the order document if your schema allows
        // (e.g., order.paymentDetails = { method: paymentMethod, transactionId: transactionId, paidAmount: amountPaid, paidAt: new Date() })

        await order.save();

        res.status(200).json({
            message: `Payment successful for Order ID: ${order._id}. Order status updated to '${order.status}'.`,
            orderId: order._id,
            newStatus: order.status,
            totalAmount: order.totalAmount,
            transactionId: transactionId // Return this for confirmation
        });

    } catch (error) {
        console.error('Error processing order payment:', error);
        res.status(500).json({ message: 'Error processing order payment', error: error.message });
    }
});

module.exports = router;