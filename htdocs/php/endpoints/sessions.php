<?php
require_once(__DIR__ . '/../../../include/config.php');
require_once(__DIR__ . '/../validation.php');

function handleSessions($method, $path, $db, $input) {
    switch ($method) {
        case 'GET':
            if ($path === '/api/sessions') {
                getSessions($db);
            } elseif ($path === '/api/sessions/check') {
                checkSession($db);
            } elseif (preg_match('/^\/api\/sessions\/(\d+)$/', $path, $matches)) {
                $sessionId = (int)$matches[1];
                getSessionDetails($db, $sessionId);
            } else {
                sendError('Sessions endpoint not found', 404);
            }
            break;
            
        case 'POST':
            if ($path === '/api/sessions') {
                createSession($db, $input);
            } elseif (preg_match('/^\/api\/sessions\/(\d+)\/grid-preparations$/', $path, $matches)) {
                $sessionId = (int)$matches[1];
                addGridPreparation($db, $sessionId, $input);
            } else {
                sendError('Sessions endpoint not found', 404);
            }
            break;
            
        case 'PUT':
            if (preg_match('/^\/api\/sessions\/(\d+)$/', $path, $matches)) {
                $sessionId = (int)$matches[1];
                updateSession($db, $sessionId, $input);
            } else {
                sendError('Sessions endpoint not found', 404);
            }
            break;
            
        case 'DELETE':
            if (preg_match('/^\/api\/sessions\/(\d+)$/', $path, $matches)) {
                $sessionId = (int)$matches[1];
                deleteSession($db, $sessionId);
            } else {
                sendError('Sessions endpoint not found', 404);
            }
            break;
            
        case 'PATCH':
            if (preg_match('/^\/api\/sessions\/(\d+)\/trash-all-grids$/', $path, $matches)) {
                $sessionId = (int)$matches[1];
                trashAllGridsInSession($db, $sessionId);
            } else {
                sendError('Sessions endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function getSessions($db) {
    try {
        $sessions = $db->query("
            SELECT s.*, 
                   COUNT(gp.prep_id) as grid_count,
                   vs.humidity_percent, vs.temperature_c
            FROM sessions s
            LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
            LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
            GROUP BY s.session_id
            ORDER BY s.date DESC, s.created_at DESC
        ");
        
        sendResponse($sessions);
    } catch (Exception $e) {
        error_log("Error fetching sessions: " . $e->getMessage());
        sendError('Error fetching sessions');
    }
}

function checkSession($db) {
    $userBox = $_GET['user_name'] ?? null;
    $gridBoxName = $_GET['grid_box_name'] ?? null;
    
    if (!$userBox || !$gridBoxName) {
        sendError('user_name and grid_box_name are required parameters', 400);
    }
    
    try {
        $sessions = $db->query(
            "SELECT session_id, user_name, date, grid_box_name FROM sessions WHERE user_name = ? AND grid_box_name = ? ORDER BY updated_at DESC LIMIT 1",
            [$userBox, $gridBoxName]
        );
        
        if (!empty($sessions)) {
            sendResponse([
                'exists' => true,
                'session' => $sessions[0]
            ]);
        } else {
            sendResponse([
                'exists' => false,
                'session' => null
            ]);
        }
    } catch (Exception $e) {
        error_log("Error checking for existing session: " . $e->getMessage());
        sendError('Error checking for existing session');
    }
}

function getSessionDetails($db, $sessionId) {
    try {
        // Get session info
        $session = $db->query("SELECT * FROM sessions WHERE session_id = ?", [$sessionId]);
        
        if (empty($session)) {
            sendError('Session not found', 404);
        }
        
        // Get vitrobot settings
        $settings = $db->query("SELECT * FROM vitrobot_settings WHERE session_id = ?", [$sessionId]);
        
        // Get grid info
        $gridInfo = $db->query("SELECT * FROM grids WHERE session_id = ?", [$sessionId]);
        
        // Get grid preparations with grid type info (sample_id is always session-level)
        $grids = $db->query("
            SELECT gp.*, g.grid_type, g.grid_batch
            FROM grid_preparations gp
            LEFT JOIN grids g ON gp.grid_id = g.grid_id
            WHERE gp.session_id = ?
            ORDER BY gp.slot_number
        ", [$sessionId]);

        // Get session-level sample
        $sampleRows = $db->query("SELECT * FROM samples WHERE session_id = ? LIMIT 1", [$sessionId]);
        $sample = !empty($sampleRows) ? $sampleRows[0] : null;

        $result = [
            'session' => $session[0],
            'settings' => $settings[0] ?? [],
            'grid_info' => $gridInfo[0] ?? [],
            'sample' => $sample,
            'grids' => $grids
        ];

        sendResponse($result);
    } catch (Exception $e) {
        error_log("Error fetching session details: " . $e->getMessage());
        sendError('Error fetching session details');
    }
}

function deleteSession($db, $sessionId) {
    try {
        $result = $db->execute("DELETE FROM sessions WHERE session_id = ?", [$sessionId]);
        sendResponse(['message' => 'Session deleted successfully']);
    } catch (Exception $e) {
        error_log("Error deleting session: " . $e->getMessage());
        sendError('Error deleting session');
    }
}

function trashAllGridsInSession($db, $sessionId) {
    try {
        $result = $db->execute(
            "UPDATE grid_preparations SET trashed = TRUE, trashed_at = NOW(), updated_at = NOW() WHERE session_id = ? AND include_in_session = TRUE",
            [$sessionId]
        );
        
        if ($result['rowCount'] === 0) {
            sendError('No grid preparations found for this session or already trashed', 404);
        }
        
        sendResponse([
            'message' => 'All grids in grid box marked as trashed successfully',
            'affectedRows' => $result['rowCount']
        ]);
    } catch (Exception $e) {
        error_log("Error marking all grids in session as trashed: " . $e->getMessage());
        sendError('Error marking all grids in session as trashed');
    }
}

// Helper function to look up grid type name by q_number/batch number
function getGridTypeByBatch($db, $batchNumber) {
    try {
        if (!$batchNumber || trim($batchNumber) === '') {
            return null;
        }
        
        $rows = $db->query(
            "SELECT grid_type_name FROM grid_types WHERE q_number = ? LIMIT 1",
            [trim($batchNumber)]
        );
        
        return !empty($rows) ? $rows[0]['grid_type_name'] : null;
    } catch (Exception $e) {
        error_log("Error looking up grid type by batch number: " . $e->getMessage());
        return null;
    }
}

// I'll continue with createSession and updateSession in the next part due to their complexity
function createSession($db, $input) {
    // Validate input
    $validationErrors = validateCompleteSession($input);
    if (!empty($validationErrors)) {
        // Flatten nested validation errors into a single array of strings
        $flattenedErrors = flattenValidationErrors($validationErrors);
        $errorMessage = 'Validation failed: ' . implode(', ', $flattenedErrors);
        sendError($errorMessage, 400);
    }
    
    // Validate required fields
    if (!isset($input['session']) || !isset($input['vitrobot_settings']) || 
        !isset($input['grid_info']) || !isset($input['grids'])) {
        sendError('Missing required fields: session, vitrobot_settings, grid_info, grids', 400);
    }
    
    $session = $input['session'];
    $vitrobot_settings = $input['vitrobot_settings'];
    $grid_info = $input['grid_info'];
    $grids = $input['grids'];
    
    // Basic validation
    if (empty($session['user_name']) || empty($session['date'])) {
        sendError('user_name and date are required', 400);
    }
    
    try {
        $db->beginTransaction();
        
        // Insert session FIRST
        $sessionResult = $db->execute(
            "INSERT INTO sessions (user_name, date, grid_box_name, loading_order, puck_name, puck_position) 
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                emptyToNull($session['user_name']),
                emptyToNull($session['date']),
                emptyToNull($session['grid_box_name'] ?? null),
                emptyToNull($session['loading_order'] ?? null),
                emptyToNull($session['puck_name'] ?? null),
                emptyToNull($session['puck_position'] ?? null)
            ]
        );
        
        $sessionId = $sessionResult['insertId'];
        
        // THEN insert grid info using the sessionId
        $glowDischargeCurrent = $grid_info['glow_discharge_current'] ?? null;
        $glowDischargeTime = $grid_info['glow_discharge_time'] ?? null;
        
        // Convert string numbers to proper types
        if ($glowDischargeCurrent !== null && $glowDischargeCurrent !== '') {
            $glowDischargeCurrent = floatval($glowDischargeCurrent);
        } else {
            $glowDischargeCurrent = null;
        }
        
        if ($glowDischargeTime !== null && $glowDischargeTime !== '') {
            $glowDischargeTime = intval($glowDischargeTime);
        } else {
            $glowDischargeTime = null;
        }
        
        $gridResult = $db->execute(
            "INSERT INTO grids (session_id, grid_type, grid_batch, glow_discharge_applied, 
              glow_discharge_current, glow_discharge_time)
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                $sessionId,
                emptyToNull($grid_info['grid_type'] ?? null),
                emptyToNull($grid_info['grid_batch'] ?? null),
                ($grid_info['glow_discharge_applied'] ?? false) ? 1 : 0,
                $glowDischargeCurrent,
                $glowDischargeTime
            ]
        );
        
        $gridId = $gridResult['insertId'];
        
        // Convert numeric string values to proper types for vitrobot settings
        $humidityPercent = $vitrobot_settings['humidity_percent'] ?? null;
        $temperatureC = $vitrobot_settings['temperature_c'] ?? null;
        $blotForce = $vitrobot_settings['blot_force'] ?? null;
        $blotTimeSeconds = $vitrobot_settings['blot_time_seconds'] ?? null;
        $waitTimeSeconds = $vitrobot_settings['wait_time_seconds'] ?? null;
        
        if ($humidityPercent !== null && $humidityPercent !== '') {
            $humidityPercent = trim($humidityPercent);
        } else {
            $humidityPercent = null;
        }
        
        if ($temperatureC !== null && $temperatureC !== '') {
            $temperatureC = floatval($temperatureC);
        } else {
            $temperatureC = null;
        }
        
        if ($blotForce !== null && $blotForce !== '') {
            $blotForce = floatval($blotForce);
        } else {
            $blotForce = null;
        }
        
        if ($blotTimeSeconds !== null && $blotTimeSeconds !== '') {
            $blotTimeSeconds = floatval($blotTimeSeconds);
        } else {
            $blotTimeSeconds = null;
        }
        
        if ($waitTimeSeconds !== null && $waitTimeSeconds !== '') {
            $waitTimeSeconds = trim($waitTimeSeconds);
        } else {
            $waitTimeSeconds = null;
        }
        
        // Insert vitrobot settings
        $db->execute(
            "INSERT INTO vitrobot_settings (session_id, humidity_percent, temperature_c, blot_force, blot_time_seconds, wait_time_seconds, glow_discharge_applied)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                $sessionId,
                $humidityPercent,
                $temperatureC,
                $blotForce,
                $blotTimeSeconds,
                $waitTimeSeconds,
                ($vitrobot_settings['glow_discharge_applied'] ?? false) ? 1 : 0
            ]
        );

        // Create the sample ONCE from the sample data in the request, now with session_id
        $sessionSampleId = null;
        if (isset($input['sample']) && !empty($input['sample']['sample_name'])) {
            $sample = $input['sample'];
            $sampleResult = $db->execute(
                "INSERT INTO samples (session_id, sample_name, sample_concentration, buffer, additives, default_volume_ul) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $sessionId,
                    emptyToNull($sample['sample_name']),
                    emptyToNull($sample['sample_concentration'] ?? null),
                    emptyToNull($sample['buffer'] ?? null),
                    emptyToNull($sample['additives'] ?? null),
                    emptyToNull($sample['default_volume_ul'] ?? null)
                ]
            );
            $sessionSampleId = $sampleResult['insertId'];
        }
        
        // Insert grid preparations for all 4 slots
        // First, create a map of slot data from the input grids
        $slotData = [];
        foreach ($grids as $grid) {
            $slotNumber = $grid['slot_number'] ?? null;
            if ($slotNumber >= 1 && $slotNumber <= 4) {
                $slotData[$slotNumber] = $grid;
            }
        }

        
        // Now create grid preparations for all 4 slots (1-4)
        for ($slotNumber = 1; $slotNumber <= 4; $slotNumber++) {
            $grid = $slotData[$slotNumber] ?? null;
            $includeInSession = $grid && ($grid['include_in_session'] ?? false);
            // Always use the session-level sample_id for all slots
            $sampleId = $sessionSampleId;
            $gridTypeOverride = null;
            $finalGridTypeOverride = null;
            if ($grid && !empty($grid['grid_batch_override'])) {
                $gridTypeOverride = getGridTypeByBatch($db, $grid['grid_batch_override']);
                $finalGridTypeOverride = $grid['grid_type_override'] ?? $gridTypeOverride;
            } elseif ($grid) {
                $finalGridTypeOverride = $grid['grid_type_override'] ?? null;
            }
            $volumeOverride = null;
            $blotTimeOverride = null;
            $blotForceOverride = null;
            if ($grid) {
                if (isset($grid['volume_ul_override']) && $grid['volume_ul_override'] !== '') {
                    $volumeOverride = $grid['volume_ul_override'];
                }
                if (isset($grid['blot_time_override']) && $grid['blot_time_override'] !== '') {
                    $blotTimeOverride = floatval($grid['blot_time_override']);
                }
                if (isset($grid['blot_force_override']) && $grid['blot_force_override'] !== '') {
                    $blotForceOverride = floatval($grid['blot_force_override']);
                }
            }
            $db->execute(
                "INSERT INTO grid_preparations (
                  session_id, slot_number, sample_id, grid_id, volume_ul_override, 
                  blot_time_override, blot_force_override, grid_batch_override, 
                  grid_type_override, comments, additives_override, include_in_session,
                  trashed, trashed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $sessionId,
                    $slotNumber,
                    $sampleId,
                    $gridId,
                    $volumeOverride,
                    $blotTimeOverride,
                    $blotForceOverride,
                    $grid ? emptyToNull($grid['grid_batch_override'] ?? null) : null,
                    emptyToNull($finalGridTypeOverride),
                    $grid ? emptyToNull($grid['comments'] ?? null) : null,
                    $grid ? emptyToNull($grid['additives_override'] ?? null) : null,
                    $includeInSession ? 1 : 0,
                    ($grid && ($grid['trashed'] ?? false)) ? 1 : 0,
                    ($grid && isset($grid['trashed_at'])) ? $grid['trashed_at'] : null
                ]
            );
        }
        
        $db->commit();
        sendResponse([
            'success' => true,
            'session_id' => (int)$sessionId,
            'message' => 'Session created successfully'
        ], 201);
        
    } catch (Exception $e) {
        $db->rollback();
        error_log("Error creating session: " . $e->getMessage());
        sendError('Failed to create session: ' . $e->getMessage());
    }
}

