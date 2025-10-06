const express = require('express');
const userRouter = express.Router({ strict: true, caseSensitive: true });

const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const UserModel = require('../dataModel/userDataModel'); // Import the Mongoose User models
const mongoose = require('mongoose'); // Import mongoose to use its Types.ObjectId.isValid and other utilities
const { authenticateToken } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Token expiration time

// Check if the JWT_SECRET is set
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.");
    process.exit(1); // Exit the process with a failure code
}

// BEGIN: Auxiliary Functions

/**
 * Generates a new JWT with the updated hospital context.
 * @param {object} payload - The JWT payload, including userId, role, and selectedHospitalId.
 * @returns {string} The signed JWT.
 */
const generateTokenWithHospital = (payload) => {
    // VERIFIED FIX: Uses real jwt.sign to generate a context-aware token.
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};



const fetchUserById = async (userId) => {
    // ⚠️ LÓGICA REAL: Busca al usuario por ID, excluye la contraseña y ejecuta la consulta.
    const user = await UserModel.findById(userId)
        .select('-password') // Excluir la contraseña
        // Si tienes populado el campo 'hospital', hazlo aquí: .populate('hospital')
        .exec();

    if (!user) {
        return null; // Usuario no encontrado
    }

    // Devolver el objeto de usuario limpio y con IDs de hospital como strings
    return {
        userId: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
        hospitalIds: user.hospital ? user.hospital.map(h => h.toString()) : []
    };
};


// END : Auxiliary Functions

// --- User Login Endpoint ---

userRouter.post('/api/auth/login', async (req, res) => {
    try {

        const { usernameOrEmail, password, hospital } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required.' });
        }

        const user = await UserModel.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        }).populate('hospital');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        let finalHospitalId;

        // Construct the payload for the JWT
        const payload = {
            userId: user._id,
            username: user.username,
            role: user.role,
            // Include all associated hospital IDs in the token.
            hospitalIds: user.hospital ? user.hospital.map(h => h._id.toString()) : []
        };

        // const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const token = generateTokenWithHospital(payload);


        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                userId: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                // Include all hospital IDs in the user response object.
                hospitalIds: user.hospital ? user.hospital.map(h => h._id.toString()) : [],
                // This is an optional field to tell the client which hospital was used for login.
                hospital: finalHospitalId || null
            }
        });

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error during login.', error: error.message });
    }
});

// --- Endpoint to verify if the authenticated user is an admin ---
/**
 * @route GET /api/auth/verify-admin
 * @description Verifies if the authenticated user has the 'admin' role.
 * Requires JWT authentication.
 * @access Protected (Any authenticated user can call this to check their role)
 */

userRouter.get('/api/auth/verify-admin', authenticateToken, (req, res) => {
    try {
        if (req.user.role === 'admin') {
            res.status(200).json({ isAdmin: true, message: 'User is an administrator.' });
        } else {
            res.status(403).json({ isAdmin: false, message: 'Access denied. User is not an administrator.' });
        }
    } catch (error) {
        console.error('Error verifying admin role:', error);
        res.status(500).json({ message: 'Error verifying role.', error: error.message });
    }
});

// --- Endpoint to select a hospital after initial login ---
/**
 * @route POST /api/auth/select-hospital
 * @description Allows a logged-in hospital staff member to select their active hospital.
 * @body {string} hospitalId
 * @access Protected (Authenticated hospital staff)
 */
