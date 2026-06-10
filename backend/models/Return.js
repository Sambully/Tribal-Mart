const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    orderNumber: { type: String },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    customerName: { type: String },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    agencyName: { type: String },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        quantity: Number,
        sellingPrice: Number,
    }],
    reason:    { type: String, required: true },
    status:    { type: String, enum: ["requested", "approved", "rejected", "received", "refunded"], default: "requested" },
    refundAmount: { type: Number, default: 0 },
    timeline: [{
        status:    String,
        message:   String,
        at:        { type: Date, default: Date.now },
    }],
    decisionNote: { type: String },
}, { timestamps: true });

returnSchema.index({ customer: 1, createdAt: -1 });
returnSchema.index({ agency: 1, status: 1 });

module.exports = mongoose.model("Return", returnSchema);
