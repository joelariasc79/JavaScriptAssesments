const express = require('express');
const orderRouter = express.Router();
const mongoose = require('mongoose'); // For ObjectId validation
const { protect } = require('../middleware/authMiddleware');

const OrderModel = require('../DataModel/orderDataModel'); // Adjust path as per your project structure
const CouponDataModel = require('../DataModel/couponDataModel');
const ProductModel = require('../DataModel/productDataModel'); // Needed for some checks, if not already there
const UserModel = require('../DataModel/userDataModel'); // Import UserModel
const OrderReviewModel = require('../DataModel/orderReviewDataModel'); // Import new OrderReviewModel
const CartModel = require('../DataModel/cartDataModel');

const notificationService = require('../services/notificationService'); // Import notification service

// API endpoint to pay for an orders
// POST /api/orders/:orderId/pay
orderRouter.post('/api/orders/:orderId/pay', async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, transactionId, amountPaid, couponCode } = req.body; // Destructure new optional inputs: couponCode
    const userId = req.body.userId; // Assuming userId is passed in body for payment context

    // 1. Validate orderId format and userId presence
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required for payment processing.' });
    }

    try {
        // 2. Find the order by its ID and ensure it belongs to the provided userId
        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to the provided patient.' });
        }

        // 3. Check current order status
        if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ message: `Order is already in a final state (${order.status}) and cannot be paid again.` });
        }
        if (order.status === 'Processing') {
            return res.status(400).json({ message: 'Order is already being processed or has been paid.' });
        }

        // Apply discount if coupon details are provided and valid
        let finalAmountToProcess = order.totalAmount;
        let appliedCouponDetails = null; // To store details about the coupon used
        let calculatedAmountSaved = 0; // Initialize calculated discount amount

        // Only proceed with coupon logic if a coupon code is provided
        if (couponCode) {
            const coupon = await CouponDataModel.findOne({ code: couponCode.toUpperCase() });

            // Check if coupon exists, is active, not used, and not expired
            if (coupon && coupon.isActive && !coupon.isUsed && coupon.expiresAt && new Date() < coupon.expiresAt) {
                calculatedAmountSaved = order.totalAmount * (coupon.discountPercentage / 100);
                calculatedAmountSaved = Math.min(calculatedAmountSaved, order.totalAmount);

                finalAmountToProcess = order.totalAmount - calculatedAmountSaved;
                finalAmountToProcess = Math.max(0, finalAmountToProcess);

                coupon.isUsed = true;
                // Ensure order.userId (string) is used to find UserModel and get its ObjectId for `usedBy`
                const userDoc = await UserModel.findOne({ userId: order.userId });
                if (userDoc) {
                    coupon.usedBy = userDoc._id; // Store the ObjectId of the patient
                    console.log(`Coupon '${coupon.code}' will be linked to user ID: ${order.userId}`);
                } else {
                    coupon.usedBy = null;
                    console.warn(`Order ${order._id} does not have a valid user object to link. Coupon '${coupon.code}' will NOT be linked to a user.`);
                }

                try {
                    await coupon.save();
                    console.log(`Coupon '${coupon.code}' status updated to used.`);
                } catch (saveError) {
                    console.error(`ERROR: Failed to save coupon '${coupon.code}' after use:`, saveError);
                    throw new Error(`Failed to update coupon status: ${saveError.message}`);
                }

                appliedCouponDetails = {
                    code: coupon.code,
                    discountPercentage: coupon.discountPercentage,
                    amountSaved: calculatedAmountSaved
                };

                console.log(`Coupon '${couponCode}' applied. Discounted amount: ${finalAmountToProcess.toFixed(2)}. Amount saved: ${calculatedAmountSaved.toFixed(2)}`);
            } else {
                console.warn(`Coupon '${couponCode}' was provided but is not valid, active, used, or expired for payment. Proceeding with original amount.`);
            }
        }

        console.log(`Processing payment for Order ID: ${order._id} with method: ${paymentMethod}`);
        console.log(`Transaction ID: ${transactionId}`);
        console.log(`Original Order Total: ${order.totalAmount.toFixed(2)}`);
        console.log(`Final Amount to Process (after discount): ${finalAmountToProcess.toFixed(2)}`);
        console.log(`Amount Paid from Client: ${amountPaid ? parseFloat(amountPaid).toFixed(2) : 'Not provided or used backend calculated'}`);

        if (amountPaid && Math.abs(parseFloat(amountPaid) - finalAmountToProcess) > 0.01) {
            console.warn(`Frontend amountPaid (${parseFloat(amountPaid).toFixed(2)}) does not match backend calculated finalAmountToProcess (${finalAmountToProcess.toFixed(2)}). It is recommended to use backend calculated amount.`);
        }

        order.status = 'Processing';
        order.totalAmount = finalAmountToProcess;

        await order.save();

        // --- Dynamic Notification Trigger: Payment Success ---
        await notificationService.createNotification(
            userId, // The string userId
            `Payment successful for Order ID #${order._id}! Total: $${order.totalAmount.toFixed(2)}.`,
            'payment_success'
        );


        res.status(200).json({
            message: `Payment successful for Order ID: ${order._id}. Order status updated to '${order.status}'.`,
            orderId: order._id,
            newStatus: order.status,
            totalAmount: order.totalAmount,
            transactionId: transactionId,
            appliedCoupon: appliedCouponDetails
        });

    } catch (error) {
        console.error('Error processing order payment:', error);
        res.status(500).json({ message: 'Error processing order payment', error: error.message });
    }
});


