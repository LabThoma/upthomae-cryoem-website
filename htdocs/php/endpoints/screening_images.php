<?php
/**
 * Screening Images API Endpoint
 * 
 * Handles serving screening images from the private folder.
 * Images are organized by session date and grid identifier:
 * private/screening_images/{YYYYMMDD}/{gridIdentifier}/low/
 * private/screening_images/{YYYYMMDD}/{gridIdentifier}/high/
 * 
 * Routes:
 * - GET /api/screening-images/{sessionDate}/{gridIdentifier} - List images
 * - GET /api/screening-images/{sessionDate}/{gridIdentifier}/{mag}/{filename} - Serve image
 * - POST /api/screening-images/upload - Upload image (API key protected)
 */

function handleScreeningImages($method, $path, $db, $input = null) {
    // Match: POST /api/screening-images/upload
    if ($method === 'POST' && $path === '/api/screening-images/upload') {
        uploadScreeningImage();
        return;
    }

    // Match: /api/screening-images/{sessionDate}/{gridIdentifier}/{mag}/{filename}
    if (preg_match('#^/api/screening-images/(\d{8})/([A-Za-z0-9]+g\d+)/(low|high)/([^/]+)$#', $path, $matches)) {
        if ($method === 'GET') {
            serveScreeningImage($matches[1], $matches[2], $matches[3], $matches[4]);
            return;
        }
    }
    
    // Match: /api/screening-images/{sessionDate}/{gridIdentifier}
    if (preg_match('#^/api/screening-images/(\d{8})/([A-Za-z0-9]+g\d+)$#', $path, $matches)) {
        if ($method === 'GET') {
            listScreeningImages($matches[1], $matches[2]);
            return;
        }
    }
    
    sendError('Invalid screening images endpoint', 404);
}

/**
 * Upload a screening image from the cluster
 * Authenticated via X-API-Key header
 */
function uploadScreeningImage() {
    // Validate API key
    $providedKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    $validKey = defined('SCREENING_IMAGES_UPLOAD_KEY') ? SCREENING_IMAGES_UPLOAD_KEY : '';

    if (empty($validKey) || !hash_equals($validKey, $providedKey)) {
        http_response_code(401);
        exit(json_encode(['error' => 'Unauthorized']));
    }

    // Validate POST fields
    $sessionDate    = $_POST['session_date']    ?? '';
    $gridIdentifier = $_POST['grid_identifier'] ?? '';
    $mag            = $_POST['mag']             ?? '';

    if (!preg_match('/^\d{8}$/', $sessionDate)) {
        sendError('Invalid session_date format (expected YYYYMMDD)', 400);
    }
    if (!preg_match('/^[A-Za-z0-9]+g\d+$/', $gridIdentifier)) {
        sendError('Invalid grid_identifier format (expected e.g. AB123g1)', 400);
    }
    if (!in_array($mag, ['low', 'high'])) {
        sendError('Invalid mag value (expected low or high)', 400);
    }

    // Validate file upload
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $code = $_FILES['file']['error'] ?? 'no file';
        sendError('File upload error: ' . $code, 400);
    }

    $file      = $_FILES['file'];

    // Enforce file size limit (10 MB)
    $maxBytes = 10 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        sendError('File too large. Maximum size is 10 MB.', 400);
    }

    $origName  = basename($file['name']);
    $extension = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
        sendError('Invalid file extension. Allowed: jpg, jpeg, png, webp', 400);
    }
    if (!preg_match('/^[a-zA-Z0-9\-_.]+\.(jpg|jpeg|png|webp)$/i', $origName)) {
        sendError('Invalid filename format', 400);
    }

    // Validate actual file content type
    $mimeType     = mime_content_type($file['tmp_name']);
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($mimeType, $allowedMimes)) {
        sendError('Invalid file content type: ' . $mimeType, 400);
    }

    // Build and create destination directory
    $privateBase = realpath(__DIR__ . '/../../../private');
    if ($privateBase === false) {
        sendError('Server configuration error: private directory not found', 500);
    }

    $destDir = $privateBase . "/screening_images/{$sessionDate}/{$gridIdentifier}/{$mag}";
    if (!is_dir($destDir)) {
        if (!mkdir($destDir, 0755, true)) {
            sendError('Failed to create destination directory', 500);
        }
    }

    $destPath = $destDir . '/' . $origName;

    // Verify final path is within the expected base (defense-in-depth)
    $expectedBase = $privateBase . '/screening_images/';
    if (strpos(realpath($destDir) . '/', $expectedBase) !== 0) {
        sendError('Invalid destination path', 400);
    }

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        sendError('Failed to save uploaded file', 500);
    }

    error_log("Screening image uploaded: {$sessionDate}/{$gridIdentifier}/{$mag}/{$origName}");

    sendResponse([
        'success' => true,
        'path'    => "{$sessionDate}/{$gridIdentifier}/{$mag}/{$origName}"
    ]);
}