userRouter.post('/api/auth/select-hospital', authenticateToken, async (req, res) => {
    try {
        const { hospitalId } = req.body;
        // req.user proviene del middleware authenticateToken (contiene datos del JWT)
        const { userId, role, hospitalIds } = req.user;

        // 1. Verificar si el usuario está autorizado para hacer la selección
        if (role !== 'hospital_admin' && role !== 'doctor' && role !== 'patient') {
            // Error seguro: Mensaje en el cuerpo.
            return res.status(403).json({ message: 'Access denied. This endpoint is for hospital staff.' });
        }

        // 2. Validar ID y asociación
        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }
        if (!hospitalIds.includes(hospitalId)) {
            return res.status(403).json({ message: 'Access denied. You are not associated with this hospital.' });
        }

        // 3. Generar un NUEVO token con el contexto del hospital
        // Se asume que el payload incluye el hospitalId para los permisos finales
        const newToken = generateTokenWithHospital({
            userId,
            role,
            selectedHospitalId: hospitalId
        });

        // const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // 4. Obtener el objeto de usuario final para la respuesta (simulando una DB fetch)
        const user = await fetchUserById(userId);

        // 5. ÉXITO: Devolver AuthResponse completa (token, user, message)
        res.status(200).json({
            message: 'Hospital selected successfully.',
            token: newToken,
            user: {
                // Aquí usamos los datos completos del usuario
                userId: user.userId,
                username: user.username,
                name: user.name,
                role: user.role,
                hospitalIds: user.hospitalIds
                // NOTA: Si el backend cambia el rol o los permisos basados en el hospital,
                // esos cambios deben reflejarse aquí.
            }
        });

    } catch (error) {
        console.error('Error selecting hospital:', error);
        // Manejo de error 500 para evitar fallos de lectura en el frontend
        res.status(500).json({
            message: 'Internal server error during hospital selection.',
            error: error.message
        });
    }
});


// ----------------------------------
// --- doctors Endpoints ---
// ----------------------------------


userRouter.post('/api/patients', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators or hospital-administrators can create users via this route.' });
        }

        const { username, email, password, name, age, profession, contact_number, address, gender, pre_existing_disease, medical_certificate_url, role, hospital } = req.body;

        if (!username || !email || !password || !name || !contact_number || !address) {
            return res.status(400).json({ message: 'Required fields are missing.' });
        }

        // Corrected the typo in the error message.
        if (role !== 'patient') {
            return res.status(400).json({ message: 'You can only create a patient.' });
        }

        if (!address.street || !address.city || !address.state || !address.zipCode) {
            return res.status(400).json({ message: 'Address fields (street, city, state, zipCode) are required.' });
        }

        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Centralized hospital ID validation and logic
        if (hospital) {
            if (!Array.isArray(hospital)) {
                return res.status(400).json({ message: 'Hospital must be an array of IDs.' });
            }
            if (hospital.some(id => !mongoose.Types.ObjectId.isValid(id))) {
                return res.status(400).json({ message: 'Invalid hospital ID format.' });
            }
        }

        if (req.user.role === 'hospital_admin') {
            if (!hospital || !hospital.some(hId => req.user.hospitalIds.includes(hId))) {
                return res.status(403).json({ message: 'Access denied. You can only create patients associated with your hospitals.' });
            }
        }

        const newUser = new UserModel({
            username, email, password, name, age, profession, contact_number, address, gender, pre_existing_disease, medical_certificate_url,
            role: 'patient',
            hospital: hospital || [] // Use an empty array if no hospital is provided
        });
        const savedUser = await newUser.save();

        const populatedUser = await UserModel.findById(savedUser._id).select('-password').populate('hospital');

        res.status(201).json({ message: 'User created successfully!', user: populatedUser });

    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});