// API endpoint to fetch current patient's recent orders
// GET /api/orders/patient/recent - Fetch recent orders for a patient, including associated review data
orderRouter.get('/api/orders/user/recent', async (req, res) => {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required as a query parameter (e.g., ?userId=yourId).' });
    }

    try {
        let recentOrders = await OrderModel.find({ userId: userId })
            .sort({ orderDate: -1 })
            .limit(limit)
            .lean();

        if (!recentOrders || recentOrders.length === 0) {
            return res.status(404).json({ message: 'No recent orders found for this patient.' });
        }

        for (let i = 0; i < recentOrders.length; i++) {
            const order = recentOrders[i];
            const orderReview = await OrderReviewModel.findOne({ order: order._id, user: userId });

            if (orderReview) {
                order.isReviewed = true;
                order.rating = orderReview.rating;
                order.comment = orderReview.comment;
            } else {
                order.isReviewed = false;
                order.rating = null;
                order.comment = null;
            }
        }

        res.status(200).json({
            message: `Successfully fetched ${recentOrders.length} recent orders.`,
            orders: recentOrders
        });

    } catch (error) {
        console.error('Error fetching recent orders and attaching reviews:', error);
        res.status(500).json({ message: 'Error fetching recent orders', error: error.message });
    }
});

// API endpoint to cancel an orders
// PUT /api/orders/:orderId/cancel
orderRouter.put('/api/orders/:orderId/cancel', async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required in the request body to cancel an order.' });
    }

    try {
        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to the provided patient.' });
        }

        if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ message: `Order is already in a final state (${order.status}) and cannot be cancelled.` });
        }

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        if (order.orderDate < twoDaysAgo) {
            return res.status(400).json({ message: 'Order can only be cancelled within 2 days of the order date.' });
        }

        order.status = 'Cancelled';
        await order.save();

        // --- Dynamic Notification Trigger: Order Cancelled ---
        await notificationService.createNotification(
            userId, // The string userId
            `Order #${order._id} has been cancelled.`,
            'order_cancelled'
        );

        res.status(200).json({
            message: `Order ID: ${order._id} has been successfully cancelled.`,
            orderId: order._id,
            newStatus: order.status
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Error cancelling order', error: error.message });
    }
});

// API endpoint to reopen a cancelled orders
// PUT /api/orders/:orderId/reopen
orderRouter.put('/api/orders/:orderId/reopen', async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required in the request body to reopen an order.' });
    }

    try {
        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to the provided patient.' });
        }

        if (order.status !== 'Cancelled') {
            return res.status(400).json({ message: `Order cannot be reopened as its current status is '${order.status}'. Only 'Cancelled' orders can be reopened.` });
        }

        order.status = 'Pending';
        await order.save();

        // --- Dynamic Notification Trigger: Order Reopened ---
        await notificationService.createNotification(
            userId, // The string userId
            `Order #${order._id} has been reopened and is now pending.`,
            'order_reopened'
        );

        res.status(200).json({
            message: `Order ID: ${order._id} has been successfully reopened.`,
            orderId: order._id,
            newStatus: order.status
        });

    } catch (error) {
        console.error('Error reopening order:', error);
        res.status(500).json({ message: 'Error reopening order', error: error.message });
    }
});

