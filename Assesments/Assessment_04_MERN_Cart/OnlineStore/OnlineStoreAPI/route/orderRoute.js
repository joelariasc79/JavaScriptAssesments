const express = require('express');
const orderRouter = express.Router();
const mongoose = require('mongoose'); // For ObjectId validation

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
            return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
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
                    coupon.usedBy = userDoc._id; // Store the ObjectId of the user
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


// API endpoint to fetch current user's recent orders
// GET /api/orders/user/recent - Fetch recent orders for a user, including associated review data
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
            return res.status(404).json({ message: 'No recent orders found for this user.' });
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
            return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
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
            return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
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

// NEW API endpoint to set orders as delivered after 2 days of orderDate
// PUT /api/orders/:orderId/deliver
orderRouter.put('/api/orders/:orderId/deliver', async (req, res) => {
    const { orderId } = req.params;
    // Assuming userId might be implicitly derived or handled by authentication
    const userId = req.body.userId; // If you still need to ensure user ownership

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'A valid Order ID is required.' });
    }

    try {
        // Find the order by its ID. Add userId check if necessary for security
        const order = await OrderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
        }

        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ message: `Order cannot be marked as delivered as its current status is '${order.status}'.` });
        }

        order.status = 'Delivered';
        await order.save();

        // --- Dynamic Notification Trigger: Order Delivered ---
        await notificationService.createNotification(
            userId, // The string userId
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
            return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: `Order cannot be reviewed. Its status is '${order.status}', but must be 'Delivered'.` });
        }

        let orderReview = await OrderReviewModel.findOne({ order: order._id, user: userId });

        const reviewerUser = await UserModel.findOne({ userId: userId }).select('username email');
        if (!reviewerUser) {
            return res.status(404).json({ message: 'Reviewer user not found for the provided userId.' });
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
            return res.status(409).json({ message: 'This order has already been reviewed by this user.', error: error.message });
        }
        console.error('Error adding/updating order review:', error);
        res.status(500).json({ message: 'Error adding/updating order review', error: error.message });
    }
});

// NEW API endpoint to get a review by userId and orderId
// GET /api/orders/:orderId/review/user/:userId
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
            return res.status(404).json({ message: 'Review not found for this order and user combination.' });
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
            return res.status(404).json({ message: 'Original order not found or does not belong to the provided user.' });
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

module.exports = orderRouter;