userRouter.put('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;
        const currentUserId = req.user.userId.toString();
        const currentUserRole = req.user.role;
        const updates = req.body;

        // 1. Basic Validation: ID format
        if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        // 2. Prevent unauthorized updates to sensitive fields
        if (currentUserRole !== 'admin') {
            delete updates.role;
        }
        // Only admins can completely change hospital affiliations
        if (currentUserRole !== 'admin' && updates.hospital) {
            delete updates.hospital;
        }

        // 3. Find the user to be updated. This is crucial for all subsequent checks.
        const userToUpdate = await UserModel.findById(userIdToUpdate);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // 4. Role-based Authorization Logic
        const isSelf = userIdToUpdate === currentUserId;

        // Admins can update anyone
        // Patients can only update themselves
        // Hospital Admins & Doctors can update patients within their hospitals
        if (currentUserRole === 'admin') {
            // No additional checks needed, proceed to update.
        } else if (currentUserRole === 'patient') {
            if (!isSelf) {
                return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
            }
        } else if (currentUserRole === 'hospital_admin' || currentUserRole === 'doctor') {
            // Check if the user being updated is associated with any of the current user's hospitals
            const isAssociated = userToUpdate.hospital.some(h => req.user.hospitalIds.includes(h.toString()));
            if (!isAssociated) {
                return res.status(403).json({ message: 'Access denied. You can only update patients within your hospitals.' });
            }
        } else {
            return res.status(403).json({ message: "Access denied." });
        }

        // 5. Apply updates using the 'Find, Modify, Save' pattern.
        // This ensures the Mongoose 'pre('save')' hook runs for password hashing.

        // Iterate through updates and apply them to the Mongoose document
        const fieldsToUpdate = Object.keys(updates);
        for (const key of fieldsToUpdate) {
            // Skip fields that Mongoose shouldn't touch directly (like virtuals or metadata)
            if (userToUpdate[key] !== undefined) {
                userToUpdate[key] = updates[key];
            }
        }

        // Save the updated user, which triggers the pre('save') hook if 'password' was modified
        const savedUser = await userToUpdate.save({ validateBeforeSave: true });

        // Populate the hospital field for the final response
        const updatedUser = await UserModel.findById(savedUser._id)
            .select('-password')
            .populate('hospital');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found after update.' });
        }

        res.status(200).json({ message: 'Patient updated successfully!', user: updatedUser });
    } catch (error) {
        console.error('Error updating patient:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Update failed: A user with the provided username or email already exists.' });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Error updating patient', error: error.message });
    }
});



userRouter.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToFetch = req.params.id;
        const currentUser = req.user;

        // 1. Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userIdToFetch)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        // 2. Find the user to be fetched
        const userToFetch = await UserModel.findById(userIdToFetch).select('-password');
        if (!userToFetch) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 3. Implement granular authorization based on role
        const isAdmin = currentUser.role === 'admin';
        const isSelf = currentUser.userId.toString() === userIdToFetch;
        const isHospitalStaff = currentUser.role === 'hospital_admin' || currentUser.role === 'doctor';

        let canView = isAdmin || isSelf;

        if (isHospitalStaff) {
            const isAssociated = userToFetch.hospital.some(h => currentUser.hospitalIds.includes(h.toString()));
            if (isAssociated) {
                canView = true;
            }
        }

        if (!canView) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to view this user profile.' });
        }

        // 4. If authorized, populate the hospital field and return the user data
        const populatedUser = await userToFetch.populate('hospital');
        res.status(200).json(populatedUser);

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// <-- Get all patients (for hospital staff to select patients)
userRouter.get('/api/patients', authenticateToken, async (req, res) => {
    try {
        const currentUserRole = req.user.role;
        const currentHospitalIds = req.user.hospitalIds;

        // 1. Check if the user has permission to view patient lists
        if (currentUserRole !== 'admin' && currentUserRole !== 'hospital_admin' && currentUserRole !== 'doctor') {
            return res.status(403).json({ message: 'Access denied. You do not have permission to view this resource.' });
        }

        let query = { role: 'patient' };

        // 2. Adjust the query based on the user's role
        if (currentUserRole === 'hospital_admin' || currentUserRole === 'doctor') {
            // VERIFIED FIX: Find patients where their hospital array contains at least one of the user's hospital IDs
            query.hospital = { $in: currentHospitalIds };
        }

        // Admins can see all patients because no hospital query is added

        // 3. Execute the filtered query
        const patients = await UserModel.find(query)
            .select('-password') // Exclude passwords
            .populate('hospital', 'name'); // Populate hospital name for all users

        res.status(200).json(patients);

    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Internal server error fetching patients.', error: error.message });
    }
});