// API endpoint to set orders as delivered after 2 days of orderDate
// PUT /api/orders/:orderId/deliver
// orderRouter.put('/api/orders/:orderId/deliver', async (req, res) => {
//     const { orderId } = req.params;
//     // Assuming userId might be implicitly derived or handled by authentication
//     const userId = req.body.userId; // If you still need to ensure patient ownership
//
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//
//     try {
//         // Find the order by its ID. Add userId check if necessary for security
//         const order = await OrderModel.findOne({ _id: orderId, userId: userId });
//
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found or does not belong to the provided patient.' });
//         }
//
//         if (order.status === 'Delivered' || order.status === 'Cancelled') {
//             return res.status(400).json({ message: `Order cannot be marked as delivered as its current status is '${order.status}'.` });
//         }
//
//         order.status = 'Delivered';
//         await order.save();
//
//         // --- Dynamic Notification Trigger: Order Delivered ---
//         await notificationService.createNotification(
//             userId, // The string userId
//             `Order #${order._id} has been delivered!`,
//             'order_delivered'
//         );
//
//         res.status(200).json({
//             message: `Order ID: ${order._id} has been successfully marked as 'Delivered'.`,
//             orderId: order._id,
//             newStatus: order.status
//         });
//
//     } catch (error) {
//         console.error('Error setting order as delivered:', error);
//         res.status(500).json({ message: 'Error setting order as delivered', error: error.message });
//     }
// });

orderRouter.put('/api/orders/:orderId/deliver', protect, async (req, res) => { // <-- ADD 'protect' middleware here
    const { orderId } = req.params;
    // const userId = req.body.userId; // <-- REMOVE THIS. It's insecure.
    const userId = req.user.userId; // <-- GET userId securely from authenticated token

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }

    try {
        // Find the order by its ID AND verify it belongs to the patient from the token.
        // This is your authorization step.
        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            // Be specific if it's not found vs. not owned by patient for better debugging
            const genericOrder = await OrderModel.findById(orderId);
            if (!genericOrder) {
                return res.status(404).json({ message: 'Order not found.' });
            } else {
                // This means the order exists, but not for the authenticated patient ID.
                // Could be an attempt to deliver someone else's order.
                console.warn(`Unauthorized attempt to deliver order ${orderId} by user ${userId}. Order owner: ${genericOrder.userId}`);
                return res.status(403).json({ message: 'Not authorized to deliver this order.' });
            }
        }

        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ message: `Order cannot be marked as delivered as its current status is '${order.status}'.` });
        }

        // Add any additional business logic for delivery.
        // For example, perhaps only an admin can mark it delivered, or it should already be 'Shipped'.
        // if (order.status !== 'Shipped' && !req.patient.isAdmin) { // Example for admin check
        //     return res.status(400).json({ message: 'Order must be shipped before marking as delivered, or you need admin privileges.' });
        // }


        order.status = 'Delivered';
        await order.save();

        // --- Dynamic Notification Trigger: Order Delivered ---
        // Use userId for the notification as well, as it's the verified patient ID
        await notificationService.createNotification(
            userId, // Use the secure userIdFromToken
            `Order #${order._id} has been delivered!`,
            'order_delivered'
        );

        res.status(200).json({
            message: `Order ID: ${order._id} has been successfully marked as 'Delivered'.`,
            orderId: order._id,
            newStatus: order.status
        });

    } catch (error) {
        console.error('Error setting order as delivered:', error);
        res.status(500).json({ message: 'Error setting order as delivered', error: error.message });
    }
});

