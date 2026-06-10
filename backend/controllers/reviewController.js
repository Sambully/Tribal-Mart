const Review = require("../models/Review.js");

// GET /api/reviews/:productId — list reviews for a product (public)
exports.listForProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
        const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
        res.json({ reviews, count: reviews.length, average: Number(avg.toFixed(2)) });
    } catch (e) {
        console.error("List reviews error:", e);
        res.status(500).json({ message: "Failed to load reviews" });
    }
};

// POST /api/reviews — customer creates a review
exports.create = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ message: "Only customers can write reviews" });
        }
        const { productId, rating, comment } = req.body;
        if (!productId || !rating) return res.status(400).json({ message: "productId and rating required" });
        if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

        // Upsert: a customer can only review a product once; allow editing.
        const review = await Review.findOneAndUpdate(
            { product: productId, customer: req.user.id },
            {
                product: productId,
                customer: req.user.id,
                customerName: req.user.name,
                rating,
                comment: (comment || '').trim().slice(0, 1000)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json(review);
    } catch (e) {
        console.error("Create review error:", e);
        res.status(500).json({ message: "Failed to save review" });
    }
};

// DELETE /api/reviews/:id — author can delete
exports.remove = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        if (review.customer.toString() !== req.user.id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: "Review deleted" });
    } catch (e) {
        console.error("Delete review error:", e);
        res.status(500).json({ message: "Failed to delete review" });
    }
};
