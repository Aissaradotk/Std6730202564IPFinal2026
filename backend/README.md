# HR Manager & Salary Analytics Backend API

**Project Name:** Std6730202564IPFinal2026  
**Exam Topic:** HR Manager & Salary Analytics System  
**Stack:** Node.js + Express.js + MySQL (with In-Memory Fallback)  
**Database:** MySQL (`ip_std6730202564`) with `mysql2/promise`  
**Table Prefix:** `AisKhun_` (`AisKhun_employees`, `AisKhun_users`)  
**Default Port:** 3000

---

## 🗄️ MySQL Database Setup & Configuration

### 1. Database Specifications
- **Database Name:** `ip_std6730202564`
- **Database User:** `std6730202564`
- **Host:** `119.59.102.161` (or `localhost` if running on the host machine)
- **Port:** `3306`
- **Tables:**
  - `AisKhun_employees` (id, name, position, status, salary, created_at, updated_at)
  - `AisKhun_users` (id, username, password_hash, created_at)

### 2. Environment Variables (.env)
Create `backend/.env` (copy from `backend/.env.example`):
```env
DB_HOST=119.59.102.161
DB_PORT=3306
DB_NAME=ip_std6730202564
DB_USER=std6730202564
DB_PASSWORD=YOUR_DATABASE_PASSWORD
AUTH_TOKEN=REPLACE_WITH_A_LONG_RANDOM_SECRET
ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_PASSWORD
PORT=3000
```

### 3. Database Migration & Seeding Scripts
```bash
# Seed admin user into AisKhun_users
npm run seed:admin

# Seed sample employees into AisKhun_employees
npm run seed:employees

# Or seed both at once
npm run seed
```

SQL definition file is located at `backend/sql/schema.sql`.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Backend Server
```bash
# Start server (default port 3000)
npm start

# Or development mode with auto-reload
npm run dev
```

### 3. Run Automated Tests
```bash
npm test # or node test-api.js
```
*(33 Automated tests passing: covering Auth, Protection, CRUD, K-Means, and MySQL Table Contracts)*

---

## 📡 REST API Documentation

### 1. Authentication

#### `POST /api/login`
- **Description:** Authenticates the user against `AisKhun_users` using bcrypt password hash verification.
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "YOUR_ADMIN_PASSWORD"
  }
  ```
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "token": "YOUR_AUTH_TOKEN"
  }
  ```
- **Response 400 (Bad Request):** Missing username or password.
- **Response 401 (Unauthorized):** Incorrect username or password.

---

### 2. Employee Management (Protected by Bearer Token)

Headers: `Authorization: Bearer YOUR_AUTH_TOKEN`

#### `GET /api/employees`
- **Description:** Retrieves all employees from `AisKhun_employees`.
- **Response 200 (OK):**
  ```json
  [
    {
      "id": "1",
      "name": "John Doe",
      "position": "Software Engineer",
      "status": "Active",
      "salary": 45000
    }
  ]
  ```

#### `POST /api/employees`
- **Description:** Inserts a new employee into `AisKhun_employees` with default status `"Active"`.
- **Request Body:**
  ```json
  {
    "name": "Sarah Connor",
    "position": "Security Engineer",
    "salary": 75000
  }
  ```
- **Response 201 (Created):** Returns the created employee with string `id`.

#### `PUT /api/employees/:id/status`
- **Description:** Toggles the employee status (`Active` ↔ `On Leave`).
- **Response 200 (OK):** Returns updated employee record.
- **Response 404 (Not Found):** If ID does not exist.

#### `DELETE /api/employees/:id`
- **Description:** Removes employee from `AisKhun_employees`.
- **Response 200 (OK):** `{"success": true, "message": "Employee deleted successfully", "id": "1"}`
- **Response 404 (Not Found):** If ID does not exist.

---

### 3. Salary Analytics (Phase 2)

#### `GET /api/employees/salary-clusters`
- **Description:** Extracts salaries from `AisKhun_employees` and calculates 1D K-Means clustering ($k=3$).
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "clusters": [
      { "group": "Tier 1", "centroid": 38333, "count": 3 },
      { "group": "Tier 2", "centroid": 80667, "count": 3 },
      { "group": "Tier 3", "centroid": 160000, "count": 1 }
    ]
  }
  ```
