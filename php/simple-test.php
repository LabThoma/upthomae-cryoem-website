<?php
// Simple test to see if we're being reached at all
header('Content-Type: application/json');
echo json_encode([
    'message' => 'Rewrite is working!',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'query_string' => $_SERVER['QUERY_STRING'] ?? 'unknown',
    'get_params' => $_GET,
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'unknown'
]);
?>
