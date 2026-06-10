const mongoose = require("mongoose");

const agentRequestSchema = new mongoose.Schema({
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    agencyName: { type: String, required: true },
    agencyAddress: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    rejectionReason: { type: String }
}, { timestamps: true });

agentRequestSchema.index({ agency: 1, agent: 1, status: 1 });

module.exports = mongoose.model("AgentRequest", agentRequestSchema);
