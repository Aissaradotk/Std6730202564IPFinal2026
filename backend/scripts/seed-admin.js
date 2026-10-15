const bcrypt = require("bcryptjs");
const { pool, testConnection } = require("../config/database");

async function seedAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("Cannot seed admin: set ADMIN_PASSWORD in backend/.env.");
    process.exit(1);
  }

  const connected = await testConnection();
  if (!connected) {
    console.error("Cannot seed admin: MySQL connection failed.");
    process.exit(1);
  }

  try {
    const [rows] = await pool.query(
      "SELECT id FROM `AisKhun_users` WHERE username = ? LIMIT 1",
      ["admin"]
    );

    if (rows.length > 0) {
      console.log("Admin user already exists in 'AisKhun_users'.");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);

    await pool.query(
      "INSERT INTO `AisKhun_users` (username, password_hash) VALUES (?, ?)",
      ["admin", hash]
    );

    console.log("Successfully seeded admin user (username: 'admin') into 'AisKhun_users'.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err.message);
    process.exit(1);
  }
}

seedAdmin();
