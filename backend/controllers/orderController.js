const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

const validateShippingAddress = (shippingAddress) => {
  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

  if (!shippingAddress) {
    return 'Shipping address is required';
  }

  for (const field of requiredFields) {
    if (!shippingAddress[field]) {
      return `Missing shipping address field: ${field}`;
    }
  }

  if (!/^\d{10}$/.test(shippingAddress.phone)) {
    return 'Please enter a valid 10-digit phone number';
  }

  if (!/^\d{6}$/.test(shippingAddress.pincode)) {
    return 'Please enter a valid 6-digit pincode';
  }

  return null;
};

const buildOrderPreview = async (items) => {
  if (!items || items.length === 0) {
    const error = new Error('No items in order');
    error.statusCode = 400;
    throw error;
  }

  let totalAmount = 0;
  let totalSavings = 0;
  const orderItems = [];
  const productUpdates = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.statusCode = 404;
      throw error;
    }

    if (product.quantity < item.quantity) {
      const error = new Error(`Insufficient quantity for ${product.title}`);
      error.statusCode = 400;
      throw error;
    }

    const itemTotal = product.sellingPrice * item.quantity;
    const savings = (product.originalPrice - product.sellingPrice) * item.quantity;

    totalAmount += itemTotal;
    totalSavings += savings;

    orderItems.push({
      product: product._id,
      productTitle: product.title,
      productImage: product.images[0] || '',
      agency: product.agency,
      agencyName: product.agencyName,
      quantity: item.quantity,
      price: product.sellingPrice,
      originalPrice: product.originalPrice
    });

    productUpdates.push({
      product,
      quantity: item.quantity
    });
  }

  return { orderItems, totalAmount, totalSavings, productUpdates };
};

const decrementInventory = async (productUpdates) => {
  for (const item of productUpdates) {
    item.product.quantity -= item.quantity;

    if (item.product.quantity === 0) {
      item.product.status = 'sold';
    }

    await item.product.save();
  }
};

const createOrderRecord = async ({
  customerId,
  customerName,
  customerEmail,
  shippingAddress,
  paymentMethod,
  paymentStatus,
  orderStatus,
  orderItems,
  totalAmount,
  totalSavings,
  productUpdates,
  trackingMessage,
  estimatedDelivery
}) => {
  await decrementInventory(productUpdates);

  return Order.create({
    customer: customerId,
    customerName,
    customerEmail,
    items: orderItems,
    shippingAddress,
    totalAmount,
    totalSavings,
    paymentMethod,
    paymentStatus,
    orderStatus,
    trackingUpdates: [{
      status: orderStatus === 'confirmed' ? 'Order Confirmed' : 'Order Placed',
      message: trackingMessage,
      timestamp: new Date()
    }],
    estimatedDelivery
  });
};

// Place new order (Customer)
exports.placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const customerId = req.user._id;

    if (paymentMethod === 'online') {
      return res.status(400).json({
        message: 'Online payments must use the payment gateway flow'
      });
    }

    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ message: addressError });
    }

    const preparedOrder = await buildOrderPreview(items);

    const order = await createOrderRecord({
      customerId,
      customerName: req.user.name,
      customerEmail: req.user.email,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      orderItems: preparedOrder.orderItems,
      totalAmount: preparedOrder.totalAmount,
      totalSavings: preparedOrder.totalSavings,
      productUpdates: preparedOrder.productUpdates,
      trackingMessage: 'Your order has been placed successfully'
    });

    res.status(201).json({ 
      message: 'Order placed successfully', 
      order 
    });
  } catch (error) {
    console.error('Place order error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Failed to place order'
    });
  }
};

// Create Razorpay order (Customer)
exports.createOnlinePaymentOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const customer = req.user;

    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ message: addressError });
    }

    const preparedOrder = await buildOrderPreview(items);
    const firstItem = items[0];
    const product = preparedOrder.orderItems[0];
    const razorpay = getRazorpayClient();

    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(preparedOrder.totalAmount * 100),
      currency: 'INR',
      receipt: `tm_${Date.now()}`,
      notes: {
        customerId: customer._id.toString(),
        customerName: customer.name,
        customerEmail: customer.email,
        productId: firstItem.productId,
        quantity: String(firstItem.quantity),
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode
      }
    });

    res.status(201).json({
      message: 'Payment order created',
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      productTitle: product.productTitle,
      totalAmount: preparedOrder.totalAmount,
      totalSavings: preparedOrder.totalSavings
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to create payment order'
    });
  }
};

