const Return = require("../models/Return.js");
const Order = require("../models/Order.js");

// POST /api/returns — customer creates a return request for a delivered order
exports.create = async (req, res) => {
    try {
        if (req.user.role !== "customer") return res.status(403).json({ message: "Customers only" });
        const { orderId, reason, itemProductIds } = req.body;
        if (!orderId || !reason) return res.status(400).json({ message: "orderId and reason are required" });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.customer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not your order" });
        }
        if (order.orderStatus !== "delivered") {
            return res.status(400).json({ message: "Only delivered orders can be returned" });
        }

        // Prevent duplicate open returns
        const existing = await Return.findOne({ order: orderId, status: { $in: ["requested", "approved", "received"] } });
        if (existing) return res.status(400).json({ message: "An open return already exists for this order" });

        // Build the item list from the order
        const wanted = new Set((itemProductIds || []).map(String));
        const items = (order.items || [])
            .filter(it => wanted.size === 0 || wanted.has(String(it.product)))
            .map(it => ({
                product: it.product,
                title: it.productTitle || it.title || "Item",
                quantity: it.quantity,
                sellingPrice: it.sellingPrice || it.price || 0,
            }));

        const refundAmount = items.reduce((s, it) => s + (it.sellingPrice || 0) * (it.quantity || 1), 0);

        const ret = await Return.create({
            order: order._id,
            orderNumber: order.orderNumber,
            customer: req.user.id,
            customerName: req.user.name,
            agency: order.agency,
            agencyName: order.agencyName,
            items,
            reason,
            refundAmount,
            timeline: [{ status: "requested", message: `Return requested: ${reason}` }],
        });

        res.status(201).json(ret);
    } catch (e) {
        console.error("Create return error:", e);
        res.status(500).json({ message: "Failed to create return" });
    }
};

// GET /api/returns/mine — customer lists own returns
exports.listMine = async (req, res) => {
    const list = await Return.find({ customer: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
};

// GET /api/returns/agency — agency sees returns for their orders
exports.listForAgency = async (req, res) => {
    if (req.user.role !== "agency") return res.status(403).json({ message: "Agency only" });
    const list = await Return.find({ agency: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
};

// PUT /api/returns/:id/decide — agency approves or rejects
exports.decide = async (req, res) => {
    try {
        if (req.user.role !== "agency") return res.status(403).json({ message: "Agency only" });
        const { decision, note } = req.body;  // 'approve' | 'reject'
        const ret = await Return.findById(req.params.id);
        if (!ret) return res.status(404).json({ message: "Return not found" });
        if (String(ret.agency) !== String(req.user.id)) return res.status(403).json({ message: "Not your return" });
        if (ret.status !== "requested") return res.status(400).json({ message: `Return already ${ret.status}` });

        if (decision === "approve") {
            ret.status = "approved";
            ret.timeline.push({ status: "approved", message: note || "Return approved — ship back to us." });
        } else if (decision === "reject") {
            ret.status = "rejected";
            ret.decisionNote = note || "";
            ret.timeline.push({ status: "rejected", message: note || "Return request was declined." });
        } else {
            return res.status(400).json({ message: "decision must be 'approve' or 'reject'" });
        }
        await ret.save();
        res.json(ret);
    } catch (e) {
        res.status(500).json({ message: "Failed to update return" });
    }
};

// PUT /api/returns/:id/refund — agency marks refund as issued
exports.refund = async (req, res) => {
    try {
        if (req.user.role !== "agency") return res.status(403).json({ message: "Agency only" });
        const ret = await Return.findById(req.params.id);
        if (!ret) return res.status(404).json({ message: "Return not found" });
        if (String(ret.agency) !== String(req.user.id)) return res.status(403).json({ message: "Not your return" });
        if (!["approved", "received"].includes(ret.status)) return res.status(400).json({ message: "Approve / receive first" });

        ret.status = "refunded";
        ret.timeline.push({ status: "refunded", message: `Refund of ₹${ret.refundAmount} issued.` });
        await ret.save();
        res.json(ret);
    } catch (e) {
        res.status(500).json({ message: "Failed to mark refunded" });
    }
};
