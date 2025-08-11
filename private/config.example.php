<?php
// TEMPLATE CONFIG FILE
// Copy this to config.local.php for development
// Copy this to config.production.php for production server
// DO NOT put real credentials in this file



// Function to set API headers (only call this from API endpoints)
function setApiHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');
    
    // Handle preflight OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Error reporting for development - but don't display errors to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0); // Turn off display_errors to prevent HTML output
ini_set('log_errors', 1); // Log errors instead

// Custom error handler for API responses
function apiErrorHandler($errno, $errstr, $errfile, $errline) {
    // Only handle API requests
    if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') === 0) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Internal server error',
            'message' => 'A PHP error occurred: ' . $errstr,
            'file' => basename($errfile),
            'line' => $errline
        ]);
        exit;
    }
    return false; // Let default handler deal with non-API errors
}

// Set the custom error handler
set_error_handler('apiErrorHandler');

// Handle fatal errors
function apiFatalErrorHandler() {
    $error = error_get_last();
    if ($error && strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') === 0) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
        }
        echo json_encode([
            'error' => 'Fatal error',
            'message' => $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
    }
}
register_shutdown_function('apiFatalErrorHandler');

// Database connection class
class Database {
    private $connection;
    
    public function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage() . " SQL: " . $sql);
            throw $e;
        }
    }
    
    public function execute($query, $params = []) {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            return [
                'rowCount' => $stmt->rowCount(),
                'insertId' => $this->connection->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Database execute error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollBack();
    }
}

// Utility functions
function emptyToNull($value) {
    if ($value === '' || $value === null) {
        return null;
    }
    return $value;
}

function sanitizeOutput($data) {
    if (is_array($data)) {
        return array_map('sanitizeOutput', $data);
    }
    
    if (is_object($data)) {
        $result = [];
        foreach ($data as $key => $value) {
            $result[$key] = sanitizeOutput($value);
        }
        return $result;
    }
    
    if (is_string($data) && is_numeric($data)) {
        return strpos($data, '.') !== false ? (float)$data : (int)$data;
    }
    
    return $data;
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(sanitizeOutput($data));
    exit();
}

function sendError($message, $statusCode = 500) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit();
}
?>