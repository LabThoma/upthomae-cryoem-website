<?php
require_once(__DIR__ . '/../vendor/autoload.php');
use Jumbojett\OpenIDConnectClient;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Start session safely
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    // Initialize OpenID Connect client
    $oidc = new OpenIDConnectClient($_ENV['AUTH_URL'], $_ENV['CLIENT_ID'], $_ENV['CLIENT_SECRET']);
    $oidc->setRedirectURL($_ENV['OIDC_REDIRECT_URI']);
    $oidc->addScope(['openid', 'profile', 'email']);
    $oidc->setResponseTypes(['code']);
    
    // Authenticate user
    $oidc->authenticate();
    
    // Get user information
    $_SESSION['user_info'] = $oidc->requestUserInfo();
    $_SESSION['claims'] = $oidc->getVerifiedClaims();
    $_SESSION['authenticated'] = true;
    
    // Redirect back to main page
    header("Location: ../index.php");
    exit;
    
} catch (Exception $e) {
    error_log("Authentication error: " . $e->getMessage());
    header("Location: ../index.php?error=auth_failed");
    exit;
}
?>