const mongoose = require("mongoose");

const trackingHistorySchema = new mongoose.Schema(
  {
    status: String,
    location: String,
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const trackingRecordSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currentStatus: {
    type: String,
    enum: ["Order Placed", "Processing", "Out for Delivery", "Delivered"],
    default: "Order Placed",
  },
  currentLocation: { type: String, default: "Warehouse" },
  confirmationImage: { type: String },
  estimatedDelivery: Date,
  trackingHistory: [trackingHistorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TrackingRecord", trackingRecordSchema);
