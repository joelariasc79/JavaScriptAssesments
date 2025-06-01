const mongoose = require('mongoose');

schemaObj = mongoose.Schema; //using the schema class from mongoose

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel; //with capability to retrieve save udpate queries with mongo db