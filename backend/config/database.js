/* global __dirname, process */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_HOST = process.env.DB_HOST || "119.59.102.161";
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
const DB_NAME = process.env.DB_NAME || "ip_std6730202564";
const DB_USER = process.env.DB_USER || "std6730202564";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

let pool = null;
let isConnected = false;

try {
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 8000,
    decimalNumbers: true
  });
} catch (err) {
  console.error("[Database] Failed to create MySQL pool:", err.message);
}

/**
 * Test database connectivity safely without exposing passwords
 */
async function testConnection() {
  if (!pool) return false;
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`[Database] Connected successfully to MySQL at ${DB_HOST}:${DB_PORT} (DB: ${DB_NAME})`);
    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MySQL at ${DB_HOST}:${DB_PORT}`);
    console.warn(`[Database Diagnostic] Error code: ${err.code || "UNKNOWN"} - ${err.message}`);
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.warn(`[Database Diagnostic] Please check DB_USER and DB_PASSWORD in backend/.env`);
    } else if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
      console.warn(`[Database Diagnostic] Remote MySQL port 3306 might be blocked by hosting firewall. If running on host, set DB_HOST=localhost.`);
    }
    return false;
  }
}

/**
 * Initialize Tables (AisKhun_employees, AisKhun_users) and seed demo admin
 */
async function initializeDatabase() {
  if (!pool) return false;
  const connected = await testConnection();
  if (!connected) return false;

  try {
    // 1. Create AisKhun_employees
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`AisKhun_employees\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(150) NOT NULL,
        \`position\` VARCHAR(150) NOT NULL,
        \`status\` ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
        \`salary\` DECIMAL(12,2) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_AisKhun_employees_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create AisKhun_users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`AisKhun_users\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_AisKhun_users_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[Database] Verified tables 'AisKhun_employees' and 'AisKhun_users'.");

    // 3. Seed demo admin user if not exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM `AisKhun_users` WHERE username = ? LIMIT 1",
      ["admin"]
    );

    if (existingUsers.length === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminPassword) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPassword, salt);
        await pool.query(
          "INSERT INTO `AisKhun_users` (username, password_hash) VALUES (?, ?)",
          ["admin", hash]
        );
        console.log("[Database] Seeded admin user into 'AisKhun_users'.");
      } else {
        console.warn("[Database] ADMIN_PASSWORD is unset; skipping admin seeding.");
      }
    }

    // 4. Seed initial employees if empty
    const [existingEmployees] = await pool.query(
      "SELECT COUNT(*) AS count FROM `AisKhun_employees`"
    );

    if (existingEmployees[0].count === 0) {
      const initialEmployees = [
        ["John Doe", "Software Engineer", "Active", 45000],
        ["Jane Smith", "Senior UI/UX Designer", "Active", 65000],
        ["Somchai Jaidee", "Junior Developer", "Active", 28000],
        ["Bob Johnson", "DevOps Engineer", "On Leave", 82000],
        ["Alice Williams", "Data Scientist", "Active", 95000],
        ["Charlie Brown", "QA Automation Engineer", "Active", 42000],
        ["David Miller", "Engineering Director", "Active", 160000]
      ];

      for (const emp of initialEmployees) {
        await pool.query(
          "INSERT INTO `AisKhun_employees` (name, position, status, salary) VALUES (?, ?, ?, ?)",
          emp
        );
      }
      console.log("[Database] Seeded initial employees into 'AisKhun_employees'.");
    }

    return true;
  } catch (err) {
    console.error("[Database Error] Failed during table initialization:", err.message);
    return false;
  }
}

function getIsConnected() {
  return isConnected;
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  getIsConnected
};
