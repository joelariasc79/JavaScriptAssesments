// backend/dataModel/couponDataModel.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true, // Ensure coupon codes are unique
        trim: true,
        uppercase: true, // Store codes in uppercase for consistency
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100, // Though we'll generate <= 20, keeping max 100 for schema flexibility
    },
    isActive: {
        type: Boolean,
        default: true, // Coupons are active by default
    },
    isUsed: {
        type: Boolean,
        default: false, // Track if a coupon has been used
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who used it (optional)
        default: null,
    },
    expiresAt: {
        type: Date,
        // Example: Coupon expires in 30 days from creation
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Create an index on the code for faster lookups
couponSchema.index({ code: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;