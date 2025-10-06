// dataModel/productReviewDataModel.js
const mongoose = require('mongoose');

const ProductReviewSchema = new mongoose.Schema({
    // Link to the Product being reviewed
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // 'Product' refers to the models name of your product (ProductModel)
        required: true,
    },
    // The rating given (e.g., 1 to 5 stars)
    rating: {
        type: Number,
        required: true,
        min: 1, // Ratings typically start from 1
        max: 5,
    },
    // The comment/text review
    comment: {
        type: String,
        trim: true, // Remove whitespace from both ends
        maxlength: 1000, // Limit comment length
    },
    // (Optional) If you have a User models, link to the user who made the review
    // For now, we'll use a simple reviewer name/email.
    reviewerName: {
        type: String,
        default: 'Anonymous',
        trim: true,
    },
    reviewerEmail: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true // Adds createdAt and updatedAt fields for the review
});

// Add an index to efficiently query reviews by product
ProductReviewSchema.index({ product: 1 });

const ProductReviewModel = mongoose.model('ProductReview', ProductReviewSchema);

module.exports = ProductReviewModel;