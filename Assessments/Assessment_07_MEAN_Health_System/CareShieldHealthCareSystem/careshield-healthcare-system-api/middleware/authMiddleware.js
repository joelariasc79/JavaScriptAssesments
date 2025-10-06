// /middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Check if the JWT_SECRET is set
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.");
    process.exit(1); // Exit the process with a failure code
}

const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token is invalid or expired
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }

        // --- 🎯 CRITICAL FIX: Standardize the User ID Property ---

        // Step 1: Determine the actual ID property name from the decoded payload.
        // It could be 'id', '_id', 'userId', or 'sub' (subject). We prioritize common names.
        const userId = user.id || user._id || user.userId || user.sub;

        if (!userId) {
            // If we still can't find the ID, the JWT payload is missing critical data.
            console.error("JWT payload missing identifiable user ID property (id, _id, or userId).");
            return res.status(403).json({ message: 'Invalid token structure. User ID missing.' });
        }

        // Step 2: Attach the original payload to req.user, AND ensure 'id' and '_id' are set.
        req.user = user;
        req.user.id = userId;
        req.user._id = userId; // Map to _id for Mongoose/MongoDB comparisons

        // --------------------------------------------------------

        next();
    });
};

/**
 * Middleware factory to authorize users based on their role.
 * * @param {string} role The required role (e.g., 'admin', 'doctor')
 * @returns {Function} Express middleware function
 */
const authorizeRole = (role) => {
    return (req, res, next) => {
        // req.user is populated by authenticateToken, which MUST run first
        if (!req.user || req.user.role !== role) {
            // Deny access if user is not present or role doesn't match
            return res.status(403).json({
                message: `Forbidden: Access restricted to ${role} users.`
            });
        }
        next();
    };
};


module.exports = {
    authenticateToken
    , authorizeRole
};


// // /middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');
//
// const JWT_SECRET = process.env.JWT_SECRET;
//
// // Check if the JWT_SECRET is set
// if (!JWT_SECRET) {
//     console.error("FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.");
//     process.exit(1); // Exit the process with a failure code
// }
//
// const authenticateToken = (req, res, next) => {
//     // Get token from header
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN
//
//     if (token == null) {
//         return res.status(401).json({ message: 'Authentication token required.' });
//     }
//
//     jwt.verify(token, JWT_SECRET, (err, user) => {
//         if (err) {
//             // Token is invalid or expired
//             return res.status(403).json({ message: 'Invalid or expired token.' });
//         }
//         req.user = user; // Attach user payload to request
//         next();
//     });
// };
//
// /**
//  * Middleware factory to authorize users based on their role.
//  * * @param {string} role The required role (e.g., 'admin', 'doctor')
//  * @returns {Function} Express middleware function
//  */
// const authorizeRole = (role) => {
//     return (req, res, next) => {
//         // req.user is populated by authenticateToken, which MUST run first
//         if (!req.user || req.user.role !== role) {
//             // Deny access if user is not present or role doesn't match
//             return res.status(403).json({
//                 message: `Forbidden: Access restricted to ${role} users.`
//             });
//         }
//         next();
//     };
// };
//
//
// module.exports = {
//     authenticateToken
//     , authorizeRole
// };