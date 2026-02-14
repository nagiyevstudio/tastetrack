<?php
// Database configuration
$host = 'localhost';
$db_name = 'alterace_tt';
$username = 'alterace_tt';
$password = 'Q*c6!3yA$cxpYRakJ48n'; // Set your MySQL password here

// --- Auth configuration (single-password mode) ---
// IMPORTANT:
// 1) Set a long random pepper string.
// 2) Put SHA256(password + pepper) into app_auth.password_hash (id = 1).
$auth_password_pepper = '9dF3!xP7@kR2#uM8$hQ5^vL1&cN4*eJ6!tS0%wB3@zY';
$auth_session_ttl_seconds = 60 * 60 * 12; // 12h
$auth_rate_limit_max_attempts = 8;
$auth_rate_limit_window_seconds = 15 * 60; // 15m

// Frontend origins allowed to call this API with credentials (cookies).
// Add your production frontend origin here.
$auth_allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://tt.nagiyev.com'
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    // Don't leak credentials/DSN details to the client in production.
    error_log("TasteTrack DB connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Connection failed"]);
    exit();
}
?>

