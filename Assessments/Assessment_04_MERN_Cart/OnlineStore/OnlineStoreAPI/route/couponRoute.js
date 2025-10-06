// backend/routes/couponRouter.js
const express = require('express');
const couponRouter = express.Router();
const CouponDataModel = require('../DataModel/couponDataModel'); // Import the new models


/**
 * Helper function to generate a random 6-digit numeric string.
 * @returns {string} A 6-digit numeric string.
 */
function generateRandomCouponCode() {
    const min = 100000;
    const max = 999999;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
}

/**
 * Helper function to generate a random discount percentage (0-20%).
 * @returns {number} A number between 0 and 20 (inclusive, with two decimal places).
 */
function generateRandomDiscountPercentage() {
    // Generate a random number between 0 and 20, with two decimal places
    return parseFloat((Math.random() * 20).toFixed(2));
}

/**
 * @route POST /api/coupon/generate-and-store
 * @description Generates a random 6-digit coupon code and a random discount percentage (0-20%), then stores it in MongoDB.
 * Uses POST as it's creating a resource on the server.
 * @access Public (In a real app, this might be restricted to admin roles)
 */
couponRouter.post('/api/coupon/generate-and-store', async (req, res) => {
    try {
        let uniqueCode = '';
        let isCodeUnique = false;
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loop in case of extreme collisions

        // Ensure unique code generation
        while (!isCodeUnique && attempts < maxAttempts) {
            uniqueCode = generateRandomCouponCode();
            const existingCoupon = await CouponDataModel.findOne({ code: uniqueCode });
            if (!existingCoupon) {
                isCodeUnique = true;
            }
            attempts++;
        }

        if (!isCodeUnique) {
            return res.status(500).json({ message: 'Failed to generate a unique coupon code after multiple attempts.' });
        }

        const discountPercentage = generateRandomDiscountPercentage();

        const newCoupon = new CouponDataModel({
            code: uniqueCode,
            discountPercentage: discountPercentage,
            // isActive, isUsed, usedBy, expiresAt are handled by default values in schema
        });

        const savedCoupon = await newCoupon.save();

        res.status(201).json({
            message: 'Coupon generated and stored successfully',
            coupon: {
                code: savedCoupon.code,
                discountPercentage: savedCoupon.discountPercentage,
                isActive: savedCoupon.isActive,
                expiresAt: savedCoupon.expiresAt
            }
        });

    } catch (error) {
        console.error('Error generating and storing coupon:', error);
        // Handle potential duplicate key error (though uniqueness check above mitigates)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A coupon with this code already exists. Please try again.', error: error.message });
        }
        res.status(500).json({ message: 'Failed to generate and store coupon', error: error.message });
    }
});

/**
 * @route GET /api/coupon/:code
 * @description Retrieves the discount percentage for a given coupon code.
 * @access Public (or restricted to authenticated users for applying to cart)
 */
couponRouter.get('/api/coupon/:code', async (req, res) => {
    const { code } = req.params;

    if (!code) {
        return res.status(400).json({ message: 'Coupon code is required.' });
    }

    try {
        const coupon = await CouponDataModel.findOne({ code: code.toUpperCase() }); // Assuming codes are stored uppercase

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ message: 'Coupon is not active.' });
        }

        if (coupon.isUsed) {
            return res.status(400).json({ message: 'Coupon has already been used.' });
        }

        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            // Optionally, mark as inactive if expired
            if (coupon.isActive) {
                coupon.isActive = false;
                await coupon.save();
            }
            return res.status(400).json({ message: 'Coupon has expired.' });
        }

        res.status(200).json({
            message: 'Coupon found and valid.',
            coupon: {
                code: coupon.code,
                discountPercentage: coupon.discountPercentage,
                isActive: coupon.isActive,
                expiresAt: coupon.expiresAt
            }
        });

    } catch (error) {
        console.error('Error retrieving coupon:', error);
        res.status(500).json({ message: 'Error retrieving coupon data', error: error.message });
    }
});


module.exports = couponRouter;