<?php
require_once 'config.php';
require_once 'endpoints/samples.php';
require_once 'endpoints/grid_types.php';
require_once 'endpoints/sessions.php';
require_once 'endpoints/users.php';
require_once 'endpoints/grid_preparations.php';
require_once 'endpoints/dashboard.php';

// Set API headers for all API requests
setApiHeaders();

// Initialize database
$db = new Database();

// Simple router
function route($method, $path, $db, $input = null) {
    // Remove trailing slash and clean up path
    $path = rtrim($path, '/');
    
    // Health check endpoint
    if ($method === 'GET' && $path === '/api/health') {
        try {
            $db->query("SELECT 1");
            sendResponse([
                'status' => 'healthy',
                'timestamp' => date('c')
            ]);
        } catch (Exception $e) {
            sendError('Database connection failed', 500);
        }
    }
    
    // Sample endpoints
    if (strpos($path, '/api/samples') === 0) {
        handleSamples($method, $path, $db, $input);
        return;
    }
    
    // Grid type endpoints
    if (strpos($path, '/api/grid-types') === 0) {
        handleGridTypes($method, $path, $db, $input);
        return;
    }
    
    // Session endpoints
    if (strpos($path, '/api/sessions') === 0) {
        handleSessions($method, $path, $db, $input);
        return;
    }
    
    // User endpoints
    if (strpos($path, '/api/users') === 0) {
        handleUsers($method, $path, $db, $input);
        return;
    }
    
    // Grid preparation endpoints
    if (strpos($path, '/api/grid-preparations') === 0) {
        handleGridPreparations($method, $path, $db, $input);
        return;
    }
    
    // Dashboard endpoint
    if (strpos($path, '/api/dashboard') === 0) {
        handleDashboard($method, $path, $db, $input);
        return;
    }
    
    // 404 - Not found
    sendError('Endpoint not found', 404);
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];

// Get the path from the query parameter set by .htaccess rewrite
$path = $_GET['path'] ?? $_SERVER['REQUEST_URI'];

// Remove query string from path if present
$path = parse_url($path, PHP_URL_PATH);

// Get JSON input for POST/PUT requests
$input = null;
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE && !empty(file_get_contents('php://input'))) {
        sendError('Invalid JSON input', 400);
    }
}

// Execute the router
route($method, $path, $db, $input);
?>
