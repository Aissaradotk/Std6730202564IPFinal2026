const express = require("express");
const router = express.Router();
const { pool, getIsConnected } = require("../config/database");
const { checkBridgeAvailability, requestPhpApi } = require("../config/phpBridge");
const memoryStore = require("../data/employees");
const { runSalaryKMeans } = require("../utils/kmeans");

/**
 * Format employee database row to match frontend contract (string id, numeric salary)
 */
function formatEmployeeRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    position: String(row.position),
    status: row.status,
    salary: Number(row.salary)
  };
}

/**
 * Helper to get all current employees from MySQL, PHP Bridge, or fallback memory store
 */
async function fetchAllEmployees() {
  if (pool && getIsConnected()) {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, position, status, salary FROM `AisKhun_employees` ORDER BY id ASC"
      );
      return rows.map(formatEmployeeRow);
    } catch (err) {
      console.error("[Database Error] fetchAllEmployees query failed:", err.message);
    }
  }

  // Check live PHP Bridge on university server
  try {
    const isBridgeLive = await checkBridgeAvailability();
    if (isBridgeLive) {
      const bridgeData = await requestPhpApi("employees", "GET");
      if (Array.isArray(bridgeData) && bridgeData.length > 0) {
        return bridgeData.map(formatEmployeeRow);
      }
    }
  } catch (bridgeErr) {
    // continue to memory store fallback
  }

  return memoryStore.getAllEmployees();
}

/**
 * GET /api/employees/salary-clusters
 * Phase 2 requirement: 1D K-Means salary clustering
 */
router.get("/salary-clusters", async (req, res) => {
  try {
    const employees = await fetchAllEmployees();
    const k = req.query.k ? parseInt(req.query.k, 10) : 3;
    const validK = isNaN(k) || k <= 0 ? 3 : k;
    const result = runSalaryKMeans(employees, validK);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Error] salary-clusters error:", err.message);
    return res.status(500).json({ success: false, message: "Server error calculating salary clusters" });
  }
});

/**
 * GET /api/employees
 * Returns all current employees
 */
router.get("/", async (req, res) => {
  try {
    const employees = await fetchAllEmployees();
    return res.status(200).json(employees);
  } catch (err) {
    console.error("[API Error] GET /employees error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve employees" });
  }
});

/**
 * GET /api/employees/:id
 * Get single employee by ID
 */
router.get("/:id", async (req, res) => {
  const numericId = parseInt(req.params.id, 10);

  if (pool && getIsConnected() && !isNaN(numericId)) {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, position, status, salary FROM `AisKhun_employees` WHERE id = ? LIMIT 1",
        [numericId]
      );
      if (rows.length > 0) {
        return res.status(200).json(formatEmployeeRow(rows[0]));
      }
      return res.status(404).json({
        success: false,
        message: `Employee with ID '${req.params.id}' not found`
      });
    } catch (err) {
      console.error("[Database Error] GET /employees/:id error:", err.message);
    }
  }

  // Fallback to memory store
  const employee = memoryStore.getEmployeeById(req.params.id);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: `Employee with ID '${req.params.id}' not found`
    });
  }
  return res.status(200).json(employee);
});

/**
 * POST /api/employees
 * Body: { name, position, salary }
 * Validates inputs, creates new employee in AisKhun_employees, returns HTTP 201
 */
