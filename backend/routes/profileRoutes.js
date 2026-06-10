const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const { uploadAvatar } = require("../middleware/uploadMiddleware.js");
const c = require("../controllers/profileController.js");

router.use(authMiddleware());

router.get("/me", c.getMe);
router.put("/me", c.updateMe);
router.post("/avatar", uploadAvatar.single("avatar"), c.uploadAvatar);

router.get("/addresses",       c.listAddresses);
router.post("/addresses",      c.addAddress);
router.put("/addresses/:id",   c.updateAddress);
router.delete("/addresses/:id", c.deleteAddress);

router.get("/payment-methods",        c.listPaymentMethods);
router.post("/payment-methods",       c.addPaymentMethod);
router.delete("/payment-methods/:id", c.deletePaymentMethod);

module.exports = router;
