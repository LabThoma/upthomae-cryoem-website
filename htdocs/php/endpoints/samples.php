<?php
function handleSamples($method, $path, $db, $input) {
    switch ($method) {
        case 'GET':
            if ($path === '/api/samples') {
                getSamples($db);
            } else {
                sendError('Samples endpoint not found', 404);
            }
            break;
            
        case 'POST':
            if ($path === '/api/samples') {
                createSample($db, $input);
            } else {
                sendError('Samples endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function getSamples($db) {
    try {
        $samples = $db->query("SELECT * FROM samples ORDER BY sample_name");
        sendResponse($samples);
    } catch (Exception $e) {
        error_log("Error fetching samples: " . $e->getMessage());
        sendError('Error fetching samples');
    }
}

function createSample($db, $input) {
    // Validate required fields
    if (!isset($input['sample_name']) || empty(trim($input['sample_name']))) {
        sendError('sample_name is required', 400);
    }
    
    // Validate sample_name length
    if (strlen($input['sample_name']) > 255) {
        sendError('sample_name must be 255 characters or less', 400);
    }
    
    // Validate optional fields
    $sample_concentration = isset($input['sample_concentration']) ? $input['sample_concentration'] : null;
    if ($sample_concentration && strlen($sample_concentration) > 100) {
        sendError('sample_concentration must be 100 characters or less', 400);
    }

    $buffer = isset($input['buffer']) ? $input['buffer'] : null;
    if ($buffer && strlen($buffer) > 500) {
        sendError('buffer must be 500 characters or less', 400);
    }

    $additives = isset($input['additives']) ? $input['additives'] : null;
    if ($additives && strlen($additives) > 1000) {
        sendError('additives must be 1000 characters or less', 400);
    }
    
    $default_volume_ul = isset($input['default_volume_ul']) ? $input['default_volume_ul'] : null;
    if ($default_volume_ul !== null) {
        if (!is_numeric($default_volume_ul) || $default_volume_ul < 0 || $default_volume_ul > 99.99) {
            sendError('default_volume_ul must be between 0 and 99.99', 400);
        }
    }
    
    try {
        $result = $db->execute(
            "INSERT INTO samples (sample_name, sample_concentration, buffer, additives, default_volume_ul) VALUES (?, ?, ?, ?, ?)",
            [
                trim($input['sample_name']),
                $sample_concentration,
                $buffer,
                $additives,
                $default_volume_ul
            ]
        );
        
        sendResponse(['id' => (int)$result['insertId']], 201);
    } catch (Exception $e) {
        error_log("Error adding sample: " . $e->getMessage());
        sendError('Error adding sample');
    }
}
?>
