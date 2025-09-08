<?php
function startSessionSafely() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function requireAuth() {
    startSessionSafely();
    
    if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
        try {
            $dotenv = Dotenv\Dotenv::createImmutable(__DIR__, ['.env.local', '.env.production', '.env']);
            $dotenv->safeLoad();
            
            if (empty($_ENV['OIDC_REDIRECT_URI'])) {
                die("Authentication configuration error: Please configure your environment file");
            }
            
            $redirectUri = $_ENV['OIDC_REDIRECT_URI'];
            header("Location: " . $redirectUri);
            exit;
        } catch (Exception $e) {
            die("Authentication setup error: " . $e->getMessage());
        }
    }
}

function getUserInfo() {
    startSessionSafely();
    return isset($_SESSION['user_info']) ? $_SESSION['user_info'] : null;
}

function getClaims() {
    startSessionSafely();
    return isset($_SESSION['claims']) ? $_SESSION['claims'] : null;
}

function isAuthenticated() {
    startSessionSafely();
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'];
}

function getUserEmail() {
    $userInfo = getUserInfo();
    return $userInfo ? $userInfo->email : null;
}

function getUserName() {
    $userInfo = getUserInfo();
    return $userInfo ? $userInfo->name : null;
}

function getUserSciper() {
    $claims = getClaims();
    return $claims && isset($claims->uniqueid) ? $claims->uniqueid : null;
}

function getUserGroups() {
    $claims = getClaims();
    if ($claims && isset($claims->groups)) {
        $group_list = array();
        foreach ($claims->groups as $ad_group_name) {
            $group_list[] = str_replace("_AppGrpU", "", $ad_group_name);
        }
        return implode(",", $group_list);
    }
    return "";
}
?>