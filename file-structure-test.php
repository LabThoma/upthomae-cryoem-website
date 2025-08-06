<?php
// Simple file structure test
header('Content-Type: application/json');

$fileChecks = [
    'Current directory' => getcwd(),
    'PHP folder exists' => is_dir('php'),
    'api.php exists' => file_exists('php/api.php'),
    'config.php exists' => file_exists('php/config.php'),
    'samples.php exists' => file_exists('php/endpoints/samples.php'),
    'Directory listing' => array_slice(scandir('.'), 2, 20) // Remove . and ..
];

echo json_encode($fileChecks, JSON_PRETTY_PRINT);
?>
