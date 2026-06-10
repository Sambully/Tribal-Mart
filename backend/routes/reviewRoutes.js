const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const { listForProduct, create, remove } = require("../controllers/reviewController.js");

router.get("/:productId", listForProduct);
router.post("/", authMiddleware(["customer"]), create);
router.delete("/:id", authMiddleware(), remove);

module.exports = router;
