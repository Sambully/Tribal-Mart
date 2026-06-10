const router = require("express").Router();
const {
    addProduct,
    getAgencyProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getAnalytics,
    getTopProducts,
    getAllProducts,
    getAgentUploadsPendingApproval,
    agencyApproveProduct,
    agencyRejectProduct,
    agentUploadedProducts,
    getAgencyStorefront,
    duplicateProduct
} = require("../controllers/productController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { uploadProductImages } = require("../middleware/uploadMiddleware.js");

// Public routes
router.get("/all", getAllProducts);
router.get("/store/:agencyId", getAgencyStorefront);
router.get("/featured/list", async (req, res) => {
    try {
        const Product = require("../models/Product.js");
        const list = await Product.find({ featured: true, status: "approved" })
            .sort({ updatedAt: -1 }).limit(8);
        res.json(list);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
});

// Agency & Agent can both create products (controller branches on role)
router.post("/", authMiddleware(["agency", "agent"]), uploadProductImages.array("images", 10), addProduct);

// Agency-only operations
router.get("/my-products", authMiddleware(["agency"]), getAgencyProducts);
router.post("/:id/duplicate", authMiddleware(["agency"]), duplicateProduct);
router.get("/analytics", authMiddleware(["agency"]), getAnalytics);
router.get("/top-products", authMiddleware(["agency"]), getTopProducts);
router.get("/agent-uploads-pending", authMiddleware(["agency"]), getAgentUploadsPendingApproval);
router.put("/:id/agency-approve", authMiddleware(["agency"]), agencyApproveProduct);
router.put("/:id/agency-reject", authMiddleware(["agency"]), agencyRejectProduct);

// Agent-only
router.get("/agent-uploads", authMiddleware(["agent"]), agentUploadedProducts);

// Generic
router.get("/:id", authMiddleware(), getProduct);
router.put("/:id", authMiddleware(["agency", "agent"]), updateProduct);
router.delete("/:id", authMiddleware(["agency", "agent"]), deleteProduct);

module.exports = router;
