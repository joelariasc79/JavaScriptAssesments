const express = require('express');
const userRouter = express.Router({ strict: true, caseSensitive: true });
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing and comparison
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const UserModel = require('../dataModel/userDataModel'); // Import the Mongoose User model
const mongoose = require('mongoose'); // Import mongoose to use its Types.ObjectId.isValid and other utilities

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

// --- Patient Registration Endpoint ---
userRouter.post('/api/auth/register', async (req, res) => {
    try {
        // This route is for general user registration (defaulting to 'patient' role)
        const {
            username,
            email,
            password,
            address, // This will be an object
            name,
            age,
            profession,
            contact_number,
            gender,
            pre_existing_disease, // This will now be an array
            medical_certificate_url,
            medical_practitioner
        } = req.body;

        // Basic validation for patient registration
        // Ensure all top-level required fields for a patient are present.
        // As per the client-side form and common sense for a patient record,
        // we'll treat address object itself as required, and then its key sub-fields.
        if (!username || !email || !password || !name || !contact_number || !medical_practitioner) {
            return res.status(400).json({ message: 'Missing required registration fields (username, email, password, name, contact number, medical practitioner).' });
        }

        // Validate address sub-fields specifically for patient registration
        // Assuming address is always expected for patient registration via this route
        if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
            return res.status(400).json({ message: 'Address fields (street, city, state, zipCode) are required for patient registration.' });
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
            address, // Mongoose will handle this as an embedded document
            name,
            age,
            profession,
            contact_number,
            gender,
            pre_existing_disease, // Mongoose will handle this as an array
            medical_certificate_url,
            role: 'patient', // Default role for this specific registration endpoint
            medical_practitioner
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
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
    }
});


// --- NEW: Hospital Staff Registration Endpoint (Admin-only) ---
/**
 * @route POST /api/auth/register-hospital-staff
 * @description Admin-only route to register a new hospital staff user.
 * Requires JWT authentication and admin role.
 * @body {string} username, {string} email, {string} password, {string} name, {string} contact_number, {object} [address], {string} hospital (ObjectId)
 * @access Protected (Admin-only)
 */
userRouter.post('/api/auth/register-hospital-staff', authenticateToken, async (req, res) => {
    try {
        // Authorization Check: Only administrators can use this route
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can register hospital staff.' });
        }

        const { username, email, password, name, contact_number, address, hospital } = req.body;

        // Basic Validation: 'address' is no longer mandatory here
        if (!username || !email || !password || !name || !contact_number || !hospital) {
            return res.status(400).json({ message: 'Missing required fields: username, email, password, name, contact_number, and hospital ID are all mandatory.' });
        }

        // Validate Hospital ID format
        if (!mongoose.Types.ObjectId.isValid(hospital)) {
            return res.status(400).json({ message: 'Invalid hospital ID format provided.' });
        }

        // Check if user already exists by username or email
        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Create new hospital staff user
        const newUser = new UserModel({
            username,
            email,
            password, // Password will be hashed by pre-save hook
            name,
            contact_number,
            address: address || undefined, // Address is now optional, set to undefined if not provided to omit from document
            role: 'hospital_staff', // Set role explicitly
            hospital: hospital // Link to the specific hospital
        });

        const savedUser = await newUser.save();

        // Populate hospital details before sending response
        const populatedUser = await UserModel.findById(savedUser._id).select('-password').populate('hospital');

        res.status(201).json({ message: 'Hospital staff user registered successfully!', user: populatedUser });

    } catch (error) {
        console.error('Error during hospital staff registration:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error during hospital staff registration.', error: error.message });
    }
});


/**
 * @route POST /api/auth/register-admin
 * @description Admin-only route to register a new administrator user.
 * Requires JWT authentication and admin role.
 * @body {string} username, {string} email, {string} password, {string} name, {string} contact_number, {object} [address], {number} [age], {string} [profession], {string} [gender]
 * @access Protected (Admin-only)
 */