// const express = require('express');
// const orderRouter = express.Router();
// const mongoose = require('mongoose'); // For ObjectId validation
//
// const OrderModel = require('../DataModel/orderDataModel'); // Adjust path as per your project structure
// const CouponDataModel = require('../DataModel/couponDataModel');
// const ProductModel = require('../DataModel/productDataModel'); // Needed for some checks, if not already there
// const UserModel = require('../DataModel/userDataModel'); // Import UserModel
// const OrderReviewModel = require('../DataModel/orderReviewDataModel'); // Import new OrderReviewModel
// const CartModel = require('../DataModel/cartDataModel');
//
// // API endpoint to pay for an orders
// // POST /api/orders/:orderId/pay
// orderRouter.post('/api/orders/:orderId/pay', async (req, res) => {
//     const { orderId } = req.params;
//     // Destructure new optional inputs: couponCode
//     const { paymentMethod, transactionId, amountPaid, couponCode } = req.body;
//
//     // 1. Validate orderId format
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//
//     try {
//         // 2. Find the order by its ID
//         const order = await OrderModel.findById(orderId);
//
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found.' });
//         }
//
//         // 3. Check current order status
//         if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
//             return res.status(400).json({ message: `Order is already in a final state (${order.status}) and cannot be paid again.` });
//         }
//         if (order.status === 'Processing') {
//             return res.status(400).json({ message: 'Order is already being processed or has been paid.' });
//         }
//
//         // Apply discount if coupon details are provided and valid
//         let finalAmountToProcess = order.totalAmount;
//         let appliedCouponDetails = null; // To store details about the coupon used
//         let calculatedAmountSaved = 0; // Initialize calculated discount amount
//
//         // Only proceed with coupon logic if a coupon code is provided
//         if (couponCode) {
//             const coupon = await CouponDataModel.findOne({ code: couponCode.toUpperCase() });
//
//             // Check if coupon exists, is active, not used, and not expired
//             if (coupon && coupon.isActive && !coupon.isUsed && coupon.expiresAt && new Date() < coupon.expiresAt) {
//                 // *** CRITICAL FIX: Calculate discount on backend ***
//                 calculatedAmountSaved = order.totalAmount * (coupon.discountPercentage / 100);
//                 // Ensure discount does not exceed the total order amount
//                 calculatedAmountSaved = Math.min(calculatedAmountSaved, order.totalAmount);
//
//                 finalAmountToProcess = order.totalAmount - calculatedAmountSaved;
//                 finalAmountToProcess = Math.max(0, finalAmountToProcess); // Ensure amount doesn't go below zero
//
//                 // Mark coupon as used
//                 coupon.isUsed = true;
//
//                 // FIX: Ensure order.userId is a valid ObjectId before assigning
//                 // This is the most common source of error for `usedBy` field.
//                 if (order.userId && mongoose.Types.ObjectId.isValid(order.userId)) {
//                     coupon.usedBy = order.userId;
//                     console.log(`Coupon '${coupon.code}' will be linked to user ID: ${order.userId}`);
//                 } else {
//                     // If order.userId is not valid or not present, ensure usedBy is null
//                     coupon.usedBy = null; // Explicitly set to null
//                     console.warn(`Order ${order._id} does not have a valid userId to link. Coupon '${coupon.code}' will NOT be linked to a user.`);
//                 }
//
//                 try {
//                     await coupon.save(); // This is the line that was likely throwing the error if `usedBy` is bad
//                     console.log(`Coupon '${coupon.code}' status updated to used.`);
//                 } catch (saveError) {
//                     // If coupon save fails, log the error and re-throw to be caught by the main catch block.
//                     // This ensures the 500 error is returned and payment process potentially halted.
//                     console.error(`ERROR: Failed to save coupon '${coupon.code}' after use:`, saveError);
//                     // Depending on your business logic, you might want to revert order changes here
//                     // or return a specific error to the client.
//                     throw new Error(`Failed to update coupon status: ${saveError.message}`);
//                 }
//
//                 appliedCouponDetails = {
//                     code: coupon.code,
//                     discountPercentage: coupon.discountPercentage,
//                     amountSaved: calculatedAmountSaved
//                 };
//
//                 console.log(`Coupon '${couponCode}' applied. Discounted amount: ${finalAmountToProcess.toFixed(2)}. Amount saved: ${calculatedAmountSaved.toFixed(2)}`);
//             } else {
//                 // Log a warning if coupon was provided but invalid/unusable at this stage
//                 console.warn(`Coupon '${couponCode}' was provided but is not valid, active, used, or expired for payment. Proceeding with original amount.`);
//                 // The finalAmountToProcess remains original order.totalAmount here if coupon is invalid
//             }
//         }
//
//         // Simulate Payment Processing (In a real app, integrate with a payment gateway)
//         console.log(`Processing payment for Order ID: ${order._id} with method: ${paymentMethod}`);
//         console.log(`Transaction ID: ${transactionId}`);
//         console.log(`Original Order Total: ${order.totalAmount.toFixed(2)}`);
//         console.log(`Final Amount to Process (after discount): ${finalAmountToProcess.toFixed(2)}`);
//         console.log(`Amount Paid from Client: ${amountPaid ? parseFloat(amountPaid).toFixed(2) : 'Not provided or used backend calculated'}`);
//
//
//         // Optional: Verify amountPaid from client matches finalAmountToProcess
//         // This is important if your frontend passes 'amountPaid' after discount
//         if (amountPaid && Math.abs(parseFloat(amountPaid) - finalAmountToProcess) > 0.01) { // Allow for float precision
//             console.warn(`Frontend amountPaid (${parseFloat(amountPaid).toFixed(2)}) does not match backend calculated finalAmountToProcess (${finalAmountToProcess.toFixed(2)}). It is recommended to use backend calculated amount.`);
//             // Depending on your strictness, you might choose to return an error here
//             // e.g., return res.status(400).json({ message: "Payment amount mismatch after discount verification." });
//         }
//
//
//         // Update Order Status and Total Amount
//         order.status = 'Processing'; // Or 'Paid' if you add that to your Order schema enum
//         order.totalAmount = finalAmountToProcess; // Update order with the discounted total
//
//         // You could also store payment details on the order document if your schema allows
//         // (e.g., order.paymentDetails = { method: paymentMethod, transactionId: transactionId, paidAmount: amountPaid, paidAt: new Date() })
//
//         await order.save();
//
//         res.status(200).json({
//             message: `Payment successful for Order ID: ${order._id}. Order status updated to '${order.status}'.`,
//             orderId: order._id,
//             newStatus: order.status,
//             totalAmount: order.totalAmount, // This is now the discounted total
//             transactionId: transactionId,
//             // Return coupon details if applied
//             appliedCoupon: appliedCouponDetails
//         });
//
//     } catch (error) {
//         console.error('Error processing order payment:', error); // Log the full error
//         res.status(500).json({ message: 'Error processing order payment', error: error.message });
//     }
// });
//
//
// // API endpoint to fetch current user's recent orders
// // GET /api/orders/user/recent - Fetch recent orders for a user, including associated review data
// orderRouter.get('/api/orders/user/recent', async (req, res) => {
//     // userId must now be provided by the client as a query parameter
//     const userId = req.query.userId;
//     const limit = parseInt(req.query.limit) || 10;
//
//     // --- IMPORTANT: Validate userId since it's no longer from an authenticated token ---
//     if (!userId) {
//         return res.status(400).json({ message: 'User ID is required as a query parameter (e.g., ?userId=yourId).' });
//     }
//
//     try {
//         // Fetch recent orders. Use .lean() to get plain JavaScript objects, making them mutable.
//         let recentOrders = await OrderModel.find({ userId: userId })
//             .sort({ orderDate: -1 })
//             .limit(limit)
//             .lean(); // Convert Mongoose documents to plain JavaScript objects
//
//         if (!recentOrders || recentOrders.length === 0) {
//             return res.status(404).json({ message: 'No recent orders found for this user.' });
//         }
//
//         // Iterate through each order to check for and attach its review data
//         for (let i = 0; i < recentOrders.length; i++) {
//             const order = recentOrders[i];
//
//             // Attempt to find an OrderReview for this specific order and user
//             // 'user' field in OrderReviewModel is a String (userId) as per your schema
//             const orderReview = await OrderReviewModel.findOne({ order: order._id, user: userId });
//
//             if (orderReview) {
//                 // If a review exists, attach its details to the order object
//                 order.isReviewed = true;
//                 order.rating = orderReview.rating;
//                 order.comment = orderReview.comment;
//             } else {
//                 // If no review exists, explicitly set review-related fields to null/false
//                 order.isReviewed = false;
//                 order.rating = null;
//                 order.comment = null;
//             }
//         }
//
//         res.status(200).json({
//             message: `Successfully fetched ${recentOrders.length} recent orders.`,
//             orders: recentOrders
//         });
//
//     } catch (error) {
//         console.error('Error fetching recent orders and attaching reviews:', error);
//         res.status(500).json({ message: 'Error fetching recent orders', error: error.message });
//     }
// });
//
// // API endpoint to cancel an orders
// // PUT /api/orders/:orderId/cancel
// orderRouter.put('/api/orders/:orderId/cancel', async (req, res) => { // AUTHENTICATION MIDDLEWARE REMOVED
//     const { orderId } = req.params;
//     const { userId } = req.body; // CHANGED: Get userId from request body
//
//     // 1. Validate orderId format and userId presence
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//     if (!userId) { // New validation for userId in body
//         return res.status(400).json({ message: 'User ID is required in the request body to cancel an order.' });
//     }
//
//     try {
//         // 2. Find the order by its ID and ensure it belongs to the provided userId
//         const order = await OrderModel.findOne({ _id: orderId, userId: userId });
//
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
//         }
//
//         // 3. Check current order status to determine if it can be cancelled
//         if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
//             return res.status(400).json({ message: `Order is already in a final state (${order.status}) and cannot be cancelled.` });
//         }
//
//         // Check if the order can be cancelled within 2 days of orderDate
//         // This is the crucial part that enforces the 2-day window on the backend.
//         const twoDaysAgo = new Date();
//         twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); // Subtract 2 days from current date
//
//         if (order.orderDate < twoDaysAgo) {
//             return res.status(400).json({ message: 'Order can only be cancelled within 2 days of the order date.' });
//         }
//
//         // 4. Update order status to 'Cancelled'
//         order.status = 'Cancelled';
//         await order.save();
//
//         res.status(200).json({
//             message: `Order ID: ${order._id} has been successfully cancelled.`,
//             orderId: order._id,
//             newStatus: order.status
//         });
//
//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         res.status(500).json({ message: 'Error cancelling order', error: error.message });
//     }
// });
//
// // API endpoint to reopen a cancelled orders
// // PUT /api/orders/:orderId/reopen
// orderRouter.put('/api/orders/:orderId/reopen', async (req, res) => { // AUTHENTICATION MIDDLEWARE REMOVED
//     const { orderId } = req.params;
//     const { userId } = req.body; // CHANGED: Get userId from request body
//
//     // 1. Validate orderId format and userId presence
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//     if (!userId) { // New validation for userId in body
//         return res.status(400).json({ message: 'User ID is required in the request body to reopen an order.' });
//     }
//
//     try {
//         // 2. Find the order by its ID and ensure it belongs to the provided userId
//         const order = await OrderModel.findOne({ _id: orderId, userId: userId });
//
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
//         }
//
//         // 3. Check current order status to determine if it can be reopened
//         // Only cancelled orders can be reopened
//         if (order.status !== 'Cancelled') {
//             return res.status(400).json({ message: `Order cannot be reopened as its current status is '${order.status}'. Only 'Cancelled' orders can be reopened.` });
//         }
//
//         // 4. Update order status to 'Pending' (or another appropriate initial status)
//         order.status = 'Pending';
//         await order.save();
//
//         res.status(200).json({
//             message: `Order ID: ${order._id} has been successfully reopened.`,
//             orderId: order._id,
//             newStatus: order.status
//         });
//
//     } catch (error) {
//         console.error('Error reopening order:', error);
//         res.status(500).json({ message: 'Error reopening order', error: error.message });
//     }
// });
//
// // NEW API endpoint to set orders as delivered after 2 days of orderDate
// // PUT /api/orders/:orderId/deliver
// orderRouter.put('/api/orders/:orderId/deliver', async (req, res) => { // AUTHENTICATION MIDDLEWARE REMOVED
//     const { orderId } = req.params;
//
//     // 1. Validate orderId format
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//
//     try {
//         // 2. Find the order by its ID.
//         const order = await OrderModel.findOne({ _id: orderId }); // userId check removed here
//
//         if (!order) {
//             // Changed message as `userId` check is removed
//             return res.status(404).json({ message: 'Order not found.' });
//         }
//
//         // 3. Check current order status to determine if it can be marked as delivered
//         // If already delivered or cancelled, it cannot be marked as delivered again
//         if (order.status === 'Delivered' || order.status === 'Cancelled') {
//             return res.status(400).json({ message: `Order cannot be marked as delivered as its current status is '${order.status}'.` });
//         }
//
//         // 5. Update order status to 'Delivered'
//         order.status = 'Delivered';
//         await order.save();
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
//
// // API endpoint to add a review/rating to a DELIVERED order
// // PUT /api/orders/:orderId/review
// /*
// PUT /api/orders/651c6b1d2f6c8d7e9a0b1c2d/review HTTP/1.1
// Host: localhost:3000
// Content-Type: application/json
//
// {
//     "userId": "user123", // Replace with a valid userId from your UserModel
//     "rating": 5,
//     "comment": "Fantastic order experience! Fast delivery and great packaging."
// }
// */
// // PUT /api/orders/:orderId/review - Submit or update an order review
// orderRouter.put('/api/orders/:orderId/review', async (req, res) => {
//     const { orderId } = req.params;
//     const { userId, rating, comment } = req.body; // Expecting userId (as string), rating, comment from body
//
//     // 1. Basic validation for inputs
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//     if (!userId) {
//         return res.status(400).json({ message: 'User ID is required in the request body.' });
//     }
//     if (typeof rating !== 'number' || rating < 1 || rating > 5) {
//         return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
//     }
//     // Comment is optional, but if present, can have length validation
//     if (comment && comment.length > 1000) {
//         return res.status(400).json({ message: 'Comment exceeds maximum length (1000 characters).' });
//     }
//
//     try {
//         // 2. Find the order by its ID and ensure it belongs to the provided userId
//         // userId here is a string, which matches the OrderModel's userId field type.
//         const order = await OrderModel.findOne({ _id: orderId, userId: userId });
//
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found or does not belong to the provided user.' });
//         }
//
//         // 3. Crucial Check: Ensure the order status is 'Delivered'
//         if (order.status !== 'Delivered') {
//             return res.status(400).json({ message: `Order cannot be reviewed. Its status is '${order.status}', but must be 'Delivered'.` });
//         }
//
//         // 4. Check if a review already exists for this order and user combination
//         // Since user in OrderReviewModel is a String (userId), we query by that string.
//         let orderReview = await OrderReviewModel.findOne({ order: order._id, user: userId });
//
//         // 5. Fetch reviewer details from the database using the provided userId
//         const reviewerUser = await UserModel.findOne({ userId: userId }).select('username email');
//         if (!reviewerUser) {
//             return res.status(404).json({ message: 'Reviewer user not found for the provided userId.' });
//         }
//
//
//         if (orderReview) {
//             // If review exists, update it
//             orderReview.rating = rating;
//             orderReview.comment = comment;
//             orderReview.reviewerName = reviewerUser.username;
//             orderReview.reviewerEmail = reviewerUser.email;
//         } else {
//             // If no review exists, create a new one
//             orderReview = new OrderReviewModel({
//                 order: order._id,
//                 user: userId, // Store userId as a String, as per OrderReviewSchema update
//                 rating: rating,
//                 comment: comment,
//                 reviewerName: reviewerUser.username,
//                 reviewerEmail: reviewerUser.email,
//             });
//         }
//
//         const savedOrderReview = await orderReview.save();
//
//         // 6. Update the order's `isReviewed` status if it's a new review
//         if (!order.isReviewed) {
//             order.isReviewed = true;
//             await order.save();
//         }
//
//         res.status(200).json({
//             message: `Order ID: ${order._id} successfully reviewed.`,
//             review: savedOrderReview,
//             orderStatus: order.status,
//             orderIsReviewed: order.isReviewed
//         });
//
//     } catch (error) {
//         // Handle Mongoose unique index violation for duplicate reviews
//         if (error.code === 11000) { // MongoDB duplicate key error code
//             return res.status(409).json({ message: 'This order has already been reviewed by this user.', error: error.message });
//         }
//         console.error('Error adding/updating order review:', error);
//         res.status(500).json({ message: 'Error adding/updating order review', error: error.message });
//     }
// });
//
// // NEW API endpoint to get a review by userId and orderId
// // GET /api/orders/:orderId/review/user/:userId
// orderRouter.get('/api/orders/:orderId/review/user/:userId', async (req, res) => {
//     const { orderId, userId } = req.params;
//
//     // 1. Validate orderId format (userId is now a string, so no ObjectId validation needed for it)
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//     // userId is expected to be a string, no ObjectId validation for userId
//     if (!userId) {
//         return res.status(400).json({ message: 'A valid User ID is required.' });
//     }
//
//     try {
//         // 2. Find the order review by both order ID and user ID
//         // The 'user' field in OrderReviewModel is now a String (userId)
//         const orderReview = await OrderReviewModel.findOne({ order: orderId, user: userId });
//
//         if (!orderReview) {
//             return res.status(404).json({ message: 'Review not found for this order and user combination.' });
//         }
//
//         // Return orderId, rating, and comments
//         res.status(200).json({
//             message: 'Order review fetched successfully.',
//             review: {
//                 orderId: orderReview.order,
//                 rating: orderReview.rating,
//                 comments: orderReview.comment
//             }
//         });
//
//     } catch (error) {
//         console.error('Error fetching order review:', error);
//         res.status(500).json({ message: 'Error fetching order review', error: error.message });
//     }
// });
//
// // API endpoint to create a reorder from a recent or cancelled order to the cart
// // POST /api/orders/:orderId/reorder-to-cart
// /*
// {
//     "userId": "YOUR_USER_ID",
//     "mergeBehavior": "merge"
// }
// */
// orderRouter.post('/api/orders/:orderId/reorder-to-cart', async (req, res) => {
//     const { orderId } = req.params;
//     // userId from body (assuming no auth, as per previous discussion)
//     // mergeBehavior: 'replace' or 'merge' - determines how items interact with existing cart
//     const { userId, mergeBehavior = 'merge' } = req.body;
//
//     // 1. Validate inputs
//     if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: 'A valid Order ID is required.' });
//     }
//     if (!userId) {
//         return res.status(400).json({ message: 'User ID is required in the request body.' });
//     }
//     if (!['replace', 'merge'].includes(mergeBehavior)) {
//         return res.status(400).json({ message: 'Invalid mergeBehavior. Must be "replace" or "merge".' });
//     }
//
//     try {
//         // 2. Find the original order by ID and userId
//         const originalOrder = await OrderModel.findOne({ _id: orderId, userId: userId });
//
//         if (!originalOrder) {
//             return res.status(404).json({ message: 'Original order not found or does not belong to the provided user.' });
//         }
//
//         // 3. Fetch the user's cart
//         let userCart = await CartModel.findOne({ userId: userId });
//
//         if (!userCart) {
//             // If user doesn't have a cart, create a new one
//             userCart = new CartModel({ userId: userId, items: [] });
//         }
//
//         // 4. Process items from the original order for reorder
//         const reorderItems = [];
//         for (const orderItem of originalOrder.items) {
//             // It's crucial to fetch current product details to ensure correct price and availability
//             const product = await ProductModel.findById(orderItem.productId);
//             if (product) {
//                 // Add to reorderItems, ensuring only productId and quantity are used for the cart
//                 reorderItems.push({
//                     productId: product._id,
//                     quantity: orderItem.quantity,
//                 });
//             } else {
//                 console.warn(`Product with ID ${orderItem.productId} from original order not found. Skipping.`);
//                 // You might choose to return an error or a warning to the client here
//                 // For now, we'll just log and skip missing products.
//             }
//         }
//
//         // 5. Apply merge behavior
//         if (mergeBehavior === 'replace') {
//             // Replace existing cart items with reorder items
//             userCart.items = reorderItems;
//         } else { // mergeBehavior === 'merge'
//             // Merge reorder items with existing cart items
//             for (const newItem of reorderItems) {
//                 const existingCartItem = userCart.items.find(item =>
//                     item.productId.equals(newItem.productId) // Use .equals() for ObjectId comparison
//                 );
//
//                 if (existingCartItem) {
//                     // If product already exists in cart, increase quantity
//                     existingCartItem.quantity += newItem.quantity;
//                 } else {
//                     // If product doesn't exist, add it as a new item
//                     userCart.items.push(newItem);
//                 }
//             }
//         }
//
//         // 6. Save the updated cart
//         await userCart.save();
//
//         res.status(200).json({
//             message: `Order ID: ${orderId} successfully reordered to cart with '${mergeBehavior}' behavior.`,
//             cart: userCart
//         });
//
//     } catch (error) {
//         console.error('Error creating reorder to cart:', error);
//         res.status(500).json({ message: 'Error creating reorder to cart', error: error.message });
//     }
// });
//
// module.exports = orderRouter;
//
