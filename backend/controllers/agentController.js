const User = require("../models/User.js");
const AgentRequest = require("../models/AgentRequest.js");
const Product = require("../models/Product.js");
const Sale = require("../models/Sale.js");
const Order = require("../models/Order.js");

// ── Agency-facing: browse the directory of agents ────────────
exports.listAgents = async (req, res) => {
    try {
        const agents = await User.find({ role: "agent", status: "active" })
            .select("_id name email address createdAt");
        res.json(agents);
    } catch (error) {
        console.error("List agents error:", error);
        res.status(500).json({ message: "Failed to load agents" });
    }
};

// ── Agency-facing: send a help request to a specific agent ───
exports.createRequest = async (req, res) => {
    try {
        if (req.user.role !== "agency") {
            return res.status(403).json({ message: "Only agencies can request agent help" });
        }

        const { agentId, agencyAddress } = req.body;
        if (!agentId || !agencyAddress) {
            return res.status(400).json({ message: "agentId and agencyAddress are required" });
        }

        const agent = await User.findOne({ _id: agentId, role: "agent" });
        if (!agent) return res.status(404).json({ message: "Agent not found" });

        const agency = await User.findById(req.user.id);
        if (agency.agent) {
            return res.status(400).json({ message: "You already have an assigned agent" });
        }

        // Prevent duplicate pending requests to same agent
        const existing = await AgentRequest.findOne({
            agency: req.user.id,
            agent: agentId,
            status: "pending"
        });
        if (existing) {
            return res.status(400).json({ message: "You already have a pending request to this agent" });
        }

        const request = await AgentRequest.create({
            agency: req.user.id,
            agent: agentId,
            agencyName: agency.name,
            agencyAddress
        });

        res.status(201).json(request);
    } catch (error) {
        console.error("Create agent request error:", error);
        res.status(500).json({ message: "Failed to create request" });
    }
};

// ── Agency-facing: list their own outgoing requests ──────────
exports.myAgencyRequests = async (req, res) => {
    try {
        const requests = await AgentRequest.find({ agency: req.user.id })
            .populate("agent", "name email address")
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error("My agency requests error:", error);
        res.status(500).json({ message: "Failed to load requests" });
    }
};

// ── Agent-facing: incoming requests ──────────────────────────
exports.incomingRequests = async (req, res) => {
    try {
        if (req.user.role !== "agent") {
            return res.status(403).json({ message: "Agent access only" });
        }
        const requests = await AgentRequest.find({ agent: req.user.id })
            .populate("agency", "name email address")
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error("Incoming requests error:", error);
        res.status(500).json({ message: "Failed to load requests" });
    }
};

// ── Agent-facing: approve a request ──────────────────────────
exports.approveRequest = async (req, res) => {
    try {
        if (req.user.role !== "agent") {
            return res.status(403).json({ message: "Agent access only" });
        }
        const request = await AgentRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.agent.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not authorized for this request" });
        }
        if (request.status !== "pending") {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        const agency = await User.findById(request.agency);
        if (!agency) return res.status(404).json({ message: "Agency no longer exists" });
        if (agency.agent) {
            request.status = "rejected";
            request.rejectionReason = "Agency was already assigned to another agent";
            await request.save();
            return res.status(400).json({ message: "Agency already has an agent" });
        }

        agency.agent = req.user.id;
        await agency.save();

        request.status = "approved";
        await request.save();

        res.json({ message: "Request approved", request });
    } catch (error) {
        console.error("Approve request error:", error);
        res.status(500).json({ message: "Failed to approve request" });
    }
};

// ── Agent-facing: reject a request ───────────────────────────
exports.rejectRequest = async (req, res) => {
    try {
        if (req.user.role !== "agent") {
            return res.status(403).json({ message: "Agent access only" });
        }
        const { reason } = req.body;
        const request = await AgentRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.agent.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not authorized for this request" });
        }
        if (request.status !== "pending") {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        request.status = "rejected";
        request.rejectionReason = reason || "No reason provided";
        await request.save();
        res.json({ message: "Request rejected", request });
    } catch (error) {
        console.error("Reject request error:", error);
        res.status(500).json({ message: "Failed to reject request" });
    }
};

// ── Agent-facing: list the agencies they manage ──────────────
exports.managedAgencies = async (req, res) => {
    try {
        if (req.user.role !== "agent") {
            return res.status(403).json({ message: "Agent access only" });
        }
        const agencies = await User.find({ role: "agency", agent: req.user.id })
            .select("_id name email address createdAt");
        res.json(agencies);
    } catch (error) {
        console.error("Managed agencies error:", error);
        res.status(500).json({ message: "Failed to load managed agencies" });
    }
};

