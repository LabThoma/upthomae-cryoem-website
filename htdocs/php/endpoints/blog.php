<?php
function handleBlog($method, $path, $db, $input) {
    switch ($method) {
        case 'GET':
            if ($path === '/api/blog') {
                getBlogPosts($db);
            } elseif (preg_match('/^\/api\/blog\/([^\/]+)$/', $path, $matches)) {
                getBlogPost($db, $matches[1]);
            } elseif (preg_match('/^\/api\/blog\/image\/([^\/]+)\/([^\/]+)$/', $path, $matches)) {
                serveBlogImage($db, $matches[1], $matches[2]);
            } else {
                sendError('Blog endpoint not found', 404);
            }
            break;
            
        case 'POST':
            if ($path === '/api/blog') {
                createBlogPost($db, $input);
            } elseif ($path === '/api/blog/upload-image') {
                uploadBlogImage($db, $_POST, $_FILES);
            } else {
                sendError('Blog endpoint not found', 404);
            }
            break;
            
        case 'PUT':
            if (preg_match('/^\/api\/blog\/([^\/]+)$/', $path, $matches)) {
                updateBlogPost($db, $matches[1], $input);
            } else {
                sendError('Blog endpoint not found', 404);
            }
            break;
            
        case 'DELETE':
            if (preg_match('/^\/api\/blog\/([^\/]+)$/', $path, $matches)) {
                deleteBlogPost($db, $matches[1]);
            } else {
                sendError('Blog endpoint not found', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
}

function getBlogPosts($db) {
    try {
        $posts = $db->query("SELECT id, slug, title, category, author, created_at, updated_at, last_modified_by FROM blog_posts ORDER BY created_at DESC");
        
        // Add excerpt for each post
        foreach ($posts as &$post) {
            $contentFile = __DIR__ . "/../../../private/blog_content/posts/{$post['slug']}.html";
            if (file_exists($contentFile)) {
                $content = file_get_contents($contentFile);
                $post['excerpt'] = substr(strip_tags($content), 0, 300) . '...';
            } else {
                $post['excerpt'] = 'Content file not found.';
            }
        }
        
        sendResponse($posts);
    } catch (Exception $e) {
        error_log("Error fetching blog posts: " . $e->getMessage());
        sendError('Failed to fetch blog posts', 500);
    }
}

function getBlogPost($db, $slug) {
    try {
        $posts = $db->query("SELECT * FROM blog_posts WHERE slug = ?", [$slug]);
        $post = !empty($posts) ? $posts[0] : null;
        
        if (!$post) {
            sendError('Blog post not found', 404);
        }
        
        // Load content from file
        $contentFile = __DIR__ . "/../../../private/blog_content/posts/{$post['slug']}.html";
        if (file_exists($contentFile)) {
            $post['content'] = file_get_contents($contentFile);
        } else {
            $post['content'] = 'Content file not found.';
        }
        
        sendResponse($post);
    } catch (Exception $e) {
        error_log("Error fetching blog post: " . $e->getMessage());
        sendError('Failed to fetch blog post', 500);
    }
}

function createBlogPost($db, $input) {
    try {
        // Validate input
        if (!isset($input['title']) || !isset($input['content']) || !isset($input['category']) || !isset($input['author'])) {
            sendError('Missing required fields: title, content, category, author', 400);
        }
        
        // Generate slug from title
        $slug = generateSlug($input['title']);
        
        // Check if slug already exists and make it unique if needed
        $originalSlug = $slug;
        $counter = 1;
        while (slugExists($db, $slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        // Save content to file
        $contentFile = __DIR__ . "/../../../private/blog_content/posts/{$slug}.html";
        $contentDir = dirname($contentFile);
        if (!is_dir($contentDir)) {
            mkdir($contentDir, 0755, true);
        }
        
        // Process and save content
        $processedContent = processImagePaths($input['content'], $slug);
        file_put_contents($contentFile, $processedContent);
        
        // Create image directory for this post
        $imageDir = __DIR__ . "/../../../private/blog_content/images/{$slug}";
        if (!is_dir($imageDir)) {
            mkdir($imageDir, 0755, true);
        }
        
        // Insert post metadata into database
        $excerpt = substr(strip_tags($input['content']), 0, 500);
        $result = $db->execute("INSERT INTO blog_posts (slug, title, content, category, author, last_modified_by) VALUES (?, ?, ?, ?, ?, ?)", [
            $slug,
            $input['title'],
            $excerpt, // Store excerpt in content field for quick access
            $input['category'],
            $input['author'],
            $input['author']
        ]);
        
        $postId = $result['insertId'];
        
        sendResponse([
            'success' => true,
            'id' => $postId,
            'slug' => $slug,
            'message' => 'Blog post created successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error creating blog post: " . $e->getMessage());
        sendError('Failed to create blog post', 500);
    }
}

function updateBlogPost($db, $slug, $input) {
    try {
        // Get existing post
        $posts = $db->query("SELECT * FROM blog_posts WHERE slug = ?", [$slug]);
        $existingPost = !empty($posts) ? $posts[0] : null;
        
        if (!$existingPost) {
            sendError('Blog post not found', 404);
        }
        
        // Update content file
        $contentFile = __DIR__ . "/../../../private/blog_content/posts/{$slug}.html";
        if (isset($input['content'])) {
            $processedContent = processImagePaths($input['content'], $slug);
            file_put_contents($contentFile, $processedContent);
        }
        
        // Update database record
        $updateFields = [];
        $updateValues = [];
        
        if (isset($input['title'])) {
            $updateFields[] = 'title = ?';
            $updateValues[] = $input['title'];
        }
        
        if (isset($input['category'])) {
            $updateFields[] = 'category = ?';
            $updateValues[] = $input['category'];
        }
        
        if (isset($input['content'])) {
            $excerpt = substr(strip_tags($input['content']), 0, 500);
            $updateFields[] = 'content = ?';
            $updateValues[] = $excerpt;
        }
        
        if (isset($input['last_modified_by'])) {
            $updateFields[] = 'last_modified_by = ?';
            $updateValues[] = $input['last_modified_by'];
        }
        
        if (!empty($updateFields)) {
            $updateValues[] = $slug;
            $sql = "UPDATE blog_posts SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE slug = ?";
            $db->execute($sql, $updateValues);
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Blog post updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error updating blog post: " . $e->getMessage());
        sendError('Failed to update blog post', 500);
    }
}

function deleteBlogPost($db, $slug) {
    try {
        // Get post to verify it exists
        $posts = $db->query("SELECT id FROM blog_posts WHERE slug = ?", [$slug]);
        $post = !empty($posts) ? $posts[0] : null;
        
        if (!$post) {
            sendError('Blog post not found', 404);
        }
        
        // Delete from database (images will be cascade deleted)
        $db->execute("DELETE FROM blog_posts WHERE slug = ?", [$slug]);
        
        // Delete content file
        $contentFile = __DIR__ . "/../../../private/blog_content/posts/{$slug}.html";
        if (file_exists($contentFile)) {
            unlink($contentFile);
        }
        
        // Delete images directory
        $imageDir = __DIR__ . "/../../../private/blog_content/images/{$slug}";
        if (is_dir($imageDir)) {
            removeDirectory($imageDir);
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Blog post deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error deleting blog post: " . $e->getMessage());
        sendError('Failed to delete blog post', 500);
    }
}

function uploadBlogImage($db, $postData, $files) {
    try {
        if (!isset($files['image']) || !isset($postData['post_slug'])) {
            sendError('Missing image file or post slug', 400);
        }
        
        $file = $files['image'];
        $postSlug = $postData['post_slug'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!in_array($file['type'], $allowedTypes)) {
            sendError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG', 400);
        }
        
        // Validate file size (5MB max)
        if ($file['size'] > 5 * 1024 * 1024) {
            sendError('File too large. Maximum size: 5MB', 400);
        }
        
        // Create image directory if it doesn't exist
        $imageDir = __DIR__ . "/../../../private/blog_content/images/{$postSlug}";
        if (!is_dir($imageDir)) {
            mkdir($imageDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = time() . '_' . uniqid() . '.' . $extension;
        $targetPath = "{$imageDir}/{$filename}";
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Record in database
            $db->execute("INSERT INTO blog_images (post_id, filename, original_name, uploaded_by) SELECT id, ?, ?, ? FROM blog_posts WHERE slug = ?", [
                $filename,
                $file['name'],
                $postData['uploaded_by'] ?? 'Unknown',
                $postSlug
            ]);
            
            sendResponse([
                'success' => true,
                'filename' => $filename,
                'message' => 'Image uploaded successfully'
            ]);
        } else {
            sendError('Failed to upload image', 500);
        }
        
    } catch (Exception $e) {
        error_log("Error uploading image: " . $e->getMessage());
        sendError('Failed to upload image', 500);
    }
}

function serveBlogImage($db, $slug, $filename) {
    try {
        // Verify the image request is for a published post
        $posts = $db->query("SELECT id FROM blog_posts WHERE slug = ?", [$slug]);
        
        if (empty($posts)) {
            http_response_code(404);
            exit('Image not found');
        }
        
        // Validate slug and filename format (basic security)
        if (!preg_match('/^[a-z0-9\-]+$/', $slug) || !preg_match('/^[a-zA-Z0-9\-_.]+\.(jpg|jpeg|png|gif|webp|svg)$/i', $filename)) {
            http_response_code(400);
            exit('Invalid request format');
        }
        
        $imagePath = __DIR__ . "/../../../private/blog_content/images/{$slug}/{$filename}";
        
        if (!file_exists($imagePath) || !is_file($imagePath)) {
            http_response_code(404);
            exit('Image not found');
        }
        
        // Security check: ensure the path is within the expected directory
        $realImagePath = realpath($imagePath);
        $expectedBasePath = realpath(__DIR__ . '/../../../private/blog_content/images/');
        
        if (strpos($realImagePath, $expectedBasePath) !== 0) {
            http_response_code(403);
            exit('Access denied');
        }
        
        // Serve the image with proper headers
        $mimeType = mime_content_type($imagePath);
        
        // Validate that it's actually an image
        if (strpos($mimeType, 'image/') !== 0) {
            http_response_code(400);
            exit('Invalid file type');
        }
        
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
        error_log("Error serving blog image: " . $e->getMessage());
        http_response_code(500);
        exit('Internal server error');
    }
}

// Helper functions
function generateSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

function slugExists($db, $slug) {
    $result = $db->query("SELECT COUNT(*) as count FROM blog_posts WHERE slug = ?", [$slug]);
    return $result[0]['count'] > 0;
}

function processImagePaths($content, $slug) {
    // Convert local image references to API calls
    return preg_replace(
        '/src="images\/([^"]+)"/i',
        'src="/api/blog/image/' . $slug . '/$1"',
        $content
    );
}

function removeDirectory($dir) {
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (is_dir($dir . "/" . $object) && !is_link($dir . "/" . $object)) {
                    removeDirectory($dir . "/" . $object);
                } else {
                    unlink($dir . "/" . $object);
                }
            }
        }
        rmdir($dir);
    }
}
?>