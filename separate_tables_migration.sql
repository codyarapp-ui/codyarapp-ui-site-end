-- ====================================================================
-- دستورات ارتقا و تفکیک دیتابیس (کاملاً ایمن و بدون حذف دیتای زنده)
-- این اسکریپت جداول اختصاصی جدید را ایجاد کرده و اطلاعات را تفکیک می‌کند.
-- ====================================================================

-- ۱. ساخت جدول جدید مشتریان (کاربران عادی)
CREATE TABLE IF NOT EXISTS `clients_v2` (
  `id` VARCHAR(100) PRIMARY KEY,
  `phone` VARCHAR(20),
  `password_hash` VARCHAR(255),
  `full_name` VARCHAR(100),
  `role` VARCHAR(20) DEFAULT 'client',
  `city` VARCHAR(100),
  `wallet_balance` DECIMAL(12,2) DEFAULT 0.00,
  `referral_code` VARCHAR(50),
  `referred_by` VARCHAR(50),
  `subscription` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_clients_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۲. ساخت جدول جدید تکنسین‌ها
CREATE TABLE IF NOT EXISTS `technicians_v2` (
  `id` VARCHAR(100) PRIMARY KEY,
  `phone` VARCHAR(20),
  `password_hash` VARCHAR(255),
  `full_name` VARCHAR(100),
  `role` VARCHAR(20) DEFAULT 'technician',
  `status` VARCHAR(20) DEFAULT 'pending',
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `specialties` LONGTEXT,
  `city` VARCHAR(100),
  `documents` LONGTEXT,
  `completed_orders` INT DEFAULT 0,
  `balance` DECIMAL(12,2) DEFAULT 0.00,
  `avatar_url` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_techs_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۳. ساخت جدول پرداختی‌های خرید اشتراک
CREATE TABLE IF NOT EXISTS `subscription_payments_v2` (
  `id` VARCHAR(100) PRIMARY KEY,
  `user_id` VARCHAR(100),
  `amount` DECIMAL(12,2),
  `gateway` VARCHAR(50),
  `status` VARCHAR(50),
  `plan` VARCHAR(50),
  `authority` VARCHAR(100),
  `ref_id` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۴. ساخت جدول پرداختی‌ها و سفارشات خرید قطعه
CREATE TABLE IF NOT EXISTS `part_payments_v2` (
  `id` VARCHAR(100) PRIMARY KEY,
  `user_id` VARCHAR(100),
  `user_phone` VARCHAR(20),
  `part_id` VARCHAR(100),
  `part_name` VARCHAR(255),
  `quantity` INT DEFAULT 1,
  `unit_price` DECIMAL(12,2) DEFAULT 0.00,
  `total_price` DECIMAL(12,2) DEFAULT 0.00,
  `gateway` VARCHAR(50) DEFAULT 'card_to_card',
  `status` VARCHAR(50) DEFAULT 'pending',
  `ref_id` VARCHAR(100),
  `card_holder` VARCHAR(100),
  `address` TEXT,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۵. انتقال ایمن اطلاعات کاربران عادی از users_v2 به clients_v2 (بدون حذف دیتای اصلی)
INSERT IGNORE INTO `clients_v2` (`id`, `phone`, `password_hash`, `full_name`, `role`, `city`, `subscription`)
SELECT `id`, `phone`, `password_hash`, `full_name`, IFNULL(`role`, 'client'), `city`, `subscription`
FROM `users_v2` WHERE `role` = 'client' OR `role` IS NULL OR `role` = '';

-- ۶. انتقال ایمن اطلاعات تکنسین‌ها به technicians_v2
INSERT IGNORE INTO `technicians_v2` (`id`, `phone`, `password_hash`, `full_name`, `role`, `status`, `rating`, `specialties`, `city`, `documents`, `completed_orders`, `balance`, `avatar_url`)
SELECT `id`, `phone`, `password_hash`, `full_name`, 'technician', IFNULL(`status`, 'pending'), IFNULL(`rating`, 5.00), `specialties`, `city`, `documents`, IFNULL(`completed_orders`, 0), IFNULL(`balance`, 0), `avatar_url`
FROM `users_v2` WHERE `role` = 'technician';

-- ۷. انتقال پرداختی‌های اشتراک به subscription_payments_v2
INSERT IGNORE INTO `subscription_payments_v2` (`id`, `user_id`, `amount`, `gateway`, `status`, `plan`, `authority`, `ref_id`)
SELECT `id`, `user_id`, `amount`, `gateway`, `status`, `plan`, `authority`, `ref_id`
FROM `payments_v2` WHERE `plan` IS NOT NULL AND `plan` != '';