// ----------------------------------
// --- doctors Endpoints ---
// ----------------------------------

userRouter.post('/api/doctors', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators or hospital-administrators can create doctors via this route.' });
        }

        const { username, email, password, name, age, profession, contact_number, specialty, experience, fees, address, gender, role, hospital } = req.body;

        if (!username || !email || !password || !name || !contact_number || !address || !specialty || !experience || !fees) {
            return res.status(400).json({ message: 'Required fields are missing.' });
        }

        // Corrected the typo in the error message.
        if (role !== 'doctor') {
            return res.status(400).json({ message: 'You can only create a doctor.' });
        }

        if (!address.street || !address.city || !address.state || !address.zipCode) {
            return res.status(400).json({ message: 'Address fields (street, city, state, zipCode) are required.' });
        }

        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that username or email already exists.' });
        }

        // Centralized hospital ID validation and logic
        if (hospital) {
            if (!Array.isArray(hospital)) {
                return res.status(400).json({ message: 'Hospital must be an array of IDs.' });
            }
            if (hospital.some(id => !mongoose.Types.ObjectId.isValid(id))) {
                return res.status(400).json({ message: 'Invalid hospital ID format.' });
            }
        }

        if (req.user.role === 'hospital_admin') {
            if (!hospital || !hospital.some(hId => req.user.hospitalIds.includes(hId))) {
                return res.status(403).json({ message: 'Access denied. You can only create doctors associated with your hospitals.' });
            }
        }

        const newDoctor = new UserModel({
            username, email, password, name, age, profession, contact_number, specialty, experience, fees, address, gender, role, hospital,
            role: 'doctor',
            hospital: hospital || [] // Use an empty array if no hospital is provided
        });

        const savedDoctor = await newDoctor.save();

        const populatedDoctor = await UserModel.findById(savedDoctor._id).select('-password').populate('hospital');

        res.status(201).json({ message: 'Doctor created successfully!', user: populatedDoctor });

    } catch (error) {
        console.error('Error creating doctor:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A user with the provided username or email already exists.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Error creating doctor', error: error.message });
    }
});


userRouter.put('/api/doctors/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;
        const currentUserId = req.user.userId.toString();
        const currentUserRole = req.user.role;
        const updates = req.body;

        // 1. Basic Validation: ID format
        if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }

        // 2. Prevent unauthorized updates to sensitive fields
        if (currentUserRole !== 'admin') {
            delete updates.role;
        }
        // Only admins can completely change hospital affiliations
        if (currentUserRole !== 'admin' && updates.hospital) {
            delete updates.hospital;
        }

        // 3. Find the user to be updated. This is crucial for all subsequent checks.
        const userToUpdate = await UserModel.findById(userIdToUpdate);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // 4. Role-based Authorization Logic
        const isSelf = userIdToUpdate === currentUserId;

        // Admins can update anyone
        // Patients can only update themselves
        // Hospital Admins & Doctors can update patients within their hospitals
        if (currentUserRole === 'admin') {
            // No additional checks needed, proceed to update.
        } else if (currentUserRole === 'doctor') {
            if (!isSelf) {
                return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
            }
        } else if (currentUserRole === 'hospital_admin') {
            // Check if the user being updated is associated with any of the current doctor's hospitals
            const isAssociated = userToUpdate.hospital.some(h => req.user.hospitalIds.includes(h.toString()));
            if (!isAssociated) {
                return res.status(403).json({ message: 'Access denied. You can only update doctors within your hospitals.' });
            }
        } else {
            return res.status(403).json({ message: "Access denied." });
        }

        // 5. Apply updates using the 'Find, Modify, Save' pattern.
        // This ensures the Mongoose 'pre('save')' hook runs for password hashing.

        // Iterate through updates and apply them to the Mongoose document
        const fieldsToUpdate = Object.keys(updates);
        for (const key of fieldsToUpdate) {
            // Skip fields that Mongoose shouldn't touch directly (like virtuals or metadata)
            if (userToUpdate[key] !== undefined) {
                userToUpdate[key] = updates[key];
            }
        }

        // Save the updated user, which triggers the pre('save') hook if 'password' was modified
        const savedUser = await userToUpdate.save({ validateBeforeSave: true });

        // Populate the hospital field for the final response
        const updatedUser = await UserModel.findById(savedUser._id)
            .select('-password')
            .populate('hospital');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Doctor not found after update.' });
        }

        res.status(200).json({ message: 'Doctor updated successfully!', user: updatedUser });
    } catch (error) {
        console.error('Error updating doctor:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Update failed: A user with the provided username or email already exists.' });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Error updating patient', error: error.message });
    }
});