function updateSession($db, $sessionId, $input) {
    // Validate input if provided
    $validationErrors = validateCompleteSession($input);
    if (!empty($validationErrors)) {
        // Flatten nested validation errors into a single array of strings
        $flattenedErrors = flattenValidationErrors($validationErrors);
        $errorMessage = 'Validation failed: ' . implode(', ', $flattenedErrors);
        sendError($errorMessage, 400);
    }
    
    $session = $input['session'] ?? null;
    $vitrobot_settings = $input['vitrobot_settings'] ?? null;
    $grid_info = $input['grid_info'] ?? null;
    $grids = $input['grids'] ?? null;
    
    try {
        $db->beginTransaction();
        
        // Update session only if session data is provided
        if ($session) {
            $db->execute(
                "UPDATE sessions SET user_name = ?, date = ?, grid_box_name = ?, loading_order = ?, puck_name = ?, puck_position = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE session_id = ?",
                [
                    emptyToNull($session['user_name']),
                    emptyToNull($session['date']),
                    emptyToNull($session['grid_box_name'] ?? null),
                    emptyToNull($session['loading_order'] ?? null),
                    emptyToNull($session['puck_name'] ?? null),
                    emptyToNull($session['puck_position'] ?? null),
                    $sessionId
                ]
            );
        }
        
        // Update grid info only if grid_info data is provided
        if ($grid_info) {
            $existingGridInfo = $db->query("SELECT * FROM grids WHERE session_id = ?", [$sessionId]);
            
            if (!empty($existingGridInfo)) {
                // Update existing grid info
                $db->execute(
                    "UPDATE grids SET 
                      grid_type = ?, grid_batch = ?, glow_discharge_applied = ?,
                      glow_discharge_current = ?, glow_discharge_time = ?, 
                      updated_at = CURRENT_TIMESTAMP
                     WHERE session_id = ?",
                    [
                        emptyToNull($grid_info['grid_type'] ?? null),
                        emptyToNull($grid_info['grid_batch'] ?? null),
                        ($grid_info['glow_discharge_applied'] ?? false) ? 1 : 0,
                        emptyToNull($grid_info['glow_discharge_current'] ?? null),
                        emptyToNull($grid_info['glow_discharge_time'] ?? null),
                        $sessionId
                    ]
                );
            } else {
                // Insert new grid info
                $db->execute(
                    "INSERT INTO grids (
                    session_id, grid_type, grid_batch, glow_discharge_applied, 
                    glow_discharge_current, glow_discharge_time
                  ) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        $sessionId,
                        emptyToNull($grid_info['grid_type'] ?? null),
                        emptyToNull($grid_info['grid_batch'] ?? null),
                        ($grid_info['glow_discharge_applied'] ?? false) ? 1 : 0,
                        emptyToNull($grid_info['glow_discharge_current'] ?? null),
                        emptyToNull($grid_info['glow_discharge_time'] ?? null)
                    ]
                );
            }
        }
        
        // Update vitrobot settings only if vitrobot_settings data is provided
        if ($vitrobot_settings) {
            $db->execute(
                "UPDATE vitrobot_settings SET humidity_percent = ?, temperature_c = ?, blot_force = ?, blot_time_seconds = ?, wait_time_seconds = ?, glow_discharge_applied = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE session_id = ?",
                [
                    emptyToNull($vitrobot_settings['humidity_percent'] ?? null),
                    emptyToNull($vitrobot_settings['temperature_c'] ?? null),
                    emptyToNull($vitrobot_settings['blot_force'] ?? null),
                    emptyToNull($vitrobot_settings['blot_time_seconds'] ?? null),
                    emptyToNull($vitrobot_settings['wait_time_seconds'] ?? null),
                    ($vitrobot_settings['glow_discharge_applied'] ?? false) ? 1 : 0,
                    $sessionId
                ]
            );
        }
        
        // Update grid preparations if provided
        if ($grids) {
            // Delete all grid preparations for this session and then re-insert
            $db->execute("DELETE FROM grid_preparations WHERE session_id = ?", [$sessionId]);

            // Fetch grid_id and sample_id for this session
            $gridQuery = $db->query("SELECT grid_id FROM grids WHERE session_id = ?", [$sessionId]);
            $gridId = !empty($gridQuery) ? $gridQuery[0]['grid_id'] : null;
            $sampleQuery = $db->query("SELECT sample_id FROM samples WHERE session_id = ?", [$sessionId]);
            $sessionSampleId = !empty($sampleQuery) ? $sampleQuery[0]['sample_id'] : null;

            // If sample data is provided, update the sample record
            if (isset($input['sample']) && $sessionSampleId) {
                $sample = $input['sample'];
                $db->execute(
                    "UPDATE samples SET sample_name = ?, sample_concentration = ?, buffer = ?, additives = ?, default_volume_ul = ?, updated_at = CURRENT_TIMESTAMP WHERE sample_id = ?",
                    [
                        emptyToNull($sample['sample_name'] ?? null),
                        emptyToNull($sample['sample_concentration'] ?? null),
                        emptyToNull($sample['buffer'] ?? null),
                        emptyToNull($sample['additives'] ?? null),
                        emptyToNull($sample['default_volume_ul'] ?? null),
                        $sessionSampleId
                    ]
                );
            }

            // Prepare slot data
            $slotData = [];
            foreach ($grids as $grid) {
                $slotNumber = $grid['slot_number'] ?? null;
                if ($slotNumber >= 1 && $slotNumber <= 4) {
                    $slotData[$slotNumber] = $grid;
                }
            }

            // Insert new grid preparations for each slot
            for ($slotNumber = 1; $slotNumber <= 4; $slotNumber++) {
                $grid = $slotData[$slotNumber] ?? null;
                $includeInSession = $grid && ($grid['include_in_session'] ?? false);
                $sampleId = $sessionSampleId;
                $gridTypeOverride = null;
                $finalGridTypeOverride = null;
                if ($grid && !empty($grid['grid_batch_override'])) {
                    $gridTypeOverride = getGridTypeByBatch($db, $grid['grid_batch_override']);
                    $finalGridTypeOverride = $grid['grid_type_override'] ?? $gridTypeOverride;
                } elseif ($grid) {
                    $finalGridTypeOverride = $grid['grid_type_override'] ?? null;
                }
                $volumeOverride = null;
                $blotTimeOverride = null;
                $blotForceOverride = null;
                if ($grid) {
                    if (isset($grid['volume_ul_override']) && $grid['volume_ul_override'] !== '') {
                        $volumeOverride = $grid['volume_ul_override'];
                    }
                    if (isset($grid['blot_time_override']) && $grid['blot_time_override'] !== '') {
                        $blotTimeOverride = floatval($grid['blot_time_override']);
                    }
                    if (isset($grid['blot_force_override']) && $grid['blot_force_override'] !== '') {
                        $blotForceOverride = floatval($grid['blot_force_override']);
                    }
                }
                $db->execute(
                    "INSERT INTO grid_preparations (
                    session_id, slot_number, sample_id, grid_id, volume_ul_override, 
                    blot_time_override, blot_force_override, grid_batch_override, 
                    grid_type_override, comments, additives_override, include_in_session,
                    trashed, trashed_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $sessionId,
                        $slotNumber,
                        $sampleId,
                        $gridId,
                        $volumeOverride,
                        $blotTimeOverride,
                        $blotForceOverride,
                        $grid ? emptyToNull($grid['grid_batch_override'] ?? null) : null,
                        emptyToNull($finalGridTypeOverride),
                        $grid ? emptyToNull($grid['comments'] ?? null) : null,
                        $grid ? emptyToNull($grid['additives_override'] ?? null) : null,
                        $includeInSession ? 1 : 0,
                        ($grid && ($grid['trashed'] ?? false)) ? 1 : 0,
                        ($grid && isset($grid['trashed_at'])) ? $grid['trashed_at'] : null
                    ]
                );
            }
        }
        
        $db->commit();
        sendResponse(['message' => 'Session updated successfully']);
        
    } catch (Exception $e) {
        $db->rollback();
        error_log("Error updating session: " . $e->getMessage());
        sendError('Error updating session: ' . $e->getMessage());
    }
}

