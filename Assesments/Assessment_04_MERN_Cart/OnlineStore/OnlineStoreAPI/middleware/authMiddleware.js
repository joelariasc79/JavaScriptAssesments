// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_this_in_production';

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, JWT_SECRET);

            // 🌟🌟🌟 ADD THIS CONSOLE.LOG HERE 🌟🌟🌟
            console.log('--- Decoded JWT Payload ---');
            console.log(decoded);
            console.log('---------------------------');

            // Based on the 'decoded' output, you will adjust the line below
            req.user = { userId: decoded.userId };// This line needs to be adjusted if 'id' is not the key

            next();
        } catch (error) {
            console.error('Not authorized, token failed:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };