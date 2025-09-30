<?php
/**
 * TinyMCE Configuration Template
 * Copy this file to tinymce-config.php and add your actual API key
 * 
 * SECURITY NOTES:
 * - Never commit the actual tinymce-config.php file to version control
 * - Get your API key from https://www.tiny.cloud/
 * - Keep this file secure and outside the web root
 */

// TinyMCE API Key - Replace YOUR_API_KEY_HERE with your actual key
define('TINYMCE_API_KEY', 'YOUR_API_KEY_HERE');

// TinyMCE CDN Configuration
define('TINYMCE_CDN_VERSION', '6'); // TinyMCE version to use
define('TINYMCE_CDN_BASE', 'https://cdn.tiny.cloud/1');

/**
 * Get the complete TinyMCE CDN URL
 * @return string The complete CDN URL with API key
 */
function getTinyMCECdnUrl() {
    return TINYMCE_CDN_BASE . '/' . TINYMCE_API_KEY . '/tinymce/' . TINYMCE_CDN_VERSION . '/tinymce.min.js';
}

/**
 * Get just the API key for JavaScript usage
 * @return string The TinyMCE API key
 */
function getTinyMCEApiKey() {
    return TINYMCE_API_KEY;
}

/**
 * Output JavaScript configuration for TinyMCE
 * This creates a JavaScript object with the API key
 */
function outputTinyMCEJSConfig() {
    echo "window.TINYMCE_CONFIG = {\n";
    echo "    apiKey: '" . TINYMCE_API_KEY . "'\n";
    echo "};\n";
}