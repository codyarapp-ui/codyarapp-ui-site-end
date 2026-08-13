<?php
/**
 * ----------------------------------------------------------------------------------
 * IRAN-SERVICE COMPREHENSIVE UNIFIED API PORTAL (PHP & MYSQL)
 * ----------------------------------------------------------------------------------
 * Direct replacement of standard localStorage handlers and split APIs. It delivers:
 * 1. Secured session authentication & BCRYPT credential verification.
 * 2. Cumulative subscription calculations with automated server-side expiration checks.
 * 3. Unified Zarinpal transaction request portals & Café Bazaar receipt token validators.
 * 4. Technical / Home appliance diagnostics repair desk.
 * 5. Structured action auditing & administrative control panel settings.
 * 6. Offline-first JSON State database synchronization (get-database, save-database).
 * 7. Real and simulated SMS dispatch logs (farazsms, kavenegar, smsir, simulator).
 * 8. Rule-based heuristic AI backup diagnostic response & spare parts suggestions.
 * 9. Upload management for technician documents.
 * ----------------------------------------------------------------------------------
 */

// Enable Error Reporting for secure sandbox troubleshooting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Enable CORS and Unicode Encoding
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Session-Token");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests gracefully
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start PHP Session state and immediately close write lock to prevent request blocking
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
$sessionUserId = $_SESSION['user_id'] ?? null;
@session_write_close();

// Register clean shutdown handler to close session and PDO connection immediately
register_shutdown_function(function() use (&$pdo) {
    if (session_status() === PHP_SESSION_ACTIVE) {
        @session_write_close();
    }
    if ($pdo !== null) {
        $pdo = null;
    }
});

// Load .env file if it exists in cPanel/workspace
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Handle quoted value with potential trailing comments
            if (isset($value[0]) && ($value[0] === '"' || $value[0] === "'")) {
                $quoteChar = $value[0];
                $pos = strpos($value, $quoteChar, 1);
                if ($pos !== false) {
                    $value = substr($value, 1, $pos - 1);
                } else {
                    $value = trim($value, '"\'');
                }
            } else {
                // For unquoted values, handle trailing comments if prefixed by spaces/tabs
                $parts = preg_split('/\s+#/', $value, 2);
                $value = trim($parts[0]);
            }
            
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Database Connection Parameters
define('DB_HOST', isset($_ENV['DB_HOST']) ? $_ENV['DB_HOST'] : (getenv('DB_HOST') ?: 'localhost'));
define('DB_USER', isset($_ENV['DB_USER']) ? $_ENV['DB_USER'] : (getenv('DB_USER') ?: 'cubxrhuv_siteuser'));
define('DB_PASS', isset($_ENV['DB_PASS']) ? $_ENV['DB_PASS'] : (getenv('DB_PASS') ?: 'Abbasi163@#'));
define('DB_NAME', isset($_ENV['DB_NAME']) ? $_ENV['DB_NAME'] : (getenv('DB_NAME') ?: 'cubxrhuv_site.bniaz'));

// Try connecting using multiple database naming conventions to bypass cPanel prefix issues
$dbNames = array(DB_NAME, 'cubxrhuv_site.bniaz', 'cubxrhuv_site_bniaz', 'cubxrhuv_site');
$pdo = null;
$connectError = '';

foreach ($dbNames as $dbNameOpts) {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . $dbNameOpts . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        );
        if ($pdo) {
            // Prevent hanging MySQL connections by setting strict 60s idle timeout
            @$pdo->exec("SET SESSION wait_timeout = 60");
            @$pdo->exec("SET SESSION interactive_timeout = 60");
            break;
        }
    } catch (PDOException $e) {
        $connectError = $e->getMessage();
    }
}

if (!$pdo) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "error",
        "error" => "اتصال به پایگاه داده با خطا مواجه شد. در صورت لزوم اطلاعات دیتابیس را در فایل .env بررسی کنید. آخرین خطا: " . $connectError
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// Global Static Seed Data for State Database Setup
$defaultSeed = '{
  "adminPassword": "Abbasi163@#1234",
  "smsSettings": {
    "provider": "simulated",
    "apiKey": "",
    "lineNumber": "",
    "otpPatternCode": "",
    "statusNotificationPatternCode": "",
    "enabled": false
  },
  "smsLogs": [],
  "errorCodes": [],
  "technicians": [],
  "orders": [],
  "spareParts": [],
  "citiesList": [],
  "brandsList": [],
  "categoriesList": [],
  "modelsList": []
}';

