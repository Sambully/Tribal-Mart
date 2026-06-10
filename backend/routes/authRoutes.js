const router = require("express").Router();
const { register, login, changePassword, updateProfile } = require("../controllers/authController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

router.post("/register", register);
router.post("/login", login);
router.put("/password", authMiddleware(), changePassword);
router.put("/profile", authMiddleware(), updateProfile);

module.exports = router;