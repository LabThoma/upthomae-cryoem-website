<?php
// Server diagnostics
echo "<h1>Server Diagnostics</h1>";

echo "<h2>PHP Information</h2>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>Server Software:</strong> " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "</p>";
echo "<p><strong>Document Root:</strong> " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "</p>";
echo "<p><strong>Request URI:</strong> " . ($_SERVER['REQUEST_URI'] ?? 'Unknown') . "</p>";

echo "<h2>Rewrite Module Test</h2>";
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "<p style='color: green;'>✓ mod_rewrite is loaded</p>";
    } else {
        echo "<p style='color: red;'>✗ mod_rewrite is NOT loaded</p>";
    }
} else {
    echo "<p style='color: orange;'>? Cannot determine if mod_rewrite is loaded (apache_get_modules not available)</p>";
}

echo "<h2>File Structure Test</h2>";
$files_to_check = [
    '.htaccess',
    'php/config.php',
    'php/api.php',
    'php/endpoints/samples.php'
];

foreach ($files_to_check as $file) {
    if (file_exists($file)) {
        echo "<p style='color: green;'>✓ $file exists</p>";
    } else {
        echo "<p style='color: red;'>✗ $file NOT found</p>";
    }
}

echo "<h2>Database Test</h2>";
try {
    require_once 'php/config.php';
    $db = new Database();
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    $tables = $db->query("SHOW TABLES");
    echo "<p style='color: green;'>✓ Found " . count($tables) . " tables in database</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Database error: " . $e->getMessage() . "</p>";
}

echo "<h2>Headers Test</h2>";
echo "<p>If you see this page, then regular PHP files are working.</p>";
echo "<p>Try accessing: <a href='php/test-api-direct.php'>/php/test-api-direct.php</a></p>";
echo "<p>Try accessing: <a href='api/health'>/api/health</a> (this should be JSON)</p>";
?>
