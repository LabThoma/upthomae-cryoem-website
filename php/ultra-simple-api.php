<?php
// Ultra-simple API test
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$response = [
    'status' => 'working',
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_GET['path'] ?? 'no path',
    'timestamp' => date('c')
];

echo json_encode($response);
?>
