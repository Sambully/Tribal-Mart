const router = require("express").Router();
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    placeOrder,
    getOrders,
    getOrder,
    cancelOrder
} = require("../controllers/customerController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// All routes require customer authentication
const customerAuth = authMiddleware(['customer']);

// Wishlist routes
router.get("/wishlist", customerAuth, getWishlist);
router.post("/wishlist", customerAuth, addToWishlist);
router.delete("/wishlist/:productId", customerAuth, removeFromWishlist);

// Cart routes
router.get("/cart", customerAuth, getCart);
router.post("/cart", customerAuth, addToCart);
router.put("/cart/:productId", customerAuth, updateCartItem);
router.delete("/cart/:productId", customerAuth, removeFromCart);
router.delete("/cart", customerAuth, clearCart);

// Order routes
router.post("/orders", customerAuth, placeOrder);
router.get("/orders", customerAuth, getOrders);
router.get("/orders/:orderId", customerAuth, getOrder);
router.post("/orders/:orderId/cancel", customerAuth, cancelOrder);

module.exports = router;