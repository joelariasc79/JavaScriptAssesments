// dataModel/orderDataModel.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    name: {
        type: String,
        // Assuming 'required: true' was removed in previous step for name
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        // Assuming 'required: true' was removed in previous step for price
        min: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: String, // Assuming this was changed to String based on previous discussions
        required: true,
        ref: 'User'
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        // --- THIS IS THE CHANGE: 'required: true' is removed ---
        // required: true, // Removed this line
        min: 0
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
});

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;