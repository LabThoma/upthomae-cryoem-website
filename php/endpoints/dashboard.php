<?php
function handleDashboard($method, $path, $db, $input) {
    switch ($method) {
        case 'GET':
            if ($path === '/api/dashboard') {
                getDashboardStats($db);
            } else {
                sendError('Dashboard endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function getDashboardStats($db) {
    try {
        // Get stats for the last 30 days
        $stats = $db->query("
            SELECT 
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(gp.prep_id) as total_grids,
                COUNT(DISTINCT s.user_name) as active_users,
                AVG(vs.humidity_percent) as avg_humidity,
                AVG(vs.temperature_c) as avg_temperature
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
            LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
            WHERE s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        
        // Get recent sessions
        $recentSessions = $db->query("
            SELECT s.session_id, s.user_name, s.date, s.puck_name, COUNT(gp.prep_id) as grid_count
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
            GROUP BY s.session_id
            ORDER BY s.date DESC, s.created_at DESC
            LIMIT 10
        ");
        
        $response = [
            'stats' => $stats[0] ?? [],
            'recent_sessions' => $recentSessions
        ];
        
        sendResponse($response);
    } catch (Exception $e) {
        error_log("Error fetching dashboard data: " . $e->getMessage());
        sendError('Error fetching dashboard data');
    }
}
?>
