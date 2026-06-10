const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const {
    listAgents,
    createRequest,
    myAgencyRequests,
    incomingRequests,
    approveRequest,
    rejectRequest,
    managedAgencies,
    unassignAgent,
    agentEarnings,
    agencyDrilldown,
    stepDown,
} = require("../controllers/agentController.js");

// Agency browses agents
router.get("/", authMiddleware(["agency"]), listAgents);

// Agency creates / lists requests
router.post("/requests", authMiddleware(["agency"]), createRequest);
router.get("/requests/mine", authMiddleware(["agency"]), myAgencyRequests);
router.delete("/assignment", authMiddleware(["agency"]), unassignAgent);

// Agent reads / acts on requests
router.get("/requests/incoming", authMiddleware(["agent"]), incomingRequests);
router.put("/requests/:id/approve", authMiddleware(["agent"]), approveRequest);
router.put("/requests/:id/reject", authMiddleware(["agent"]), rejectRequest);
router.get("/managed-agencies", authMiddleware(["agent"]), managedAgencies);
router.get("/managed-agencies/:agencyId", authMiddleware(["agent"]), agencyDrilldown);
router.delete("/managed-agencies/:agencyId", authMiddleware(["agent"]), stepDown);
router.get("/earnings", authMiddleware(["agent"]), agentEarnings);

module.exports = router;
