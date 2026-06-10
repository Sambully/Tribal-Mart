const mongoose = require("mongoose");

const addressSubSchema = new mongoose.Schema({
    label:        { type: String, default: "Home" },      // "Home", "Office", "Mom's place"
    fullName:     { type: String, required: true },
    phone:        { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city:         { type: String, required: true },
    state:        { type: String, required: true },
    pincode:      { type: String, required: true },
    isDefault:    { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const paymentMethodSubSchema = new mongoose.Schema({
    kind:      { type: String, enum: ["card", "upi", "netbanking"], required: true },
    label:     { type: String },              // user-given nickname e.g. "HDFC Platinum"
    last4:     { type: String },              // last 4 digits of card (never store full number)
    upiId:     { type: String },              // for kind === "upi"
    bankName:  { type: String },
    isDefault: { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
        type: String,
        enum: ["agency", "customer", "admin", "agent"],
        default: "customer"
    },
    address: { type: String },                            // legacy single-line address (kept for agents/agencies)
    addresses:      { type: [addressSubSchema], default: [] },        // customer shipping addresses
    paymentMethods: { type: [paymentMethodSubSchema], default: [] },  // customer saved payment methods
    avatarUrl:      { type: String },                                 // profile photo (relative or absolute URL)

    // When role === "agency" and this is set, the agency is being managed by this agent.
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: ["active", "suspended"],
        default: "active"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
