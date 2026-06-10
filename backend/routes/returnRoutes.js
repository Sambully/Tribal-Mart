const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const c = require("../controllers/returnController.js");

router.use(authMiddleware());

router.post("/",                  c.create);
router.get("/mine",               c.listMine);
router.get("/agency",             c.listForAgency);
router.put("/:id/decide",         c.decide);
router.put("/:id/refund",         c.refund);

module.exports = router;
