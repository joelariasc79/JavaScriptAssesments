const express = require('express') //import package
const cartRouter = express.Router({strict:true, caseSensitive: true}) // a separate route table to create and handle our api's
const cartDataModel = require('../DataModel/cartDataModel');
const productDataModel = require('../DataModel/productDataModel');
const orderDataModel = require('../DataModel/orderDataModel');
const userDataModel = require('../DataModel/userDataModel');

cartRouter.post('/api/cart/add', async (req, res) => {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ message: 'User ID and Product ID are required.' });
    }

    try {
        // Find the product to ensure it exists
        const product = await productDataModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        let cart = await cartDataModel.findOne({ userId });

        if (cart) {
            // Cart exists, update it
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // Item already in cart, update quantity
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Item not in cart, add new item
                cart.items.push({ productId, quantity });
            }
        } else {
            // No cart for this user, create a new one
            cart = new cartDataModel({
                userId,
                items: [{ productId, quantity }]
            });
        }

        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
});

/**
 * @route GET /api/cart/:userId
 * @description Get a user's current cart, populated with product details.
 * @access Public (in a real app, userId would be derived from authentication)
 */
cartRouter.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params; // Get userId from the URL parameter

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to fetch the cart.' });
    }

    try {
        // Find the cart by userId and POPULATE the 'productId' field within 'items'
        // This brings in the actual product document (including name and price)
        const cart = await cartDataModel.findOne({ userId: userId }).populate('items.productId');

        if (!cart) {
            // If no cart is found for the user, return an empty cart structure
            // This is often more convenient for the frontend than a 404, as it can just render an empty cart.
            return res.status(200).json({ userId: userId, items: [], _id: null, createdAt: new Date(), updatedAt: new Date() });
        }

        // Map the cart items to ensure product details are correctly included
        // and handle cases where product might be missing or incomplete
        const populatedCartItems = cart.items.map(item => {
            if (item.productId && item.productId.name && typeof item.productId.price === 'number') {
                return {
                    // Return necessary product details for the frontend
                    productId: {
                        _id: item.productId._id,
                        name: item.productId.name,
                        price: item.productId.price,
                        // Include other product details if your frontend needs them (e.g., imageUrl)
                    },
                    quantity: item.quantity,
                    // Add any other cart item-specific fields (e.g., _id for the cart item subdocument itself if used)
                };
            } else {
                // Handle cases where a product linked in the cart might have been deleted
                console.warn(`Product details incomplete or missing for cart item. Product ID: ${item.productId ? item.productId._id : 'N/A'}`);
                return {
                    productId: { _id: item.productId, name: 'Unknown Product', price: 0 }, // Placeholder for missing product
                    quantity: item.quantity,
                    warning: 'Product details could not be loaded for this item.'
                };
            }
        });

        // Construct the response object that mirrors the cart structure expected by the frontend
        const responseCart = {
            _id: cart._id,
            userId: cart.userId,
            items: populatedCartItems,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            // Optionally, calculate and include the totalAmount here if your frontend needs it directly
            // totalAmount: populatedCartItems.reduce((sum, currentItem) => sum + (currentItem.productId.price * currentItem.quantity), 0)
        };

        res.status(200).json(responseCart);

    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart data', error: error.message });
    }
});
/**
 * @route POST /api/cart/checkout
 * @description Saves the current cart (marks it as "checked out" or moves it to an order collection).
 * For this example, we'll simply update the cart and potentially clear it or mark it as complete.
 * In a real scenario, this would involve creating an 'Order' document and potentially clearing the cart.
 * @body {string} userId - The ID of the user whose cart is being checked out.
 * @access Public (in a real app, userId would be derived from authentication)
 */

cartRouter.post('/api/cart/checkout', async (req, res) => { // <--- REMOVED THE TRAILING SLASH HERE
    // Assuming userId from req.body is the string userId stored in your Cart and User models
    const { userId: stringUserId } = req.body;

    if (!stringUserId) {
        return res.status(400).json({ message: 'User ID is required for checkout.' });
    }

    try {
        // 1. Find the User document to get its ObjectId (_id) for the Order model
        // This resolves the 'userId: Cast to ObjectId failed' if that was still an issue.
        const user = await userDataModel.findOne({ userId: stringUserId });
        if (!user) {
            return res.status(404).json({ message: 'User not found for the provided ID.' });
        }
        const userObjectId = user._id; // This is the actual ObjectId for the Order's userId field


        // 2. Find the cart AND POPULATE its items with product details (name, price, etc.)
        // THIS IS THE CRUCIAL CHANGE TO GET 'name' AND 'price'
        const cart = await cartDataModel.findOne({ userId: stringUserId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ message: 'No active cart found for this user to checkout.' });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty, cannot checkout.' });
        }

        // Prepare items for the order and calculate totalAmount using populated data
        const orderItems = [];
        let calculatedTotalAmount = 0;

        for (const item of cart.items) {
            // Validate if product was successfully populated and has necessary details
            if (!item.productId || !item.productId.name || item.productId.price === undefined) {
                console.warn(`Missing or invalid product data for cart item. Product ID: ${item.productId ? item.productId._id : 'N/A'}`);
                return res.status(400).json({ message: `Product details missing or incomplete for item with ID: ${item.productId ? item.productId._id : 'N/A'}. Cannot checkout.` });
            }

            // Ensure quantity is a valid number
            const quantity = Number(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                console.warn(`Invalid quantity for cart item: ${item.productId.name || 'N/A'}. Quantity: ${item.quantity}`);
                return res.status(400).json({ message: `Invalid quantity for item '${item.productId.name || 'N/A'}'.` });
            }

            // Use the populated price from the Product model
            const price = Number(item.productId.price);
            if (isNaN(price) || price < 0) {
                console.warn(`Invalid price for populated product: ${item.productId.name || 'N/A'}. Price: ${item.productId.price}`);
                return res.status(400).json({ message: `Invalid price for item '${item.productId.name || 'N/A'}'.` });
            }

            orderItems.push({
                productId: item.productId._id, // Use the actual ObjectId from the populated product
                name: item.productId.name,     // Get name from the populated product
                quantity: quantity,
                price: price                   // Get price from the populated product
            });
            calculatedTotalAmount += (quantity * price);
        }

        // Ensure calculatedTotalAmount is a valid number after the loop
        if (isNaN(calculatedTotalAmount)) {
            console.error('Final calculated totalAmount is NaN. This indicates an issue with previous data validation or product data.');
            return res.status(500).json({ message: 'Failed to finalize total amount calculation due to unexpected non-numeric values.' });
        }

        // 3. Create a new Order document using the correctly prepared data
        const order = new orderDataModel({
            userId: userObjectId, // Use the ObjectId obtained from the User document
            items: orderItems, // Use the correctly formatted orderItems array (with name and price)
            totalAmount: calculatedTotalAmount, // Use the correctly calculated total (now a number)
            status: 'Pending'
        });

        // Save the new order
        await order.save();

        // 4. Clear the user's cart
        cart.items = [];
        await cart.save();

        res.status(200).json({
            message: 'Cart successfully checked out and cleared.',
            orderId: order._id,
            totalAmount: order.totalAmount, // This will now be the actual number
            checkedOutItems: order.items    // This will now have name and price
        });

    } catch (error) {
        console.error('Checkout error:', error);
        // Provide more detailed error message if it's a Mongoose validation error
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ message: 'Order validation failed', errors: errors });
        }
        res.status(500).json({ message: 'Error during checkout process', error: error.message });
    }
});

module.exports = cartRouter;