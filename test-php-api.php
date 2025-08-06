<?php
// Simple test script to check if our basic PHP API is working
require_once 'php/config.php';

echo "<h1>PHP API Test</h1>";

// Test database connection
try {
    $db = new Database();
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    // Test a simple query
    $result = $db->query("SELECT COUNT(*) as count FROM sessions");
    echo "<p style='color: green;'>✓ Database query successful - Found " . $result[0]['count'] . " sessions</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Database error: " . $e->getMessage() . "</p>";
}

// Test JSON response functions
echo "<h2>Testing JSON Response Functions</h2>";

// Test the utility functions
$testData = [
    'test' => 'value',
    'number' => 123,
    'array' => [1, 2, 3]
];

echo "<p>Test data structure works:</p>";
echo "<pre>" . print_r($testData, true) . "</pre>";

echo "<p style='color: green;'>✓ Basic PHP setup appears to be working</p>";

echo "<h2>Next Steps</h2>";
echo "<ul>";
echo "<li>Test the API endpoints by accessing php/api.php</li>";
echo "<li>Update your frontend JavaScript to point to the PHP API instead of Node.js</li>";
echo "<li>Complete the complex session creation/update functions</li>";
echo "</ul>";
?>