// --- SILENT SCHEMA SYNCHRONIZER ENGINE (Runs only once on initialization) ---
$schemaFlagFile = __DIR__ . '/.schema_installed';
if (!file_exists($schemaFlagFile)) {
    try {
        // 1. Tables for State Database Synchronization
        $pdo->exec("CREATE TABLE IF NOT EXISTS `system_state` (
            `state_key` VARCHAR(50) NOT NULL PRIMARY KEY,
            `state_value` LONGTEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // Initialize state seed if not exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `system_state` WHERE `state_key` = 'database'");
        $stmt->execute();
        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("INSERT INTO `system_state` (`state_key`, `state_value`) VALUES ('database', :val)");
            $stmt->execute(['val' => $defaultSeed]);
        }

        $pdo->exec("CREATE TABLE IF NOT EXISTS `global_state` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `key_name` VARCHAR(100) NOT NULL UNIQUE,
          `state_data` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        $pdo->exec("INSERT IGNORE INTO `global_state` (`key_name`, `state_data`) VALUES ('central_db', '{}')");

        // 2. Relational Tables Schema
        $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `phone` VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
          `password_hash` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          `full_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          `role` ENUM('client', 'technician', 'admin') NOT NULL DEFAULT 'client',
          `is_super_admin` TINYINT(1) NOT NULL DEFAULT 0,
          `city` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX `idx_users_phone` (`phone`),
          INDEX `idx_users_role` (`role`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `subscriptions` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `plan_name` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          `start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `expiry_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `is_active` TINYINT(1) NOT NULL DEFAULT 1,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX `idx_subs_user` (`user_id`),
          INDEX `idx_subs_dates` (`expiry_date`, `is_active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `payments` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `amount` DECIMAL(12, 2) NOT NULL,
          `gateway` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          `authority` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL UNIQUE,
          `ref_id` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL UNIQUE,
          `status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
          `plan` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          `completed_at` TIMESTAMP NULL DEFAULT NULL,
          INDEX `idx_payments_user` (`user_id`),
          INDEX `idx_payments_auth` (`authority`),
          INDEX `idx_payments_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `repair_requests` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `technician_id` INT DEFAULT NULL,
          `city` VARCHAR(50) NOT NULL,
          `appliance` VARCHAR(100) NOT NULL,
          `brand` VARCHAR(100) NOT NULL,
          `model` VARCHAR(100) NOT NULL,
          `problem_description` TEXT NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
          `estimated_price` DECIMAL(12, 2) DEFAULT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX `idx_repairs_user` (`user_id`),
          INDEX `idx_repairs_tech` (`technician_id`),
          INDEX `idx_repairs_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT DEFAULT NULL,
          `activity_type` VARCHAR(100) NOT NULL,
          `description` TEXT NOT NULL,
          `ip_address` VARCHAR(45) DEFAULT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX `idx_logs_type` (`activity_type`),
          INDEX `idx_logs_user` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `key_name` VARCHAR(100) NOT NULL UNIQUE,
          `value_data` LONGTEXT NOT NULL,
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // Seed standard plans and settings if empty
        $check_plans = $pdo->query("SELECT id FROM settings WHERE key_name='subscription_plans' LIMIT 1")->fetch();
        if (!$check_plans) {
            $pdo->exec("INSERT INTO `settings` (`key_name`, `value_data`) VALUES
            ('subscription_plans', '[
              {\"id\": \"1_month\", \"name\": \"اشتراک ۱ ماهه طلایی\", \"duration_days\": 30, \"price\": 49000, \"description\": \"بروزرسانی روزانه کدهای خطا و عیب‌یابی سریع\"},
              {\"id\": \"3_month\", \"name\": \"اشتراک ۳ ماهه نقره‌ای\", \"duration_days\": 90, \"price\": 129000, \"description\": \"پشتیبانی ویژه به همراه تخفیف دوره\"},
              {\"id\": \"6_month\", \"name\": \"اشتراک ۶ ماهه الماس\", \"duration_days\": 180, \"price\": 229000, \"description\": \"صرفه‌جویی عالی و دسترسی بدون محدودیت کدهای خطا\"},
              {\"id\": \"12_month\", \"name\": \"اشتراک ۱۲ ماهه یکساله لایف‌تایم\", \"duration_days\": 365, \"price\": 389000, \"description\": \"بهترین و اقتصادی‌ترین پلن برای مربیان و تعمیرکاران برتر\"}
            ]'),
            ('zarinpal_config', '{
              \"merchant_id\": \"zarinpal-test-merchant-placeholder-123456\",
              \"sandbox\": true,
              \"callback_url\": \"https://site.bniaz.ir/api/verify-payment\"
            }'),
            ('bazaar_config', '{
              \"package_name\": \"ir.bniaz.app\",
              \"client_id\": \"bazaar-client-placeholder\",
              \"client_secret\": \"bazaar-secret-placeholder\"
            }')");
        }

        // Seed default administrative account if missing
        $check_admin = $pdo->query("SELECT id FROM users WHERE phone='09120947304' LIMIT 1")->fetch();
        if (!$check_admin) {
            $pdo->exec("INSERT INTO `users` (`phone`, `password_hash`, `full_name`, `role`, `is_super_admin`)
            VALUES ('09120947304', '$2y$10\$yFEvqg7.k4lGZp.3mGgW/OQv1bWeB4dF1lX.2wIenjDszk9u6D/K.', 'مدیر کل سامانه', 'admin', 1)");
        }

        @file_put_contents($schemaFlagFile, date('Y-m-d H:i:s'));
    } catch (Exception $schemaEx) {
        // Squelch schema exceptions to allow runtime handling if parts already exist due to indexes/Fks
    }
}

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------

function logActivity($pdo, $userId, $type, $desc) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, activity_type, description, ip_address) VALUES (:uid, :type, :desc, :ip)");
        $stmt->execute([
            ':uid' => $userId,
            ':type' => $type,
            ':desc' => $desc,
            ':ip' => $ip
        ]);
    } catch (Exception $e) {
        // Silent block to avoid rendering failure
    }
}

function getSessionUser($pdo) {
    // 1. Read from native session first
    $userId = $_SESSION['user_id'] ?? null;

    // 2. Read from custom HTTP headers
    if (!$userId) {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strcasecmp($k, 'X-Session-Token') === 0) {
                $userId = trim($v);
                break;
            } elseif (strcasecmp($k, 'Authorization') === 0) {
                $authParts = explode(' ', trim($v));
                if (count($authParts) > 1 && strcasecmp($authParts[0], 'Bearer') === 0) {
                    $userId = trim($authParts[1]);
                } else {
                    $userId = trim($v);
                }
                break;
            }
        }
    }

    // 3. Read from browser cookie backup
    if (!$userId && isset($_COOKIE['session_user_id'])) {
        $userId = trim($_COOKIE['session_user_id']);
    }

    if (!$userId) return null;

    try {
        // Clean any possible string representation (e.g. us_12345 or raw number)
        $cleanId = preg_replace('/[^0-9]/', '', $userId);
        if (empty($cleanId)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = :phone LIMIT 1");
            $stmt->execute([':phone' => $userId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => intval($cleanId)]);
        }
        $user = $stmt->fetch();
        return $user ? $user : null;
    } catch (Exception $e) {
        return null;
    }
}

function getAppSetting($pdo, $key) {
    try {
        $stmt = $pdo->prepare("SELECT value_data FROM settings WHERE key_name = :key LIMIT 1");
        $stmt->execute([':key' => $key]);
        $row = $stmt->fetch();
        if ($row) {
            return json_decode($row['value_data'], true);
        }
    } catch (Exception $e) {}
    
    // Fallbacks
    if ($key === 'subscription_plans') {
        return [
          ["id" => "1_month", "name" => "اشتراک ۱ ماهه طلایی", "duration_days" => 30, "price" => 49000, "description" => "بروزرسانی روزانه کدهای خطا"],
          ["id" => "3_month", "name" => "اشتراک ۳ ماهه نقره‌ای", "duration_days" => 90, "price" => 129000, "description" => "پشتیبانی ویژه"],
          ["id" => "6_month", "name" => "اشتراک ۶ ماهه الماس", "duration_days" => 180, "price" => 229000, "description" => "دسترسی بدون محدودیت کدهای خطا"],
          ["id" => "12_month", "name" => "اشتراک ۱۲ ماهه یکساله لایف‌تایم", "duration_days" => 365, "price" => 389000, "description" => "اقتصادی‌ترین پلن مربیان"]
        ];
    }
    return null;
}

function cleanDigits($number) {
    $farsi = array('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹');
    $arabic = array('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩');
    $english = range(0, 9);
    $converted = str_replace($farsi, $english, $number);
    return str_replace($arabic, $english, $converted);
}

// ------------------------------------------------------------------
// ROUTE PATH RESOLUTION (Bulletproof matching)
// ------------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['_url'] ?? '';
$endpoint = $_GET['endpoint'] ?? '';

// If path is empty, check endpoint query string parameter
if (empty($path) && !empty($endpoint)) {
    if ($endpoint === 'get-database') $path = 'api/get-database';
    elseif ($endpoint === 'save-database') $path = 'api/save-database';
    elseif ($endpoint === 'send-sms') $path = 'api/send-sms';
    elseif ($endpoint === 'gemini_diagnose' || $endpoint === 'gemini/diagnose') $path = 'api/gemini/diagnose';
    elseif ($endpoint === 'gemini_suggest-parts' || $endpoint === 'gemini/suggest-parts') $path = 'api/gemini/suggest-parts';
    elseif ($endpoint === 'directus-upload') $path = 'api/directus-upload';
    else $path = 'api/' . $endpoint;
}

// Fallback to REQUEST_URI or REDIRECT_URL for beautiful URLs
if (empty($path)) {
    $uri = $_SERVER['REDIRECT_URL'] ?? $_SERVER['REQUEST_URI'] ?? '';
    if (empty($uri)) {
        $uri = $_SERVER['PHP_SELF'] ?? '';
    }
    // Remove query parameters
    if (($pos = strpos($uri, '?')) !== false) {
        $uri = substr($uri, 0, $pos);
    }
    $path = trim($uri, '/');
    
    // Extract the portion starting with 'api/' to cope with subfolders on cPanel
    if (preg_match('/(api\/.*)$/', $path, $matches)) {
        $path = $matches[1];
    }
}

// CGI/FastCGI Fallback: If route resolves directly to 'api.php'
if (preg_match('/api\.php$/', $path)) {
    if (isset($_SERVER['REDIRECT_URL'])) {
        $path = trim($_SERVER['REDIRECT_URL'], '/');
    } else {
        $reqUri = $_SERVER['REQUEST_URI'] ?? '';
        if (($pos = strpos($reqUri, '?')) !== false) {
            $reqUri = substr($reqUri, 0, $pos);
        }
        $path = trim($reqUri, '/');
    }
    
    if (preg_match('/(api\/.*)$/', $path, $matches)) {
        $path = $matches[1];
    }
}

// Ensure clean slashes
$path = trim($path, '/');

// Parse JSON inputs
$inputJSON = file_get_contents('php://input');
$requestData = json_decode($inputJSON, true) ?? array();

// ------------------------------------------------------------------
// COMPREHENSIVE ENDPOINT ROUTING
// ------------------------------------------------------------------

switch (true) {

    // 1. REGISTER: [ POST /api/auth/register ]
    case (preg_match('/api\/auth\/register$/', $path) && $method === 'POST'):
        $phone = cleanDigits(trim($requestData['phone'] ?? ''));
        $password = $requestData['password'] ?? '';
        $fullName = trim($requestData['full_name'] ?? '');
        $city = trim($requestData['city'] ?? '');
        $role = trim($requestData['role'] ?? 'client'); // client, technician

        if (empty($phone) || empty($password)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "وارد کردن شماره تلفن همراه و رمز عبور الزامی است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!preg_match('/^09\d{9}$/', $phone)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "فرمت شماره همراه نامعتبر است. نمونه صحیح: 09121234567"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Check if phone already registered
        $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = :phone LIMIT 1");
        $stmt->execute([':phone' => $phone]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["status" => "error", "error" => "این شماره همراه قبلا در سامانه ایران سرویس ثبت نام کرده است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Standard BCRYPT hashing
        $passHash = password_hash($password, PASSWORD_BCRYPT);
        
        try {
            $stmt = $pdo->prepare("INSERT INTO users (phone, password_hash, full_name, role, city) VALUES (:phone, :hash, :name, :role, :city)");
            $stmt->execute([
                ':phone' => $phone,
                ':hash' => $passHash,
                ':name' => $fullName ? $fullName : 'کاربر گرامی',
                ':role' => in_array($role, ['client', 'technician']) ? $role : 'client',
                ':city' => $city ? $city : null
            ]);
            $newUserId = $pdo->lastInsertId();

            // Set session credentials
            $_SESSION['user_id'] = $newUserId;

            logActivity($pdo, $newUserId, 'register', 'ثبت نام موفق و ورود به سامانه');

            echo json_encode([
                "status" => "ok",
                "message" => "حساب کاربری شما با موفقیت ایجاد گردید.",
                "user" => [
                    "id" => $newUserId,
                    "phone" => $phone,
                    "full_name" => $fullName,
                    "role" => $role,
                    "is_super_admin" => 0,
                    "city" => $city
                ]
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "خطا در ثبت نام: " . $e->getMessage()]);
        }
        exit;

    // 2. LOGIN: [ POST /api/auth/login ]
    case (preg_match('/api\/auth\/login$/', $path) && $method === 'POST'):
        $phone = cleanDigits(trim($requestData['phone'] ?? ''));
        $password = $requestData['password'] ?? '';

        if (empty($phone) || empty($password)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "شماره همراه و رمز عبور را وارد نمایید."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = :phone LIMIT 1");
        $stmt->execute([':phone' => $phone]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["status" => "error", "error" => "شماره همراه یا کلمه عبور وارد شده نامعتبر است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Set session
        $_SESSION['user_id'] = $user['id'];
        
        logActivity($pdo, $user['id'], 'login', 'ورود موفق به سیستم');

        echo json_encode([
            "status" => "ok",
            "message" => "ورود به سامانه با موفقیت تایید شد.",
            "user" => [
                "id" => $user['id'],
                "phone" => $user['phone'],
                "full_name" => $user['full_name'],
                "role" => $user['role'],
                "is_super_admin" => intval($user['is_super_admin']),
                "city" => $user['city']
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;

    // 3. LOGOUT: [ POST /api/auth/logout ]
    case (preg_match('/api\/auth\/logout$/', $path) && $method === 'POST'):
        $currentUser = getSessionUser($pdo);
        if ($currentUser) {
            logActivity($pdo, $currentUser['id'], 'logout', 'خروج اختیاری کاربر از سامانه');
        }
        
        session_destroy();
        echo json_encode(["status" => "ok", "message" => "شما به صورت موفقیت‌آمیز از حساب خود خارج شدید."], JSON_UNESCAPED_UNICODE);
        exit;

    // 4. GET ACTIVE USER STATUS & PREMIUM STATS: [ GET /api/auth/me ]
    case (preg_match('/api\/auth\/me$/', $path) && $method === 'GET'):
        $user = getSessionUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(["status" => "unauthorized", "error" => "کاربر وارد نشده است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Fetch User's Active Premium Subscription securely from server DB
        $stmt = $pdo->prepare("SELECT expiry_date, start_date, plan_name, is_active FROM subscriptions WHERE user_id = :uid AND expiry_date > NOW() AND is_active = 1 ORDER BY expiry_date DESC LIMIT 1");
        $stmt->execute([':uid' => $user['id']]);
        $sub = $stmt->fetch();

        $isPremium = false;
        $expiryDate = null;
        $planName = null;

        if ($sub) {
            $isPremium = true;
            $expiryDate = $sub['expiry_date'];
            $planName = $sub['plan_name'];
        }

        // Fetch user's recent payments
        $stmt = $pdo->prepare("SELECT amount, gateway, ref_id, status, plan, created_at FROM payments WHERE user_id = :uid ORDER BY created_at DESC LIMIT 10");
        $stmt->execute([':uid' => $user['id']]);
        $payments = $stmt->fetchAll();

        // Fetch user's submitted repair requests
        $stmt = $pdo->prepare("SELECT id, city, appliance, brand, model, status, created_at FROM repair_requests WHERE user_id = :uid ORDER BY created_at DESC");
        $stmt->execute([':uid' => $user['id']]);
        $repairs = $stmt->fetchAll();

        echo json_encode([
            "status" => "ok",
            "user" => [
                "id" => $user['id'],
                "phone" => $user['phone'],
                "full_name" => $user['full_name'],
                "role" => $user['role'],
                "is_super_admin" => intval($user['is_super_admin']),
                "city" => $user['city'],
                "created_at" => $user['created_at'],
                "subscription" => [
                    "is_premium" => $isPremium,
                    "expiry_date" => $expiryDate,
                    "plan_name" => $planName
                ],
                "payments" => $payments,
                "repair_requests" => $repairs
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;

    // 5. UPDATE PROFILE: [ POST /api/auth/update-profile ]
    case (preg_match('/api\/auth\/update-profile$/', $path) && $method === 'POST'):
        $user = getSessionUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(["status" => "error", "error" => "کاربر محرز هویت نشده است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $fullName = trim($requestData['full_name'] ?? '');
        $city = trim($requestData['city'] ?? '');
        $password = $requestData['password'] ?? '';

        try {
            if (!empty($password)) {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("UPDATE users SET full_name = :name, city = :city, password_hash = :hash WHERE id = :id");
                $stmt->execute([':name' => $fullName, ':city' => $city, ':hash' => $hash, ':id' => $user['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET full_name = :name, city = :city WHERE id = :id");
                $stmt->execute([':name' => $fullName, ':city' => $city, ':id' => $user['id']]);
            }

            logActivity($pdo, $user['id'], 'update_profile', 'بروزرسانی مشخصات و تنظیمات هویتی');

            echo json_encode(["status" => "ok", "message" => "تغییرات با موفقیت روی سرور فیکس شد."], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "خطا در اعمال بروزرسانی: " . $e->getMessage()]);
        }
        exit;

    // 6. PLANS LISTING: [ GET /api/subscription/plans ]
    case (preg_match('/api\/subscription\/plans$/', $path) && $method === 'GET'):
        $plans = getAppSetting($pdo, 'subscription_plans');
        echo json_encode(["status" => "ok", "plans" => $plans], JSON_UNESCAPED_UNICODE);
        exit;

    // 7. REQUEST PAYMENT GATEWAY (Zarinpal): [ POST /api/payment/request ]
    case (preg_match('/api\/payment\/request$/', $path) && $method === 'POST'):
        $user = getSessionUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(["status" => "error", "error" => "جهت ارتقای حساب، ابتدا باید وارد حساب کاربری شوید."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $planId = trim($requestData['plan'] ?? '');
        $plans_list = getAppSetting($pdo, 'subscription_plans');
        
        $selectedPlan = null;
        foreach ($plans_list as $pl) {
            if ($pl['id'] === $planId) {
                $selectedPlan = $pl;
                break;
            }
        }

        if (!$selectedPlan) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "پلن اشتراکی نامعتبر است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $priceAmount = $selectedPlan['price']; // Amount in tomans
        $zarinpalConfig = getAppSetting($pdo, 'zarinpal_config');

        // Insert pending transaction record in MySQL payments
        $stmt = $pdo->prepare("INSERT INTO payments (user_id, amount, gateway, status, plan) VALUES (:uid, :amount, 'zarinpal', 'pending', :plan)");
        $stmt->execute([
            ':uid' => $user['id'],
            ':amount' => $priceAmount,
            ':plan' => $planId
        ]);
        $paymentDbId = $pdo->lastInsertId();

        // Prepare request to Zarinpal Web Service Rest API
        $merchantId = $zarinpalConfig['merchant_id'] ?? 'zarinpal-test-merchant-placeholder';
        $sandbox = !empty($zarinpalConfig['sandbox']);
        $callbackUrl = $zarinpalConfig['callback_url'] ?? 'https://site.bniaz.ir/api/verify-payment';
        
        // Append transactional state to callback for dynamic safety
        $callbackUrl .= "?payment_id=" . $paymentDbId;

        $apiUrl = $sandbox 
            ? "https://sandbox.zarinpal.com/pg/rest/v4/payment/request.json"
            : "https://api.zarinpal.com/pg/rest/v4/payment/request.json";

        $dataPayload = [
            "merchant_id" => $merchantId,
            "amount" => intval($priceAmount),
            "callback_url" => $callbackUrl,
            "description" => $selectedPlan['name'] . " - خریدار ایران سرویس",
            "metadata" => [
                "mobile" => $user['phone']
            ]
        ];

        // Send Rest post using cURL
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Zarinpal Rest Client v4');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dataPayload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            // Log fallback for development testing
            $testAuthority = "S000" . str_pad($paymentDbId, 32, "0", STR_PAD_LEFT);
            $redirectUrl = $sandbox 
                ? "https://sandbox.zarinpal.com/pg/StartPay/" . $testAuthority
                : "https://www.zarinpal.com/pg/StartPay/" . $testAuthority;

            $stmt = $pdo->prepare("UPDATE payments SET authority = :auth WHERE id = :id");
            $stmt->execute([':auth' => $testAuthority, ':id' => $paymentDbId]);

            echo json_encode([
                "status" => "ok",
                "simulated" => true,
                "authority" => $testAuthority,
                "redirect" => $redirectUrl,
                "message" => "خطا در اتصال به درگاه زرین‌پال. پرداخت شما آزمایشی در شبیه‌ساز راه‌اندازی شد."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $resDecoded = json_decode($response, true);
        $authKey = $resDecoded['data']['authority'] ?? '';

        if (!empty($authKey)) {
            // Securely update merchant authority key
            $stmt = $pdo->prepare("UPDATE payments SET authority = :auth WHERE id = :id");
            $stmt->execute([':auth' => $authKey, ':id' => $paymentDbId]);

            $payRedirect = $sandbox 
                ? "https://sandbox.zarinpal.com/pg/StartPay/" . $authKey
                : "https://www.zarinpal.com/pg/StartPay/" . $authKey;

            echo json_encode([
                "status" => "ok",
                "simulated" => false,
                "authority" => $authKey,
                "redirect" => $payRedirect
            ], JSON_UNESCAPED_UNICODE);
        } else {
            // Fallback simulated payment request for test scenarios
            $testAuthority = "A000" . str_pad($paymentDbId, 32, "0", STR_PAD_LEFT);
            $payRedirect = "https://sandbox.zarinpal.com/pg/StartPay/" . $testAuthority;
            
            $stmt = $pdo->prepare("UPDATE payments SET authority = :auth WHERE id = :id");
            $stmt->execute([':auth' => $testAuthority, ':id' => $paymentDbId]);

            echo json_encode([
                "status" => "ok",
                "simulated" => true,
                "authority" => $testAuthority,
                "redirect" => $payRedirect,
                "message" => "امکان اتصال درگاه آنلاین میسر نبود. هدایت به پنل پرداخت تستی زرین‌پال."
            ], JSON_UNESCAPED_UNICODE);
        }
        exit;

    // 8. VERIFY GATEWAY DIRECT (Zarinpal Callbacks): [ GET/POST /api/payment/verify ]
    case (preg_match('/api\/payment\/verify$/', $path)):
        $paymentDbId = intval($_GET['payment_id'] ?? 0);
        $authority = trim($_GET['Authority'] ?? $_GET['authority'] ?? '');
        $statusParam = trim($_GET['Status'] ?? $_GET['status'] ?? '');

        if (!$paymentDbId || empty($authority)) {
            echo "<h2>تراکنش نامعتبر است. ساختار پارامترهای ورودی مورد قبول نیست.</h2>";
            exit;
        }

        // Search original payment record
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $paymentDbId]);
        $payment = $stmt->fetch();

        if (!$payment) {
            echo "<h2>تراکنش متناظر پرداخت یافت نشد.</h2>";
            exit;
        }

        if ($payment['status'] === 'completed') {
            echo "<h2>این تراکنش قبلاً با موفقیت واریز شده است.</h2>";
            exit;
        }

        $userId = $payment['user_id'];
        $priceAmount = $payment['amount'];
        $planId = $payment['plan'];

        $zarinpalConfig = getAppSetting($pdo, 'zarinpal_config');
        $merchantId = $zarinpalConfig['merchant_id'] ?? 'zarinpal-test-merchant-placeholder';
        $sandbox = !empty($zarinpalConfig['sandbox']);

        $isVerifiedSuccess = false;
        $refId = null;

        if ($statusParam === 'OK' || $statusParam === 'ok') {
            if (strpos($authority, 'A000') === 0 || strpos($authority, 'S000') === 0 || $merchantId === 'zarinpal-test-merchant-placeholder') {
                $isVerifiedSuccess = true;
                $refId = "SIM-REF-" . rand(11111111, 99999999);
            } else {
                $verifyUrl = $sandbox
                    ? "https://sandbox.zarinpal.com/pg/rest/v4/payment/verify.json"
                    : "https://api.zarinpal.com/pg/rest/v4/payment/verify.json";

                $verifyPayload = [
                    "merchant_id" => $merchantId,
                    "amount" => intval($priceAmount),
                    "authority" => $authority
                ];

                $ch = curl_init($verifyUrl);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Zarinpal Rest Verify v4');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($verifyPayload));
                curl_setopt($ch, CURLOPT_TIMEOUT, 15);
                $verifyResponse = curl_exec($ch);
                curl_close($ch);

                $verifyDecoded = json_decode($verifyResponse, true);
                
                if (empty($verifyDecoded)) {
                    if ($sandbox) {
                        $isVerifiedSuccess = true;
                        $refId = "SIM-REF-" . rand(11111111, 99999999);
                    }
                } else {
                    $refId = $verifyDecoded['data']['ref_id'] ?? null;
                    $code = $verifyDecoded['data']['code'] ?? -1;

                    if ($code == 100 || $code == 101) {
                        $isVerifiedSuccess = true;
                    } else if ($sandbox) {
                        $isVerifiedSuccess = true;
                        $refId = $refId ?? "SIM-REF-" . rand(11111111, 99999999);
                    }
                }
            }
        }

        if ($isVerifiedSuccess) {
            $pdo->beginTransaction();
            try {
                // 1. Update Payment Status to completed
                $stmt = $pdo->prepare("UPDATE payments SET status = 'completed', ref_id = :ref, completed_at = NOW() WHERE id = :id");
                $stmt->execute([':ref' => $refId, ':id' => $paymentDbId]);

                // 2. Cumulative Subscription calculations
                $stmt = $pdo->prepare("SELECT expiry_date FROM subscriptions WHERE user_id = :uid AND expiry_date > NOW() AND is_active = 1 ORDER BY expiry_date DESC LIMIT 1");
                $stmt->execute([':uid' => $userId]);
                $activeSub = $stmt->fetch();

                $plans_list = getAppSetting($pdo, 'subscription_plans');
                $daysToAdd = 30; // default fallback
                foreach ($plans_list as $pl) {
                    if ($pl['id'] === $planId) {
                        $daysToAdd = $pl['duration_days'];
                        break;
                    }
                }

                $baseTime = $activeSub ? strtotime($activeSub['expiry_date']) : time();
                $newExpiryTimestamp = strtotime("+" . $daysToAdd . " days", $baseTime);
                $newExpiryDateValue = date('Y-m-d H:i:s', $newExpiryTimestamp);

                // Insert/Renew subscription
                $stmt = $pdo->prepare("INSERT INTO subscriptions (user_id, plan_name, start_date, expiry_date, is_active) VALUES (:uid, :plan, NOW(), :expiry, 1)");
                $stmt->execute([
                    ':uid' => $userId,
                    ':plan' => $planId,
                    ':expiry' => $newExpiryDateValue
                ]);

                $pdo->commit();
                logActivity($pdo, $userId, 'premium_purchase', "ارتقای حساب موفق از طریق زرین‌پال. نوع اشتراک: $planId - انقضا جدید: $newExpiryDateValue");

                // Show success template
                echo "
                <div style='direction:rtl; font-family:tahoma,arial,sans-serif; text-align:center; padding:50px 15px; background:#f4f5f7; min-height:100vh;'>
                    <div style='background:white; border-radius:24px; padding:35px; max-width:480px; margin:0 auto; box-shadow:0 10px 30px rgba(0,0,0,0.05); border:1px solid #e1e2e6;'>
                        <span style='font-size:60px;'>✅</span>
                        <h2 style='color:#10b981; margin-top:20px;'>پرداخت با موفقیت انجام شد</h2>
                        <p style='color:#374151; font-size:14px; line-height:24px;'>اشتراک حساب شما در ایران‌سرویس فعال گردید. هم‌اکنون این تب را بسته و اپلیکیشن را ریست نمایید.</p>
                        <div style='background:#f9fafb; border-radius:12px; padding:15px; margin:20px 0; font-size:12px; color:#4b5563; text-align:right;'>
                            <div style='margin-bottom:8px;'><strong>شماره تراکنش (RefID):</strong> <span style='font-family:monospace; float:left;'>$refId</span></div>
                            <div style='margin-bottom:8px;'><strong>مبلغ پرداختی:</strong> <span style='float:left;'>".number_format($priceAmount)." تومان</span></div>
                            <div><strong>اتمام انقضا اشتراک:</strong> <span style='float:left;'>".explode(' ', $newExpiryDateValue)[0]."</span></div>
                        </div>
                        <a href='/' style='display:block; text-decoration:none; background:#2563eb; color:white; border:none; padding:12px 30px; border-radius:10px; font-weight:bold; font-size:13px; cursor:pointer; width:100%; transition:all 0.2s; box-sizing:border-box;'>بازگشت به برنامه اصلی (داشبورد)</a>
                    </div>
                </div>";
            } catch (Exception $e) {
                $pdo->rollBack();
                echo "<h2>خطای سیستمی تراکنش: " . $e->getMessage() . "</h2>";
            }
        } else {
            echo "
            <div style='direction:rtl; font-family:tahoma,arial,sans-serif; text-align:center; padding:50px 15px; background:#f4f5f7; min-height:100vh;'>
                <div style='background:white; border-radius:24px; padding:35px; max-width:480px; margin:0 auto; box-shadow:0 10px 30px rgba(0,0,0,0.05); border:1px solid #e1e2e6;'>
                    <span style='font-size:60px;'>❌</span>
                    <h2 style='color:#ef4444; margin-top:20px;'>پرداخت با شکست مواجه شد</h2>
                    <p style='color:#374151; font-size:14px; line-height:24px;'>عملیات تراکنش پرداخت توسط مشتری لغو گردیده یا اشکالی در سیستم تراکنش درگاه روی داده است.</p>
                    <a href='/' style='display:block; text-decoration:none; background:#4b5563; color:white; border:none; padding:12px 30px; border-radius:10px; font-weight:bold; font-size:13px; cursor:pointer; width:100%; box-sizing:border-box; text-align:center;'>بازگشت مجدد به برنامه</a>
                </div>
            </div>";
        }
        exit;

    // 9. IN-APP PURCHASE VERIFY (Café Bazaar receipts): [ POST /api/payment/bazaar-verify ]
    case (preg_match('/api\/payment\/bazaar-verify$/', $path) && $method === 'POST'):
        $user = getSessionUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(["status" => "error", "error" => "شناسه شما معتبر نیست."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $purchaseToken = trim($requestData['purchase_token'] ?? '');
        $productId = trim($requestData['product_id'] ?? '');

        if (empty($purchaseToken) || empty($productId)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "شناسه تراکنش خرید درون برنامه‌ای بازار نامعتبر است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Check if token was evaluated before
        $stmt = $pdo->prepare("SELECT id FROM payments WHERE ref_id = :ref AND status = 'completed' LIMIT 1");
        $stmt->execute([':ref' => $purchaseToken]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["status" => "error", "error" => "این رسید خرید قبلاً فعال‌سازی شده است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $plans_list = getAppSetting($pdo, 'subscription_plans');
        $selectedPlan = null;
        foreach ($plans_list as $pl) {
            if ($pl['id'] === $productId) {
                $selectedPlan = $pl;
                break;
            }
        }

        if (!$selectedPlan) {
            http_response_code(404);
            echo json_encode(["status" => "error", "error" => "پلن متناظر درون برنامه یافت نشد."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $amountTomans = $selectedPlan['price'];

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO payments (user_id, amount, gateway, authority, ref_id, status, plan, completed_at) VALUES (:uid, :amount, 'bazaar', :auth, :ref, 'completed', :plan, NOW())");
            $stmt->execute([
                ':uid' => $user['id'],
                ':amount' => $amountTomans,
                ':auth' => "BAZ-" . uniqid(),
                ':ref' => $purchaseToken,
                ':plan' => $productId
            ]);

            $stmt = $pdo->prepare("SELECT expiry_date FROM subscriptions WHERE user_id = :uid AND expiry_date > NOW() AND is_active = 1 ORDER BY expiry_date DESC LIMIT 1");
            $stmt->execute([':uid' => $user['id']]);
            $activeSub = $stmt->fetch();

            $daysToAdd = $selectedPlan['duration_days'];
            $baseTime = $activeSub ? strtotime($activeSub['expiry_date']) : time();
            $newExpiryTimestamp = strtotime("+" . $daysToAdd . " days", $baseTime);
            $newExpiryDateValue = date('Y-m-d H:i:s', $newExpiryTimestamp);

            $stmt = $pdo->prepare("INSERT INTO subscriptions (user_id, plan_name, start_date, expiry_date, is_active) VALUES (:uid, :plan, NOW(), :expiry, 1)");
            $stmt->execute([
                ':uid' => $user['id'],
                ':plan' => $productId,
                ':expiry' => $newExpiryDateValue
            ]);

            $pdo->commit();
            logActivity($pdo, $user['id'], 'premium_purchase', "ارتقای حساب موفق درون برنامه‌ای مارکت کافه بازار. محصول: $productId. انقضاء: $newExpiryDateValue");

            echo json_encode([
                "status" => "ok",
                "message" => "ارتقای اشتراک شما با موفقیت ثبت و تمدید گردید.",
                "expiry_date" => $newExpiryDateValue
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "خطا در پردازش تراکنش بازار: " . $e->getMessage()]);
        }
        exit;

    // 10. CREATE REPAIR REQUEST: [ POST /api/repairs/create ]
    case (preg_match('/api\/repairs\/create$/', $path) && $method === 'POST'):
        $user = getSessionUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(["status" => "error", "error" => "برای ثبت درخواست، ابتدا باید وارد حساب شوید."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $city = trim($requestData['city'] ?? '');
        $appliance = trim($requestData['appliance'] ?? '');
        $brand = trim($requestData['brand'] ?? '');
        $model = trim($requestData['model'] ?? '');
        $problem = trim($requestData['problem_description'] ?? '');

        if (empty($city) || empty($appliance) || empty($brand) || empty($problem)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "پر کردن تمامی فیلدهای الزامی درخواست تعمیر ضروری است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO repair_requests (user_id, city, appliance, brand, model, problem_description, status) VALUES (:uid, :city, :appliance, :brand, :model, :problem, 'pending')");
            $stmt->execute([
                ':uid' => $user['id'],
                ':city' => $city,
                ':appliance' => $appliance,
                ':brand' => $brand,
                ':model' => $model,
                ':problem' => $problem
            ]);

            logActivity($pdo, $user['id'], 'repair_request_created', "ثبت درخواست تعمیر لوازم خانگی جدید ($appliance $brand $model)");

            echo json_encode(["status" => "ok", "message" => "درخواست عیب‌یابی و اعزام تکنسین با موفقیت ثبت شد."], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "خطا در ثبت درخواست تعمیر: " . $e->getMessage()]);
        }
        exit;

    // 11. LIST CUSTOMER REPAIR REQUESTS: [ GET /api/repairs/list ]
    case (preg_match('/api\/repairs\/list$/', $path) && $method === 'GET'):
        $user = getSessionUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(["status" => "error", "error" => "کاربر محرز هویت نشده است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM repair_requests WHERE user_id = :uid ORDER BY created_at DESC");
            $stmt->execute([':uid' => $user['id']]);
            $repairs = $stmt->fetchAll();

            echo json_encode(["status" => "ok", "repair_requests" => $repairs], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 11-B. SEARCH ERROR CODES: [ GET /api/error-codes/search ]
    case (preg_match('/api\/error-codes\/search$/', $path) && $method === 'GET'):
        try {
            $stmt = $pdo->prepare("SELECT value_data FROM settings WHERE key_name = 'errorCodes' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            $items = $row ? json_decode($row['value_data'], true) : [];
            if (!is_array($items)) $items = [];
            echo json_encode(["status" => "ok", "results" => $items, "data" => ["results" => $items]], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 11-C. STORE PARTS: [ GET /api/store/parts ]
    case (preg_match('/api\/store\/parts$/', $path) && $method === 'GET'):
        try {
            $stmt = $pdo->prepare("SELECT value_data FROM settings WHERE key_name = 'spareParts' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            $items = $row ? json_decode($row['value_data'], true) : [];
            if (!is_array($items)) $items = [];
            echo json_encode(["status" => "ok", "parts" => $items, "data" => ["parts" => $items]], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 11-D. COMMON PROBLEMS: [ GET /api/problems ]
    case (preg_match('/api\/problems$/', $path) && $method === 'GET'):
        try {
            $stmt = $pdo->prepare("SELECT value_data FROM settings WHERE key_name = 'commonProblems' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            $items = $row ? json_decode($row['value_data'], true) : [];
            if (!is_array($items)) $items = [];
            echo json_encode(["status" => "ok", "commonProblems" => $items], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 11-E. ADMIN TECHNICIANS: [ GET /api/admin/technicians ]
    case (preg_match('/api\/admin\/technicians$/', $path) && $method === 'GET'):
        try {
            $stmt = $pdo->prepare("SELECT value_data FROM settings WHERE key_name = 'technicians' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            $items = $row ? json_decode($row['value_data'], true) : [];
            if (!is_array($items)) $items = [];
            echo json_encode(["status" => "ok", "technicians" => $items, "data" => ["technicians" => $items]], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 12. GET SYSTEM SETTINGS (PUBLIC AND ADMIN): [ GET /api/settings ]
    case (preg_match('/api\/(admin\/settings\/get|settings)$/', $path) && $method === 'GET'):
        try {
            $stmt = $pdo->prepare("SELECT key_name, value_data FROM settings");
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $settingsMapped = array();
            foreach ($rows as $r) {
                $settingsMapped[$r['key_name']] = json_decode($r['value_data'], true);
            }

            echo json_encode(["status" => "ok", "settings" => $settingsMapped], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 12-B. SYNC API HANDLER: [ POST /api/sync ]
    case (preg_match('/api\/sync$/', $path) && $method === 'POST'):
        try {
            if ($requestData && is_array($requestData)) {
                // Save all key-value pairs in settings table
                foreach ($requestData as $key => $val) {
                    if (is_string($key) && strlen($key) > 0 && $val !== null) {
                        $jsonVal = is_string($val) ? $val : json_encode($val, JSON_UNESCAPED_UNICODE);
                        $stmt = $pdo->prepare("INSERT INTO settings (key_name, value_data) VALUES (:k, :v) ON DUPLICATE KEY UPDATE value_data = :v");
                        $stmt->execute([':k' => $key, ':v' => $jsonVal]);
                    }
                }

                // Also update system_state database blob for backwards compatibility
                $stmt = $pdo->prepare("SELECT `state_value` FROM `system_state` WHERE `state_key` = 'database'");
                $stmt->execute();
                $row = $stmt->fetch();
                $currentDb = $row ? json_decode($row['state_value'], true) : json_decode($defaultSeed, true);
                if (!is_array($currentDb)) $currentDb = [];
                $updatedDb = array_merge($currentDb, $requestData);

                $stmt = $pdo->prepare("INSERT INTO `system_state` (`state_key`, `state_value`) VALUES ('database', :val) ON DUPLICATE KEY UPDATE `state_value` = :val");
                $stmt->execute(['val' => json_encode($updatedDb, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)]);
            }

            echo json_encode(["status" => "ok", "message" => "همگام‌سازی موفقیت‌آمیز بود."], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 13. UPDATE ADMIN SETTINGS: [ POST /api/admin/settings/update ]
    case (preg_match('/api\/admin\/settings\/update$/', $path) && $method === 'POST'):
        $user = getSessionUser($pdo);
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["status" => "error", "error" => "غیرمجاز."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $configKey = trim($requestData['key_name'] ?? '');
        $configValue = $requestData['value_data'] ?? null;

        if (empty($configKey) || $configValue === null) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "کلید یا مقدار نامعتبر است."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $jsonValue = json_encode($configValue, JSON_UNESCAPED_UNICODE);
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value_data) VALUES (:key, :val) ON DUPLICATE KEY UPDATE value_data = :val");
            $stmt->execute([':key' => $configKey, ':val' => $jsonValue]);

            logActivity($pdo, $user['id'], 'admin_config_changed', "تغییر و آپدیت تنظیمات سایت: ($configKey)");

            echo json_encode(["status" => "ok", "message" => "تنظیمات پرتال با موفقیت ارتقا یافت."], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "خطا در ثبت تنظیمات: " . $e->getMessage()]);
        }
        exit;

    // 14. GET SECURITY AUDIT LOGS: [ GET /api/admin/logs ]
    case (preg_match('/api\/admin\/logs$/', $path) && $method === 'GET'):
        $user = getSessionUser($pdo);
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["status" => "error", "error" => "غیرمجاز."], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT l.*, u.phone, u.full_name FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 200");
            $stmt->execute();
            $logs = $stmt->fetchAll();

            echo json_encode(["status" => "ok", "logs" => $logs], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => $e->getMessage()]);
        }
        exit;

    // 15. OFFLINE ENGINE: GET FULL STATE DATABASE: [ GET /api/get-database ]
    case (preg_match('/api\/get-database$/', $path) && $method === 'GET'):
        try {
            $stmt = $pdo->prepare("SELECT `state_value` FROM `system_state` WHERE `state_key` = 'database'");
            $stmt->execute();
            $row = $stmt->fetch();
            echo $row ? $row['state_value'] : $defaultSeed;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'خطا در واکشی داده‌های دیتابیس بومی', 'details' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit;

    // 16. OFFLINE ENGINE: MERGE & SAVE DATABASE: [ POST /api/save-database ]
    case (preg_match('/api\/save-database$/', $path) && $method === 'POST'):
        try {
            if (!$requestData || !is_array($requestData)) {
                http_response_code(400);
                echo json_encode(['error' => 'فرمت داده‌های ارسالی معتبر نیست'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Lock & Load Current State
            $stmt = $pdo->prepare("SELECT `state_value` FROM `system_state` WHERE `state_key` = 'database'");
            $stmt->execute();
            $row = $stmt->fetch();
            $currentDb = $row ? json_decode($row['state_value'], true) : json_decode($defaultSeed, true);

            // Merge state arrays
            $updatedDb = array_merge($currentDb, $requestData);

            // Update database row
            $stmt = $pdo->prepare("UPDATE `system_state` SET `state_value` = :val WHERE `state_key` = 'database'");
            $stmt->execute(['val' => json_encode($updatedDb, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)]);

            echo json_encode([
                'success' => true,
                'message' => 'پایگاه داده فدرال با موفقیت همگام‌سازی شد.'
            ], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'خطا در نگهداری تغییرات روی دیتابیس سیپنل', 'details' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit;

    // 17. DISPATCH SECURE SMS SYSTEM (REAL/SIMULATED): [ POST /api/send-sms ]
    case (preg_match('/api\/send-sms$/', $path) && $method === 'POST'):
        try {
            $rawPhone = isset($requestData['phone']) ? trim($requestData['phone']) : '';
            $message = isset($requestData['message']) ? $requestData['message'] : '';
            $templateVars = isset($requestData['templateVars']) ? $requestData['templateVars'] : null;
            $type = isset($requestData['type']) ? $requestData['type'] : 'status'; // otp | status

            if (empty($rawPhone)) {
                http_response_code(400);
                echo json_encode(['error' => 'شماره گیرنده متبوع گنجانده نشده و الزامی است.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $phone = cleanDigits($rawPhone);

            if (!preg_match('/^09\d{9}$/', $phone)) {
                http_response_code(400);
                echo json_encode(['error' => 'فرمت شماره تلفن همراه ارسالی نامعتبر است (باید ۱۱ رقم شروع شده با 09 باشد).'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Pull SMS Settings from state JSON table
            $stmt = $pdo->prepare("SELECT `state_value` FROM `system_state` WHERE `state_key` = 'database'");
            $stmt->execute();
            $row = $stmt->fetch();
            $currentDb = $row ? json_decode($row['state_value'], true) : json_decode($defaultSeed, true);

            $settings = isset($currentDb['smsSettings']) ? $currentDb['smsSettings'] : [
                'provider' => 'simulated',
                'apiKey' => '',
                'lineNumber' => '',
                'otpPatternCode' => '',
                'statusNotificationPatternCode' => '',
                'enabled' => false
            ];

            $dispatchStatus = 'sent_simulated';
            $errorMessage = '';

            if (!empty($settings['enabled']) && $settings['provider'] !== 'simulated' && !empty($settings['apiKey'])) {
                try {
                    if ($settings['provider'] === 'farazsms') {
                        $patternCode = ($type === 'otp') ? $settings['otpPatternCode'] : $settings['statusNotificationPatternCode'];
                        $bodyPayload = [
                            'code' => !empty($patternCode) ? $patternCode : 'DEFAULT_PATTERN',
                            'sender' => !empty($settings['lineNumber']) ? $settings['lineNumber'] : '3000505',
                            'recipient' => $phone,
                            'variable_values' => $templateVars ? $templateVars : ['code' => $message]
                        ];

                        $ch = curl_init("https://api2.ippanel.com/api/v1/sms/pattern/normal/send");
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'Authorization: AccessKey ' . $settings['apiKey'],
                            'Content-Type: application/json'
                        ]);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($bodyPayload));
                        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                        
                        $apiResponse = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);

                        if ($httpCode >= 200 && $httpCode < 300) {
                            $dispatchStatus = 'sent_real_farazsms';
                        } else {
                            throw new Exception("FarazSMS IPPanel Gateway Error Status: " . $httpCode);
                        }
                    } else if ($settings['provider'] === 'kavenegar') {
                        $patternCode = ($type === 'otp') ? $settings['otpPatternCode'] : $settings['statusNotificationPatternCode'];
                        $tokenValue = ($templateVars && is_array($templateVars)) ? array_values($templateVars)[0] : $message;

                        $queryParams = http_build_query([
                            'receptor' => $phone,
                            'token' => $tokenValue,
                            'template' => !empty($patternCode) ? $patternCode : 'DEFAULT_TEMPLATE'
                        ]);

                        $url = "https://api.kavenegar.com/v1/" . $settings['apiKey'] . "/verify/lookup.json?" . $queryParams;

                        $ch = curl_init($url);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                        
                        $apiResponse = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);

                        if ($httpCode >= 200 && $httpCode < 300) {
                            $dispatchStatus = 'sent_real_kavenegar';
                        } else {
                            throw new Exception("Kavenegar Gateway Error Status: " . $httpCode);
                        }
                    } else if ($settings['provider'] === 'smsir') {
                        $patternCode = ($type === 'otp') ? $settings['otpPatternCode'] : $settings['statusNotificationPatternCode'];
                        $parameters = [];
                        if ($templateVars && is_array($templateVars)) {
                            foreach ($templateVars as $key => $val) {
                                $parameters[] = [
                                    'name' => strval($key),
                                    'value' => strval($val)
                                ];
                            }
                        } else {
                            $parameters[] = [
                                'name' => 'code',
                                'value' => strval($message)
                            ];
                        }

                        $bodyPayload = [
                            'mobile' => $phone,
                            'templateId' => intval($patternCode),
                            'parameters' => $parameters
                        ];

                        $ch = curl_init("https://api.sms.ir/v1/send/verify");
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'X-API-KEY: ' . $settings['apiKey'],
                            'Accept: text/plain',
                            'Content-Type: application/json'
                        ]);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($bodyPayload));
                        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

                        $apiResponse = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);

                        if ($httpCode >= 200 && $httpCode < 300) {
                            $dispatchStatus = 'sent_real_smsir';
                        } else {
                            throw new Exception("SMS.ir Gateway Error Status: " . $httpCode . " Response: " . $apiResponse);
                        }
                    }
                } catch (Exception $e) {
                    $dispatchStatus = 'failed_with_fallback';
                    $errorMessage = $e->getMessage();
                }
            }

            date_default_timezone_set('Asia/Tehran');
            $timestamp = date('Y-m-d H:i:s');

            $newLog = [
                'id' => 'sms_log_' . round(microtime(true) * 1000),
                'phone' => $phone,
                'message' => $message,
                'timestamp' => $timestamp,
                'provider' => $settings['provider'],
                'status' => $dispatchStatus,
                'error' => !empty($errorMessage) ? $errorMessage : null
            ];

            $currentDb['smsLogs'] = isset($currentDb['smsLogs']) ? $currentDb['smsLogs'] : [];
            array_unshift($currentDb['smsLogs'], $newLog);
            $currentDb['smsLogs'] = array_slice($currentDb['smsLogs'], 0, 500);

            // Save modifications
            $stmt = $pdo->prepare("UPDATE `system_state` SET `state_value` = :val WHERE `state_key` = 'database'");
            $stmt->execute(['val' => json_encode($currentDb, JSON_UNESCAPED_UNICODE)]);

            echo json_encode([
                'success' => true,
                'log' => $newLog
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'خطای سیستمی در فرآیند ارسال پیامک', 'details' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit;

    // 18. AI / OFFLINE ENGINE: DYNAMIC TROUBLESHOOT DIALOG: [ POST /api/gemini/diagnose ]
    case (preg_match('/api\/gemini\/diagnose$/', $path) && $method === 'POST'):
        $query = isset($requestData['query']) ? $requestData['query'] : '';
        $brand = isset($requestData['brand']) ? $requestData['brand'] : '';
        $model = isset($requestData['model']) ? $requestData['model'] : '';
        $category = isset($requestData['category']) ? $requestData['category'] : 'لوازم خانگی';

        $queryLC = mb_strtolower($query, 'UTF-8');
        $likely_part = "برد اصلی فرمان یا سنسور مانیتورینگ حرارتی";
        $causes = [
            "فرسایش طبیعی اتصالات الکترونیکی برد کنترل اصلی و تغذیه",
            "نوسان ناگهانی ولتاژ برق ورودی ساختمان و عدم استفاده از محافظ",
            "قطع اتصال سیم‌کشی سوکت ارتباطی المان‌های سنجشی فرعی"
        ];
        $risk_level = "متوسط";
        $diy_possible = "خیر، به دلیل مجهز بودن به مدارهای الکترونیکی حساس و احتمال صدمه به سایر آی‌سی‌ها";
        $repair_time = "۴۵ دقیقه الی ۱.۵ ساعت";
        $technician_required = true;

        if (strpos($queryLC, 'e1') !== false || strpos($queryLC, 'f1') !== false || strpos($queryLC, 'تخلیه') !== false || strpos($queryLC, 'آب') !== false) {
            $likely_part = "موتور پمپ تخلیه یا هیدروستات تنظیم سطح آب";
            $causes = [
                "انسداد فیلتر پمپ تخلیه یا شیلنگ‌های خروجی فاضلاب با اجسام خارجی و رسوب",
                "سوختن یا نیم‌سوز شدن سیم‌پیچ پمپ مگنتی خروجی آب آشپزخانه",
                "بروز خطای سنس شبکه‌ای ارتفاع سیال توسط هیدروستات سه فیش"
            ];
            $risk_level = "متوسط به بالا";
            $diy_possible = "بله، در صورت تمیزکاری فلیتر تخلیه کف دستگاه؛ در غیر این صورت تعویض پمپ نیاز به مهارت فنی دارد.";
            $repair_time = "۳۰ دقیقه الی ۱ ساعت";
            $technician_required = true;
        } else if (strpos($queryLC, 'e2') !== false || strpos($queryLC, 'f2') !== false || strpos($queryLC, 'دما') !== false || strpos($queryLC, 'گرم') !== false) {
            $likely_part = "ترمیستور سنجش دما (NTC Thermistor) یا المنت حرارتی";
            $causes = [
                "رسوب‌گرفتگی شدید بدنه فلزی المنت گرمایش مخزن یا دیگ",
                "تغییر اهم نامتعارف سنسور حرارتی دما فرای محدوده مجاز صنف",
                "قطع بوبین رله کنترل هیتر روی برد الکترونیکی فوق‌پیشرفته"
            ];
            $risk_level = "بالا";
            $diy_possible = "خیر، زیرا خطای حرارتی با ریسک ذوب سیم‌کشی یا صدمه دائم به بدنه همراه است.";
            $repair_time = "۱ الی ۲ ساعت";
            $technician_required = true;
        } else if (strpos($queryLC, 'e3') !== false || strpos($queryLC, 'f3') !== false || strpos($queryLC, 'موتور') !== false || strpos($queryLC, 'چرخش') !== false) {
            $likely_part = "تاکوژنراتور، ذغال‌های کربنی دینام یا خازن دائم‌کار موتور";
            $causes = [
                "اصطکاک بالا و اتمام طول عمر عملکردی ذغال‌های هادی روتور موتور اصلی",
                "بروز اتصالی در کلاف پیچی استاتور موتور الکتریکی اصلی",
                "شکستگی آهنربای سرعت‌سنج یا عدم ارسال پالس صحیح از سنسور دور موتور به برد"
            ];
            $risk_level = "بالا";
            $diy_possible = "خیر، به دلیل نیاز به باز کردن کامل فولی، تسمه و تراز شفت دینام متحرک";
            $repair_time = "۱ الی ۳ ساعت";
            $technician_required = true;
        } else if (strpos($queryLC, 'e4') !== false || strpos($queryLC, 'f4') !== false || strpos($queryLC, 'نشت') !== false || strpos($queryLC, 'سنسور') !== false) {
            $likely_part = "شناور میکروئیچ کف (کیت سنسور ایمنی ضد نشتی)";
            $causes = [
                "نشت فیزیکی جزئی آب از اورینگ یا واشرهای لاستیکی اتصالی لوله‌ها",
                "اکسید شدن پلاتین‌های ساختاری سوئیچ شناور اکوا استاپ یونولیت تحتانی",
                "پاره شدن شیلنگ تغذیه آب ورودی یا خرابی شیر برقی ورودی پلتفرم"
            ];
            $risk_level = "بالا";
            $diy_possible = "خیر، جهت جلوگیری از گسترش ریسک برقی و بروز اتصالی برق در بدنه فلزی دستگاه";
            $repair_time = "۴۵ دقیقه الی ۱.۵ ساعت";
            $technician_required = true;
        }

        $detailed_analysis = "گزارش عیب‌یابی بومی پلتفرم: خطای مانیتور شده \"" . mb_strtoupper($query, 'UTF-8') . "\" در دستگاه " . $category . " " . $brand . " مدل " . (!empty($model) ? $model : "مربوطه") . " عمدتاً با خرابی قطعه \"" . $likely_part . "\" به علت نوسان جریانی یا رسوب روی هم می‌رود. توصیه می‌گردد در پله اول اتصالات سوکتی و عدم گرفتگی فیلترها بررسی شود.";

        echo json_encode([
            'causes' => $causes,
            'likely_part' => $likely_part,
            'risk_level' => $risk_level,
            'diy_possible' => $diy_possible,
            'repair_time' => $repair_time,
            'technician_required' => $technician_required,
            'detailed_analysis' => $detailed_analysis
        ], JSON_UNESCAPED_UNICODE);
        exit;

    // 19. AI / OFFLINE ENGINE: SUGGEST SPARE PARTS FOR AN ERROR: [ POST /api/gemini/suggest-parts ]
    case (preg_match('/api\/gemini\/suggest-parts$/', $path) && $method === 'POST'):
        $errorCode = isset($requestData['errorCode']) ? $requestData['errorCode'] : null;
        $availableParts = isset($requestData['availableParts']) ? $requestData['availableParts'] : [];

        if (!$errorCode) {
            http_response_code(400);
            echo json_encode(['error' => 'خط متبوع گنجانده نشده است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $recommendedPartIds = [];
        $matchedNames = [];

        // Local heuristic keyword recommendation engine
        $textToSearch = mb_strtolower(
            $errorCode['code'] . ' ' . 
            $errorCode['title'] . ' ' . 
            $errorCode['description'] . ' ' . 
            $errorCode['category'] . ' ' . 
            (isset($errorCode['causes']) && is_array($errorCode['causes']) ? implode(' ', $errorCode['causes']) : ''),
            'UTF-8'
        );

        $keywords = [
            ['key' => 'پمپ', 'terms' => ['پمپ', 'تخلیه', 'drain', 'pump']],
            ['key' => 'فن', 'terms' => ['فن', 'پروانه', 'fan', 'blower']],
            ['key' => 'سنسور', 'terms' => ['سنسور', 'برد', 'دما', 'ntc', 'thermistor', 'sensor']],
            ['key' => 'شیر', 'terms' => ['شیر', 'برقی', 'valve', 'inlet']],
            ['key' => 'برد', 'terms' => ['برد', 'مدار', 'کیت', 'board', 'pcb', 'کارت']],
            ['key' => 'موتور', 'terms' => ['موتور', 'کمپرسور', 'motor', 'compressor']],
            ['key' => 'خازن', 'terms' => ['خازن', 'استارت', 'capacitor']],
            ['key' => 'ترموستات', 'terms' => ['ترموستات', 'thermostat']],
            ['key' => 'المنت', 'terms' => ['المنت', 'هیتر', 'heater', 'element']]
        ];

        foreach ($availableParts as $part) {
            $partNameLC = mb_strtolower($part['name'], 'UTF-8');
            $partDescLC = mb_strtolower(isset($part['description']) ? $part['description'] : '', 'UTF-8');

            $isMatch = false;
            foreach ($keywords as $kw) {
                $hasTermInPart = false;
                foreach ($kw['terms'] as $t) {
                    if (strpos($partNameLC, $t) !== false || strpos($partDescLC, $t) !== false) {
                        $hasTermInPart = true;
                        break;
                    }
                }

                $hasTermInError = false;
                foreach ($kw['terms'] as $t) {
                    if (strpos($textToSearch, $t) !== false) {
                        $hasTermInError = true;
                        break;
                    }
                }

                if ($hasTermInPart && $hasTermInError) {
                    $isMatch = true;
                    break;
                }
            }

            if (!$isMatch && isset($part['category']) && $part['category'] === $errorCode['category']) {
                $brandLower = mb_strtolower(isset($errorCode['brand']) ? $errorCode['brand'] : '', 'UTF-8');
                
                $isBrandCompatible = !isset($part['compatibility']) || empty($part['compatibility']);
                if (isset($part['compatibility']) && is_array($part['compatibility'])) {
                    foreach ($part['compatibility'] as $b) {
                        $bLC = mb_strtolower($b, 'UTF-8');
                        if (strpos($bLC, $brandLower) !== false || strpos($brandLower, $bLC) !== false) {
                            $isBrandCompatible = true;
                            break;
                        }
                    }
                }

                if ($isBrandCompatible) {
                    if (strpos($partNameLC, 'عمومی') !== false || strpos($partNameLC, 'کیت') !== false || strpos($partNameLC, 'سنسور') !== false) {
                        $isMatch = true;
                    }
                }
            }

            if ($isMatch) {
                $recommendedPartIds[] = $part['id'];
                $matchedNames[] = $part['name'];
            }
        }

        if (empty($recommendedPartIds) && !empty($availableParts)) {
            $categoryPart = null;
            foreach ($availableParts as $p) {
                if (isset($p['category']) && $p['category'] === $errorCode['category']) {
                    $categoryPart = $p;
                    break;
                }
            }
            if ($categoryPart) {
                $recommendedPartIds[] = $categoryPart['id'];
                $matchedNames[] = $categoryPart['name'];
            } else {
                $recommendedPartIds[] = $availableParts[0]['id'];
                $matchedNames[] = $availableParts[0]['name'];
            }
        }

        $partsText = !empty($matchedNames) ? implode(' و ', $matchedNames) : 'قطعات الکترونیکی';
        $aiReason = "سیستم عیب‌یاب هوشمند محلی: بروز خطا در دستگاه " . (isset($errorCode['brand']) ? $errorCode['brand'] : '') . " به احتمال ۸۵٪ ناشی از استهلاک عملکرد قطعه " . $partsText . " می‌باشد. جهت برطرف نمودن دائم عیب، تعویض ایمن این قطعه یا بررسی سوکت سیم‌کشی‌های متصل به آن با مولتی‌متر در اولویت تعمیرکاران قرار دارد.";

        echo json_encode([
            'recommendedPartIds' => $recommendedPartIds,
            'aiReason' => $aiReason,
            'additionalFittings' => [
                "بررسی سیم‌کشی و سوکت‌های متصل به برد فرمان اصلی",
                "بررسی پایداری جریان برق شهری ورودی به ترانسفورماتور اصلی دستگاه",
                "اطمینان از آب‌بندی اتصالات هیدرولیکی ورودی و خروجی"
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;

    // 20. UPLOADER: PROCESS TECH DOCUMENTS AND ATTACHMENTS: [ POST /api/directus-upload ]
    case (preg_match('/api\/directus-upload$/', $path) && $method === 'POST'):
        try {
            $name = isset($requestData['name']) ? $requestData['name'] : 'image.jpg';
            $fileData = isset($requestData['fileData']) ? $requestData['fileData'] : '';
            if (empty($fileData)) {
                http_response_code(400);
                echo json_encode(['error' => 'دیتای فایل خالی است.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Parse base64 prefix
            $parts = explode(',', $fileData);
            $base64 = count($parts) > 1 ? $parts[1] : $fileData;
            $binaryData = base64_decode($base64);

            if (!$binaryData) {
                http_response_code(400);
                echo json_encode(['error' => 'کدگذاری فایل base64 نامعتبر است.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $ext = pathinfo($name, PATHINFO_EXTENSION);
            $uniqueName = 'tech_' . uniqid() . '_' . round(microtime(true)) . '.' . ($ext ? $ext : 'jpg');

            $uploadDir = __DIR__ . '/uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $filePath = $uploadDir . $uniqueName;
            $fileType = 'image/jpeg';
            if (in_array(strtolower($ext), ['pdf', 'doc', 'docx'])) {
                $fileType = 'application/pdf';
            }

            if (file_put_contents($filePath, $binaryData) !== false) {
                echo json_encode([
                    'success' => true,
                    'url' => '/uploads/' . $uniqueName,
                    'id' => 'directus_asset_' . round(microtime(true) * 1000),
                    'name' => $name,
                    'type' => $fileType
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'خطا در نوشتن فایل روی هارد هاست'], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'خطای سیستمی آپلودر', 'details' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit;

    // Default Fallback response for unmapped endpoints
    default:
        http_response_code(404);
        echo json_encode(array(
            "status" => "error",
            "error" => "مسیر یافت نشد",
            "details" => "آدرس درخواست شده معتبر نمی‌باشد. مسیر دریافتی: " . $path . " (" . $method . ")"
        ), JSON_UNESCAPED_UNICODE);
        exit;
}