router.post("/", async (req, res) => {
  const { name, position, salary } = req.body || {};

  // Validate Name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Employee name is required and cannot be empty"
    });
  }

  // Validate Position
  if (!position || typeof position !== "string" || position.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Employee position is required and cannot be empty"
    });
  }

  // Validate Salary: numeric, finite, greater than zero
  const numericSalary = Number(salary);
  if (
    salary === undefined ||
    salary === null ||
    typeof salary === "boolean" ||
    isNaN(numericSalary) ||
    !isFinite(numericSalary) ||
    numericSalary <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Salary must be a valid positive numeric value greater than zero"
    });
  }

  const cleanName = name.trim();
  const cleanPosition = position.trim();

  // Insert into MySQL table AisKhun_employees
  if (pool && getIsConnected()) {
    try {
      const [result] = await pool.query(
        "INSERT INTO `AisKhun_employees` (name, position, status, salary) VALUES (?, ?, 'Active', ?)",
        [cleanName, cleanPosition, numericSalary]
      );

      const [newRow] = await pool.query(
        "SELECT id, name, position, status, salary FROM `AisKhun_employees` WHERE id = ? LIMIT 1",
        [result.insertId]
      );

      return res.status(201).json(formatEmployeeRow(newRow[0]));
    } catch (err) {
      console.error("[Database Error] POST /employees error:", err.message);
    }
  }

  // Insert via PHP Bridge if live
  try {
    const isBridgeLive = await checkBridgeAvailability();
    if (isBridgeLive) {
      const bridgeRes = await requestPhpApi("create_employee", "POST", {
        name: cleanName,
        position: cleanPosition,
        salary: numericSalary
      });
      if (bridgeRes && bridgeRes.success && bridgeRes.data) {
        return res.status(201).json(formatEmployeeRow(bridgeRes.data));
      }
    }
  } catch (err) {}

  // Fallback to memory store
  const newEmployee = memoryStore.addEmployee({
    name: cleanName,
    position: cleanPosition,
    salary: numericSalary
  });

  return res.status(201).json(newEmployee);
});

/**
 * PUT /api/employees/:id/status
 * Toggles employee status between 'Active' and 'On Leave'
 */
router.put("/:id/status", async (req, res) => {
  const numericId = parseInt(req.params.id, 10);

  if (pool && getIsConnected() && !isNaN(numericId)) {
    try {
      const [rows] = await pool.query(
        "SELECT id, status FROM `AisKhun_employees` WHERE id = ? LIMIT 1",
        [numericId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Employee with ID '${req.params.id}' not found`
        });
      }

      const newStatus = rows[0].status === "Active" ? "On Leave" : "Active";
      await pool.query(
        "UPDATE `AisKhun_employees` SET status = ? WHERE id = ?",
        [newStatus, numericId]
      );

      const [updated] = await pool.query(
        "SELECT id, name, position, status, salary FROM `AisKhun_employees` WHERE id = ? LIMIT 1",
        [numericId]
      );

      return res.status(200).json(formatEmployeeRow(updated[0]));
    } catch (err) {
      console.error("[Database Error] PUT /employees/:id/status error:", err.message);
    }
  }

  // Toggle via PHP Bridge if live
  try {
    const isBridgeLive = await checkBridgeAvailability();
    if (isBridgeLive) {
      const bridgeRes = await requestPhpApi(`toggle_status&id=${req.params.id}`, "POST", { id: req.params.id });
      if (bridgeRes && bridgeRes.success && bridgeRes.data) {
        return res.status(200).json(formatEmployeeRow(bridgeRes.data));
      }
    }
  } catch (err) {}

  // Fallback to memory store
  const updatedEmployee = memoryStore.toggleEmployeeStatus(req.params.id);
  if (!updatedEmployee) {
    return res.status(404).json({
      success: false,
      message: `Employee with ID '${req.params.id}' not found`
    });
  }

  return res.status(200).json(updatedEmployee);
});

/**
 * DELETE /api/employees/:id
 * Removes employee from AisKhun_employees
 */
router.delete("/:id", async (req, res) => {
  const numericId = parseInt(req.params.id, 10);

  if (pool && getIsConnected() && !isNaN(numericId)) {
    try {
      const [result] = await pool.query(
        "DELETE FROM `AisKhun_employees` WHERE id = ?",
        [numericId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: `Employee with ID '${req.params.id}' not found`
        });
      }

      return res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
        id: String(numericId)
      });
    } catch (err) {
      console.error("[Database Error] DELETE /employees/:id error:", err.message);
    }
  }

  // Delete via PHP Bridge if live
  try {
    const isBridgeLive = await checkBridgeAvailability();
    if (isBridgeLive) {
      const bridgeRes = await requestPhpApi(`delete_employee&id=${req.params.id}`, "POST", { id: req.params.id });
      if (bridgeRes && bridgeRes.success) {
        return res.status(200).json({
          success: true,
          message: "Employee deleted successfully",
          id: req.params.id
        });
      }
    }
  } catch (err) {}

  // Fallback to memory store
  const success = memoryStore.deleteEmployee(req.params.id);
  if (!success) {
    return res.status(404).json({
      success: false,
      message: `Employee with ID '${req.params.id}' not found`
    });
  }

  return res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
    id: req.params.id
  });
});

module.exports = router;
