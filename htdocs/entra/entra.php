<?php
require_once(__DIR__ . '/../vendor/autoload.php');
use Jumbojett\OpenIDConnectClient;

// Load environment variables
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__, ['.env.local', '.env.production', '.env']);
    $dotenv->safeLoad();
} catch (Exception $e) {
    die("Environment configuration error: " . $e->getMessage());
}

// Validate required environment variables
$required_vars = ['AUTH_URL', 'CLIENT_ID', 'CLIENT_SECRET', 'OIDC_REDIRECT_URI'];
foreach ($required_vars as $var) {
    if (empty($_ENV[$var])) {
        die("Missing required environment variable: " . $var);
    }
}

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
    echo "Authentication failed: " . $e->getMessage();
    exit;
}
?>