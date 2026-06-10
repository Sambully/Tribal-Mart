const Wishlist = require("../models/Wishlist.js");
const Cart = require("../models/Cart.js");
const Order = require("../models/Order.js");
const Product = require("../models/Product.js");

// ============ WISHLIST ============

// Get customer wishlist
exports.getWishlist = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        let wishlist = await Wishlist.findOne({ customer: customerId })
            .populate('products');
        
        if (!wishlist) {
            wishlist = await Wishlist.create({ customer: customerId, products: [] });
        }
        
        res.json(wishlist);
    } catch (error) {
        console.error("Get wishlist error:", error);
        res.status(500).json({ message: "Failed to fetch wishlist", error: error.message });
    }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId } = req.body;
        
        let wishlist = await Wishlist.findOne({ customer: customerId });
        
        if (!wishlist) {
            wishlist = await Wishlist.create({ customer: customerId, products: [productId] });
        } else {
            if (!wishlist.products.includes(productId)) {
                wishlist.products.push(productId);
                await wishlist.save();
            }
        }
        
        wishlist = await Wishlist.findById(wishlist._id).populate('products');
        res.json(wishlist);
    } catch (error) {
        console.error("Add to wishlist error:", error);
        res.status(500).json({ message: "Failed to add to wishlist", error: error.message });
    }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId } = req.params;
        
        const wishlist = await Wishlist.findOne({ customer: customerId });
        
        if (!wishlist) {
            return res.status(404).json({ message: "Wishlist not found" });
        }
        
        wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
        await wishlist.save();
        
        const updatedWishlist = await Wishlist.findById(wishlist._id).populate('products');
        res.json(updatedWishlist);
    } catch (error) {
        console.error("Remove from wishlist error:", error);
        res.status(500).json({ message: "Failed to remove from wishlist", error: error.message });
    }
};

// ============ CART ============

// Get customer cart
exports.getCart = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        let cart = await Cart.findOne({ customer: customerId })
            .populate('items.product');
        
        if (!cart) {
            cart = await Cart.create({ customer: customerId, items: [] });
        }
        
        // Calculate totals
        let totalAmount = 0;
        let totalSavings = 0;
        
        cart.items.forEach(item => {
            if (item.product) {
                totalAmount += item.product.sellingPrice * item.quantity;
                totalSavings += (item.product.originalPrice - item.product.sellingPrice) * item.quantity;
            }
        });
        
        res.json({
            ...cart.toObject(),
            totalAmount,
            totalSavings
        });
    } catch (error) {
        console.error("Get cart error:", error);
        res.status(500).json({ message: "Failed to fetch cart", error: error.message });
    }
};

// Add to cart
exports.addToCart = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId, quantity = 1 } = req.body;
        
        // Check if product exists and is approved
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.status !== 'approved') {
            return res.status(400).json({ message: "Product is not available for purchase" });
        }
        
        let cart = await Cart.findOne({ customer: customerId });
        
        if (!cart) {
            cart = await Cart.create({
                customer: customerId,
                items: [{ product: productId, quantity }]
            });
        } else {
            const existingItem = cart.items.find(item => item.product.toString() === productId);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }
            
            await cart.save();
        }
        
        cart = await Cart.findById(cart._id).populate('items.product');
        res.json(cart);
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ message: "Failed to add to cart", error: error.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;
        
        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }
        
        const cart = await Cart.findOne({ customer: customerId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        const item = cart.items.find(item => item.product.toString() === productId);
        
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }
        
        item.quantity = quantity;
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.json(updatedCart);
    } catch (error) {
        console.error("Update cart error:", error);
        res.status(500).json({ message: "Failed to update cart", error: error.message });
    }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId } = req.params;
        
        const cart = await Cart.findOne({ customer: customerId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.json(updatedCart);
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ message: "Failed to remove from cart", error: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const cart = await Cart.findOne({ customer: customerId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        cart.items = [];
        await cart.save();
        
        res.json(cart);
    } catch (error) {
        console.error("Clear cart error:", error);
        res.status(500).json({ message: "Failed to clear cart", error: error.message });
    }
};

// ============ ORDERS ============

// Place order
exports.placeOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const customerName = req.user.name;
        const customerEmail = req.user.email;
        const { shippingAddress, paymentMethod = 'cod' } = req.body;
        
        // Get cart
        const cart = await Cart.findOne({ customer: customerId }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        
        // Prepare order items
        const orderItems = [];
        let totalAmount = 0;
        let totalSavings = 0;
        
        for (const item of cart.items) {
            if (!item.product) continue;
            
            // Check if product is still available
            if (item.product.status !== 'approved') {
                return res.status(400).json({ 
                    message: `Product "${item.product.title}" is no longer available` 
                });
            }
            
            orderItems.push({
                product: item.product._id,
                productTitle: item.product.title,
                productImage: item.product.images[0] || '',
                agency: item.product.agency,
                agencyName: item.product.agencyName,
                quantity: item.quantity,
                price: item.product.sellingPrice,
                originalPrice: item.product.originalPrice
            });
            
            totalAmount += item.product.sellingPrice * item.quantity;
            totalSavings += (item.product.originalPrice - item.product.sellingPrice) * item.quantity;
        }
        
        // Create order
        const order = await Order.create({
            customer: customerId,
            customerName,
            customerEmail,
            items: orderItems,
            shippingAddress,
            totalAmount,
            totalSavings,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
            orderStatus: 'confirmed',
            trackingUpdates: [{
                status: 'confirmed',
                message: 'Order has been confirmed and is being prepared for shipment',
                timestamp: new Date()
            }],
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });
        
        // Clear cart
        cart.items = [];
        await cart.save();
        
        // Update product status to sold (if needed)
        // for (const item of orderItems) {
        //     await Product.findByIdAndUpdate(item.product, { status: 'sold', soldDate: new Date() });
        // }
        
        res.status(201).json(order);
    } catch (error) {
        console.error("Place order error:", error);
        res.status(500).json({ message: "Failed to place order", error: error.message });
    }
};

// Get customer orders
exports.getOrders = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const orders = await Order.find({ customer: customerId })
            .sort({ createdAt: -1 })
            .populate('items.product');
        
        res.json(orders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { orderId } = req.params;
        
        const order = await Order.findOne({ _id: orderId, customer: customerId })
            .populate('items.product');
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.json(order);
    } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({ message: "Failed to fetch order", error: error.message });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { orderId } = req.params;
        const { reason } = req.body;
        
        const order = await Order.findOne({ _id: orderId, customer: customerId });
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
            return res.status(400).json({ message: "Cannot cancel this order" });
        }
        
        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;
        order.trackingUpdates.push({
            status: 'cancelled',
            message: `Order cancelled by customer. Reason: ${reason}`,
            timestamp: new Date()
        });
        
        await order.save();
        
        res.json(order);
    } catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({ message: "Failed to cancel order", error: error.message });
    }
};