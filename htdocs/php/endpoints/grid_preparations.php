<?php
function handleGridPreparations($method, $path, $db, $input) {
    switch ($method) {
        case 'PATCH':
            if (preg_match('/^\/api\/grid-preparations\/(\d+)\/trash$/', $path, $matches)) {
                $prepId = (int)$matches[1];
                trashGridPreparation($db, $prepId);
            } elseif (preg_match('/^\/api\/grid-preparations\/(\d+)\/untrash$/', $path, $matches)) {
                $prepId = (int)$matches[1];
                untrashGridPreparation($db, $prepId);
            } else {
                sendError('Grid preparations endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function trashGridPreparation($db, $prepId) {
    try {
        $result = $db->execute(
            "UPDATE grid_preparations SET trashed = TRUE, trashed_at = NOW(), updated_at = NOW() WHERE prep_id = ?",
            [$prepId]
        );
        
        if ($result['rowCount'] === 0) {
            sendError('Grid preparation not found', 404);
        }
        
        sendResponse(['message' => 'Grid preparation marked as trashed successfully']);
    } catch (Exception $e) {
        error_log("Error marking grid preparation as trashed: " . $e->getMessage());
        sendError('Error marking grid preparation as trashed');
    }
}

function untrashGridPreparation($db, $prepId) {
    try {
        $result = $db->execute(
            "UPDATE grid_preparations SET trashed = FALSE, trashed_at = NULL, updated_at = NOW() WHERE prep_id = ?",
            [$prepId]
        );
        
        if ($result['rowCount'] === 0) {
            sendError('Grid preparation not found', 404);
        }
        
        sendResponse(['message' => 'Grid preparation untrashed successfully']);
    } catch (Exception $e) {
        error_log("Error untrashing grid preparation: " . $e->getMessage());
        sendError('Error untrashing grid preparation');
    }
}
?>
