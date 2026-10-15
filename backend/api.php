<?php
/**
 * REST API Bridge for HR Manager & Salary Analytics System
 * Project: Std6730202564IPFinal2026
 * Database: ip_std6730202564 on localhost (Server 119.59.102.161)
 * Tables: AisKhun_employees, AisKhun_users
 */

// 1. Enable CORS for web & mobile app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Database Connection (Localhost inside the server)
$dbHost = 'localhost';
$dbPort = '3306';
$dbName = 'ip_std6730202564';
$dbUser = 'std6730202564';
$dbPass = getenv('DB_PASSWORD') ?: '';
$authToken = getenv('AUTH_TOKEN') ?: '';

if ($dbPass === '' || $authToken === '') {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database or authentication secret is not configured']);
    exit();
}

try {
    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 3. Read Request Data
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?: [];

// Helper to format employee row
function formatEmployee($row) {
    if (!$row) return null;
    return [
        'id'       => (string)$row['id'],
        'name'     => (string)$row['name'],
        'position' => (string)$row['position'],
        'status'   => (string)$row['status'],
        'salary'   => (float)$row['salary'],
    ];
}

// 4. Routes Handling
switch ($action) {

    // --- HEALTH CHECK / PING ---
    case 'ping':
    case '':
        try {
            $stmt = $pdo->query("SELECT COUNT(*) AS total FROM `AisKhun_employees`");
            $count = $stmt->fetchColumn();
            echo json_encode([
                'success' => true,
                'status'  => 'online',
                'message' => 'Connected to MySQL ip_std6730202564 successfully!',
                'server'  => '119.59.102.161 (localhost)',
                'table'   => 'AisKhun_employees',
                'total_employees' => (int)$count
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
        break;

    // --- GET ALL EMPLOYEES ---
    // GET api.php?action=employees
    case 'employees':
        try {
            $stmt = $pdo->query("SELECT id, name, position, status, salary FROM `AisKhun_employees` ORDER BY id ASC");
            $rows = $stmt->fetchAll();
            $result = array_map('formatEmployee', $rows);
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // --- GET SINGLE EMPLOYEE ---
    // GET api.php?action=get_employee&id=1
    case 'get_employee':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        try {
            $stmt = $pdo->prepare("SELECT id, name, position, status, salary FROM `AisKhun_employees` WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if ($row) {
                echo json_encode(formatEmployee($row), JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Employee not found']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // --- CREATE EMPLOYEE ---
    // POST api.php?action=create_employee
    // Body: { name, position, salary }
    case 'create_employee':
        $name = isset($body['name']) ? trim($body['name']) : '';
        $position = isset($body['position']) ? trim($body['position']) : '';
        $salary = isset($body['salary']) ? (float)$body['salary'] : null;

        if (empty($name) || empty($position) || $salary === null || $salary <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Validation error: name, position, and positive salary are required'
            ]);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO `AisKhun_employees` (name, position, status, salary) VALUES (?, ?, 'Active', ?)");
            $stmt->execute([$name, $position, $salary]);
            $newId = $pdo->lastInsertId();

            $stmt2 = $pdo->prepare("SELECT id, name, position, status, salary FROM `AisKhun_employees` WHERE id = ? LIMIT 1");
            $stmt2->execute([$newId]);
            $created = $stmt2->fetch();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Employee created successfully in AisKhun_employees',
                'data'    => formatEmployee($created)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // --- TOGGLE EMPLOYEE STATUS ---
    // POST/PUT api.php?action=toggle_status&id=1
    case 'toggle_status':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($body['id']) ? (int)$body['id'] : 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing employee id']);
            break;
        }

        try {
            $stmt = $pdo->prepare("SELECT id, status FROM `AisKhun_employees` WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Employee not found']);
                break;
            }

            $newStatus = ($row['status'] === 'Active') ? 'On Leave' : 'Active';
            $update = $pdo->prepare("UPDATE `AisKhun_employees` SET status = ? WHERE id = ?");
            $update->execute([$newStatus, $id]);

            $stmt2 = $pdo->prepare("SELECT id, name, position, status, salary FROM `AisKhun_employees` WHERE id = ? LIMIT 1");
            $stmt2->execute([$id]);
            $updated = $stmt2->fetch();

            echo json_encode([
                'success' => true,
                'message' => 'Status updated successfully',
                'data'    => formatEmployee($updated)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // --- DELETE EMPLOYEE ---
    // POST/DELETE api.php?action=delete_employee&id=1
    case 'delete_employee':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($body['id']) ? (int)$body['id'] : 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing employee id']);
            break;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `AisKhun_employees` WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => "Employee ID {$id} deleted from AisKhun_employees"
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Employee not found']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // --- AUTHENTICATION (LOGIN) ---
    // POST api.php?action=login
    // Body: { username, password }
    case 'login':
        $username = isset($body['username']) ? trim($body['username']) : '';
        $password = isset($body['password']) ? trim($body['password']) : '';

        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Username and password are required']);
            break;
        }

        try {
            $stmt = $pdo->prepare("SELECT id, username, password_hash FROM `AisKhun_users` WHERE username = ? LIMIT 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            $isValid = $user && password_verify($password, $user['password_hash']);

            if ($isValid) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'token'   => $authToken,
                    'user'    => ['id' => $user ? (string)$user['id'] : '1', 'username' => $username]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid action. Supported: employees, get_employee, create_employee, toggle_status, delete_employee, login, ping'
        ]);
        break;
}
