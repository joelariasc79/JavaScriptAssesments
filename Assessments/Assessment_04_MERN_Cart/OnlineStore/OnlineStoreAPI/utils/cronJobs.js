// A separate file, e.g., 'cronJobs.js'
const cron = require('node-cron');
const OrderModel = require('../DataModel/orderDataModel'); // Adjust path
const moment = require('moment'); // You might need moment.js for date calculations

const setupScheduledTasks = () => {
    // Schedule a task to run every day at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('Running daily order delivery check...');
        try {
            const twoDaysAgo = moment().subtract(2, 'days').toDate();

            // Find orders that were 'Shipped' (or similar status) more than 2 days ago
            const ordersToDeliver = await OrderModel.find({
                status: 'Shipped', // Or 'In Transit', 'Out for Delivery' etc.
                orderDate: { $lte: twoDaysAgo } // Orders placed on or before twoDaysAgo
            });

            if (ordersToDeliver.length === 0) {
                console.log('No orders to automatically mark as delivered.');
                return;
            }

            // Update found orders to 'Delivered'
            const updatePromises = ordersToDeliver.map(async (order) => {
                order.status = 'Delivered';
                // Optionally add a deliveredDate field here: order.deliveredDate = new Date();
                await order.save();
                console.log(`Order ${order._id} automatically marked as Delivered.`);
            });

            await Promise.all(updatePromises);
            console.log(`Successfully marked ${ordersToDeliver.length} orders as Delivered.`);

        } catch (error) {
            console.error('Error during automatic delivery marking:', error);
        }
    });

    // You can add more scheduled tasks here if needed
    console.log('Scheduled tasks initialized.');
};

module.exports = setupScheduledTasks;
