const jwt = require('jsonwebtoken');
const Enterprise = require('../models/Enterprise');

const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get enterprise from token
            const enterprise = await Enterprise.findById(decoded.id).select('-password');
            if (!enterprise) {
                return res.status(401).json({ error: 'Not authorized, enterprise not found' });
            }

            // Add enterprise to request object
            req.enterprise = enterprise;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Not authorized, invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { protect };