const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Furniture', 'Clothing', 'Appliances', 'Toys', 'Vehicles', 'Others']
    },
    originalPrice: {
        type: Number,
        required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    condition: {
        type: String,
        enum: ['New', 'Like New', 'Good', 'Fair'],
        default: 'Good'
    },
    images: [{
        type: String
    }],
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    agencyName: {
        type: String,
        required: true
    },
    // If an agent uploaded this product on behalf of the agency, this is set
    uploadedByAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['pending_agency_approval', 'pending', 'approved', 'rejected', 'rejected_by_agency', 'sold'],
        default: 'pending'
    },
    views: {
        type: Number,
        default: 0
    },
    rejectionReason: {
        type: String
    },
    soldDate: {
        type: Date
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);