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
            } elseif (preg_match('/^\/api\/users\/([^\/]+)\/latest-settings$/', $path, $matches)) {
                $username = urldecode($matches[1]);
                getUserLatestSettings($db, $username);
            } elseif (preg_match('/^\/api\/users\/([^\/]+)\/microscope-sessions$/', $path, $matches)) {
                $username = urldecode($matches[1]);
                getUserMicroscopeSessions($db, $username);
            } else {
                sendError('Users endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

// Return all microscope sessions for a user
function getUserMicroscopeSessions($db, $username) {
    try {
        // Get all microscope sessions for the user, grouped by session
        $rows = $db->query("
            SELECT 
                ms.microscope_session_id,
                ms.date AS microscope_session_date,
                ms.microscope AS microscope_name,
                COUNT(md.prep_id) AS grid_count
            FROM microscope_sessions ms
            LEFT JOIN microscope_details md ON ms.microscope_session_id = md.microscope_session_id
            LEFT JOIN grid_preparations gp ON md.prep_id = gp.prep_id
            LEFT JOIN sessions s ON gp.session_id = s.session_id
            WHERE s.user_name = ?
            GROUP BY ms.microscope_session_id, ms.date, ms.microscope
            ORDER BY ms.date DESC
        ", [$username]);
        $result = [];
        foreach ($rows as $row) {
            // For each microscope session, get all microscope_details
            $details = $db->query(
                "SELECT md.*, gp.sample_id, s.sample_name
                 FROM microscope_details md
                 LEFT JOIN grid_preparations gp ON md.prep_id = gp.prep_id
                 LEFT JOIN samples s ON gp.sample_id = s.sample_id
                 WHERE md.microscope_session_id = ?",
                [$row['microscope_session_id']]
            );
            $grids = [];
            foreach ($details as $d) {
                $grids[] = [
                    'grid_identifier' => $d['grid_identifier'],
                    'microscope_slot' => $d['microscope_slot'],
                    'sample' => $d['sample_name'] ?? '',
                    'ice_quality' => $d['ice_quality'],
                    'particle_concentration' => $d['particle_number'],
                    'grid_quality' => $d['grid_quality'],
                    'number_of_images' => $d['images'],
                    'rescued' => $d['rescued'],
                    'comments' => $d['comments']
                ];
            }
            // For each microscope session, find all grid_preparations linked via microscope_details
            $prepRows = $db->query(
                "SELECT DISTINCT md.prep_id FROM microscope_details md WHERE md.microscope_session_id = ? AND md.prep_id IS NOT NULL",
                [$row['microscope_session_id']]
            );
            $prepIds = array_column($prepRows, 'prep_id');
            $boxNames = [];
            if (!empty($prepIds)) {
                // For each prep_id, get its session_id and then the box name
                $inClause = implode(',', array_fill(0, count($prepIds), '?'));
                $params = $prepIds;
                $boxRows = $db->query(
                    "SELECT DISTINCT s.grid_box_name FROM grid_preparations gp JOIN sessions s ON gp.session_id = s.session_id WHERE gp.prep_id IN ($inClause) AND s.grid_box_name IS NOT NULL AND s.grid_box_name != '' ORDER BY s.grid_box_name",
                    $params
                );
                $boxNames = array_column($boxRows, 'grid_box_name');
            }
            $result[] = [
                'date' => $row['microscope_session_date'],
                'microscope' => $row['microscope_name'],
                'numberOfGrids' => (int)($row['grid_count'] ?? 0),
                'gridBoxes' => implode(', ', $boxNames),
                'grids' => $grids
            ];
        }
        sendResponse($result);
    } catch (Exception $e) {
        error_log("Error fetching microscope sessions for user $username: " . $e->getMessage());
        sendError("Error fetching microscope sessions for user: $username");
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
                    WHEN gp.include_in_session = 1 
                         AND (gp.trashed = 0 OR gp.trashed IS NULL)
                         AND (gp.shipped = 0 OR gp.shipped IS NULL)
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
            $microscopeSessions = getMicroscopeSessionsForUser($db, $user['user_name']);
            // Find latest microscope session date
            $latestMicroscopeDate = null;
            if (!empty($microscopeSessions)) {
                foreach ($microscopeSessions as $ms) {
                    if (!empty($ms['microscope_session_date'])) {
                        if ($latestMicroscopeDate === null || $ms['microscope_session_date'] > $latestMicroscopeDate) {
                            $latestMicroscopeDate = $ms['microscope_session_date'];
                        }
                    }
                }
            }
            $processedUsers[] = [
                'username' => $user['user_name'],
                'totalSessions' => (int)($user['total_sessions'] ?? 0),
                'totalGrids' => (int)($user['total_grids'] ?? 0),
                'sessionDays' => (int)($user['session_days'] ?? 0),
                'lastSessionDate' => $user['last_session_date'],
                'firstSessionDate' => $user['first_session_date'],
                'activeGridBoxes' => $activeBoxesMap[$user['user_name']] ?? 0,
                'nextBoxName' => generateNextBoxName($user['user_name'], $db),
                'microscopeSessions' => $microscopeSessions,
                'lastMicroscopeSessionDate' => $latestMicroscopeDate,
                'hasMicroscopeSession' => !empty($latestMicroscopeDate)
            ];
        }
        
        sendResponse($processedUsers);
    } catch (Exception $e) {
        error_log("Error fetching users: " . $e->getMessage());
        sendError('Error fetching users');
    }
}

// Helper: Get microscope sessions for a user
function getMicroscopeSessionsForUser($db, $username) {
    try {
        // Join microscope_details -> grid_preparations -> sessions to get user_name
        $rows = $db->query("
            SELECT md.*, ms.date AS microscope_session_date, gp.prep_id, s.user_name
            FROM microscope_details md
            LEFT JOIN grid_preparations gp ON md.prep_id = gp.prep_id
            LEFT JOIN sessions s ON gp.session_id = s.session_id
            LEFT JOIN microscope_sessions ms ON md.microscope_session_id = ms.microscope_session_id
            WHERE s.user_name = ?
            ORDER BY ms.date DESC, md.last_updated DESC
        ", [$username]);
        return $rows;
    } catch (Exception $e) {
        error_log("Error fetching microscope sessions for user $username: " . $e->getMessage());
        return [];
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
            
            // Get grid preparations (no sample fields)
            $gridPreps = $db->query(
                "SELECT gp.*, g.grid_type, g.grid_batch  
                 FROM grid_preparations gp
                 LEFT JOIN grids g ON gp.grid_id = g.grid_id
                 WHERE gp.session_id = ?
                 ORDER BY gp.slot_number",
                [$sessionId]
            );
            $row['grid_preparations'] = $gridPreps;

            // Get session-level sample
            $sample = $db->query(
                "SELECT * FROM samples WHERE session_id = ? LIMIT 1",
                [$sessionId]
            );
            $row['sample'] = $sample[0] ?? null;
        }
        
        sendResponse($rows);
    } catch (Exception $e) {
        error_log("Error fetching user sessions: " . $e->getMessage());
        sendError("Error fetching sessions for user: $username");
    }
}

function getUserLatestSettings($db, $username) {
    try {
        // Get the most recent vitrobot settings for this user
        $settings = $db->query("
            SELECT vs.* 
            FROM vitrobot_settings vs
            INNER JOIN sessions s ON vs.session_id = s.session_id
            WHERE s.user_name = ? 
                AND (vs.humidity_percent IS NOT NULL 
                     OR vs.temperature_c IS NOT NULL 
                     OR vs.blot_force IS NOT NULL 
                     OR vs.blot_time_seconds IS NOT NULL 
                     OR vs.wait_time_seconds IS NOT NULL)
            ORDER BY s.date DESC, s.created_at DESC
            LIMIT 1
        ", [$username]);
        
        if (!empty($settings)) {
            sendResponse($settings[0]);
        } else {
            sendResponse(null);
        }
    } catch (Exception $e) {
        error_log("Error fetching latest settings for user: " . $e->getMessage());
        sendError("Error fetching latest settings for user: $username");
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
