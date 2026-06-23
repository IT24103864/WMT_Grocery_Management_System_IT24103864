require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: "admin@gmail.com" });
  if (existing) {
    console.log("Admin already exists — nothing to do.");
    process.exit(0);
  }

  await User.create({
    name:     "Admin",
    email:    "admin@gmail.com",
    password: "admin123",
    role:     "admin",
  });

  console.log("Admin account created successfully.");
  console.log("  Email:    admin@gmail.com");
  console.log("  Password: admin123");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seeder failed:", err.message);
  process.exit(1);
});
