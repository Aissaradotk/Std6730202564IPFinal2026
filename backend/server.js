require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

// Routes
const authRouter = require("./routes/auth");
const employeesRouter = require("./routes/employees");
const analyticsRouter = require("./routes/analytics");

const authenticateToken = require("./middleware/auth");
const { initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

// Request logger for debugging & verification
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Root & Health check
app.get("/", (req, res) => {
  res.json({
    project: "Std6730202564IPFinal2026",
    service: "HR Manager & Salary Analytics System API",
    status: "running",
    port: PORT,
    endpoints: {
      auth: "POST /api/login",
      employees: "GET, POST /api/employees | PUT /api/employees/:id/status | DELETE /api/employees/:id",
      analytics: "GET /api/analytics/salary-clusters"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Public authentication routes
app.use("/api", authRouter);

// Protected routes require the configured authorization token
app.use("/api/employees", authenticateToken, employeesRouter);
app.use("/api/analytics", authenticateToken, analyticsRouter);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start Server
if (require.main === module) {
  if (!process.env.AUTH_TOKEN) {
    throw new Error("AUTH_TOKEN must be configured in backend/.env.");
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`=======================================================`);
    console.log(`HR Manager & Salary Analytics API is running!`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT}`);
    console.log(`Default Port: 3000`);
    console.log(`=======================================================`);

    // Perform database connection and table initialization check
    try {
      await initializeDatabase();
    } catch (dbErr) {
      console.warn("[Database] Initialization note:", dbErr.message);
    }
  });
}

module.exports = app;
