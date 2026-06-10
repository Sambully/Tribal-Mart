const router = require("express").Router();
const {
    sendMessage,
    getAgencyMessages,
    getCustomerMessages,
    markAsRead,
    replyMessage,
    deleteMessage,
    getUnreadCount
} = require("../controllers/messageController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// Customer routes
router.post("/", authMiddleware(['customer']), sendMessage);
router.get("/customer", authMiddleware(['customer']), getCustomerMessages);

// Agency routes
router.get("/agency", authMiddleware(['agency']), getAgencyMessages);
router.get("/unread-count", authMiddleware(['agency']), getUnreadCount);
router.patch("/:id/read", authMiddleware(['agency']), markAsRead);
router.post("/:id/reply", authMiddleware(['agency']), replyMessage);
router.delete("/:id", authMiddleware(['agency']), deleteMessage);

module.exports = router;