userRouter.post('/api/auth/register-admin', authenticateToken, async (req, res) => {
    try {
        // Authorization Check: Only administrators can use this route
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can register new admin users.' });
        }

        const { username, email, password, name, contact_number, address, age, profession, gender } = req.body;

        // Basic Validation: Required fields for an admin user
        if (!username || !email || !password || !name || !contact_number) {
            return res.status(400).json({ message: 'Missing required fields: username, email, password, name, contact_number.' });
        }

        if (address && (!address.street || !address.city || !address.state || !address.zipCode)) {
            return res.status(400).json({ message: 'Address fields (street, city, state, zipCode) are required for hospital staff registration if address is provided.' });
        }

        // Check if user already exists by username or email
        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Create new admin user
        const newUser = new UserModel({
            username,
            email,
            password, // Password will be hashed by pre-save hook
            name,
            contact_number,
            address: address || undefined, // Address is optional
            age, // Optional
            profession, // Optional
            gender, // Optional
            role: 'admin', // Set role explicitly to 'admin'
            hospital: null, // Admins are not typically linked to a specific hospital in this schema
            pre_existing_disease: null, // Not expected for admin
            medical_certificate_url: null // Not expected for admin
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            message: 'Admin user registered successfully!',
            user: {
                _id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                name: savedUser.name,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('Error during admin registration:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error during admin registration.', error: error.message });
    }
});


// --- User Login Endpoint ---

userRouter.post('/api/auth/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required.' });
        }

        // Find the user. If you have a specific user model field for `hospital`
        // that's a direct reference, you might want to `populate` it if you need
        // more hospital details in the future, but for just the ID, `findOne` is fine.
        const user = await UserModel.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Construct the payload for the JWT
        const payload = {
            userId: user._id,
            username: user.username,
            role: user.role,
            // --- ADD THIS LINE ---
            // Include hospital ID in the payload ONLY if the user has one
            // This is crucial for the `authenticateToken` middleware
            ...(user.hospital && { hospitalId: user.hospital.toString() }) // Convert ObjectId to string for JWT
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Include the 'name' and 'hospital' fields in the user object sent to the frontend
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                userId: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                // --- ADD THIS LINE ---
                // Include hospital ID in the user response object
                hospitalId: user.hospital ? user.hospital.toString() : null // Ensure it's string or null
            }
        });

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
 * @body {string} username, {string} email, {string} password, {object} address, {string} name, {string} contact_number, {string} role (and other user fields), {string} [hospital] (ObjectId)
 * @access Protected (Admin-only)
 */
userRouter.post('/api/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can create users via this route.' });
        }

        // Destructure hospital from body as well
        const { username, email, password, name, age, profession, contact_number, address, gender, pre_existing_disease, medical_certificate_url, role, hospital } = req.body;

        if (!username || !email || !password || !name || !contact_number || !address) {
            return res.status(400).json({ message: 'Required fields are missing.' });
        }

        // Basic validation for address fields as they are nested and required in schema
        if (!address.street || !address.city || !address.state || !address.zipCode) {
            return res.status(400).json({ message: 'Address fields (street, city, state, zipCode) are required.' });
        }


        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Validate hospital ID if provided
        if (hospital && !mongoose.Types.ObjectId.isValid(hospital)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        const newUser = new UserModel({
            username, email, password, name, age, profession, contact_number, address, gender, pre_existing_disease, medical_certificate_url,
            role: role || 'patient', // Allow admin to set role
            hospital: hospital || null // Set hospital if provided, otherwise null
        });
        const savedUser = await newUser.save();

        // Optionally, populate hospital field before sending response if needed by frontend
        const populatedUser = await UserModel.findById(savedUser._id).select('-password').populate('hospital');

        res.status(201).json({ message: 'User created successfully!', user: populatedUser });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
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

        // Select all fields except password for security AND populate hospital field
        const user = await UserModel.findById(userIdToFetch).select('-password').populate('hospital');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// userRouter.get('/api/users/:id', authenticateToken, async (req, res) => {
//     try {
//         const userId = req.params.id;
//
//         // Ensure user is authorized to view this profile
//         if (req.user.role === 'patient' && req.user.userId !== userId) {
//             return res.status(403).json({ message: 'Access denied. Patients can only view their own profile.' });
//         }
//         // Hospital staff can view any user's profile within their hospital (optional, depending on granular access)
//         // Admin can view any profile.
//
//         const user = await UserModel.findById(userId)
//             .select('-password') // Exclude password
//             .populate('hospital', 'name location'); // Populate hospital details
//
//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }
//
//         res.status(200).json(user);
//     } catch (error) {
//         console.error('Error fetching user profile:', error);
//         res.status(500).json({ message: 'Internal server error fetching user profile.', error: error.message });
//     }
// });

// New: Get All Users (Admin only)
// userRouter.get('/api/admin/users', authenticateToken, async (req, res) => {
//     try {
//         // Ensure only admins can access this route
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Access denied. Only administrators can view all users.' });
//         }
//
//         // Select all fields except password for security AND populate hospital field
//         const users = await UserModel.find({}).select('-password').populate('hospital');
//         res.status(200).json(users);
//     } catch (error) {
//         console.error('Error fetching all users:', error);
//         res.status(500).json({ message: 'Error fetching all users', error: error.message });
//     }
// });

// <-- NEW: Get all users (for hospital staff to select patients)
userRouter.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Only admin and hospital staff can view all users
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view all users.' });
        }

        const users = await UserModel.find({})
            .select('-password') // Exclude passwords
            .populate('hospital', 'name'); // Populate hospital name for staff users

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Internal server error fetching users.', error: error.message });
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
            // Prevent non-admins from changing hospital association
            delete updates.hospital;
        } else {
            // If admin is updating, validate hospital ID if present in updates
            if (updates.hospital !== undefined && updates.hospital !== null && !mongoose.Types.ObjectId.isValid(updates.hospital)) {
                return res.status(400).json({ message: 'Invalid hospital ID format for update.' });
            }
        }


        const updatedUser = await UserModel.findByIdAndUpdate(
            userIdToUpdate,
            { $set: updates },
            { new: true, runValidators: true, select: '-password' } // Return updated doc, run validators, exclude password
        ).populate('hospital'); // Populate hospital field on update response

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User updated successfully!', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'Update failed: A user with the provided username or email already exists.' });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
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