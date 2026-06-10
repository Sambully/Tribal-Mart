const Product = require("../models/Product.js");
const Sale = require("../models/Sale.js");
const User = require("../models/User.js");

// Add new product
// - Agency uploads → status "pending" (goes to admin queue)
// - Agent uploads (with agencyId in body) → status "pending_agency_approval"
//   (agency must approve first, then it flows to admin)
exports.addProduct = async (req, res) => {
    try {
        const { title, description, category, originalPrice, sellingPrice, quantity, condition, agencyId: bodyAgencyId } = req.body;

        let agencyId;
        let agencyName;
        let uploadedByAgent = null;
        let initialStatus = "pending";

        if (req.user.role === "agent") {
            if (!bodyAgencyId) {
                return res.status(400).json({ message: "agencyId is required when an agent lists a product" });
            }
            const agency = await User.findOne({ _id: bodyAgencyId, role: "agency" });
            if (!agency) return res.status(404).json({ message: "Agency not found" });
            if (!agency.agent || agency.agent.toString() !== req.user.id.toString()) {
                return res.status(403).json({ message: "You are not the assigned agent for this agency" });
            }
            agencyId = agency._id;
            agencyName = agency.name;
            uploadedByAgent = req.user.id;
            initialStatus = "pending_agency_approval";
        } else if (req.user.role === "agency") {
            agencyId = req.user.id;
            agencyName = req.user.name;
        } else {
            return res.status(403).json({ message: "Only agencies and agents can add products" });
        }

        // Images: prefer URLs passed in JSON body (Cloudinary flow),
        // fall back to multipart files for legacy callers.
        let images = [];
        if (Array.isArray(req.body.images)) {
            // Already an array of strings (Cloudinary URLs)
            images = req.body.images.filter(u => typeof u === 'string' && u.length > 0);
        } else if (typeof req.body.images === 'string' && req.body.images.length > 0) {
            // Single URL passed as string
            images = [req.body.images];
        } else if (req.files && req.files.length > 0) {
            const serverUrl = `${req.protocol}://${req.get("host")}`;
            images = req.files.map(file => `${serverUrl}/uploads/products/${file.filename}`);
        }

        const product = await Product.create({
            title,
            description,
            category,
            originalPrice,
            sellingPrice,
            quantity,
            condition,
            images,
            agency: agencyId,
            agencyName,
            uploadedByAgent,
            status: initialStatus
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Add product error:", error);
        res.status(500).json({ message: "Failed to add product", error: error.message });
    }
};

// ── Agency: list products awaiting their approval (uploaded by their agent)
exports.getAgentUploadsPendingApproval = async (req, res) => {
    try {
        if (req.user.role !== "agency") {
            return res.status(403).json({ message: "Agency access only" });
        }
        const products = await Product.find({
            agency: req.user.id,
            status: "pending_agency_approval"
        })
            .populate("uploadedByAgent", "name email")
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("Get agent uploads error:", error);
        res.status(500).json({ message: "Failed to fetch pending products" });
    }
};

// ── Agency: approve an agent-uploaded product (moves to "pending" for admin)
exports.agencyApproveProduct = async (req, res) => {
    try {
        if (req.user.role !== "agency") {
            return res.status(403).json({ message: "Agency access only" });
        }
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.agency.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not your product" });
        }
        if (product.status !== "pending_agency_approval") {
            return res.status(400).json({ message: `Product is in status '${product.status}'` });
        }
        product.status = "pending";
        await product.save();
        res.json({ message: "Approved — forwarded to admin", product });
    } catch (error) {
        console.error("Agency approve error:", error);
        res.status(500).json({ message: "Failed to approve product" });
    }
};

// ── Agency: reject an agent-uploaded product
exports.agencyRejectProduct = async (req, res) => {
    try {
        if (req.user.role !== "agency") {
            return res.status(403).json({ message: "Agency access only" });
        }
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.agency.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not your product" });
        }
        if (product.status !== "pending_agency_approval") {
            return res.status(400).json({ message: `Product is in status '${product.status}'` });
        }
        product.status = "rejected_by_agency";
        product.rejectionReason = req.body.reason || "Rejected by agency";
        await product.save();
        res.json({ message: "Rejected", product });
    } catch (error) {
        console.error("Agency reject error:", error);
        res.status(500).json({ message: "Failed to reject product" });
    }
};

// POST /api/products/:id/duplicate — clone a listing (agency-owned only)
exports.duplicateProduct = async (req, res) => {
    try {
        if (req.user.role !== "agency") return res.status(403).json({ message: "Agency only" });
        const src = await Product.findById(req.params.id);
        if (!src) return res.status(404).json({ message: "Product not found" });
        if (String(src.agency) !== String(req.user.id)) return res.status(403).json({ message: "Not your product" });

        const clone = await Product.create({
            title:         `${src.title} (Copy)`,
            description:   src.description,
            category:      src.category,
            originalPrice: src.originalPrice,
            sellingPrice:  src.sellingPrice,
            quantity:      src.quantity || 1,
            condition:     src.condition,
            images:        src.images || [],
            agency:        src.agency,
            agencyName:    src.agencyName,
            status:        "pending",
        });
        res.status(201).json(clone);
    } catch (e) {
        console.error("Duplicate product error:", e);
        res.status(500).json({ message: "Failed to duplicate", error: e.message });
    }
};

