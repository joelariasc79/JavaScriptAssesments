const express = require('express');
const userRouter = express.Router({strict:true, caseSensitive: true});
const userDataModel = require('../DataModel/userDataModel'); // Import the new User models

/**
 * @route POST /api/users
 * @description Create a new patient (for testing/setup purposes)
 * @body {string} userId, {string} username, {string} email, {object} address
 * @access Public
 */
userRouter.post('/api/users', async (req, res) => {
    try {
        const newUser = new userDataModel(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error creating patient', error: error.message });
    }
});

/**
 * @route GET /api/users/:userId
 * @description Get a single patient by their custom userId
 * @access Public (in a real app, this would be authenticated)
 */
userRouter.get('/api/users/:userId', async (req, res) => {
    try {
        const user = await userDataModel.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient', error: error.message });
    }
});

module.exports = userRouter;