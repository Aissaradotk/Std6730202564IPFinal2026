const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { pool, getIsConnected } = require("../config/database");

const AUTH_TOKEN = process.env.AUTH_TOKEN || "";

/**
 * POST /api/login
 * Body: { username, password }
 * Authenticates user from AisKhun_users with bcrypt hash verification
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  // Validate presence of username and password
  if (
    !username ||
    !password ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required"
    });
  }

  const cleanUsername = username.trim();

  // 1. If database connection is active, query AisKhun_users
  if (pool && getIsConnected()) {
    try {
      const [rows] = await pool.query(
        "SELECT id, username, password_hash FROM `AisKhun_users` WHERE username = ? LIMIT 1",
        [cleanUsername]
      );

      if (rows.length > 0) {
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
          return res.status(200).json({
            success: true,
            token: AUTH_TOKEN
          });
        }
      }

      // User not found or password mismatch
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    } catch (err) {
      console.error("[Auth Error] Database authentication failure:", err.message);
      // Fallback check below if DB error occurs
    }
  }

  // 2. Optional demo login, disabled unless explicitly configured
  const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD;
  if (
    process.env.ALLOW_DEMO_LOGIN === "true" &&
    demoAdminPassword &&
    cleanUsername === "admin" &&
    password === demoAdminPassword
  ) {
    return res.status(200).json({
      success: true,
      token: AUTH_TOKEN
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password"
  });
});

module.exports = router;