userRouter.get('/api/doctors/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToFetch = req.params.id;
        const currentUser = req.user;

        // 1. Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userIdToFetch)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }

        // 2. Find the user to be fetched
        const userToFetch = await UserModel.findById(userIdToFetch).select('-password');
        if (!userToFetch) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // 3. Implement granular authorization based on role
        const isAdmin = currentUser.role === 'admin';
        const isSelf = currentUser.userId.toString() === userIdToFetch;
        const isHospitalStaff = currentUser.role === 'hospital_admin' || currentUser.role === 'doctor';

        let canView = isAdmin || isSelf;

        if (isHospitalStaff) {
            // Check if the user to fetch is associated with any of the current user's hospitals
            const isAssociated = userToFetch.hospital.some(h => currentUser.hospitalIds.includes(h.toString()));
            if (isAssociated) {
                canView = true;
            }
        }

        if (!canView) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to view this doctor profile.' });
        }

        // 4. If authorized, populate the hospital field and return the user data
        const populatedUser = await userToFetch.populate('hospital');
        res.status(200).json(populatedUser);

    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ message: 'Error fetching doctor', error: error.message });
    }
});

// <-- Get all patients (for hospital staff to select patients)
userRouter.get('/api/doctors', authenticateToken, async (req, res) => {
    try {
        const currentUserRole = req.user.role;
        const currentHospitalIds = req.user.hospitalIds;

        // 1. Check if the user has permission to view patient lists, this because should be able to find another doctors
        // for referral for treatments that needs a different specialities
        if (currentUserRole !== 'admin' && currentUserRole !== 'hospital_admin' && currentUserRole !== 'doctor') {
            return res.status(403).json({ message: 'Access denied. You do not have permission to view this resource.' });
        }

        let query = { role: 'doctor' };

        // 2. Adjust the query based on the user's role
        if (currentUserRole === 'hospital_admin' || currentUserRole === 'doctor') {
            // Find patients where their hospital array contains at least one of the user's hospital IDs
            query.hospital = { $in: currentHospitalIds };
        }

        // Admins can see all doctors because no hospital query is added

        // 3. Execute the filtered query
        const doctors = await UserModel.find(query)
            .select('-password') // Exclude passwords
            .populate('hospital', 'name'); // Populate hospital name for all users

        res.status(200).json(doctors);

    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Internal server error fetching doctors.', error: error.message });
    }
});

