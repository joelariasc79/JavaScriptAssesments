const mongoose = require('mongoose');

schemaObj = mongoose.Schema; //using the schema class from mongoose

// cart Item Schema (sub-document for cart)
const CartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
});

// cart Schema
const CartSchema = new mongoose.Schema({
    // In a real application, userId would come from an authenticated patient session.
    // For simplicity, we'll assume a userId is passed or generated for demonstration.
    userId: { type: String, required: true, unique: true }, // Each patient has one active cart
    items: [CartItemSchema], // Array of cart items
}, { timestamps: true });

const CartModel = mongoose.model('cart', CartSchema);
module.exports = CartModel; //with capability to retrieve save udpate queries with mongo db