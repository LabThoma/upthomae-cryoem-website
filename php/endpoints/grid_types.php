<?php
function handleGridTypes($method, $path, $db, $input) {
    // Parse path for dynamic routes
    $pathParts = explode('/', trim($path, '/'));
    
    switch ($method) {
        case 'GET':
            if ($path === '/api/grid-types') {
                getGridTypes($db);
            } elseif ($path === '/api/grid-types/summary') {
                getGridTypesSummary($db);
            } elseif ($path === '/api/grid-types/batches') {
                // Use query parameter instead of path parameter to avoid URL encoding issues
                $gridTypeName = $_GET['type'] ?? null;
                if (!$gridTypeName) {
                    sendError('Grid type parameter is required', 400);
                    return;
                }
                getGridTypeBatches($db, $gridTypeName);
                getGridTypes($db);
            } elseif ($path === '/api/grid-types/summary') {
                getGridTypesSummary($db);
            } elseif ($path === '/api/grid-types/batches') {
                // Use query parameter instead of path parameter to avoid URL encoding issues
                $gridTypeName = $_GET['type'] ?? null;
                if (!$gridTypeName) {
                    sendError('Grid type parameter is required', 400);
                    return;
                }
                getGridTypeBatches($db, $gridTypeName);
            } elseif ($path === '/api/grid-types/debug') {
                // Temporary debug endpoint
                sendResponse([
                    'received_path' => $path,
                    'path_length' => strlen($path),
                    'path_bytes' => bin2hex($path),
                    'get_params' => $_GET,
                    'server_request_uri' => $_SERVER['REQUEST_URI'] ?? 'not set'
                ]);
            } elseif (preg_match('/^\/api\/grid-types\/(\d+)\/details$/', $path, $matches)) {
                $gridTypeId = (int)$matches[1];
                getGridTypeDetails($db, $gridTypeId);
            } else {
                sendError('Grid types endpoint not found', 404);
            }
            break;
            
        case 'POST':
            if ($path === '/api/grid-types') {
                createGridType($db, $input);
            } else {
                sendError('Grid types endpoint not found', 404);
            }
            break;
            
        case 'PUT':
            if (preg_match('/^\/api\/grid-types\/(\d+)$/', $path, $matches)) {
                $gridTypeId = (int)$matches[1];
                updateGridType($db, $gridTypeId, $input);
            } else {
                sendError('Grid types endpoint not found', 404);
            }
            break;
            
        case 'DELETE':
            if (preg_match('/^\/api\/grid-types\/(\d+)$/', $path, $matches)) {
                $gridTypeId = (int)$matches[1];
                deleteGridType($db, $gridTypeId);
            } else {
                sendError('Grid types endpoint not found', 404);
            }
            break;
            
        case 'PATCH':
            if (preg_match('/^\/api\/grid-types\/(\d+)\/mark-empty$/', $path, $matches)) {
                $gridTypeId = (int)$matches[1];
                markGridTypeAsEmpty($db, $gridTypeId);
            } elseif (preg_match('/^\/api\/grid-types\/(\d+)\/mark-in-use$/', $path, $matches)) {
                $gridTypeId = (int)$matches[1];
                markGridTypeAsInUse($db, $gridTypeId);
            } else {
                sendError('Grid types endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function getGridTypes($db) {
    try {
        $gridTypes = $db->query("SELECT * FROM grid_types ORDER BY grid_type_name");
        sendResponse($gridTypes);
    } catch (Exception $e) {
        error_log("Error fetching grid types: " . $e->getMessage());
        sendError('Error fetching grid types');
    }
}

function getGridTypesSummary($db) {
    try {
        $summary = $db->query("
            SELECT 
                gt.grid_type_name,
                SUM(
                    CASE 
                        WHEN gt.marked_as_empty = TRUE THEN 0
                        ELSE COALESCE(gt.quantity, 0) - COALESCE(usage_counts.total_used, 0)
                    END
                ) as total_unused_grids,
                SUM(COALESCE(usage_counts.used_last_3_months, 0)) as total_used_last_3_months,
                COUNT(gt.grid_type_id) as batch_count
            FROM grid_types gt
            LEFT JOIN (
                SELECT 
                    batch_q_number as q_number,
                    COUNT(*) as total_used,
                    COUNT(CASE WHEN gp.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 1 END) as used_last_3_months
                FROM (
                    SELECT 
                        gp.prep_id,
                        gp.created_at,
                        CASE 
                            WHEN gp.grid_batch_override IS NOT NULL AND gp.grid_batch_override != '' 
                            THEN gp.grid_batch_override
                            ELSE g.grid_batch
                        END as batch_q_number
                    FROM grid_preparations gp
                    JOIN grids g ON gp.grid_id = g.grid_id
                    WHERE gp.include_in_session = 1
                ) gp
                WHERE batch_q_number IS NOT NULL AND batch_q_number != ''
                GROUP BY batch_q_number
            ) usage_counts ON gt.q_number = usage_counts.q_number
            GROUP BY gt.grid_type_name
            ORDER BY gt.grid_type_name
        ");
        sendResponse($summary);
    } catch (Exception $e) {
        error_log("Error fetching grid type summary: " . $e->getMessage());
        sendError('Error fetching grid type summary');
    }
}

function getGridTypeBatches($db, $gridTypeName) {
    try {
        $batches = $db->query("
            SELECT 
                gt.grid_type_id,
                gt.grid_type_name,
                gt.q_number,
                gt.quantity,
                gt.created_at,
                gt.marked_as_empty,
                gt.marked_as_in_use,
                COALESCE(usage_counts.used_grids, 0) as used_grids,
                CASE 
                    WHEN gt.marked_as_empty = TRUE THEN 0
                    ELSE COALESCE(gt.quantity, 0) - COALESCE(usage_counts.used_grids, 0)
                END as remaining_grids
            FROM grid_types gt
            LEFT JOIN (
                SELECT 
                    batch_q_number as q_number,
                    COUNT(*) as used_grids
                FROM (
                    SELECT 
                        gp.prep_id,
                        CASE 
                            WHEN gp.grid_batch_override IS NOT NULL AND gp.grid_batch_override != '' 
                            THEN gp.grid_batch_override
                            ELSE g.grid_batch
                        END as batch_q_number
                    FROM grid_preparations gp
                    JOIN grids g ON gp.grid_id = g.grid_id
                    WHERE gp.include_in_session = 1
                ) gp
                WHERE batch_q_number IS NOT NULL AND batch_q_number != ''
                GROUP BY batch_q_number
            ) usage_counts ON gt.q_number = usage_counts.q_number
            WHERE gt.grid_type_name = ?
            ORDER BY gt.created_at DESC
        ", [$gridTypeName]);
        
        sendResponse($batches);
    } catch (Exception $e) {
        error_log("Error fetching grid type batches: " . $e->getMessage());
        sendError('Error fetching grid type batches');
    }
}

function getGridTypeDetails($db, $gridTypeId) {
    try {
        $details = $db->query("
            SELECT 
                gt.grid_type_id,
                gt.grid_type_name,
                gt.q_number,
                gt.quantity,
                gt.created_at,
                gt.marked_as_empty,
                gt.marked_as_in_use,
                COALESCE(usage_counts.used_grids, 0) as used_grids,
                CASE 
                    WHEN gt.marked_as_empty = TRUE THEN 0
                    ELSE COALESCE(gt.quantity, 0) - COALESCE(usage_counts.used_grids, 0)
                END as remaining_grids
            FROM grid_types gt
            LEFT JOIN (
                SELECT 
                    batch_q_number as q_number,
                    COUNT(*) as used_grids
                FROM (
                    SELECT 
                        gp.prep_id,
                        CASE 
                            WHEN gp.grid_batch_override IS NOT NULL AND gp.grid_batch_override != '' 
                            THEN gp.grid_batch_override
                            ELSE g.grid_batch
                        END as batch_q_number
                    FROM grid_preparations gp
                    JOIN grids g ON gp.grid_id = g.grid_id
                    WHERE gp.include_in_session = 1
                ) gp
                WHERE batch_q_number IS NOT NULL AND batch_q_number != ''
                GROUP BY batch_q_number
            ) usage_counts ON gt.q_number = usage_counts.q_number
            WHERE gt.grid_type_id = ?
        ", [$gridTypeId]);
        
        if (empty($details)) {
            sendError('Grid type not found', 404);
        }
        
        sendResponse($details[0]);
    } catch (Exception $e) {
        error_log("Error fetching grid type details: " . $e->getMessage());
        sendError('Error fetching grid type details');
    }
}

function createGridType($db, $input) {
    try {
        $result = $db->execute(
            "INSERT INTO grid_types (
                grid_type_name, manufacturer, support, spacing, grid_material, 
                grid_mesh, extra_layer, extra_layer_thickness, q_number, 
                extra_info, quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                emptyToNull($input['grid_type_name'] ?? null),
                emptyToNull($input['manufacturer'] ?? null),
                emptyToNull($input['support'] ?? null),
                emptyToNull($input['spacing'] ?? null),
                emptyToNull($input['grid_material'] ?? null),
                emptyToNull($input['grid_mesh'] ?? null),
                emptyToNull($input['extra_layer'] ?? null),
                emptyToNull($input['extra_layer_thickness'] ?? null),
                emptyToNull($input['q_number'] ?? null),
                emptyToNull($input['extra_info'] ?? null),
                isset($input['quantity']) ? (int)$input['quantity'] : null
            ]
        );
        
        sendResponse([
            'id' => (int)$result['insertId'],
            'message' => 'Grid type added successfully'
        ], 201);
    } catch (Exception $e) {
        error_log("Error adding grid type: " . $e->getMessage());
        sendError('Error adding grid type');
    }
}

function updateGridType($db, $gridTypeId, $input) {
    try {
        $result = $db->execute(
            "UPDATE grid_types SET
                grid_type_name = ?, manufacturer = ?, support = ?, spacing = ?, 
                grid_material = ?, grid_mesh = ?, extra_layer = ?, 
                extra_layer_thickness = ?, q_number = ?, extra_info = ?, 
                quantity = ?, updated_at = NOW()
            WHERE grid_type_id = ?",
            [
                emptyToNull($input['grid_type_name'] ?? null),
                emptyToNull($input['manufacturer'] ?? null),
                emptyToNull($input['support'] ?? null),
                emptyToNull($input['spacing'] ?? null),
                emptyToNull($input['grid_material'] ?? null),
                emptyToNull($input['grid_mesh'] ?? null),
                emptyToNull($input['extra_layer'] ?? null),
                emptyToNull($input['extra_layer_thickness'] ?? null),
                emptyToNull($input['q_number'] ?? null),
                emptyToNull($input['extra_info'] ?? null),
                isset($input['quantity']) ? (int)$input['quantity'] : null,
                $gridTypeId
            ]
        );
        
        if ($result['affectedRows'] === 0) {
            sendError('Grid type not found', 404);
        }
        
        sendResponse(['message' => 'Grid type updated successfully']);
    } catch (Exception $e) {
        error_log("Error updating grid type: " . $e->getMessage());
        sendError('Error updating grid type');
    }
}

function deleteGridType($db, $gridTypeId) {
    try {
        $result = $db->execute("DELETE FROM grid_types WHERE grid_type_id = ?", [$gridTypeId]);
        
        if ($result['affectedRows'] === 0) {
            sendError('Grid type not found', 404);
        }
        
        sendResponse(['message' => 'Grid type deleted successfully']);
    } catch (Exception $e) {
        error_log("Error deleting grid type: " . $e->getMessage());
        sendError('Error deleting grid type');
    }
}

function markGridTypeAsEmpty($db, $gridTypeId) {
    try {
        $result = $db->execute(
            "UPDATE grid_types SET marked_as_empty = TRUE, updated_at = NOW() WHERE grid_type_id = ?",
            [$gridTypeId]
        );
        
        if ($result['affectedRows'] === 0) {
            sendError('Grid type not found', 404);
        }
        
        sendResponse(['message' => 'Grid type marked as empty successfully']);
    } catch (Exception $e) {
        error_log("Error marking grid type as empty: " . $e->getMessage());
        sendError('Error marking grid type as empty');
    }
}

function markGridTypeAsInUse($db, $gridTypeId) {
    try {
        $result = $db->execute(
            "UPDATE grid_types SET marked_as_in_use = TRUE, updated_at = NOW() WHERE grid_type_id = ?",
            [$gridTypeId]
        );
        
        if ($result['affectedRows'] === 0) {
            sendError('Grid type not found', 404);
        }
        
        sendResponse(['message' => 'Grid type marked as in use successfully']);
    } catch (Exception $e) {
        error_log("Error marking grid type as in use: " . $e->getMessage());
        sendError('Error marking grid type as in use');
    }
}
?>
