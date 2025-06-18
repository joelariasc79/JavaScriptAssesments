const express = require('express') //import package
const productRouter = express.Router({strict:true, caseSensitive: true}) // a separate route table to create and handle our api's
const productDataModel = require('../DataModel/productDataModel');
const ProductReviewModel = require('../DataModel/productReviewDataModel');
const UserModel = require('../DataModel/userDataModel');


productRouter.post('/api/products', async (req, res) => {
    try {
        const newProduct = new productDataModel(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct); // 201 Created
    } catch (error) {
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
});

/**
 * @route GET /api/products
 * @description Get all products
 * @access Public
 */
productRouter.get('/api/products', async (req, res) => {
    try {
        const products = await productDataModel.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

/**
 * @route GET /api/products/:id
 * @description Get a single product by ID
 * @access Public
 */
productRouter.get('/api/products/:id', async (req, res) => {
    try {
        const product = await productDataModel.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

/*
* @route POST /api/products/:productId/reviews
* @description Add a new review/rating for a specific product and update product's average rating
* @access Public (userId provided in body, NOT authenticated)
* @body {number} rating - The rating (1-5)
* @body {string} [comment] - The review comment
* @body {string} userId - The ID of the user submitting the review (REQUIRED in body)
*/
productRouter.post('/api/products/:productId/reviews', async (req, res) => { // authenticateToken is REMOVED
    try {
        const productId = req.params.productId;
        // Now expecting userId directly from the request body
        const { rating, comment, userId } = req.body;

        // 1. Basic validation for userId from body
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required in the request body.' });
        }

        // 2. Fetch reviewer details from the database using the provided userId
        const reviewer = await UserModel.findOne({ userId: userId }).select('username email');
        if (!reviewer) {
            return res.status(404).json({ message: 'Reviewer user not found for the provided userId.' });
        }

        // 3. Validate product existence
        const product = await productDataModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // 4. Validate rating
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
        }

        // 5. Create and save the new review using fetched reviewer details
        const newReview = new ProductReviewModel({
            product: productId,
            rating: rating,
            comment: comment,
            reviewerName: reviewer.username, // Use username from fetched user
            reviewerEmail: reviewer.email,   // Use email from fetched user
            // If you updated ProductReviewSchema to include a 'user' ObjectId field:
            // user: reviewer._id,
        });

        const savedReview = await newReview.save();

        // 6. Calculate and update the product's average rating
        const result = await ProductReviewModel.aggregate([
            { $match: { product: product._id } },
            {
                $group: {
                    _id: '$product',
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        let newAverageRating = 0;
        if (result.length > 0) {
            newAverageRating = result[0].averageRating;
        }

        const updatedProduct = await productDataModel.findByIdAndUpdate(
            productId,
            { rating: newAverageRating },
            { new: true }
        );

        res.status(201).json({ savedReview, updatedProduct });

    } catch (error) {
        console.error('Error adding review or updating product rating:', error);
        res.status(500).json({ message: 'Error adding review or updating product rating', error: error.message });
    }
});

/**
 * @route GET /api/products/:productId/reviews
 * @description Get all reviews for a specific product
 * @access Public
 */
productRouter.get('/api/products/:productId/reviews', async (req, res) => {
    try {
        const productId = req.params.productId;

        // Optional: Check if product exists before fetching reviews
        const productExists = await productDataModel.exists({ _id: productId });
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Find all reviews for the given product ID, populate reviewer info if needed, and sort by newest first
        const reviews = await ProductReviewModel.find({ product: productId })
            .sort({ createdAt: -1 }) // Sort by newest reviews first
            .select('-__v'); // Exclude the Mongoose version key

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Error fetching product reviews', error: error.message });
    }
});

module.exports = productRouter;