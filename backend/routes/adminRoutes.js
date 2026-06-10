const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// All routes require admin authentication
router.use(authMiddleware(["admin"]));

// Dashboard statistics
router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/analytics", adminController.getAdminAnalytics);

// Product management routes
router.get("/pending-products", adminController.getPendingProducts);
router.get("/all-products", adminController.getAllProducts);
router.get("/products", adminController.getAllProducts);
router.get("/products/:id", adminController.getProductDetails);
router.post("/products/:id/approve", adminController.approveProduct);
router.post("/products/:id/reject", adminController.rejectProduct);
router.put("/products/:id/status", adminController.updateProductStatus);
router.delete("/products/:id", adminController.deleteProduct);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserDetail);
router.put("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

// Featured products
router.put("/products/:id/featured", adminController.toggleFeatured);
router.get("/featured", adminController.listFeatured);

// Financial summary + settlements
router.get("/financial-summary", adminController.getFinancialSummary);

// Categories
router.get("/categories", adminController.listCategories);
router.post("/categories", adminController.addCategory);
router.delete("/categories/:name", adminController.removeCategory);

module.exports = router;
