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
 */

function handleScreeningImages($method, $path, $db, $input = null) {
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