// ── Agent earnings (commission summary) ─────────────────────
// Default agent commission rate = 5% of approved sales of products they uploaded
const AGENT_COMMISSION_RATE = 0.05;
exports.agentEarnings = async (req, res) => {
    try {
        if (req.user.role !== "agent") return res.status(403).json({ message: "Agent only" });

        // All products this agent uploaded (across managed agencies)
        const products = await Product.find({ uploadedByAgent: req.user.id });
        const sold = products.filter(p => p.status === "sold");
        const live = products.filter(p => p.status === "approved");

        // Derive gross revenue from soldDate-priced products (best-effort given current schema)
        const grossRevenue = sold.reduce((s, p) => s + (p.sellingPrice || 0), 0);
        const commission = Math.round(grossRevenue * AGENT_COMMISSION_RATE);

        // Per-agency breakdown
        const agencies = await User.find({ role: "agency", agent: req.user.id }).select("_id name");
        const perAgency = agencies.map(a => {
            const mine = products.filter(p => String(p.agency) === String(a._id));
            const mineSold = mine.filter(p => p.status === "sold");
            const revenue = mineSold.reduce((s, p) => s + (p.sellingPrice || 0), 0);
            return {
                agencyId: a._id,
                agencyName: a.name,
                productsListed: mine.length,
                sold: mineSold.length,
                live: mine.filter(p => p.status === "approved").length,
                revenue,
                commission: Math.round(revenue * AGENT_COMMISSION_RATE),
            };
        });

        res.json({
            rate: AGENT_COMMISSION_RATE,
            grossRevenue,
            commission,
            totalProducts: products.length,
            sold: sold.length,
            live: live.length,
            perAgency,
        });
    } catch (e) {
        console.error("Agent earnings error:", e);
        res.status(500).json({ message: "Failed to compute earnings" });
    }
};

// ── Per-agency drill-down (agent viewing one managed agency) ─
exports.agencyDrilldown = async (req, res) => {
    try {
        if (req.user.role !== "agent") return res.status(403).json({ message: "Agent only" });
        const agency = await User.findOne({ _id: req.params.agencyId, role: "agency", agent: req.user.id })
            .select("_id name email address createdAt");
        if (!agency) return res.status(404).json({ message: "Agency not managed by you" });

        const products = await Product.find({ agency: agency._id }).sort({ createdAt: -1 });
        const myProducts = products.filter(p => String(p.uploadedByAgent) === String(req.user.id));
        const orders = await Order.find({ agency: agency._id }).sort({ createdAt: -1 }).limit(20).catch(() => []);

        const stats = {
            total: products.length,
            approved: products.filter(p => p.status === "approved").length,
            pending:  products.filter(p => ["pending", "pending_agency_approval"].includes(p.status)).length,
            sold:     products.filter(p => p.status === "sold").length,
            myUploads: myProducts.length,
        };

        res.json({ agency, products: products.slice(0, 12), myProducts: myProducts.slice(0, 12), orders, stats });
    } catch (e) {
        console.error("Agency drilldown error:", e);
        res.status(500).json({ message: "Failed to load agency details" });
    }
};

// ── Agent steps down from managing an agency ────────────────
exports.stepDown = async (req, res) => {
    try {
        if (req.user.role !== "agent") return res.status(403).json({ message: "Agent only" });
        const agency = await User.findById(req.params.agencyId);
        if (!agency || agency.role !== "agency") return res.status(404).json({ message: "Agency not found" });
        if (String(agency.agent) !== String(req.user.id)) {
            return res.status(403).json({ message: "You are not managing this agency" });
        }
        agency.agent = null;
        await agency.save();
        res.json({ message: "Stepped down" });
    } catch (e) {
        res.status(500).json({ message: "Failed to step down" });
    }
};

// ── Agency-facing: remove the assigned agent ─────────────────
exports.unassignAgent = async (req, res) => {
    try {
        if (req.user.role !== "agency") {
            return res.status(403).json({ message: "Agency access only" });
        }
        const agency = await User.findById(req.user.id);
        if (!agency.agent) return res.status(400).json({ message: "No agent assigned" });
        agency.agent = null;
        await agency.save();
        res.json({ message: "Agent unassigned" });
    } catch (error) {
        console.error("Unassign agent error:", error);
        res.status(500).json({ message: "Failed to unassign agent" });
    }
};