/**
 * List all screening images for a specific grid
 * Returns arrays of filenames for low and high magnification
 */
function listScreeningImages($sessionDate, $gridIdentifier) {
    try {
        $basePath = __DIR__ . "/../../../private/screening_images/{$sessionDate}/{$gridIdentifier}";
        
        $lowImages = [];
        $highImages = [];
        
        // Scan low magnification folder
        $lowPath = $basePath . "/low";
        if (is_dir($lowPath)) {
            $lowImages = scanImageFolder($lowPath);
        }
        
        // Scan high magnification folder
        $highPath = $basePath . "/high";
        if (is_dir($highPath)) {
            $highImages = scanImageFolder($highPath);
        }
        
        sendResponse([
            'sessionDate' => $sessionDate,
            'gridIdentifier' => $gridIdentifier,
            'low' => $lowImages,
            'high' => $highImages
        ]);
        
    } catch (Exception $e) {
        error_log("Error listing screening images: " . $e->getMessage());
        sendError('Failed to list screening images', 500);
    }
}

/**
 * Scan a folder for image files
 * Returns sorted array of filenames
 */
function scanImageFolder($folderPath) {
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    $images = [];
    
    $files = scandir($folderPath);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($extension, $allowedExtensions)) {
            $images[] = $file;
        }
    }
    
    // Sort alphabetically (allows users to control order with prefixes like 01_, 02_)
    sort($images, SORT_NATURAL | SORT_FLAG_CASE);
    
    return $images;
}

/**
 * Serve a specific screening image file
 */
function serveScreeningImage($sessionDate, $gridIdentifier, $magnification, $filename) {
    try {
        // Validate filename format (security)
        if (!preg_match('/^[a-zA-Z0-9\-_.]+\.(jpg|jpeg|png|webp)$/i', $filename)) {
            http_response_code(400);
            exit('Invalid filename format');
        }
        
        // Validate magnification
        if (!in_array($magnification, ['low', 'high'])) {
            http_response_code(400);
            exit('Invalid magnification type');
        }
        
        $imagePath = __DIR__ . "/../../../private/screening_images/{$sessionDate}/{$gridIdentifier}/{$magnification}/{$filename}";
        
        if (!file_exists($imagePath) || !is_file($imagePath)) {
            http_response_code(404);
            exit('Image not found');
        }
        
        // Security check: ensure the path is within the expected directory
        $realImagePath = realpath($imagePath);
        $expectedBasePath = realpath(__DIR__ . '/../../../private/screening_images/');
        
        if ($expectedBasePath === false || strpos($realImagePath, $expectedBasePath) !== 0) {
            http_response_code(403);
            exit('Access denied');
        }
        
        // Get and validate MIME type
        $mimeType = mime_content_type($imagePath);
        
        if (strpos($mimeType, 'image/') !== 0) {
            http_response_code(400);
            exit('Invalid file type');
        }
        
        // Serve the image with proper headers
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($imagePath));
        
        // Add caching headers for better performance
        header('Cache-Control: public, max-age=31536000'); // 1 year
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
        
        // Add security headers
        header('X-Content-Type-Options: nosniff');
        
        readfile($imagePath);
        exit;
        
    } catch (Exception $e) {
        error_log("Error serving screening image: " . $e->getMessage());
        http_response_code(500);
        exit('Internal server error');
    }
}
