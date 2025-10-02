<?php
/**
 * Blog Image Upload Handler
 * Handles image uploads for the TinyMCE blog editor
 */

class BlogImageUpload {
    private $uploadDir;
    private $allowedTypes;
    private $maxFileSize;
    
    public function __construct() {
        $this->uploadDir = __DIR__ . '/../../images/blog/';
        $this->allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $this->maxFileSize = 5 * 1024 * 1024; // 5MB
        
        // Create upload directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    /**
     * Handle image upload
     */
    public function handleUpload() {
        try {
            // Check if file was uploaded
            if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('No file uploaded or upload error occurred');
            }
            
            $file = $_FILES['image'];
            
            // Validate file type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $this->allowedTypes)) {
                throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
            }
            
            // Validate file size
            if ($file['size'] > $this->maxFileSize) {
                throw new Exception('File size too large. Maximum size is 5MB.');
            }
            
            // Generate unique filename
            $extension = $this->getExtensionFromMimeType($mimeType);
            $filename = $this->generateUniqueFilename($extension);
            $filepath = $this->uploadDir . $filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                throw new Exception('Failed to save uploaded file');
            }
            
            // Save to database
            $imageId = $this->saveToDatabase($filename, $file['name'], $mimeType, $file['size']);
            
            // Return success response
            $this->jsonResponse([
                'success' => true,
                'url' => '/images/blog/' . $filename,
                'id' => $imageId,
                'filename' => $filename
            ]);
            
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Get list of uploaded images
     */
    public function getImageList() {
        try {
            $db = Database::getInstance();
            
            $stmt = $db->prepare("
                SELECT id, filename, original_name, url, created_at 
                FROM blog_images 
                ORDER BY created_at DESC 
                LIMIT 100
            ");
            $stmt->execute();
            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->jsonResponse($images);
            
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Save image info to database
     */
    private function saveToDatabase($filename, $originalName, $mimeType, $size) {
        $db = Database::getInstance();
        
        $stmt = $db->prepare("
            INSERT INTO blog_images (filename, original_name, mime_type, file_size, url, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $url = '/images/blog/' . $filename;
        $stmt->execute([$filename, $originalName, $mimeType, $size, $url]);
        
        return $db->lastInsertId();
    }
    
    /**
     * Generate unique filename
     */
    private function generateUniqueFilename($extension) {
        do {
            $filename = date('Y-m-d_H-i-s_') . uniqid() . '.' . $extension;
            $filepath = $this->uploadDir . $filename;
        } while (file_exists($filepath));
        
        return $filename;
    }
    
    /**
     * Get file extension from MIME type
     */
    private function getExtensionFromMimeType($mimeType) {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        ];
        
        return $extensions[$mimeType] ?? 'jpg';
    }
    
    /**
     * Send JSON response
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}