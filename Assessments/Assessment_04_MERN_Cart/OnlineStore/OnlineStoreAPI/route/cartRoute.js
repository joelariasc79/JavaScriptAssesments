const express = require('express') //import package
const cartRouter = express.Router({strict:true, caseSensitive: true}) // a separate route table to create and handle our api's
const cartDataModel = require('../DataModel/cartDataModel');
const productDataModel = require('../DataModel/productDataModel');
const orderDataModel = require('../DataModel/orderDataModel'); // Not directly used here, but good to keep if needed
const userDataModel = require('../DataModel/userDataModel'); // Not directly used here, but good to keep if needed

const notificationService = require('../services/notificationService'); // Import notification service

cartRouter.post('/api/cart/add', async (req, res) => {
    // Destructure userId, productId, and quantity from the request body.
    // Default quantity to 1 if not provided.
    const { userId, productId, quantity = 1 } = req.body;

    // Input validation: Ensure userId and productId are provided.
    if (!userId || !productId) {
        return res.status(400).json({ message: 'User ID and Product ID are required.' });
    }

    try {
        // 1. Find the product to ensure it exists in the database.
        const product = await productDataModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // 2. Find the patient's cart.
        let cart = await cartDataModel.findOne({ userId });

        if (cart) {
            // 3. If a cart exists, check if the item is already in the cart.
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // 3a. Item already in cart: Update its quantity.
                cart.items[itemIndex].quantity = quantity;
            } else {
                // 3b. Item not in cart: Add it as a new item.
                cart.items.push({ productId, quantity });
            }
        } else {
            // 4. If no cart exists for the patient, create a new one.
            cart = new cartDataModel({
                userId,
                items: [{ productId, quantity }]
            });
        }

        // 5. Save the updated or newly created cart to the database.
        await cart.save();

        // 6. After saving, find the cart again and populate the 'items.productId' field.
        // This is crucial to embed the full product details (name, price, etc.)
        // into the response, matching the desired output format.
        const populatedCart = await cartDataModel.findOne({ userId }).populate('items.productId');

        // Handle case where populatedCart might somehow be null after save (unlikely but good for robustness)
        if (!populatedCart) {
            return res.status(500).json({ message: 'Failed to retrieve populated cart after update.' });
        }

        // 7. Map the populated items to ensure the structure matches the desired output.
        const responseItems = populatedCart.items.map(item => {
            if (item.productId && item.productId.name && typeof item.productId.price === 'number') {
                return {
                    productId: {
                        _id: item.productId._id,
                        name: item.productId.name,
                        price: item.productId.price,
                    },
                    quantity: item.quantity,
                };
            } else {
                console.warn(`Product details incomplete or missing for cart item. Product ID: ${item.productId ? item.productId._id : 'N/A'}`);
                return {
                    productId: { _id: item.productId, name: 'Unknown Product', price: 0 },
                    quantity: item.quantity,
                    warning: 'Product details could not be loaded for this item.'
                };
            }
        });

        // 8. Construct the final response object with the desired structure.
        const finalResponseCart = {
            _id: populatedCart._id,
            userId: populatedCart.userId,
            items: responseItems,
            createdAt: populatedCart.createdAt,
            updatedAt: populatedCart.updatedAt,
        };

        // --- Dynamic Notification Trigger: Item Added to Cart ---
        await notificationService.createNotification(
            userId, // The string userId
            `${product.name} (${quantity} pcs) added to your cart! You now have ${populatedCart.items.length} items.`,
            'cart_item_added'
        );

        // 9. Send the populated cart as a successful response.
        res.status(200).json(finalResponseCart);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
});

/**
 * @route GET /api/cart/:userId
 * @description Get a patient's current cart, populated with product details.
 * @access Public (in a real app, userId would be derived from authentication)
 */
