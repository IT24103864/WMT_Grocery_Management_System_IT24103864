const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const {
  getAllTracking,
  getMyTracking,
  getByOrder,
  updateStatus,
  updateLocation,
  deleteTracking,
} = require("../controllers/trackingController");

router.get("/", protect, admin, getAllTracking);
router.get("/my", protect, getMyTracking);                              // must be before /:orderId
router.get("/:orderId", protect, getByOrder);
router.put("/:orderId/status", protect, admin, updateStatus);
router.put("/:orderId/location", protect, admin, updateLocation);
router.delete("/:id", protect, admin, deleteTracking);

module.exports = router;
