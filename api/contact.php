<?php
// Saves a Contact-form message into MySQL (table: contact_messages).
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

function reply(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'POST only']);
}

// Accept JSON (from script.js) or a normal form post
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) { $in = $_POST; }

$name    = trim((string)($in['name'] ?? ''));
$email   = trim((string)($in['email'] ?? ''));
$message = trim((string)($in['message'] ?? ''));

if (!empty($in['website'])) {                      // honeypot: bots fill this in
    reply(200, ['ok' => true]);
}
if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    reply(422, ['ok' => false, 'error' => 'Please enter your name.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
    reply(422, ['ok' => false, 'error' => 'Please enter a valid email.']);
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 3000) {
    reply(422, ['ok' => false, 'error' => 'Message must be 10 to 3000 characters.']);
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    // Simple spam limit: max 5 messages per IP per hour
    $q = $pdo->prepare('SELECT COUNT(*) FROM contact_messages WHERE ip_address = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
    $q->execute([$ip]);
    if ((int)$q->fetchColumn() >= 5) {
        reply(429, ['ok' => false, 'error' => 'Too many messages. Please try again later.']);
    }

    // Prepared statement = safe from SQL injection
    $ins = $pdo->prepare('INSERT INTO contact_messages (name, email, message, ip_address) VALUES (?, ?, ?, ?)');
    $ins->execute([$name, $email, $message, $ip]);
    reply(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('contact.php: ' . $e->getMessage());
    reply(500, ['ok' => false, 'error' => 'Server error']);
}
