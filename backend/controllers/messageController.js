const Message = require("../models/Message.js");

// Send message (from customer to agency)
exports.sendMessage = async (req, res) => {
    try {
        const { productId, agencyId, subject, message } = req.body;
        const customerId = req.user.id;
        const customerName = req.user.name;
        const customerEmail = req.user.email;

        const newMessage = await Message.create({
            product: productId,
            customer: customerId,
            customerName,
            customerEmail,
            agency: agencyId,
            subject,
            message,
            status: 'unread'
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('product', 'title')
            .populate('customer', 'name email');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
};

// Get all messages for agency
exports.getAgencyMessages = async (req, res) => {
    try {
        const agencyId = req.user.id;
        const { status } = req.query;

        const filter = { agency: agencyId };
        if (status) {
            filter.status = status;
        }

        const messages = await Message.find(filter)
            .populate('product', 'title')
            .populate('customer', 'name email')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
};

// Get all messages for customer
exports.getCustomerMessages = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { status } = req.query;

        const filter = { customer: customerId };
        if (status) {
            filter.status = status;
        }

        const messages = await Message.find(filter)
            .populate('product', 'title')
            .populate('agency', 'name email')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error("Get customer messages error:", error);
        res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (!message.agency.equals(req.user.id)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.status = 'read';
        await message.save();

        res.json(message);
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ message: "Failed to update message", error: error.message });
    }
};

// Reply to message
exports.replyMessage = async (req, res) => {
    try {
        const { reply } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (!message.agency.equals(req.user.id)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.reply = reply;
        message.status = 'replied';
        message.repliedAt = new Date();
        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('product', 'title')
            .populate('customer', 'name email');

        res.json(populatedMessage);
    } catch (error) {
        console.error("Reply message error:", error);
        res.status(500).json({ message: "Failed to reply", error: error.message });
    }
};

// Delete message
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (!message.agency.equals(req.user.id)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ message: "Failed to delete message", error: error.message });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const agencyId = req.user.id;
        const count = await Message.countDocuments({ agency: agencyId, status: 'unread' });
        res.json({ count });
    } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({ message: "Failed to get count", error: error.message });
    }
};