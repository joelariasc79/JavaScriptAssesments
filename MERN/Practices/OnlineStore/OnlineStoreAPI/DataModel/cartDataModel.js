const mongoose = require('mongoose');

schemaObj = mongoose.Schema; //using the schema class from mongoose

// Cart Item Schema (sub-document for Cart)
const CartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
});

// Cart Schema
const CartSchema = new mongoose.Schema({
    // In a real application, userId would come from an authenticated user session.
    // For simplicity, we'll assume a userId is passed or generated for demonstration.
    userId: { type: String, required: true, unique: true }, // Each user has one active cart
    items: [CartItemSchema], // Array of cart items
}, { timestamps: true });

const CartModel = mongoose.model('Cart', CartSchema);
module.exports = CartModel; //with capability to retrieve save udpate queries with mongo db