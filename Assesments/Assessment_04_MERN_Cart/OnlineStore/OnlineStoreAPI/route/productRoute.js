const express = require('express') //import package
const productRouter = express.Router({strict:true, caseSensitive: true}) // a separate route table to create and handle our api's
const productDataModel = require('../DataModel/productDataModel');


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

module.exports = productRouter;