<?php
// Minimal API test that mimics the exact structure
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to prevent HTML output
ini_set('log_errors', 1); // Log errors instead

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple response function
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Get method and path exactly like the real API
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? $_SERVER['REQUEST_URI'];
$path = parse_url($path, PHP_URL_PATH);

// Log what we received
error_log("Minimal API Test - Method: $method, Path: $path");

// Health check endpoint
if ($method === 'GET' && $path === '/api/health') {
    sendResponse([
        'status' => 'minimal test healthy',
        'timestamp' => date('c'),
        'method' => $method,
        'path' => $path,
        'received_path_param' => $_GET['path'] ?? 'not set'
    ]);
}

// Default response
sendResponse([
    'error' => 'Endpoint not found in minimal test',
    'method' => $method,
    'path' => $path,
    'available' => ['/api/health']
], 404);
?>
