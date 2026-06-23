const TrackingRecord = require("../models/TrackingRecord");

const VALID_STATUSES = ["Order Placed", "Processing", "Out for Delivery", "Delivered"];

const getAllTracking = async (req, res) => {
  try {
    const records = await TrackingRecord.find()
      .populate("orderId")
      .populate("customerId", "name email");
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyTracking = async (req, res) => {
  try {
    const records = await TrackingRecord.find({ customerId: req.user.id }).populate("orderId");
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getByOrder = async (req, res) => {
  try {
    const record = await TrackingRecord.findOne({ orderId: req.params.orderId })
      .populate("orderId")
      .populate("customerId", "name email")
      .populate("trackingHistory.updatedBy", "name");

    if (!record) return res.status(404).json({ message: "Tracking record not found" });

    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FIX #10: validate status against allowed enum values
const updateStatus = async (req, res) => {
  const { status, location, note, confirmationImageBase64 } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  try {
    const record = await TrackingRecord.findOne({ orderId: req.params.orderId });
    if (!record) return res.status(404).json({ message: "Tracking record not found" });

    record.currentStatus = status;
    if (location) record.currentLocation = location;
    if (status === 'Delivered' && confirmationImageBase64) {
      record.confirmationImage = confirmationImageBase64;
    }
    record.trackingHistory.push({
      status,
      location: location || record.currentLocation,
      note,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });
    record.updatedAt = new Date();

    await record.save();
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateLocation = async (req, res) => {
  const { location } = req.body;
  if (!location) return res.status(400).json({ message: "Location is required" });

  try {
    const record = await TrackingRecord.findOne({ orderId: req.params.orderId });
    if (!record) return res.status(404).json({ message: "Tracking record not found" });

    record.currentLocation = location;
    record.trackingHistory.push({
      status: record.currentStatus,
      location,
      note: `Location updated to ${location}`,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });
    record.updatedAt = new Date();

    await record.save();
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTracking = async (req, res) => {
  try {
    const record = await TrackingRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Tracking record not found" });

    await record.deleteOne();
    return res.json({ message: "Tracking record removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAllTracking, getMyTracking, getByOrder, updateStatus, updateLocation, deleteTracking };
