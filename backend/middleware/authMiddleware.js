const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const authMiddleware = (roles = []) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ message: "No token provided" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET");
            
            // Get user from database
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Check if user has required role
            if (roles.length && !roles.includes(user.role)) {
                return res.status(403).json({ message: "Access denied. Insufficient permissions." });
            }

            // Attach user to request
            req.user = {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            };
            
            next();
        } catch (error) {
            console.error("Auth middleware error:", error);
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};

// Named exports for convenience
const protect = authMiddleware();
const agencyOnly = authMiddleware(['agency']);
const adminOnly = authMiddleware(['admin']);
const customerOnly = authMiddleware(['customer']);

// Default export for backward compatibility
module.exports = authMiddleware;

// Named exports
module.exports.protect = protect;
module.exports.agencyOnly = agencyOnly;
module.exports.adminOnly = adminOnly;
module.exports.customerOnly = customerOnly;