<?php
require_once 'config.php';

// Set API headers
setApiHeaders();

// Debug: Show what we're receiving
$debug = [
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'not set',
    'GET_path' => $_GET['path'] ?? 'not set',
    'parsed_path' => parse_url($_GET['path'] ?? $_SERVER['REQUEST_URI'], PHP_URL_PATH),
    'all_GET' => $_GET,
    'timestamp' => date('c')
];

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
