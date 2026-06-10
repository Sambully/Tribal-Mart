// Public read-only categories endpoint. Anyone (logged in or not) can
// see the live category list — so Add Product dropdowns in the agency
// and agent portals always reflect what the admin has configured.

const express = require('express');
const router = express.Router();
const categoryStore = require('../lib/categoryStore.js');

router.get('/', (_req, res) => {
  res.json(categoryStore.list());
});

module.exports = router;
