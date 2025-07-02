// route/userRoute.js
const express = require('express');
const userRouter = express.Router({ strict: true, caseSensitive: true });
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing and comparison
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const UserModel = require('../DataModel/userDataModel'); // Import the Mongoose User model

// --- IMPORTANT: JWT Secret Key ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Token expiration time

// --- Middleware for JWT Authentication ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid or expired authentication token.' });
        }
        req.user = user;
        next();
    });
}

// --- User Registration Endpoint ---
userRouter.post('/api/auth/register', async (req, res) => {
    try {
        // userId from body is removed as MongoDB uses _id. If you need a custom userId string, add it to schema.
        const { username, email, password, address, name, age, profession, contact_number, gender, pre_existing_disease, medical_certificate_url } = req.body;

        // Basic validation
        if (!username || !email || !password || !address || !name || !contact_number) {
            return res.status(400).json({ message: 'Missing required registration fields.' });
        }

        // Check if user already exists by username or email
        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });

        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Create new user. The pre-save hook in the model will hash the password.
        const newUser = new UserModel({
            username,
            email,
            password,
            address,
            name,
            age,
            profession,
            contact_number,
            gender,
            pre_existing_disease,
            medical_certificate_url,
            role: 'patient' // Default role
        });
        const savedUser = await newUser.save();

        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                _id: savedUser._id, // MongoDB's default ID
                username: savedUser.username,
                email: savedUser.email
            }
        });

    } catch (error) {
        console.error('Error during user registration:', error);
        // Mongoose validation errors or duplicate key errors (code 11000)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
    }
});

// --- User Login Endpoint ---
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

        // Compare provided password with hashed password from the database
        const isMatch = await user.comparePassword(password); // Uses the method defined in the Mongoose model

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // User authenticated successfully, create JWT
        const payload = {
            userId: user._id, // MongoDB's default ID
            username: user.username,
            role: user.role // Include role in JWT payload
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Send token back to the client
        res.status(200).json({ message: 'Login successful!', token, user: { userId: user._id, username: user.username, role: user.role } });

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error during login.', error: error.message });
    }
});

// --- User Management Routes ---

/**
 * @route POST /api/users
 * @description Admin route to create a new user (e.g., hospital staff, another admin).
 * Requires JWT authentication and admin role.
 * @body {string} username, {string} email, {string} password, {object} address (and other user fields)
 * @access Protected (Admin-only)
 */
userRouter.post('/api/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can create users via this route.' });
        }

        const { username, email, password, name, age, profession, contact_number, address, gender, pre_existing_disease, medical_certificate_url, role } = req.body;

        if (!username || !email || !password || !name || !contact_number || !address) {
            return res.status(400).json({ message: 'Required fields are missing.' });
        }

        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Admin can specify role
        const newUser = new UserModel({
            username, email, password, name, age, profession, contact_number, address, gender, pre_existing_disease, medical_certificate_url,
            role: role || 'patient' // Allow admin to set role
        });
        const savedUser = await newUser.save();

        res.status(201).json({ message: 'User created successfully!', user: savedUser });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});


/**
 * @route GET /api/users/:id
 * @description Get a single user by their MongoDB _id
 * @access Protected (requires JWT)
 * Note: Add logic to ensure req.user.userId matches req.params.id if only a user can view their own profile.
 * Or if admin, they can view any profile.
 */
userRouter.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToFetch = req.params.id; // This is the MongoDB _id

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userIdToFetch)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        // Security check: A user can only view their own profile, unless they are an admin
        if (req.user.role !== 'admin' && req.user.userId.toString() !== userIdToFetch) { // Convert to string for comparison
            return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
        }

        // Select all fields except password for security
        const user = await UserModel.findById(userIdToFetch).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// New: Get All Users (Admin only)
userRouter.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Ensure only admins can access this route
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can view all users.' });
        }

        // Select all fields except password for security
        const users = await UserModel.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Error fetching all users', error: error.message });
    }
});

// New: Update User (Admin or Self)
userRouter.put('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        // Allow user to update their own profile, or admin to update any profile
        if (req.user.role !== 'admin' && req.user.userId.toString() !== userIdToUpdate) {
            return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
        }

        const updates = req.body;
        // Prevent direct update of password via this route unless handled specifically (e.g., separate change password route)
        delete updates.password;
        // Prevent non-admins from changing role
        if (req.user.role !== 'admin') {
            delete updates.role;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userIdToUpdate,
            { $set: updates },
            { new: true, runValidators: true, select: '-password' } // Return updated doc, run validators, exclude password
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User updated successfully!', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'Update failed: A user with the provided username or email already exists.' });
        }
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});


// New: Delete User (Admin only)
userRouter.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete users.' });
        }

        const userIdToDelete = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userIdToDelete)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        const deletedUser = await UserModel.findByIdAndDelete(userIdToDelete);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User deleted successfully!', user: { _id: deletedUser._id, username: deletedUser.username } });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});


// Export both the router and the middleware for use in your main application file
module.exports = { userRouter, authenticateToken };
