const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS.replace(/\s/g, ""), // strip spaces from Google App Password
    },
  });

// Generates a 6-character uppercase alphanumeric OTP
const makeOTP = () =>
  crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();

const hashOTP = (otp) =>
  crypto.createHash("sha256").update(otp.toUpperCase()).digest("hex");

// ─── Register ────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    // role is always customer — admin account is fixed and not created via registration
    const user = await User.create({ name, email, password, role: "customer" });
    return res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Login ───────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get profile ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  const { _id, name, email, role, createdAt } = req.user;
  return res.json({ id: _id, name, email, role, createdAt });
};

// ─── Forgot password ─────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Always return success so we don't reveal whether an email is registered
  const SUCCESS_MSG = "If that email is registered, a reset code has been sent.";

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: SUCCESS_MSG });

    const otp = makeOTP();
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken:  hashOTP(otp),
      resetPasswordExpire: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"GroceryApp" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Reset Code — GroceryApp",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;
                    border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">

          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;
                        background:#2E7D32;border-radius:50%;width:60px;height:60px;">
              <span style="font-size:30px;">🛒</span>
            </div>
            <h2 style="color:#0f172a;margin:12px 0 2px;font-size:20px;">GroceryApp</h2>
            <p style="color:#64748b;margin:0;font-size:13px;">Password Reset</p>
          </div>

          <p style="color:#0f172a;font-size:15px;margin-bottom:6px;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:20px;">
            We received a request to reset your GroceryApp password.
            Enter the code below in the app. It expires in <strong>15 minutes</strong>.
          </p>

          <div style="background:#f0fdf4;border:2px dashed #2E7D32;border-radius:12px;
                      padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#64748b;font-size:11px;margin:0 0 10px;
                      text-transform:uppercase;letter-spacing:2px;">Reset Code</p>
            <p style="font-size:36px;font-weight:bold;letter-spacing:10px;
                      color:#2E7D32;margin:0;font-family:monospace;">${otp}</p>
          </div>

          <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin-bottom:0;">
            If you did not request this, ignore this email — your password will not change.
          </p>

          <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
          <p style="color:#cbd5e1;font-size:11px;text-align:center;margin:0;">
            © 2024 GroceryApp &nbsp;·&nbsp; WD-DS-22 &nbsp;·&nbsp; SLIIT
          </p>
        </div>
      `,
    });

    return res.json({ message: SUCCESS_MSG });
  } catch (error) {
    // Clear any partial token state
    await User.findOneAndUpdate(
      { email },
      { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } }
    );
    return res.status(500).json({ message: "Email could not be sent. Please try again later." });
  }
};

// ─── Reset password ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { otp, password } = req.body;
  if (!otp || !password) {
    return res.status(400).json({ message: "Reset code and new password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken:  hashOTP(otp),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset code is invalid or has expired" });
    }

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { register, login, getProfile, forgotPassword, resetPassword };
