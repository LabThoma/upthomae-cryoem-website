<?php
// Example config file for development/production
// Copy this file to config.local.php or config.production.php and fill in the values

define('DB_HOST', 'localhost'); // or your production host
define('DB_USER', 'username');
define('DB_PASS', 'password');
define('DB_NAME', 'database_name');
define('DB_CHARSET', 'utf8mb4');

// Include shared code
require_once __DIR__ . '/config.shared.php';
?>