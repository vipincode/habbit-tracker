import { connectDB } from "./config/db";
import { User } from "./models/user.model";
import bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    await connectDB();

    // ---- Clean old data (optional) ----
    await User.deleteMany({});
    console.log("🧹 Cleared existing users.");

    // ---- Create sample data ----
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    const users = [
      {
        name: "Admin User",
        username: "admin",
        email: "admin@example.com",
        password: passwordHash,
        role: "admin",
      },
      {
        name: "John Doe",
        username: "john",
        email: "john@example.com",
        password: passwordHash,
        role: "user",
      },
    ];

    await User.insertMany(users);
    console.log("✅ Seeded users successfully.");

    console.log("🌳 Seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

seed();
