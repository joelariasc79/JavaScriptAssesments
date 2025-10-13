// dataModel/orderReviewDataModel.js
const mongoose = require('mongoose');

const OrderReviewSchema = new mongoose.Schema({
    // Link to the Order being reviewed
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true // Enforce that one order can only have one overall review (from the purchasing patient)
    },
    // Link to the User who placed the order and is reviewing it
    user: {
        type: String, // Changed to String to store userId
        ref: 'User', // Still keeping ref for potential population, but it will populate on a String field
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Order ratings typically 1-5
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    // Denormalized patient info for quicker access without populating 'patient'
    reviewerName: {
        type: String,
        required: true,
        trim: true,
    },
    reviewerEmail: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true // Adds createdAt and updatedAt fields for the review
});

// Compound unique index to ensure a specific patient can review a specific order only once
OrderReviewSchema.index({ order: 1, user: 1 }, { unique: true });

const OrderReviewModel = mongoose.model('OrderReview', OrderReviewSchema);

module.exports = OrderReviewModel;
