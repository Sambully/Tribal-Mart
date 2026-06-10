const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, agencyOnly, customerOnly } = require('../middleware/authMiddleware');

// Customer routes
router.post('/', protect, customerOnly, orderController.placeOrder);
router.post('/create-online-payment-order', protect, customerOnly, orderController.createOnlinePaymentOrder);
router.post('/confirm-online-payment', protect, customerOnly, orderController.confirmOnlinePayment);
router.get('/my-orders', protect, customerOnly, orderController.getMyOrders);
router.post('/:id/cancel', protect, customerOnly, orderController.cancelOrder);

// Agency routes
router.get('/agency-orders', protect, agencyOnly, orderController.getAgencyOrders);
router.get('/agency-recent', protect, agencyOnly, orderController.getRecentOrders);
router.get('/agency-stats', protect, agencyOnly, orderController.getAgencyOrderStats);
router.put('/:id/status', protect, agencyOnly, orderController.updateOrderStatus);
router.post('/:id/tracking', protect, agencyOnly, orderController.addTrackingUpdate);

// PUBLIC: anyone (guest or logged in) can track an order by ID/number.
// Must come BEFORE the protected `/:id` so Express matches it first.
router.get('/track/:id', orderController.trackOrder);

// Shared routes (customer or agency can view)
router.get('/:id', protect, orderController.getOrderById);

module.exports = router;
