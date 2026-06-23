const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const {
  createTicket,
  getAllTickets,
  getMyTickets,
  adminRespond,
  updateStatus,
  deleteTicket,
} = require("../controllers/supportController");

router.post("/", protect, createTicket);
router.get("/", protect, admin, getAllTickets);
router.get("/my", protect, getMyTickets);                        // must be before /:id
router.put("/:id/respond", protect, admin, adminRespond);
router.put("/:id/status", protect, admin, updateStatus);
router.delete("/:id", protect, admin, deleteTicket);

module.exports = router;
