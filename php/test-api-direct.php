<?php
// Simple direct API test - bypasses .htaccess
require_once 'config.php';

// Set API headers
setApiHeaders();

// Initialize database
try {
    $db = new Database();
    
    // Test basic functionality
    $response = [
        'status' => 'success',
        'message' => 'PHP API is working',
        'timestamp' => date('c'),
        'database' => 'connected'
    ];
    
    // Test a simple query
    $sessionCount = $db->query("SELECT COUNT(*) as count FROM sessions");
    $response['session_count'] = (int)$sessionCount[0]['count'];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
}
?>