// ── Agent: list products they have uploaded across their managed agencies
exports.agentUploadedProducts = async (req, res) => {
    try {
        if (req.user.role !== "agent") {
            return res.status(403).json({ message: "Agent access only" });
        }
        const products = await Product.find({ uploadedByAgent: req.user.id })
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("Agent uploads error:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

// Get all products for logged-in agency
exports.getAgencyProducts = async (req, res) => {
    try {
        const agencyId = req.user.id;
        const { status } = req.query; // Filter by status if provided

        const filter = { agency: agencyId };
        if (status) {
            filter.status = status;
        }

        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Include "verifiedAgency" flag so the UI can show a trust badge
        const Document = require("../models/Document.js");
        const doc = await Document.findOne({ agency: product.agency, status: "approved" });
        res.json({ ...product.toObject(), verifiedAgency: !!doc });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({ message: "Failed to fetch product", error: error.message });
    }
};

// Update product (agency owner OR managing agent)
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const isOwnerAgency  = req.user.role === "agency" && product.agency.toString() === req.user.id.toString();
        const isUploadingAgent = req.user.role === "agent" && product.uploadedByAgent && product.uploadedByAgent.toString() === req.user.id.toString();
        if (!isOwnerAgency && !isUploadingAgent) {
            return res.status(403).json({ message: "Not authorized to update this product" });
        }

        if (product.status === 'approved' || product.status === 'sold') {
            return res.status(400).json({ message: "Cannot update approved or sold products" });
        }

        // When agent edits, listing goes back to agency-approval queue. Agency edits go to admin queue.
        const nextStatus = isUploadingAgent ? "pending_agency_approval" : "pending";
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, status: nextStatus },
            { new: true }
        );

        res.json(updatedProduct);
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ message: "Failed to update product", error: error.message });
    }
};

// Delete product (agency owner OR managing agent)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const isOwnerAgency  = req.user.role === "agency" && product.agency.toString() === req.user.id.toString();
        const isUploadingAgent = req.user.role === "agent" && product.uploadedByAgent && product.uploadedByAgent.toString() === req.user.id.toString();
        if (!isOwnerAgency && !isUploadingAgent) {
            return res.status(403).json({ message: "Not authorized to delete this product" });
        }

        if (product.status === 'sold') return res.status(400).json({ message: "Cannot delete sold products" });

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
};

// Get agency analytics
exports.getAnalytics = async (req, res) => {
    try {
        const agencyId = req.user.id;

        // Get all products
        const totalProducts = await Product.countDocuments({ agency: agencyId });
        const approvedProducts = await Product.countDocuments({ agency: agencyId, status: 'approved' });
        const pendingProducts = await Product.countDocuments({ agency: agencyId, status: 'pending' });
        const soldProducts = await Product.countDocuments({ agency: agencyId, status: 'sold' });

        // Get sales data
        const sales = await Sale.find({ agency: agencyId });
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
        const totalSales = sales.length;
        const avgOrderValue = totalSales > 0 ? (totalRevenue / totalSales).toFixed(0) : 0;

        // Get views
        const products = await Product.find({ agency: agencyId });
        const totalViews = products.reduce((sum, product) => sum + product.views, 0);

        // Monthly sales data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySales = await Sale.aggregate([
            {
                $match: {
                    agency: agencyId,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    revenue: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Category breakdown
        const categoryBreakdown = await Product.aggregate([
            {
                $match: { agency: agencyId, status: 'approved' }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overview: {
                totalProducts,
                approvedProducts,
                pendingProducts,
                soldProducts,
                totalRevenue,
                totalSales,
                totalViews,
                avgOrderValue,
                conversionRate: totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : 0
            },
            monthlySales,
            categoryBreakdown
        });
    } catch (error) {
        console.error("Get analytics error:", error);
        res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
    }
};

// Get top products by views for agency
exports.getTopProducts = async (req, res) => {
    try {
        const agencyId = req.user.id;
        
        const topProducts = await Product.find({ agency: agencyId })
            .sort({ views: -1 })
            .limit(10)
            .select('title category images views sellingPrice status');
        
        res.json(topProducts);
    } catch (error) {
        console.error("Get top products error:", error);
        res.status(500).json({ message: "Failed to fetch top products", error: error.message });
    }
};

// Public agency store — returns agency profile + their approved products.
// No auth required so it can be shared as a public storefront URL.
exports.getAgencyStorefront = async (req, res) => {
    try {
        const { agencyId } = req.params;
        const agency = await User.findOne({ _id: agencyId, role: "agency" })
            .select("_id name email address createdAt avatarUrl");
        if (!agency) return res.status(404).json({ message: "Storefront not found" });

        // Agency is "verified" if their documents have been approved
        const Document = require("../models/Document.js");
        const doc = await Document.findOne({ agency: agencyId, status: "approved" });
        const verified = !!doc;

        const products = await Product.find({ agency: agencyId, status: "approved" })
            .sort({ createdAt: -1 })
            .limit(60);

        const stats = {
            total: products.length,
            categories: [...new Set(products.map(p => p.category))],
        };

        res.json({ agency: { ...agency.toObject(), verified }, products, stats });
    } catch (error) {
        console.error("Get agency storefront error:", error);
        res.status(500).json({ message: "Failed to load storefront", error: error.message });
    }
};

// Get all approved products (for customers to browse)
exports.getAllProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search } = req.query;
        
        const filter = { status: 'approved' };
        
        if (category) filter.category = category;
        if (minPrice || maxPrice) {
            filter.sellingPrice = {};
            if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
            if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("Get all products error:", error);
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
};