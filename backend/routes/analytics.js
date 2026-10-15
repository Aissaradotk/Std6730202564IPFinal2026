const express = require("express");
const router = express.Router();
const { pool, getIsConnected } = require("../config/database");
const memoryStore = require("../data/employees");
const { runSalaryKMeans } = require("../utils/kmeans");

async function fetchEmployees() {
  if (pool && getIsConnected()) {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, position, status, salary FROM `AisKhun_employees` ORDER BY id ASC"
      );
      return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        position: String(r.position),
        status: r.status,
        salary: Number(r.salary)
      }));
    } catch (err) {
      console.error("[Database Error] Analytics fetchEmployees query failed:", err.message);
    }
  }
  return memoryStore.getAllEmployees();
}

/**
 * GET /api/analytics/salary-clusters
 * Query: ?k=3 (optional, defaults to 3)
 */
router.get("/salary-clusters", async (req, res) => {
  try {
    const employees = await fetchEmployees();
    const k = req.query.k ? parseInt(req.query.k, 10) : 3;
    const validK = isNaN(k) || k <= 0 ? 3 : k;

    const result = runSalaryKMeans(employees, validK);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Error] Analytics salary-clusters:", err.message);
    return res.status(500).json({ success: false, message: "Error calculating salary clusters" });
  }
});

/**
 * GET /api/analytics
 * Alias returning full analytics summary and salary clusters
 */
router.get("/", async (req, res) => {
  try {
    const employees = await fetchEmployees();
    const k = req.query.k ? parseInt(req.query.k, 10) : 3;
    const validK = isNaN(k) || k <= 0 ? 3 : k;

    const result = runSalaryKMeans(employees, validK);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Error] Analytics error:", err.message);
    return res.status(500).json({ success: false, message: "Error calculating salary analytics" });
  }
});

module.exports = router;
