<?php
function handleUsers($method, $path, $db, $input) {
    switch ($method) {
        case 'GET':
            if ($path === '/api/users') {
                getUsers($db);
            } elseif ($path === '/api/users/all/sessions') {
                getAllUserSessions($db);
            } elseif (preg_match('/^\/api\/users\/([^\/]+)\/sessions$/', $path, $matches)) {
                $username = urldecode($matches[1]);
                getUserSessions($db, $username);
            } else {
                sendError('Users endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function getUsers($db) {
    try {
        // Get basic user statistics
        $users = $db->query("
            SELECT 
                s.user_name,
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(DISTINCT DATE(s.date)) as session_days,
                COUNT(gp.prep_id) as total_grids,
                MAX(s.date) as last_session_date,
                MIN(s.date) as first_session_date
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
            GROUP BY s.user_name
            ORDER BY s.user_name
        ");
        
        // Get active grid boxes for each user
        $activeGridBoxes = $db->query("
            SELECT 
                s.user_name,
                s.grid_box_name,
                COUNT(CASE 
                    WHEN gp.include_in_session = 1 AND (gp.trashed = 0 OR gp.trashed IS NULL)
                    THEN 1 
                    ELSE NULL 
                END) as active_grids
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id
            WHERE s.grid_box_name IS NOT NULL AND s.grid_box_name != ''
            GROUP BY s.user_name, s.grid_box_name
            HAVING active_grids > 0
        ");
        
        // Create a map of active grid boxes per user
        $activeBoxesMap = [];
        foreach ($activeGridBoxes as $box) {
            if (!isset($activeBoxesMap[$box['user_name']])) {
                $activeBoxesMap[$box['user_name']] = 0;
            }
            $activeBoxesMap[$box['user_name']]++;
        }
        
        // Process the results to add computed fields
        $processedUsers = [];
        foreach ($users as $user) {
            $processedUsers[] = [
                'username' => $user['user_name'],
                'totalSessions' => (int)($user['total_sessions'] ?? 0),
                'totalGrids' => (int)($user['total_grids'] ?? 0),
                'sessionDays' => (int)($user['session_days'] ?? 0),
                'lastSessionDate' => $user['last_session_date'],
                'firstSessionDate' => $user['first_session_date'],
                'activeGridBoxes' => $activeBoxesMap[$user['user_name']] ?? 0,
                'nextBoxName' => generateNextBoxName($user['user_name'], $db)
            ];
        }
        
        sendResponse($processedUsers);
    } catch (Exception $e) {
        error_log("Error fetching users: " . $e->getMessage());
        sendError('Error fetching users');
    }
}

function getUserSessions($db, $username) {
    try {
        // Get basic session information first
        $query = "
            SELECT s.*,
                   COUNT(gp.prep_id) as grid_count,
                   vs.humidity_percent, vs.temperature_c,
                   (
                       SELECT GROUP_CONCAT(DISTINCT sam.sample_name SEPARATOR ', ')
                       FROM grid_preparations gp2
                       LEFT JOIN samples sam ON gp2.sample_id = sam.sample_id
                       WHERE gp2.session_id = s.session_id AND sam.sample_name IS NOT NULL
                   ) as sample_names
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
            LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
        ";
        
        $params = [];
        
        // Only filter by username if not "all"
        if ($username !== 'all') {
            $query .= " WHERE s.user_name = ?";
            $params[] = $username;
        }
        
        $query .= " GROUP BY s.session_id ORDER BY s.date DESC, s.created_at DESC";
        
        $rows = $db->query($query, $params);
        
        // For each session, get detailed grid preparation information
        foreach ($rows as &$row) {
            $sessionId = $row['session_id'];
            
            // Get vitrobot settings
            $settings = $db->query(
                "SELECT * FROM vitrobot_settings WHERE session_id = ?",
                [$sessionId]
            );
            $row['settings'] = $settings[0] ?? [];
            
            // Get grid preparations
            $gridPreps = $db->query(
                "SELECT gp.*,
                   s.sample_name, s.sample_concentration, s.additives, s.default_volume_ul,
                   g.grid_type, g.grid_batch  
                 FROM grid_preparations gp
                 LEFT JOIN samples s ON gp.sample_id = s.sample_id
                 LEFT JOIN grids g ON gp.grid_id = g.grid_id
                 WHERE gp.session_id = ?
                 ORDER BY gp.slot_number",
                [$sessionId]
            );
            $row['grid_preparations'] = $gridPreps;
        }
        
        sendResponse($rows);
    } catch (Exception $e) {
        error_log("Error fetching user sessions: " . $e->getMessage());
        sendError("Error fetching sessions for user: $username");
    }
}

// Helper function to generate initials from username
function generateInitials($username) {
    $parts = preg_split('/\s+/', trim($username));
    
    if (count($parts) >= 3) {
        // For names with middle names (first, middle, last initials)
        return strtoupper(
            substr($parts[0], 0, 1) . 
            substr($parts[1], 0, 1) . 
            substr($parts[2], 0, 1)
        );
    } elseif (count($parts) === 2) {
        // For names without middle names (first and last initials)
        return strtoupper(
            substr($parts[0], 0, 1) . 
            substr($parts[1], 0, 1)
        );
    } else {
        // Other names
        return str_pad(strtoupper(substr($parts[0], 0, 2)), 2, 'X');
    }
}

// Helper function to generate next box name
function generateNextBoxName($username, $db) {
    try {
        // Get all existing grid box names to check for patterns
        $existingBoxes = $db->query("
            SELECT DISTINCT grid_box_name 
            FROM sessions 
            WHERE grid_box_name IS NOT NULL AND grid_box_name != ''
            ORDER BY grid_box_name
        ");
        
        $existingBoxNames = array_column($existingBoxes, 'grid_box_name');
        
        // Generate possible initials patterns
        $parts = preg_split('/\s+/', trim($username));
        $twoLetterInitials = null;
        $threeLetterInitials = null;
        
        if (count($parts) === 2) {
            $twoLetterInitials = strtoupper(substr($parts[0], 0, 1) . substr($parts[1], 0, 1));
        }
        
        if (count($parts) >= 3) {
            $threeLetterInitials = strtoupper(
                substr($parts[0], 0, 1) . 
                substr($parts[1], 0, 1) . 
                substr($parts[2], 0, 1)
            );
        }
        
        // Priority 1: Check for three-letter initials pattern (ASK008) for users with 3+ names
        if ($threeLetterInitials) {
            $pattern = '/^' . preg_quote($threeLetterInitials) . '(\d{3})$/';
            $matches = [];
            foreach ($existingBoxNames as $name) {
                if (preg_match($pattern, $name, $match)) {
                    $matches[] = (int)$match[1];
                }
            }
            
            if (!empty($matches)) {
                rsort($matches); // Sort descending to get highest number first
                $nextNumber = str_pad($matches[0] + 1, 3, '0', STR_PAD_LEFT);
                return $threeLetterInitials . $nextNumber;
            }
        }
        
        // Priority 2: Check for two-letter initials pattern (AJ008) for users with 2 names
        if ($twoLetterInitials) {
            $pattern = '/^' . preg_quote($twoLetterInitials) . '(\d{3})$/';
            $matches = [];
            foreach ($existingBoxNames as $name) {
                if (preg_match($pattern, $name, $match)) {
                    $matches[] = (int)$match[1];
                }
            }
            
            if (!empty($matches)) {
                rsort($matches); // Sort descending to get highest number first
                $nextNumber = str_pad($matches[0] + 1, 3, '0', STR_PAD_LEFT);
                return $twoLetterInitials . $nextNumber;
            }
        }
        
        // Priority 3: Look for any letter patterns followed by numbers for this user
        $userBoxNames = $db->query("
            SELECT DISTINCT grid_box_name 
            FROM sessions 
            WHERE user_name = ? AND grid_box_name IS NOT NULL AND grid_box_name != ''
            ORDER BY grid_box_name
        ", [$username]);
        
        $userBoxNamesList = array_column($userBoxNames, 'grid_box_name');
        
        $letterNumberMatches = [];
        foreach ($userBoxNamesList as $name) {
            if (preg_match('/^([A-Z]+)(\d+)$/', $name, $match)) {
                $letterNumberMatches[] = [
                    'letters' => $match[1],
                    'number' => (int)$match[2]
                ];
            }
        }
        
        if (!empty($letterNumberMatches)) {
            // Sort by number descending to get highest
            usort($letterNumberMatches, function($a, $b) {
                return $b['number'] - $a['number'];
            });
            
            $highestMatch = $letterNumberMatches[0];
            $nextNumber = str_pad($highestMatch['number'] + 1, 3, '0', STR_PAD_LEFT);
            return $highestMatch['letters'] . $nextNumber;
        }
        
        // Priority 4: Look for any box names ending with numbers and use the highest
        $allNumberMatches = [];
        foreach ($existingBoxNames as $name) {
            if (preg_match('/^.*?(\d+)$/', $name, $match)) {
                $allNumberMatches[] = (int)$match[1];
            }
        }
        
        $startNumber = 1;
        if (!empty($allNumberMatches)) {
            rsort($allNumberMatches); // Sort descending to get highest number first
            $startNumber = $allNumberMatches[0] + 1;
        }
        
        // Use three-letter initials if available, otherwise two-letter, otherwise fallback
        $preferredInitials = $threeLetterInitials ?: $twoLetterInitials ?: generateInitials($username);
        $nextNumber = str_pad($startNumber, 3, '0', STR_PAD_LEFT);
        return $preferredInitials . $nextNumber;
        
    } catch (Exception $e) {
        error_log("Error generating next box name: " . $e->getMessage());
        // Fallback to simple pattern
        $initials = generateInitials($username);
        return $initials . '001';
    }
}

function getAllUserSessions($db) {
    try {
        // Get all sessions with their details
        $sessions = $db->query("
            SELECT 
                s.*,
                COUNT(gp.prep_id) as grid_count,
                vs.humidity_percent, 
                vs.temperature_c,
                vs.blot_force,
                vs.blot_time_seconds,
                vs.wait_time_seconds
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
            LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
            GROUP BY s.session_id
            ORDER BY s.date DESC, s.created_at DESC
        ");
        
        sendResponse($sessions);
    } catch (Exception $e) {
        error_log("Error fetching all user sessions: " . $e->getMessage());
        sendError('Error fetching all user sessions');
    }
}
?>
