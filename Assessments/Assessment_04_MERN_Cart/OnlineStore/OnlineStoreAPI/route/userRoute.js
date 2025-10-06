const express = require('express');
const userRouter = express.Router({ strict: true, caseSensitive: true });
const UserModel = require('../DataModel/userDataModel'); // Import the corrected User models
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
// bcrypt is used via the UserModel, so no direct import here is strictly needed for these routes

// --- IMPORTANT: JWT Secret Key ---
// In a real application, this secret should be stored securely
// as an environment variable (e.g., process.env.JWT_SECRET)
// DO NOT hardcode it in production!
const JWT_SECRET = 'your_super_secret_jwt_key_please_change_this_in_production';
const JWT_EXPIRES_IN = '1h'; // Token expiration time

// --- Middleware for JWT Authentication ---
// This middleware will be used to protect routes that require a logged-in user.
function authenticateToken(req, res, next) {
    // Get the token from the Authorization header (Bearer TOKEN)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" -> ["Bearer", "TOKEN"]

    if (token == null) {
        // No token provided, user is not authenticated
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token is invalid or expired
            console.error('JWT verification failed:', err.message);
            // 403 Forbidden means client authenticated but not authorized to access *this* resource
            // For invalid token, 403 is often used, or 401 if you want to explicitly signal re-authentication
            return res.status(403).json({ message: 'Invalid or expired authentication token.' });
        }
        // If token is valid, attach the decoded user payload to the request object
        req.user = user; // user object contains payload { userId: ..., username: ... }
        next(); // Proceed to the next middleware or route handler
    });
}

// --- User Registration Endpoint ---
/**
 * @route POST /api/auth/register
 * @description Register a new user with hashed password
 * @body {string} userId, {string} username, {string} email, {string} password, {object} address
 * @access Public
 */
userRouter.post('/api/auth/register', async (req, res) => {
    try {
        const { userId, username, email, password, address } = req.body;

        // Basic validation
        if (!userId || !username || !email || !password || !address) {
            return res.status(400).json({ message: 'All registration fields (userId, username, email, password, address) are required.' });
        }

        // Check if user already exists by username, userId or email
        const existingUser = await UserModel.findOne({ $or: [{ userId }, { username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that userId, username, or email already exists.' });
        }

        // Create new user. The pre-save hook in the models will hash the password.
        const newUser = new UserModel({ userId, username, email, password, address });
        const savedUser = await newUser.save();

        // Respond with success (do NOT send back the password, even hashed)
        res.status(201).json({ message: 'User registered successfully!', user: { userId: savedUser.userId, username: savedUser.username, email: savedUser.email } });

    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
    }
});

// --- User Login Endpoint ---
/**
 * @route POST /api/auth/login
 * @description Authenticate user and return a JWT
 * @body {string} usernameOrEmail, {string} password
 * @access Public
 */
userRouter.post('/api/auth/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required.' });
        }

        // Find user by username or email
        const user = await UserModel.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Compare provided password with hashed password in the database
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // User authenticated successfully, create JWT
        const payload = {
            userId: user.userId, // Custom userId from your schema
            username: user.username,
            // You can add more user-specific data to the payload if needed
            // e.g., roles: user.roles, department: user.department
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Send token back to the client
        res.status(200).json({ message: 'Login successful!', token });

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error during login.', error: error.message });
    }
});

// --- Original User Routes (Adjusted) ---

/**
 * @route POST /api/users
 * @description Create a new user. This route is now primarily for registration.
 * If you still need a simple 'create user' without full registration,
 * ensure password handling (hashing) is robust.
 * @body {string} userId, {string} username, {string} email, {string} password, {object} address
 * @access Public (Consider making this admin-only and requiring JWT in production)
 */
userRouter.post('/api/users', async (req, res) => {
    try {
        // If password is not provided, this will still trigger the Mongoose schema's 'required' validation.
        // If you intend for this route to *not* handle passwords directly, you need a different user models or logic.
        const newUser = new UserModel(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        // Mongoose validation errors will be caught here
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
});

/**
 * @route GET /api/users/:userId
 * @description Get a single user by their custom userId
 * @access Protected (requires JWT)
 * Note: You might want to add logic to ensure req.user.userId matches req.params.userId
 * if only a user can view their own profile.
 */
userRouter.get('/api/users/:userId', authenticateToken, async (req, res) => { // <-- Now a Protected route
    try {
        const user = await UserModel.findOne({ userId: req.params.userId }).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Export both the router and the middleware for use in your main application file
module.exports = { userRouter, authenticateToken };