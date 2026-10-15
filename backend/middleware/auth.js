// Authentication middleware to protect employee and analytics routes

const EXPECTED_TOKEN = process.env.AUTH_TOKEN || "";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing"
    });
  }

  // Support "Bearer <token>" or raw token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (token !== EXPECTED_TOKEN) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token"
    });
  }

  // Token is valid
  req.user = { username: "admin", role: "HR_MANAGER" };
  next();
};

module.exports = authenticateToken;
