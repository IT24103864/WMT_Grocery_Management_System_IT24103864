const SupportTicket = require("../models/SupportTicket");

const createTicket = async (req, res) => {
  const { title, description, category, issueImageBase64 } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ message: "Title, description, and category are required" });
  }
  try {
    const ticket = await SupportTicket.create({
      customerId: req.user.id,
      title,
      description,
      category,
      issueImage: issueImageBase64,
    });
    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FIX #11 + #12: validate non-empty response and auto-update status to "In Progress"
const adminRespond = async (req, res) => {
  const { adminResponse } = req.body;

  if (!adminResponse || !adminResponse.trim()) {
    return res.status(400).json({ message: "Response message is required" });
  }

  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: adminResponse.trim(),
        status: "In Progress",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Open", "In Progress", "Resolved"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await ticket.deleteOne();
    return res.json({ message: "Ticket removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createTicket, getAllTickets, getMyTickets, adminRespond, updateStatus, deleteTicket };
