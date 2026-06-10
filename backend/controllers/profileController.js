const User = require("../models/User.js");
const path = require("path");
const fs = require("fs");

// GET /api/profile/me
exports.getMe = async (req, res) => {
    try {
        const me = await User.findById(req.user.id).select("-password");
        if (!me) return res.status(404).json({ message: "User not found" });
        res.json(me);
    } catch (e) {
        res.status(500).json({ message: "Failed to load profile" });
    }
};

// PUT /api/profile/me — update name / address (legacy field) / avatarUrl
exports.updateMe = async (req, res) => {
    try {
        const { name, address, avatarUrl } = req.body;
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "User not found" });
        if (typeof name === "string"      && name.trim())      me.name = name.trim();
        if (typeof address === "string")                       me.address = address;
        if (typeof avatarUrl === "string") me.avatarUrl = avatarUrl;
        await me.save();
        const out = me.toObject(); delete out.password;
        res.json(out);
    } catch (e) {
        res.status(500).json({ message: "Failed to update profile" });
    }
};

// POST /api/profile/avatar — multipart upload
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        const url = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
        const me = await User.findByIdAndUpdate(req.user.id, { avatarUrl: url }, { new: true }).select("-password");
        res.json({ avatarUrl: url, user: me });
    } catch (e) {
        res.status(500).json({ message: "Failed to upload avatar" });
    }
};

// ── Addresses ─────────────────────────────────────────────
exports.listAddresses = async (req, res) => {
    const me = await User.findById(req.user.id).select("addresses");
    res.json(me?.addresses || []);
};

exports.addAddress = async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "User not found" });

        const addr = req.body || {};
        const required = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];
        for (const f of required) {
            if (!addr[f]) return res.status(400).json({ message: `Field "${f}" is required` });
        }

        // If first address, mark as default
        if (me.addresses.length === 0) addr.isDefault = true;
        // If user marked this as default, unset others
        if (addr.isDefault) me.addresses.forEach(a => { a.isDefault = false; });

        me.addresses.push(addr);
        await me.save();
        res.status(201).json(me.addresses);
    } catch (e) {
        res.status(500).json({ message: "Failed to add address" });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "User not found" });
        const addr = me.addresses.id(req.params.id);
        if (!addr) return res.status(404).json({ message: "Address not found" });
        Object.assign(addr, req.body || {});
        if (addr.isDefault) {
            me.addresses.forEach(a => { if (String(a._id) !== String(addr._id)) a.isDefault = false; });
        }
        await me.save();
        res.json(me.addresses);
    } catch (e) {
        res.status(500).json({ message: "Failed to update address" });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "User not found" });
        const addr = me.addresses.id(req.params.id);
        if (!addr) return res.status(404).json({ message: "Address not found" });
        const wasDefault = addr.isDefault;
        addr.deleteOne();
        if (wasDefault && me.addresses.length > 0) me.addresses[0].isDefault = true;
        await me.save();
        res.json(me.addresses);
    } catch (e) {
        res.status(500).json({ message: "Failed to delete address" });
    }
};

// ── Payment methods ──────────────────────────────────────
exports.listPaymentMethods = async (req, res) => {
    const me = await User.findById(req.user.id).select("paymentMethods");
    res.json(me?.paymentMethods || []);
};

exports.addPaymentMethod = async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "User not found" });
        const pm = req.body || {};
        if (!pm.kind) return res.status(400).json({ message: "kind is required" });
        if (pm.kind === "card" && !pm.last4) return res.status(400).json({ message: "last4 required for card" });
        if (pm.kind === "upi" && !pm.upiId)  return res.status(400).json({ message: "upiId required for UPI" });

        if (me.paymentMethods.length === 0) pm.isDefault = true;
        if (pm.isDefault) me.paymentMethods.forEach(p => { p.isDefault = false; });

        me.paymentMethods.push(pm);
        await me.save();
        res.status(201).json(me.paymentMethods);
    } catch (e) {
        res.status(500).json({ message: "Failed to add payment method" });
    }
};

exports.deletePaymentMethod = async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "User not found" });
        const pm = me.paymentMethods.id(req.params.id);
        if (!pm) return res.status(404).json({ message: "Payment method not found" });
        const wasDefault = pm.isDefault;
        pm.deleteOne();
        if (wasDefault && me.paymentMethods.length > 0) me.paymentMethods[0].isDefault = true;
        await me.save();
        res.json(me.paymentMethods);
    } catch (e) {
        res.status(500).json({ message: "Failed to delete payment method" });
    }
};