// ----------------------------------------------------------
// --- Hospital Staff Registration Endpoints (Admin-only) ---
// ----------------------------------------------------------

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

        const { username, email, password, name, contact_number, address, hospital, role } = req.body;

        // Basic Validation
        if (!username || !email || !password || !name || !contact_number) {
            return res.status(400).json({ message: 'Missing required fields: username, email, password, name, contact_number.' });
        }

        // VERIFIED FIX: Validate the role
        if (!['hospital_admin', 'doctor'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be hospital_admin or doctor.' });
        }

        // VERIFIED FIX: Handle hospital as an array
        if (hospital) {
            if (!Array.isArray(hospital) || hospital.some(h => !mongoose.Types.ObjectId.isValid(h))) {
                return res.status(400).json({ message: 'Hospital must be a valid array of hospital IDs.' });
            }
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
            address: address || undefined, // Address is now optional
            role: role, // Set role from the request body
            hospital: hospital || [] // Link to the specific hospital
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


// /**
//  * @route POST /api/auth/register-admin
//  * @description Admin-only route to register a new administrator user.
//  * Requires JWT authentication and admin role.
//  * @body {string} username, {string} email, {string} password, {string} name, {string} contact_number, {object} [address], {number} [age], {string} [profession], {string} [gender]
//  * @access Protected (Admin-only)
//  */
// userRouter.post('/api/auth/select-hospital', authenticateToken, async (req, res) => {
//     try {
//         const { hospitalId } = req.body;
//         // req.user proviene del middleware authenticateToken (contiene datos del JWT)
//         const { userId, role, hospitalIds } = req.user;
//
//         // 1. Verificar si el usuario está autorizado para hacer la selección
//         if (role !== 'hospital_admin' && role !== 'doctor' && role !== 'patient') {
//             // Error seguro: Mensaje en el cuerpo.
//             return res.status(403).json({ message: 'Access denied. This endpoint is for hospital staff.' });
//         }
//
//         // 2. Validar ID y asociación
//         if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
//             return res.status(400).json({ message: 'Invalid hospital ID format.' });
//         }
//         if (!hospitalIds.includes(hospitalId)) {
//             return res.status(403).json({ message: 'Access denied. You are not associated with this hospital.' });
//         }
//
//         // 3. Generar un NUEVO token con el contexto del hospital
//         // Se asume que el payload incluye el hospitalId para los permisos finales
//         const newToken = generateToken({
//             userId,
//             role,
//             selectedHospitalId: hospitalId
//         });
//
//         // 4. Obtener el objeto de usuario final para la respuesta (simulando una DB fetch)
//         const user = await fetchUserById(userId);
//
//         // 5. ÉXITO: Devolver AuthResponse completa (token, user, message)
//         res.status(200).json({
//             message: 'Hospital selected successfully.',
//             token: newToken,
//             user: {
//                 // Aquí usamos los datos completos del usuario
//                 userId: user.userId,
//                 username: user.username,
//                 name: user.name,
//                 role: user.role,
//                 hospitalIds: user.hospitalIds
//                 // NOTA: Si el backend cambia el rol o los permisos basados en el hospital,
//                 // esos cambios deben reflejarse aquí.
//             }
//         });
//
//     } catch (error) {
//         console.error('Error selecting hospital:', error);
//         // Manejo de error 500 para evitar fallos de lectura en el frontend
//         res.status(500).json({
//             message: 'Internal server error during hospital selection.',
//             error: error.message
//         });
//     }
// });

// Delete User (Admin only)
userRouter.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const userRole = req.user.role;
        const currentUserId = req.user.userId.toString();

        // Check if the user has the required roles
        if (userRole !== 'admin' && userRole !== 'hospital_admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete users.' });
        }

        // Check if the user is trying to delete their own profile
        if (userIdToDelete === currentUserId) {
            return res.status(403).json({ message: 'Access denied. You cannot delete your own profile.' });
        }

        if (!mongoose.Types.ObjectId.isValid(userIdToDelete)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        // Find the user to be deleted before deleting
        const userToDelete = await UserModel.findById(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // VERIFIED FIX: Enforce hospital-level scope for hospital_admin role
        if (userRole === 'hospital_admin') {
            // Check if the user being deleted is associated with one of the admin's hospitals
            const isAssociated = userToDelete.hospital.some(h => req.user.hospitalIds.includes(h.toString()));
            if (!isAssociated) {
                return res.status(403).json({ message: 'Access denied. You can only delete users within your hospitals.' });
            }
        }

        // Now, perform the deletion
        const deletedUser = await UserModel.findByIdAndDelete(userIdToDelete);

        res.status(200).json({ message: 'User deleted successfully!', user: { _id: deletedUser._id, username: deletedUser.username } });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// Export both the router and the middleware for use in your main application file
module.exports = { userRouter, authenticateToken };
