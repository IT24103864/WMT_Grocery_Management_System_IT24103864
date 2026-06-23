const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: [true, "Title is required"] },
  description: { type: String, required: [true, "Description is required"] },
  issueImage: { type: String },
  category: {
    type: String,
    enum: ["Order Issue", "Payment Issue", "Delivery Issue", "Other"],
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved"],
    default: "Open",
  },
  adminResponse: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