function addGridPreparation($db, $sessionId, $input) {
    try {
        // Validate required fields
        if (!isset($input['slot_number'])) {
            sendError('slot_number is required', 400);
        }
        
        $slotNumber = (int)$input['slot_number'];
        
        // Validate slot number range
        if ($slotNumber < 1 || $slotNumber > 4) {
            sendError('slot_number must be between 1 and 4', 400);
        }
        
        // Check if session exists and get the grid_id for this session
        $sessionData = $db->query(
            "SELECT s.session_id, g.grid_id FROM sessions s 
             LEFT JOIN grids g ON s.session_id = g.session_id 
             WHERE s.session_id = ?",
            [$sessionId]
        );
        
        if (empty($sessionData)) {
            sendError('Session not found', 404);
        }
        
        $gridId = $sessionData[0]['grid_id'];
        
        // Check if grid preparation exists for this slot (it should always exist now)
        $existingGrid = $db->query(
            "SELECT prep_id, include_in_session FROM grid_preparations WHERE session_id = ? AND slot_number = ?",
            [$sessionId, $slotNumber]
        );
        
        if (!empty($existingGrid)) {
            // Update existing grid preparation to include it in session and link to grid_id
            $result = $db->execute(
                "UPDATE grid_preparations SET include_in_session = 1, grid_id = ?, trashed = FALSE, trashed_at = NULL, updated_at = NOW() WHERE session_id = ? AND slot_number = ?",
                [$gridId, $sessionId, $slotNumber]
            );
            
            sendResponse(['message' => 'Grid preparation updated successfully', 'prep_id' => $existingGrid[0]['prep_id']]);
        } else {
            // This shouldn't happen with the new approach, but handle it just in case
            // Create new grid preparation
            $result = $db->execute(
                "INSERT INTO grid_preparations (session_id, slot_number, grid_id, include_in_session, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())",
                [$sessionId, $slotNumber, $gridId]
            );
            
            sendResponse(['message' => 'Grid preparation added successfully', 'prep_id' => $result['insertId']]);
        }
    } catch (Exception $e) {
        error_log("Error adding grid preparation: " . $e->getMessage());
        sendError('Error adding grid preparation');
    }
}
?>
