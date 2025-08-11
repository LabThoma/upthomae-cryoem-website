<?php
require_once(__DIR__ . '/../../include/config.php');
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
        
        // Get grid preparations with sample and grid type info
        $grids = $db->query("
            SELECT gp.*, 
                   s.sample_name, s.sample_concentration, s.additives, s.default_volume_ul,
                   g.grid_type, g.grid_batch
            FROM grid_preparations gp
            LEFT JOIN samples s ON gp.sample_id = s.sample_id
            LEFT JOIN grids g ON gp.grid_id = g.grid_id
            WHERE gp.session_id = ?
            ORDER BY gp.slot_number
        ", [$sessionId]);
        
        $result = [
            'session' => $session[0],
            'settings' => $settings[0] ?? [],
            'grid_info' => $gridInfo[0] ?? [],
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
            $humidityPercent = floatval($humidityPercent);
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
            $waitTimeSeconds = floatval($waitTimeSeconds);
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
        
        // Insert grid preparations
        foreach ($grids as $grid) {
            if ($grid['include_in_session']) {
                // Handle sample creation/lookup based on sample_name
                $sampleId = null;
                
                if (!empty($grid['sample_name'])) {
                    // Check if this sample already exists FOR THIS SESSION/GRID BOX
                    $existingSamples = $db->query(
                        "SELECT s.sample_id FROM samples s 
                         JOIN grid_preparations gp ON s.sample_id = gp.sample_id 
                         WHERE gp.session_id = ? AND s.sample_name = ?",
                        [$sessionId, $grid['sample_name']]
                    );
                    
                    if (!empty($existingSamples)) {
                        // Use existing sample from this session
                        $sampleId = $existingSamples[0]['sample_id'];
                    } else {
                        // Create a new sample for this grid box/session
                        $sampleResult = $db->execute(
                            "INSERT INTO samples (sample_name, sample_concentration, additives, default_volume_ul) VALUES (?, ?, ?, ?)",
                            [
                                emptyToNull($grid['sample_name']),
                                emptyToNull($grid['sample_concentration'] ?? null),
                                emptyToNull($grid['additives'] ?? null),
                                emptyToNull($grid['default_volume_ul'] ?? null)
                            ]
                        );
                        $sampleId = $sampleResult['insertId'];
                    }
                } elseif (!empty($grid['sample_id'])) {
                    $sampleId = $grid['sample_id'];
                }
                
                // Look up grid type if grid_batch_override is provided
                $gridTypeOverride = null;
                if (!empty($grid['grid_batch_override'])) {
                    $gridTypeOverride = getGridTypeByBatch($db, $grid['grid_batch_override']);
                }
                
                // Use manual override if provided, otherwise use auto-populated value
                $finalGridTypeOverride = $grid['grid_type_override'] ?? $gridTypeOverride;
                
                // Convert numeric string values to proper types for grid preparations
                $slotNumber = $grid['slot_number'] ?? null;
                $volumeOverride = $grid['volume_ul_override'] ?? null;
                $blotTimeOverride = $grid['blot_time_override'] ?? null;
                $blotForceOverride = $grid['blot_force_override'] ?? null;
                
                if ($slotNumber !== null && $slotNumber !== '') {
                    $slotNumber = intval($slotNumber);
                } else {
                    $slotNumber = null;
                }
                
                if ($volumeOverride !== null && $volumeOverride !== '') {
                    $volumeOverride = floatval($volumeOverride);
                } else {
                    $volumeOverride = null;
                }
                
                if ($blotTimeOverride !== null && $blotTimeOverride !== '') {
                    $blotTimeOverride = floatval($blotTimeOverride);
                } else {
                    $blotTimeOverride = null;
                }
                
                if ($blotForceOverride !== null && $blotForceOverride !== '') {
                    $blotForceOverride = floatval($blotForceOverride);
                } else {
                    $blotForceOverride = null;
                }
                
                // Insert grid preparation
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
                        emptyToNull($grid['grid_batch_override'] ?? null),
                        emptyToNull($finalGridTypeOverride),
                        emptyToNull($grid['comments'] ?? null),
                        emptyToNull($grid['additives_override'] ?? null),
                        $grid['include_in_session'] ? 1 : 0,
                        $grid['trashed'] ?? 0,
                        $grid['trashed_at'] ?? null
                    ]
                );
            }
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
            // Delete existing grid preparations and re-insert
            $db->execute("DELETE FROM grid_preparations WHERE session_id = ?", [$sessionId]);
            
            // Get the grid_id for this session
            $gridQuery = $db->query("SELECT grid_id FROM grids WHERE session_id = ?", [$sessionId]);
            $gridId = !empty($gridQuery) ? $gridQuery[0]['grid_id'] : null;
            
            // Insert updated grid preparations
            foreach ($grids as $grid) {
                if ($grid['include_in_session']) {
                    // Handle sample creation/lookup (same logic as create)
                    $sampleId = null;
                    
                    if (!empty($grid['sample_id'])) {
                        // If we have an existing sample_id, use it and update the sample details
                        $sampleId = $grid['sample_id'];
                        
                        if (!empty($grid['sample_name'])) {
                            $db->execute(
                                "UPDATE samples SET sample_name = ?, sample_concentration = ?, additives = ?, updated_at = CURRENT_TIMESTAMP WHERE sample_id = ?",
                                [
                                    emptyToNull($grid['sample_name']),
                                    emptyToNull($grid['sample_concentration'] ?? null),
                                    emptyToNull($grid['additives'] ?? null),
                                    $sampleId
                                ]
                            );
                        }
                    } elseif (!empty($grid['sample_name'])) {
                        // Check if this sample already exists FOR THIS SESSION/GRID BOX
                        $existingSamples = $db->query(
                            "SELECT s.sample_id FROM samples s 
                             JOIN grid_preparations gp ON s.sample_id = gp.sample_id 
                             WHERE gp.session_id = ? AND s.sample_name = ?",
                            [$sessionId, $grid['sample_name']]
                        );
                        
                        if (!empty($existingSamples)) {
                            $sampleId = $existingSamples[0]['sample_id'];
                        } else {
                            // Create a new sample
                            $sampleResult = $db->execute(
                                "INSERT INTO samples (sample_name, sample_concentration, additives, default_volume_ul) VALUES (?, ?, ?, ?)",
                                [
                                    emptyToNull($grid['sample_name']),
                                    emptyToNull($grid['sample_concentration'] ?? null),
                                    emptyToNull($grid['additives'] ?? null),
                                    emptyToNull($grid['default_volume_ul'] ?? null)
                                ]
                            );
                            $sampleId = $sampleResult['insertId'];
                        }
                    }
                    
                    // Look up grid type if grid_batch_override is provided
                    $gridTypeOverride = null;
                    if (!empty($grid['grid_batch_override'])) {
                        $gridTypeOverride = getGridTypeByBatch($db, $grid['grid_batch_override']);
                    }
                    
                    $finalGridTypeOverride = $grid['grid_type_override'] ?? $gridTypeOverride;
                    
                    $db->execute(
                        "INSERT INTO grid_preparations (
                        session_id, slot_number, sample_id, grid_id, volume_ul_override, 
                        blot_time_override, blot_force_override, grid_batch_override, 
                        grid_type_override, comments, additives_override, include_in_session,
                        trashed, trashed_at
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                            $sessionId,
                            emptyToNull($grid['slot_number'] ?? null),
                            $sampleId,
                            $gridId,
                            emptyToNull($grid['volume_ul_override'] ?? null),
                            emptyToNull($grid['blot_time_override'] ?? null),
                            emptyToNull($grid['blot_force_override'] ?? null),
                            emptyToNull($grid['grid_batch_override'] ?? null),
                            emptyToNull($finalGridTypeOverride),
                            emptyToNull($grid['comments'] ?? null),
                            emptyToNull($grid['additives_override'] ?? null),
                            $grid['include_in_session'] ? 1 : 0,
                            $grid['trashed'] ?? 0,
                            $grid['trashed_at'] ?? null
                        ]
                    );
                }
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
?>