// Confirm Razorpay payment and create order (Customer)
exports.confirmOnlinePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    const razorpay = getRazorpayClient();
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const paymentOrder = await razorpay.orders.fetch(razorpay_order_id);

    if (paymentOrder.status !== 'paid') {
      return res.status(400).json({ message: 'Payment is not completed' });
    }

    const notes = paymentOrder.notes || {};
    if (notes.customerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Payment does not belong to this user' });
    }

    const shippingAddress = {
      fullName: notes.fullName,
      phone: notes.phone,
      addressLine1: notes.addressLine1,
      addressLine2: notes.addressLine2 || '',
      city: notes.city,
      state: notes.state,
      pincode: notes.pincode
    };

    const preparedOrder = await buildOrderPreview([{ 
      productId: notes.productId,
      quantity: Number(notes.quantity)
    }]);

    if (paymentOrder.amount !== Math.round(preparedOrder.totalAmount * 100)) {
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }

    const order = await createOrderRecord({
      customerId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      shippingAddress,
      paymentMethod: 'online',
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      orderItems: preparedOrder.orderItems,
      totalAmount: preparedOrder.totalAmount,
      totalSavings: preparedOrder.totalSavings,
      productUpdates: preparedOrder.productUpdates,
      trackingMessage: 'Your payment was received and the order is confirmed',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      message: 'Payment verified and order created successfully',
      order,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to confirm payment'
    });
  }
};

// Get customer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const customerId = req.user._id;
    const orders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get single order details
// Public order tracking (no auth) — returns SAFE subset only.
// Used by the floating chatbot on the landing page so guests can
// look up the status of an order they were given an ID for.
exports.trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Order ID is required' });

    // Accept either the Mongo _id or the order number
    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      return res.status(404).json({ message: 'No order found for that ID' });
    }

    // Return only what's safe for an anonymous lookup
    res.json({
      orderNumber: order.orderNumber || String(order._id),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      placedAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      items: (order.items || []).map((it) => ({
        productTitle: it.productTitle,
        productImage: it.productImage,
        agencyName: it.agencyName,
        quantity: it.quantity,
        price: it.price,
      })),
      trackingUpdates: order.trackingUpdates || [],
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Failed to look up order' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (order.customer.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      // Check if user is the agency for any item in the order
      const isAgency = order.items.some(item => 
        item.agency && item.agency.toString() === req.user._id.toString()
      );
      
      if (!isAgency) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

// Get agency's orders
exports.getAgencyOrders = async (req, res) => {
  try {
    const agencyId = req.user._id;
    
    // Find all orders that contain items from this agency
    const orders = await Order.find({
      'items.agency': agencyId
    })
    .sort({ createdAt: -1 })
    .populate('items.product');

    res.json(orders);
  } catch (error) {
    console.error('Get agency orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get recent orders for analytics
exports.getRecentOrders = async (req, res) => {
  try {
    const agencyId = req.user._id;
    
    const orders = await Order.find({
      'items.agency': agencyId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customer', 'name email')
    .select('orderNumber totalAmount status createdAt customer');

    res.json(orders);
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ message: 'Failed to fetch recent orders' });
  }
};

// Update order status (Agency)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const agencyId = req.user._id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if agency owns any item in this order
    const hasAgencyItem = order.items.some(item => 
      item.agency && item.agency.toString() === agencyId.toString()
    );

    if (!hasAgencyItem) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    order.orderStatus = status;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'completed';
    }

    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

// Add tracking update (Agency)
exports.addTrackingUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    const agencyId = req.user._id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if agency owns any item in this order
    const hasAgencyItem = order.items.some(item => 
      item.agency && item.agency.toString() === agencyId.toString()
    );

    if (!hasAgencyItem) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.trackingUpdates.push({
      status,
      message,
      timestamp: new Date()
    });

    await order.save();

    res.json({ message: 'Tracking update added', order });
  } catch (error) {
    console.error('Add tracking update error:', error);
    res.status(500).json({ message: 'Failed to add tracking update' });
  }
};

// Cancel order (Customer)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const customerId = req.user._id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== customerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.trackingUpdates.push({
      status: 'Cancelled',
      message: reason || 'Order cancelled by customer',
      timestamp: new Date()
    });

    // Restore product quantities
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        if (product.status === 'sold') {
          product.status = 'approved';
        }
        await product.save();
      }
    }

    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Get order statistics (Agency)
exports.getAgencyOrderStats = async (req, res) => {
  try {
    const agencyId = req.user._id;

    const orders = await Order.find({
      'items.agency': agencyId
    });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
      processing: orders.filter(o => o.orderStatus === 'processing').length,
      shipped: orders.filter(o => o.orderStatus === 'shipped').length,
      delivered: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.orderStatus === 'delivered')
        .reduce((sum, order) => {
          const agencyItems = order.items.filter(item => 
            item.agency && item.agency.toString() === agencyId.toString()
          );
          return sum + agencyItems.reduce((itemSum, item) => 
            itemSum + (item.price * item.quantity), 0
          );
        }, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Failed to fetch order statistics' });
  }
};
