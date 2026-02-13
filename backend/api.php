<?php
require_once __DIR__ . '/config.php';

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
}

function getJsonInput() {
    return json_decode(file_get_contents("php://input"), true);
}

function attachRecords($pdo, $product) {
    if (!$product) return null;
    $stmt = $pdo->prepare("SELECT * FROM product_records WHERE product_id = ? ORDER BY record_date DESC");
    $stmt->execute([$product['id']]);
    $product['records'] = $stmt->fetchAll();
    return $product;
}

function getClientIp() {
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') return trim(explode(',', $forwarded)[0]);
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function getRateLimitFile() {
    return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tastetrack_auth_rate_limit.json';
}

function readRateLimitState() {
    $file = getRateLimitFile();
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    if ($raw === false || trim($raw) === '') return [];
    $json = json_decode($raw, true);
    return is_array($json) ? $json : [];
}

function writeRateLimitState($state) {
    $file = getRateLimitFile();
    file_put_contents($file, json_encode($state), LOCK_EX);
}

function getAttemptsForIp($state, $ip, $windowSeconds) {
    $now = time();
    $attempts = $state[$ip] ?? [];
    if (!is_array($attempts)) return [];
    return array_values(array_filter($attempts, function ($ts) use ($now, $windowSeconds) {
        return is_int($ts) && ($now - $ts) < $windowSeconds;
    }));
}

function isRateLimited($ip, $maxAttempts, $windowSeconds, &$retryAfterSeconds = 0) {
    $state = readRateLimitState();
    $attempts = getAttemptsForIp($state, $ip, $windowSeconds);
    if (count($attempts) < $maxAttempts) {
        $retryAfterSeconds = 0;
        return false;
    }
    $oldest = min($attempts);
    $retryAfterSeconds = max(1, $windowSeconds - (time() - $oldest));
    return true;
}

function recordFailedLogin($ip, $windowSeconds) {
    $state = readRateLimitState();
    $state[$ip] = getAttemptsForIp($state, $ip, $windowSeconds);
    $state[$ip][] = time();
    writeRateLimitState($state);
}

function clearFailedLogins($ip) {
    $state = readRateLimitState();
    unset($state[$ip]);
    writeRateLimitState($state);
}

function destroyAuthSession() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function isAuthenticated($ttlSeconds) {
    $isAuthed = !empty($_SESSION['tt_auth_ok']);
    if (!$isAuthed) return false;

    $lastSeen = (int)($_SESSION['tt_auth_last_seen'] ?? 0);
    if ($lastSeen === 0 || (time() - $lastSeen) > $ttlSeconds) {
        destroyAuthSession();
        return false;
    }

    $_SESSION['tt_auth_last_seen'] = time();
    return true;
}

function fetchStoredPasswordHash($pdo) {
    $stmt = $pdo->prepare("SELECT password_hash FROM app_auth WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    if (!$row) return null;
    $hash = trim((string)($row['password_hash'] ?? ''));
    return $hash !== '' ? strtolower($hash) : null;
}

// --- CORS ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $auth_allowed_origins ?? [];

if ($origin !== '') {
    if (!in_array($origin, $allowedOrigins, true)) {
        header("Content-Type: application/json; charset=UTF-8");
        sendJson(["error" => "Origin not allowed"], 403);
        exit();
    }
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Session ---
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
session_name('tt_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

$action = $_GET['action'] ?? '';
$publicActions = ['check', 'auth_status', 'login', 'logout'];

if (!in_array($action, $publicActions, true) && !isAuthenticated((int)$auth_session_ttl_seconds)) {
    sendJson(["error" => "Unauthorized"], 401);
    exit();
}

// --- Router ---
try {
    switch ($action) {
        case 'check':
            sendJson(["status" => "ok"]);
            break;

        case 'auth_status':
            sendJson(["authenticated" => isAuthenticated((int)$auth_session_ttl_seconds)]);
            break;

        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendJson(["error" => "Method not allowed"], 405);
                break;
            }

            if ($auth_password_pepper === 'change-this-pepper-to-a-long-random-string') {
                sendJson(["error" => "Auth not configured: change auth pepper in backend/config.php"], 500);
                break;
            }

            $input = getJsonInput();
            $passwordInput = trim((string)($input['password'] ?? ''));
            if ($passwordInput === '') {
                sendJson(["error" => "Password is required"], 400);
                break;
            }

            $ip = getClientIp();
            $retryAfter = 0;
            if (isRateLimited($ip, (int)$auth_rate_limit_max_attempts, (int)$auth_rate_limit_window_seconds, $retryAfter)) {
                sendJson([
                    "error" => "Too many login attempts",
                    "retry_after_seconds" => $retryAfter
                ], 429);
                break;
            }

            $storedHash = fetchStoredPasswordHash($pdo);
            if (!$storedHash) {
                sendJson(["error" => "Auth hash is not configured in app_auth table"], 500);
                break;
            }

            $incomingHash = hash('sha256', $passwordInput . $auth_password_pepper);
            if (!hash_equals($storedHash, strtolower($incomingHash))) {
                recordFailedLogin($ip, (int)$auth_rate_limit_window_seconds);
                sendJson(["error" => "Invalid password"], 401);
                break;
            }

            clearFailedLogins($ip);
            session_regenerate_id(true);
            $_SESSION['tt_auth_ok'] = true;
            $_SESSION['tt_auth_last_seen'] = time();
            sendJson(["status" => "ok"]);
            break;

        case 'logout':
            if (session_status() === PHP_SESSION_ACTIVE) {
                destroyAuthSession();
            }
            sendJson(["status" => "ok"]);
            break;

        case 'get_all_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll();
            foreach ($products as &$p) {
                $p = attachRecords($pdo, $p);
            }
            sendJson($products);
            break;

        case 'get_product':
            $id = $_GET['id'] ?? null;
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(attachRecords($pdo, $stmt->fetch()));
            break;

        case 'get_product_by_barcode':
            $barcode = $_GET['barcode'] ?? null;
            $stmt = $pdo->prepare("SELECT * FROM products WHERE barcode = ?");
            $stmt->execute([$barcode]);
            sendJson(attachRecords($pdo, $stmt->fetch()));
            break;

        case 'search':
            $query = "%" . ($_GET['query'] ?? '') . "%";
            $stmt = $pdo->prepare("SELECT * FROM products WHERE name LIKE ?");
            $stmt->execute([$query]);
            $products = $stmt->fetchAll();
            foreach ($products as &$p) {
                $p = attachRecords($pdo, $p);
            }
            sendJson($products);
            break;

        case 'create_product':
            $data = getJsonInput();
            if (!$data) throw new Exception("No data provided");

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("INSERT INTO products (barcode, name, category_id, photo) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['barcode'], $data['name'], $data['category_id'], $data['photo'] ?? null]);
            $productId = $pdo->lastInsertId();

            $stmt2 = $pdo->prepare("INSERT INTO product_records (product_id, rating, price, notes) VALUES (?, ?, ?, ?)");
            $stmt2->execute([$productId, $data['rating'], $data['price'], $data['notes'] ?? null]);

            $pdo->commit();

            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            sendJson(attachRecords($pdo, $stmt->fetch()));
            break;

        case 'add_record':
            $data = getJsonInput();
            $stmt = $pdo->prepare("INSERT INTO product_records (product_id, rating, price, notes) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['product_id'], $data['rating'], $data['price'], $data['notes'] ?? null]);
            $recordId = $pdo->lastInsertId();

            $stmt = $pdo->prepare("SELECT * FROM product_records WHERE id = ?");
            $stmt->execute([$recordId]);
            sendJson($stmt->fetch());
            break;

        case 'delete_product':
            $data = getJsonInput();
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$data['id']]);
            sendJson(["status" => "deleted"]);
            break;

        default:
            sendJson(["error" => "Invalid action"], 400);
            break;
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    sendJson(["error" => $e->getMessage()], 500);
}
?>
