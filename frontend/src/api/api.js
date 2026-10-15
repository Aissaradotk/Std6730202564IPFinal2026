import { Platform } from "react-native";

// Automatic default host pointing to live server with MySQL database
const getDefaultBaseUrl = () => {
  return "http://119.59.102.161:3000";
};

let currentBaseUrl = getDefaultBaseUrl();

export const getBaseUrl = () => currentBaseUrl;
export const setBaseUrl = (url) => {
  if (url && typeof url === "string") {
    currentBaseUrl = url.replace(/\/+$/, ""); // remove trailing slashes
  }
};

/**
 * Universal fetch wrapper with timeout and JSON parsing
 */
const request = async (endpoint, options = {}, token = null) => {
  const url = `${currentBaseUrl}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        (data && (data.message || data.error)) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Network request timed out. Please check if the backend server is running on port 3000.");
    }
    throw err;
  }
};

/**
 * 1. Authentication
 * POST /api/login
 */
export const loginApi = async (username, password) => {
  return request("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
};

/**
 * 2. Employee CRUD
 * GET /api/employees
 */
export const getEmployeesApi = async (token) => {
  return request("/api/employees", { method: "GET" }, token);
};

/**
 * POST /api/employees
 */
export const createEmployeeApi = async (employeeData, token) => {
  return request(
    "/api/employees",
    {
      method: "POST",
      body: JSON.stringify(employeeData)
    },
    token
  );
};

/**
 * PUT /api/employees/:id/status
 */
export const toggleEmployeeStatusApi = async (id, token) => {
  return request(
    `/api/employees/${id}/status`,
    {
      method: "PUT"
    },
    token
  );
};

/**
 * DELETE /api/employees/:id
 */
export const deleteEmployeeApi = async (id, token) => {
  return request(
    `/api/employees/${id}`,
    {
      method: "DELETE"
    },
    token
  );
};

/**
 * 3. Salary Analytics (Phase 2.1)
 * GET /api/employees/salary-clusters
 */
export const getSalaryClustersApi = async (token, k = 3) => {
  try {
    return await request(`/api/employees/salary-clusters?k=${k}`, { method: "GET" }, token);
  } catch (err) {
    return await request(`/api/analytics/salary-clusters?k=${k}`, { method: "GET" }, token);
  }
};