// API endpoint to add a review/rating to a DELIVERED order
// PUT /api/orders/:orderId/review
orderRouter.put('/api/orders/:orderId/review', async (req, res) => {
    const { orderId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required in the request body.' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }
    if (comment && comment.length > 1000) {
        return res.status(400).json({ message: 'Comment exceeds maximum length (1000 characters).' });
    }

    try {
        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to the provided patient.' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: `Order cannot be reviewed. Its status is '${order.status}', but must be 'Delivered'.` });
        }

        let orderReview = await OrderReviewModel.findOne({ order: order._id, user: userId });

        const reviewerUser = await UserModel.findOne({ userId: userId }).select('username email');
        if (!reviewerUser) {
            return res.status(404).json({ message: 'Reviewer patient not found for the provided userId.' });
        }

        if (orderReview) {
            orderReview.rating = rating;
            orderReview.comment = comment;
            orderReview.reviewerName = reviewerUser.username;
            orderReview.reviewerEmail = reviewerUser.email;
        } else {
            orderReview = new OrderReviewModel({
                order: order._id,
                user: userId,
                rating: rating,
                comment: comment,
                reviewerName: reviewerUser.username,
                reviewerEmail: reviewerUser.email,
            });
        }

        const savedOrderReview = await orderReview.save();

        if (!order.isReviewed) {
            order.isReviewed = true;
            await order.save();
        }

        // --- Dynamic Notification Trigger: Order Reviewed ---
        await notificationService.createNotification(
            userId, // The string userId
            `Thank you for reviewing Order #${order._id} with a ${rating}-star rating!`,
            'order_reviewed'
        );

        res.status(200).json({
            message: `Order ID: ${order._id} successfully reviewed.`,
            review: savedOrderReview,
            orderStatus: order.status,
            orderIsReviewed: order.isReviewed
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This order has already been reviewed by this patient.', error: error.message });
        }
        console.error('Error adding/updating order review:', error);
        res.status(500).json({ message: 'Error adding/updating order review', error: error.message });
    }
});

// API endpoint to get a review by userId and orderId
// GET /api/orders/:orderId/review/patient/:userId
orderRouter.get('/api/orders/:orderId/review/user/:userId', async (req, res) => {
    const { orderId, userId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'A valid User ID is required.' });
    }

    try {
        const orderReview = await OrderReviewModel.findOne({ order: orderId, user: userId });

        if (!orderReview) {
            return res.status(404).json({ message: 'Review not found for this order and patient combination.' });
        }

        res.status(200).json({
            message: 'Order review fetched successfully.',
            review: {
                orderId: orderReview.order,
                rating: orderReview.rating,
                comments: orderReview.comment
            }
        });

    } catch (error) {
        console.error('Error fetching order review:', error);
        res.status(500).json({ message: 'Error fetching order review', error: error.message });
    }
});

// API endpoint to create a reorder from a recent or cancelled order to the cart
// POST /api/orders/:orderId/reorder-to-cart
orderRouter.post('/api/orders/:orderId/reorder-to-cart', async (req, res) => {
    const { orderId } = req.params;
    const { userId, mergeBehavior = 'merge' } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required in the request body.' });
    }
    if (!['replace', 'merge'].includes(mergeBehavior)) {
        return res.status(400).json({ message: 'Invalid mergeBehavior. Must be "replace" or "merge".' });
    }

    try {
        const originalOrder = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!originalOrder) {
            return res.status(404).json({ message: 'Original order not found or does not belong to the provided patient.' });
        }

        let userCart = await CartModel.findOne({ userId: userId });

        if (!userCart) {
            userCart = new CartModel({ userId: userId, items: [] });
        }

        const reorderItems = [];
        for (const orderItem of originalOrder.items) {
            const product = await ProductModel.findById(orderItem.productId);
            if (product) {
                reorderItems.push({
                    productId: product._id,
                    quantity: orderItem.quantity,
                });
            } else {
                console.warn(`Product with ID ${orderItem.productId} from original order not found. Skipping.`);
            }
        }

        if (mergeBehavior === 'replace') {
            userCart.items = reorderItems;
        } else { // mergeBehavior === 'merge'
            for (const newItem of reorderItems) {
                const existingCartItem = userCart.items.find(item =>
                    item.productId.equals(newItem.productId)
                );

                if (existingCartItem) {
                    existingCartItem.quantity += newItem.quantity;
                } else {
                    userCart.items.push(newItem);
                }
            }
        }

        await userCart.save();

        // --- Dynamic Notification Trigger: Order Reordered ---
        await notificationService.createNotification(
            userId, // The string userId
            `Order #${orderId} has been successfully reordered to your cart!`,
            'order_reordered'
        );

        res.status(200).json({
            message: `Order ID: ${orderId} successfully reordered to cart with '${mergeBehavior}' behavior.`,
            cart: userCart
        });

    } catch (error) {
        console.error('Error creating reorder to cart:', error);
        res.status(500).json({ message: 'Error creating reorder to cart', error: error.message });
    }
});


orderRouter.delete('/api/orders/:orderId', protect, async (req, res) => {
    try {

        const { orderId } = req.params;
        const userId = req.user.userId;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'A valid Order ID is required.' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'User ID is unauthorized.' });
        }

        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order)
            return res.status(404).json({ message: `Order ${orderId} not found.` });


        // If authorized, proceed with deletion
        const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

        if (deletedOrder) {
            res.status(200).json({ message: `Order ${orderId} deleted successfully.` });
        } else {
            // This case should ideally not be reached if order was found above
            res.status(404).json({ message: `Order ${orderId} not found after authorization.` });
        }

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
});

module.exports = orderRouter;