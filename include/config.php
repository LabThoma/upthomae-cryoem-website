<?php
// Main config loader - detects environment and loads appropriate config
$isProduction = isset($_SERVER['HTTP_HOST']) && 
                (strpos($_SERVER['HTTP_HOST'], 'epfl.ch') !== false ||
                 strpos($_SERVER['HTTP_HOST'], 'your-university-domain') !== false);

if ($isProduction) {
    require_once __DIR__ . '/../private/config.production.php';
} else {
    require_once __DIR__ . '/../private/config.local.php';
}

// // Define website URL for entra redirects
// define('WEBSITE_URL', $isProduction ? 
//     'https://your-actual-site.epfl.ch' : 
//     'http://localhost/your-project'
// );
// ?>