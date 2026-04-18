const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Please authenticate.' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        const user = await User.findOne({ _id: decoded._id });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Please authenticate.' });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).json({ success: false, error: 'Please authenticate.' });
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Unauthorized access.' });
        }
        next();
    };
};

module.exports = { auth, authorize };
