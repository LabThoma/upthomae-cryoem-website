<?php
// Load environment variables
require_once(__DIR__ . '/../vendor/autoload.php');
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__, ['.env.local', '.env.production', '.env']);
    $dotenv->safeLoad();
} catch (Exception $e) {
    die("Environment configuration error: " . $e->getMessage());
}

session_start();

// Clear all session data
$_SESSION = array();

// If cookies are used for session, delete the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session
session_destroy();

// Construct Azure AD logout URL
$auth_url = $_ENV['AUTH_URL'];

// Determine the redirect URI - use OIDC_REDIRECT_URI if set, otherwise construct dynamically
if (!empty($_ENV['OIDC_REDIRECT_URI'])) {
    $redirect_uri = $_ENV['OIDC_REDIRECT_URI'];
} else {
    // Dynamically construct based on current request
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $redirect_uri = $protocol . '://' . $host . '/index.php';
}

$post_logout_redirect_uri = urlencode($redirect_uri);

// Extract tenant ID from AUTH_URL
// AUTH_URL is typically: https://login.microsoftonline.com/{tenant-id}/v2.0
$tenant_id = null;
if (preg_match('/login\.microsoftonline\.com\/([^\/]+)/', $auth_url, $matches)) {
    $tenant_id = $matches[1];
}

// Construct proper logout URL
if ($tenant_id) {
    $logout_url = "https://login.microsoftonline.com/{$tenant_id}/oauth2/v2.0/logout?post_logout_redirect_uri=" . $post_logout_redirect_uri;
} else {
    // Fallback: try to construct from AUTH_URL
    $base_url = preg_replace('/\/v2\.0$/', '', $auth_url);
    $logout_url = $base_url . "/oauth2/v2.0/logout?post_logout_redirect_uri=" . $post_logout_redirect_uri;
}

// Redirect to Azure AD logout
header("Location: " . $logout_url);
exit;
?>