cartRouter.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params; // Get userId from the URL parameter

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to fetch the cart.' });
    }

    try {
        // Find the cart by userId and POPULATE the 'productId' field within 'items'
        const cart = await cartDataModel.findOne({ userId: userId }).populate('items.productId');

        if (!cart) {
            return res.status(200).json({ userId: userId, items: [], _id: null, createdAt: new Date(), updatedAt: new Date() });
        }

        // Map the cart items to ensure product details are correctly included
        const populatedCartItems = cart.items.map(item => {
            if (item.productId && item.productId.name && typeof item.productId.price === 'number') {
                return {
                    productId: {
                        _id: item.productId._id,
                        name: item.productId.name,
                        price: item.productId.price,
                    },
                    quantity: item.quantity,
                };
            } else {
                console.warn(`Product details incomplete or missing for cart item. Product ID: ${item.productId ? item.productId._id : 'N/A'}`);
                return {
                    productId: { _id: item.productId, name: 'Unknown Product', price: 0 },
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
        };

        res.status(200).json(responseCart);

    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart data', error: error.message });
    }
});

/**
 * @route POST /api/cart/checkout
 * @description Saves the current cart (marks it as "checked out" or moves it to an orders collection).
 * For this example, we'll simply update the cart and potentially clear it or mark it as complete.
 * In a real scenario, this would involve creating an 'Order' document and potentially clearing the cart.
 * @body {string} userId - The ID of the patient whose cart is being checked out.
 * @access Public (in a real app, userId would be derived from authentication)
 */
cartRouter.post('/api/cart/checkout', async (req, res) => {
    const { userId: stringUserId } = req.body;

    if (!stringUserId) {
        return res.status(400).json({ message: 'User ID is required for checkout.' });
    }

    try {
        const user = await userDataModel.findOne({ userId: stringUserId });
        if (!user) {
            return res.status(404).json({ message: 'User not found for the provided ID.' });
        }

        const cart = await cartDataModel.findOne({ userId: stringUserId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ message: 'No active cart found for this patient to checkout.' });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty, cannot checkout.' });
        }

        const orderItems = [];
        let calculatedTotalAmount = 0;

        for (const item of cart.items) {
            if (!item.productId || !item.productId.name || item.productId.price === undefined) {
                console.warn(`Missing or invalid product data for cart item. Product ID: ${item.productId ? item.productId._id : 'N/A'}`);
                return res.status(400).json({ message: `Product details missing or incomplete for item with ID: ${item.productId ? item.productId._id : 'N/A'}. Cannot checkout.` });
            }

            const quantity = Number(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                console.warn(`Invalid quantity for cart item: ${item.productId.name || 'N/A'}. Quantity: ${item.quantity}`);
                return res.status(400).json({ message: `Invalid quantity for item '${item.productId.name || 'N/A'}'.` });
            }

            const price = Number(item.productId.price);
            if (isNaN(price) || price < 0) {
                console.warn(`Invalid price for populated product: ${item.productId.name || 'N/A'}. Price: ${item.productId.price}`);
                return res.status(400).json({ message: `Invalid price for item '${item.productId.name || 'N/A'}'.` });
            }

            orderItems.push({
                productId: item.productId._id,
                name: item.productId.name,
                quantity: quantity,
                price: price
            });
            calculatedTotalAmount += (quantity * price);
        }

        if (isNaN(calculatedTotalAmount)) {
            console.error('Final calculated totalAmount is NaN. This indicates an issue with previous data validation or product data.');
            return res.status(500).json({ message: 'Failed to finalize total amount calculation due to unexpected non-numeric values.' });
        }

        const order = new orderDataModel({
            userId: stringUserId,
            items: orderItems,
            totalAmount: calculatedTotalAmount,
            status: 'Pending'
        });

        await order.save();

        cart.items = [];
        await cart.save();

        // --- Dynamic Notification Trigger: Checkout Complete ---
        await notificationService.createNotification(
            stringUserId,
            `Your cart has been successfully checked out! Order ID: ${order._id}. Total: $${order.totalAmount.toFixed(2)}.`,
            'cart_checkout_complete'
        );

        res.status(200).json({
            message: 'Cart successfully checked out and cleared.',
            orderId: order._id,
            totalAmount: order.totalAmount,
            checkedOutItems: order.items
        });

    } catch (error) {
        console.error('Checkout error:', error);
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


cartRouter.post('/api/cart/clear', async (req, res) => {
    const { userId: stringUserId } = req.body;

    if (!stringUserId) {
        return res.status(400).json({ message: 'User ID is required to clear the cart.' });
    }

    try {
        const cart = await cartDataModel.findOne({ userId: stringUserId });

        if (!cart) {
            return res.status(200).json({ message: 'No active cart found for this patient, or cart is already empty.' });
        }

        cart.items = [];
        await cart.save();

        // // --- Dynamic Notification Trigger: Cart Cleared ---
        // await notificationService.createNotification(
        //     stringUserId,
        //     `Your cart has been cleared.`,
        //     'cart_cleared'
        // );

        res.status(200).json({
            message: 'Cart successfully cleared.'
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
});

/**
 * @route DELETE /api/cart/:userId/items/:productId
 * @description Remove a specific item from the patient's cart.
 * @param {string} userId - The ID of the patient whose cart to modify.
 * @param {string} productId - The ID of the product to remove from the cart.
 * @access Public (in a real app, userId would be derived from authentication)
 */
cartRouter.delete('/api/cart/:userId/items/:productId', async (req, res) => {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
        return res.status(400).json({ message: 'User ID and Product ID are required.' });
    }

    try {
        let cart = await cartDataModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for this patient.' });
        }

        const initialItemCount = cart.items.length;
        // Filter out the item to be removed
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        if (cart.items.length === initialItemCount) {
            // If the length hasn't changed, the item was not found in the cart
            return res.status(404).json({ message: 'Product not found in the cart.' });
        }

        const updatedCart = await cart.save();
        const populatedCart = await cartDataModel.findOne({ userId }).populate('items.productId');

        // --- Dynamic Notification Trigger: Item Removed from Cart ---
        // You might want to fetch product name here if available
        await notificationService.createNotification(
            userId,
            `An item was removed from your cart. You now have ${populatedCart ? populatedCart.items.length : 0} items.`,
            'cart_item_removed'
        );

        res.status(200).json({
            message: 'Item removed from cart successfully.',
            cart: populatedCart
        });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});

module.exports = cartRouter;