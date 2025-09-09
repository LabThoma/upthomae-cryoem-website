<?php
require_once(__DIR__ . '/../../../include/config.php');
// require_once(__DIR__ . '/../validation.php');
function handleMicroscopeSessions($method, $path, $db, $input) {
    switch ($method) {
        case 'POST':
            if ($path === '/api/microscope-sessions') {
                saveMicroscopeSession($db, $input);
            } else {
                sendError('Microscope sessions endpoint not found', 404);
            }
            break;
        case 'PUT':
            if (preg_match('/^\/api\/microscope-sessions\/(\d+)$/', $path, $matches)) {
                $sessionId = (int)$matches[1];
                saveMicroscopeSession($db, $input, $sessionId);
            } else {
                sendError('Microscope sessions endpoint not found', 404);
            }
            break;
        default:
            sendError('Method not allowed', 405);
    }
}

function saveMicroscopeSession($db, $input, $sessionId = null) {
    // Validate required fields
    $required = ['date', 'microscope'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            sendError("Missing field: $field", 400);
        }
    }

    // Optional fields
    $overnight = isset($input['overnight']) ? (int)$input['overnight'] : 0;
    $clipped_at_microscope = isset($input['clipped_at_microscope']) ? (int)$input['clipped_at_microscope'] : 0;
    $issues = isset($input['issues']) ? $input['issues'] : null;

    $isUpdate = ($sessionId !== null);

    try {
        $db->beginTransaction();

        if ($isUpdate) {
            // Update existing session
            $db->execute(
                'UPDATE microscope_sessions SET date = ?, microscope = ?, overnight = ?, clipped_at_microscope = ?, issues = ?, updated_at = NOW() WHERE session_id = ?',
                [
                    $input['date'],
                    $input['microscope'],
                    $overnight,
                    $clipped_at_microscope,
                    $issues,
                    $sessionId
                ]
            );

            // Delete existing microscope_details for this session
            $db->execute('DELETE FROM microscope_details WHERE session_id = ?', [$sessionId]);
        } else {
            // Create new session
            $result = $db->execute(
                'INSERT INTO microscope_sessions (date, microscope, overnight, clipped_at_microscope, issues) VALUES (?, ?, ?, ?, ?)',
                [
                    $input['date'],
                    $input['microscope'],
                    $overnight,
                    $clipped_at_microscope,
                    $issues
                ]
            );
            $sessionId = $result['insertId'];
        }

        $insertedSlots = [];
        // Insert up to 12 microscope_details if provided
        if (isset($input['details']) && is_array($input['details'])) {
            $details = $input['details'];
            $count = 0;
            foreach ($details as $detail) {
                if ($count >= 12) break;
                // Required fields for details: microscope_slot (1-12), grid_identifier
                if (!isset($detail['microscope_slot']) || !isset($detail['grid_identifier'])) continue;
                $microscope_slot = (int)$detail['microscope_slot'];
                if ($microscope_slot < 1 || $microscope_slot > 12) continue;
                $grid_identifier = $detail['grid_identifier'];
                // Optional fields
                // Find prep_id if not provided
                $prep_id = isset($detail['prep_id']) ? $detail['prep_id'] : findPrepIdByGridIdentifier($db, $grid_identifier);
                $atlas = isset($detail['atlas']) ? (int)$detail['atlas'] : 0;
                $screened = isset($detail['screened']) ? $detail['screened'] : null;
                $collected = isset($detail['collected']) ? (int)$detail['collected'] : 0;
                $multigrid = isset($detail['multigrid']) ? (int)$detail['multigrid'] : 0;
                $px_size = isset($detail['px_size']) ? $detail['px_size'] : null;
                $magnification = isset($detail['magnification']) ? $detail['magnification'] : null;
                $exposure_e = isset($detail['exposure_e']) ? $detail['exposure_e'] : null;
                $exposure_time = isset($detail['exposure_time']) ? $detail['exposure_time'] : null;
                $spot_size = isset($detail['spot_size']) ? $detail['spot_size'] : null;
                $illumination_area = isset($detail['illumination_area']) ? $detail['illumination_area'] : null;
                $exp_per_hole = isset($detail['exp_per_hole']) ? $detail['exp_per_hole'] : null;
                $images = isset($detail['images']) ? $detail['images'] : null;
                $comments = isset($detail['comments']) ? $detail['comments'] : null;
                $nominal_defocus = isset($detail['nominal_defocus']) ? $detail['nominal_defocus'] : null;
                $objective = isset($detail['objective']) ? $detail['objective'] : null;
                $slit_width = isset($detail['slit_width']) ? $detail['slit_width'] : null;
                $rescued = isset($detail['rescued']) ? (int)$detail['rescued'] : 0;
                $particle_number = isset($detail['particle_number']) ? $detail['particle_number'] : null;
                $ice_quality = isset($detail['ice_quality']) ? $detail['ice_quality'] : null;
                $grid_quality = isset($detail['grid_quality']) ? $detail['grid_quality'] : null;

                $detailResult = $db->execute(
                    'INSERT INTO microscope_details (
                        session_id, microscope_slot, grid_identifier, prep_id, atlas, screened, collected, multigrid, px_size, magnification, exposure_e, exposure_time, spot_size, illumination_area, exp_per_hole, images, comments, nominal_defocus, objective, slit_width, rescued, particle_number, ice_quality, grid_quality
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $sessionId,
                        $microscope_slot,
                        $grid_identifier,
                        $prep_id,
                        $atlas,
                        $screened,
                        $collected,
                        $multigrid,
                        $px_size,
                        $magnification,
                        $exposure_e,
                        $exposure_time,
                        $spot_size,
                        $illumination_area,
                        $exp_per_hole,
                        $images,
                        $comments,
                        $nominal_defocus,
                        $objective,
                        $slit_width,
                        $rescued,
                        $particle_number,
                        $ice_quality,
                        $grid_quality
                    ]
                );
                if ($detailResult['rowCount'] !== 1) {
                    $db->rollback();
                    sendError('Failed to insert microscope detail for slot ' . $microscope_slot);
                }
                $insertedSlots[] = $microscope_slot;
                $count++;
            }
        }

        $db->commit();
        
        $message = $isUpdate ? 'Microscope session updated successfully' : 'Microscope session saved successfully';
        $statusCode = $isUpdate ? 200 : 201;
        $responseKey = $isUpdate ? 'slots_updated' : 'inserted_slots';
        
        sendResponse([
            'success' => true, 
            'message' => $message,
            'id' => $sessionId, 
            $responseKey => $insertedSlots
        ], $statusCode);
        
    } catch (Exception $e) {
        $db->rollback();
        $action = $isUpdate ? 'update' : 'create';
        sendError("Failed to {$action} microscope session: " . $e->getMessage(), 500);
    }
}

// Helper to find prep_id from grid_identifier
function findPrepIdByGridIdentifier($db, $grid_identifier) {
    if (!preg_match('/^([A-Za-z0-9]+)g(0?[1-9]|1[0-2])$/', $grid_identifier, $matches)) {
        return null;
    }
    $grid_box_name = $matches[1];
    $slot_number = (int)ltrim($matches[2], '0');
    // Find session_id for grid_box_name
    $sessionRows = $db->query(
        'SELECT session_id FROM sessions WHERE grid_box_name = ? ORDER BY updated_at DESC LIMIT 1',
        [$grid_box_name]
    );
    if (empty($sessionRows)) return null;
    $session_id = $sessionRows[0]['session_id'];
    // Find prep_id for session_id and slot_number
    $prepRows = $db->query(
        'SELECT prep_id FROM grid_preparations WHERE session_id = ? AND slot_number = ? LIMIT 1',
        [$session_id, $slot_number]
    );
    return !empty($prepRows) ? $prepRows[0]['prep_id'] : null;
}
