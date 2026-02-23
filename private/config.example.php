<?php
// Example config file for development/production
// Copy this file to config.local.php or config.production.php and fill in the values

define('DB_HOST', 'localhost'); // or your production host
define('DB_USER', 'username');
define('DB_PASS', 'password');
define('DB_NAME', 'database_name');
define('DB_CHARSET', 'utf8mb4');

// API key for screening image uploads from the cluster
// Generate with: openssl rand -hex 32
define('SCREENING_IMAGES_UPLOAD_KEY', 'your-secret-key-here');

// Include shared code
require_once __DIR__ . '/config.shared.php';
?>