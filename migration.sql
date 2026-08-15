-- migration.sql
-- Unified Database Schema & Restored Data for Kodyar24
-- Includes All Users, Technicians, Settings, and System Dependencies with Intact Passwords

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(100) DEFAULT '',
  role VARCHAR(50) DEFAULT 'user',
  is_super_admin TINYINT(1) DEFAULT 0,
  city VARCHAR(100) DEFAULT '',
  address TEXT,
  password_hash VARCHAR(255) DEFAULT '',
  wallet_balance DECIMAL(15,2) DEFAULT 0.00,
  referral_code VARCHAR(100) DEFAULT '',
  must_change_password TINYINT(1) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: customer_profiles
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_profiles (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  national_code VARCHAR(20) DEFAULT '',
  email VARCHAR(100) DEFAULT '',
  telephone VARCHAR(20) DEFAULT '',
  province VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  region VARCHAR(100) DEFAULT '',
  address TEXT,
  postal_code VARCHAR(20) DEFAULT '',
  lat DECIMAL(10,8) DEFAULT NULL,
  lng DECIMAL(11,8) DEFAULT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: technicians
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS technicians (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(100) DEFAULT '',
  national_id VARCHAR(50) DEFAULT '',
  city VARCHAR(100) DEFAULT 'تهران',
  specialties JSON NULL,
  avatar_url TEXT NULL,
  status VARCHAR(50) DEFAULT 'active',
  rating DECIMAL(3,2) DEFAULT 5.00,
  completed_orders INT DEFAULT 0,
  wallet_balance DECIMAL(15,2) DEFAULT 0.00,
  is_verified TINYINT(1) DEFAULT 1,
  documents JSON NULL,
  active_location VARCHAR(100) DEFAULT 'تهران',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: technician_specialties
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS technician_specialties (
  id VARCHAR(100) PRIMARY KEY,
  technician_id VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100) DEFAULT '',
  proficiency_level VARCHAR(50) DEFAULT 'expert',
  is_certified TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ts_tech FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: error_codes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS error_codes (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) DEFAULT '',
  description TEXT NULL,
  causes JSON NULL,
  steps JSON NULL,
  precautions JSON NULL,
  hazard_level VARCHAR(50) DEFAULT 'medium',
  solution TEXT NULL,
  is_approved TINYINT(1) DEFAULT 1,
  submitted_by VARCHAR(100) DEFAULT '',
  submitted_at VARCHAR(100) DEFAULT '',
  video_url TEXT NULL,
  audio_url TEXT NULL,
  tech_pdf_url TEXT NULL,
  diagram_url TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_error_codes_lookup (code, brand, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: problems
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS problems (
  id VARCHAR(100) PRIMARY KEY,
  title TEXT NOT NULL,
  category VARCHAR(100) DEFAULT '',
  brand VARCHAR(100) DEFAULT '',
  model VARCHAR(100) DEFAULT '',
  symptoms JSON NULL,
  causes JSON NULL,
  solutions JSON NULL,
  related_parts JSON NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NULL,
  technician_id VARCHAR(100) NULL,
  customer_name VARCHAR(100) DEFAULT '',
  customer_phone VARCHAR(20) DEFAULT '',
  category VARCHAR(100) DEFAULT '',
  brand VARCHAR(100) DEFAULT '',
  model VARCHAR(100) DEFAULT '',
  error_code VARCHAR(100) DEFAULT '',
  problem_description TEXT NULL,
  address TEXT NULL,
  city VARCHAR(100) DEFAULT '',
  region VARCHAR(100) DEFAULT '',
  date VARCHAR(100) DEFAULT '',
  time_slot VARCHAR(100) DEFAULT '',
  media_urls JSON NULL,
  technician_name VARCHAR(100) DEFAULT '',
  technician_phone VARCHAR(20) DEFAULT '',
  status VARCHAR(50) DEFAULT 'pending',
  amount DECIMAL(15,2) DEFAULT 0.00,
  report TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_technician FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: order_status_history
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  title TEXT NULL,
  updated_by VARCHAR(100) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_osh_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: spare_parts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS spare_parts (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '',
  brand VARCHAR(100) DEFAULT '',
  model VARCHAR(100) DEFAULT '',
  price DECIMAL(15,2) DEFAULT 0.00,
  stock INT DEFAULT 0,
  image_url TEXT NULL,
  description TEXT NULL,
  part_number VARCHAR(100) DEFAULT '',
  compatible_models JSON NULL,
  code VARCHAR(100) DEFAULT '',
  status VARCHAR(50) DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: part_orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS part_orders (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NULL,
  part_id VARCHAR(100) NULL,
  buyer_name VARCHAR(100) DEFAULT '',
  buyer_phone VARCHAR(20) DEFAULT '',
  address TEXT NULL,
  quantity INT DEFAULT 1,
  total_price DECIMAL(15,2) DEFAULT 0.00,
  items JSON NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_tracking_code VARCHAR(100) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_po_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_po_part FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE SET NULL,
  INDEX idx_po_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: subscriptions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'عضویت ویژه',
  plan_id VARCHAR(100) DEFAULT '',
  plan_name VARCHAR(100) DEFAULT '',
  payment_id VARCHAR(100) NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sub_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: payments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NULL,
  order_id VARCHAR(100) NULL,
  related_type VARCHAR(50) NULL,
  related_id VARCHAR(100) NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) DEFAULT 'card_to_card',
  authority VARCHAR(255) NULL,
  ref_id VARCHAR(255) NULL,
  ref_code VARCHAR(100) DEFAULT '',
  card_number VARCHAR(50) DEFAULT '',
  tracking_code VARCHAR(100) DEFAULT '',
  receipt_img TEXT NULL,
  admin_note TEXT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_pay_user_id (user_id),
  INDEX idx_pay_authority (authority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: wallet_transactions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_wt_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: tickets
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tickets_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: ticket_messages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_messages (
  id VARCHAR(100) PRIMARY KEY,
  ticket_id VARCHAR(100) NOT NULL,
  sender_type VARCHAR(50) NULL DEFAULT 'user',
  sender_role VARCHAR(50) NULL DEFAULT 'user',
  sender_id VARCHAR(100) NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tm_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX idx_tm_ticket_id (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: sms_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_logs (
  id VARCHAR(100) PRIMARY KEY,
  recipient_phone VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  provider VARCHAR(50) DEFAULT '',
  status VARCHAR(50) DEFAULT 'sent',
  response_data TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: otp_codes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id VARCHAR(100) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'login',
  attempts INT NOT NULL DEFAULT 0,
  consumed_at DATETIME DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone (phone),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value LONGTEXT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: system_state
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_state (
  state_key VARCHAR(50) PRIMARY KEY,
  state_value LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: sessions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  token TEXT NOT NULL,
  refresh_token TEXT NULL,
  user_agent TEXT NULL,
  ip VARCHAR(50) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: usage_counters
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_counters (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  feature VARCHAR(64) NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  period_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  period_end DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_feature (user_id, feature),
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_usage_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usage_counter (
  usage_key VARCHAR(100) PRIMARY KEY,
  count_val INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure: activity_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NULL,
  action VARCHAR(100) NOT NULL,
  ip VARCHAR(50) NULL,
  details TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_act_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- RESTORED DATA: USERS (All Original Accounts & Passwords)
-- ========================================================
INSERT INTO `users` (`id`, `phone`, `full_name`, `role`, `is_super_admin`, `city`, `address`, `password_hash`, `wallet_balance`, `referral_code`, `must_change_password`, `status`, `created_at`, `updated_at`) VALUES
('72', '09127866452', 'مهدی اصلی بیگی', 'technician', 0, 'تهران', '', '$2b$10$NKA/SCciJkUEowbaC9vwf.yp0BCWZnNPBjv2D50cd0/buBuD36gkC', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:30'),
('73', '09351550073', 'استاد رسول آرمونتن', 'technician', 0, 'تهران', '', '$2b$10$8W0Fplzjb1YZzfNToNQPV.lBDgNZskc5PuDtVMxCwMPTlO42U0eFy', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:10'),
('75', '09179308257', 'مجید عابدی', 'technician', 0, 'تهران', '', '$2b$10$WLRX2q0ZJIOBzOfZGIQh6eXtM3q8vXJ5FFP33.bUwfV9q3UbFd0Py', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:11'),
('77', '09035261058', 'بهزاد بهزادی', 'technician', 0, 'تهران', '', '$2b$10$TvuKCw1SpJUpPbDMeu05S.dTdV.qCCDv3WT.MqXgAcUvwrvY7iOaG', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:12'),
('tech_us_1785101979869', '09128380616', 'میلاد ثابت', 'technician', 0, 'تهران', '', '$2b$10$GhnejHDsXSofX1lg0owxAeLiKazYnF4lDW8CA1Az3pI9/GfovS1Ca', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:12'),
('tech_us_1785150218956', '09109379012', 'عابدینی', 'technician', 0, 'مشهد', '', '$2b$10$IaAUj46eVolJhcE7jsRIHe.jujyTK/3NCXtdL3OBCRSTgFQZOAei6', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:13'),
('tech_us_1785171272998', '09113912634', 'استاد مصطفی کرمیان', 'technician', 0, 'تهران، تمام نقاط', '', '$2b$10$YUxTTJUbnVjOteVjRG1G2.vFcAVDglrOYm3FIesDclrsPtP.sDfQO', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:14'),
('tech_us_1785213863777', '09166685475', 'محمد رهبری', 'technician', 0, 'تهران، تمام نقاط', '', '$2b$10$PpcJUX36xPwG.vdy0s1lEegA4knVmvv.5fFSGiHKOW5PuT5d0Iwrq', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:14'),
('us_14', '09963163202', 'محمد عزیز', 'client', 0, 'اراک', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:15'),
('us_15', '09026638935', 'hosein amini', 'client', 0, 'میانه', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:16'),
('us_16', '09104923024', 'ارژنگ صفرب', 'client', 0, 'البرز', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:17'),
('us_17', '09188376296', 'اکبر سلطان آبادی', 'client', 0, '', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:17'),
('us_1783324567726', '09112580143', 'مجید قنبری', 'client', 0, '', '', '87b30ce8275892231931e006ea47c3250e26de50cbf962fbd706aade4de23887', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:18'),
('us_1783440341734', '09196492190', 'محمد رضا', 'client', 0, 'تبریز', '', '04649d1bb5b15464894b5563ac943bfdaa1975794baad44a31990aeb10ae1ffc', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:19'),
('us_1783451309595', '09126180797', 'رضا محمد طاهری', 'client', 0, 'تهران', '', '9fb1219083ec1afc8bff36def25fe5dae3245d97d34ee85a103b675a4437a9a6', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:19'),
('us_1783615412838', '09186719282', 'حسن', 'client', 0, 'همدان', '', '480aa842a374b5c1d46b3827b4dee64404ed0e24afb6535c1edea0571a476da5', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:09'),
('us_1783632926150', '09384753602', 'صادق دوستی', 'technician', 0, 'تهران پاکدشت', '', '$2b$10$VeBEZdjQi6AtbFvfidC78.mq8lmPo.itdgjPHYvJYdeBQtlbOO5VK', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:21'),
('us_1783704924879', '09196479362', 'مرادبازافکن', 'technician', 0, 'تهران', '', '$2b$10$GCgaEH.z8FdQOkUp4IhnZeiV.1AfLfDCHEuCGEAWxZZGMUvOBqMAu', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:22'),
('us_1783752832590', '09399545004', 'هادی احمدیزاده', 'technician', 0, 'تهران', '', '$2b$10$O0pHzJRz5LAvxNLGe2mQ9OclPq4KUG3oYANVP.1ruxHp7S.KWSdYu', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:22'),
('us_1784290433541', '09126532412', 'عبادی', 'client', 0, '', '', '$2b$10$OS/3MYVX.LOw2zcTiJWrnOeqJ.cmpAsySK/0pXJwY0fd7ZKIAQ5Hm', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:23'),
('us_1784467258450', '09393481132', 'استاد بلوچ', 'technician', 0, 'تهران', '', '$2b$10$8BpIxHFIV2d8WPOH24VML.7cKl7AsGS6C6R7KOlhhsn0a7bT5vNOq', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:24'),
('us_1784730917764', '09364284644', 'بینا خاوصی', 'technician', 0, 'کرمان', '', '$2b$10$/OpSkhAHlTFfkQA5W5LuXeItCinzJ/1N2YaR6sABitC.LNT3eUpX2', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:24'),
('us_1784738756105', '09374163377', 'مهرداد سلیمی', 'technician', 0, 'شیراز', '', '$2b$10$gKHRf7pyGkEx03qDKEdz5edu9KDskYOWvMpYmkRP/P5b7lAnh2ECG', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:25'),
('us_1784739415658', '09912793478', 'علیرضامقیمی', 'technician', 0, 'کرج', '', '$2b$10$/te7vEeKGoickMdUPD0s0es.e.qHBl12EBd/rwqffzXzXi8raHqKC', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:26'),
('us_1784745571379', '09371814990', 'محمد اکبری', 'client', 0, 'بندرانزلی', '', '$2b$10$YR7djpXDhbMKiE5xplxK.eZb4aFJD45aeisUifnvZH4iG3rioqz3.', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:27'),
('us_1784756192212', '09332804241', 'حسین', 'client', 0, 'تهران', '', '$2b$10$USDK8bitPWNdD1OMPBewpuyRUbhTRKfzenWdWfrCLbnEQt2OLwhAa', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:27'),
('us_1784777944356', '09352257809', 'محمدرضا درزی', 'technician', 0, 'مازندران', '', '$2b$10$edHig/TY1ENyu9la1f1DeuqR1mMExP9SU0XSXXe66d58xMbfCqrr6', 0.00, '', 0, 'active', '2026-08-03 14:10:27', '2026-08-12 21:53:28'),
('us_1784838017150', '09919588445', 'مرتضی خوشرو ماجدی', 'client', 0, 'کرج', '', '$2b$10$FgOICnP3yWFsuz70Ibm13uPRr15HPYQjFFDTO5JyQWF1v6htuJ4kW', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:29'),
('us_1784880430375', '09162754640', 'ابوالفضل اسدی', 'client', 0, 'کرمان', '', '$2b$10$AqH.ubX0RpC44AXGFBwph.GKG7xfhrmuoTxzvtlppooZc8RRBziTq', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:29'),
('us_1785048946013', '09137744877', 'محسن دهقانی فیروزآبادی', 'client', 0, 'یزد', '', '$2b$10$879d4TMVpg1UAWFlH68I6ujZML6rA/yTNT2xOENI4SFIBmuoHgGkG', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:52:59'),
('us_1785152658354', '09125836764', 'بهزاد اسکندری', 'client', 0, '', '', '$2b$10$eRmzyYiIvLubRYGiJQhg8.xicrbz6djJVtMbOd/foNXv2JcMVolny', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:20'),
('us_1785159145079', '09138378098', 'احمدرضا جعفری', 'client', 0, 'اصفهان', '', '$2b$10$LXA5fGL4qR5hqQlBzix32eXErLcUL602vFc3gd2uEuJ97rTvGwBiK', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:00'),
('us_1785349718179', '09357000622', 'مرتضی ماجدی', 'client', 0, 'کرج', '', '$2b$10$uj1DsdSmpV2pQhwRj1C7EOVOGwyjcNY5Wxx4tCGuWQO/XRYdHiDwu', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:52:59'),
('us_1785462195734', '09365572371', 'سالار محمدزاده', 'client', 0, 'تهران', '', '$2b$10$yCFDHQvfmHcn296Mr8YJ3.qubeawDdNzVH5JnyisjSHp2AF7aWOVa', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:52:56'),
('us_1785508366077', '09123342366', 'عباس یوسفی', 'client', 0, 'تهران', '', '$2b$10$sxrJEV2gsotTJ0x58xG5VOLGCrIX0T6qfM4OT5dpwebFKwK.CKFk.', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:52:57'),
('us_1786119798153', '09389744510', 'امید پریسا', 'client', 0, 'تهران', '', '$2b$10$Z.o5TWKw/IctNhPwxpC15Oqiv/bEKABcb8x73Nl10/vWMbH8dFe8W', 0.00, '', 0, 'verified', '2026-08-07 19:53:19', '2026-08-12 21:52:51'),
('us_1786361246109', '09395569663', 'ابوالفضل فریدونی', 'client', 0, 'شیراز', '', '$2b$10$zbYJqrLJkZBjMfwtTCqUgua9pPNY1W0VHFx8XA9FZ/XAmF7u7bYzi', 0.00, '', 0, 'verified', '2026-08-10 14:57:27', '2026-08-12 21:52:48'),
('us_19', '09353718912', 'مهدی', 'client', 0, '', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:01'),
('us_20', '09123226009', 'حیدر قاسمی', 'client', 0, 'تهران', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:01'),
('us_22', '09068667790', 'رستم قلی موس به چو', 'client', 0, 'آمل', '', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:02'),
('us_25', '09120947304', 'مدیر عالی کدیار24', 'admin', 1, 'تهران', '', '$2b$10$d571vxJrxiqY7Z9us3pLuO04cs6NGQi2.goa5.y.jD07VqfA8OiVO', 0.00, '', 0, 'active', '2026-08-03 14:58:18', '2026-08-13 14:37:55'),
('us_28', '09305705484', 'کامران شریف', 'client', 0, 'تهران', '', '$2y$10$E92zz.6gUaa6WAucYreO8euW6OceRZKREJUvl5Lh8f4PAjJVuwyG2', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:03'),
('us_43', '09195850731', 'Saeed', 'client', 0, 'کرج', '', '$2y$10$f5Fim2uYn.hoKsR7tnFzHOrfQuuFHKnD0Wfigs/4foyblw2z9/4tq', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:04'),
('us_52', '09186323212', 'reza', 'client', 0, '', '', '$2y$10$9eWNWlcYJKb99TOHw/DVt.5fuIfeqSNvcCyl/aLysuDhq.qDUd7Ku', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:04'),
('us_53', '09192294599', 'علیرضا مقصودی', 'client', 0, '', '', '$2y$10$8thoZKzgrUPkwXR1FtlIVezQBwfzoMhimwu3RbaVBIpT2r/HFlVwK', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:05'),
('us_56', '09127883398', 'سالار بدر حصاری', 'client', 0, '', '', '$2y$10$ArkqbBO5Y8.OTYcC7m0MVeALrkZvngTmlGPc89c4jH8IkC4TqugeK', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:06'),
('us_57', '09160856355', 'محمد مرادی', 'client', 0, '', '', '$2y$10$aTc0eKd3GWAzqJBpMsbZuu9FAo4x.H7mp6FSSg9G6GQtBf29WAlcu', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:06'),
('us_61', '09189660106', 'رضا شعبانی', 'client', 0, '', '', '$2y$10$XsF.2Zz01C3IapamJ7sJF.5ZvHo2EnALxGOPh/rZ6iowwx/nSXBDa', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:07'),
('us_62', '09163016619', 'panbakar', 'client', 0, '', '', '$2y$10$7h9u9rbNLSzCiteKe9t3y.WJXr1fUlNXejKGzuCaV7K16In.2xejq', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:08'),
('us_64', '09125204262', 'عباس فتحی', 'client', 0, '', '', '$2y$10$e5nh1iHshur5e7RixDuK6OixAk8Ur74XxUzMmgwavpm3DhuhgOd5u', 0.00, '', 0, 'verified', '2026-08-03 14:10:27', '2026-08-12 21:53:09'),
('user_1786546835989_480', '09120000000', 'مدیر کل پلتفرم', 'admin', 1, '', '', '$2b$10$n8APSCrhS9xZb1GEfrM9Y.eX5N2kyutQ4wu8TUjktnjSFeG1ZBgZW', 0.00, '', 0, 'active', '2026-08-12 18:30:36', '2026-08-12 18:30:36'),
('user_1786751026589_446', '09307446295', 'مشتری کدیاراز اپ', 'customer', 0, 'فراهان', 'اراک فراهان فرمهین کوی ثامن', '$2b$10$RXe8Y9hGHU4uJUPFxo46ee0lExkUgHUSy0JmeZOy3/XhD2301k846', 0.00, '', 0, 'active', '2026-08-15 03:13:46', '2026-08-15 03:14:46')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_super_admin = VALUES(is_super_admin),
  city = VALUES(city),
  address = VALUES(address),
  password_hash = VALUES(password_hash),
  wallet_balance = VALUES(wallet_balance),
  status = VALUES(status);

-- ========================================================
-- RESTORED DATA: TECHNICIANS
-- ========================================================
INSERT INTO `technicians` (`id`, `user_id`, `phone`, `full_name`, `national_id`, `city`, `specialties`, `avatar_url`, `status`, `rating`, `completed_orders`, `wallet_balance`, `created_at`, `updated_at`, `is_verified`, `documents`, `active_location`) VALUES
('tech_72', '72', '09127866452', 'مهدی اصلی بیگی', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:32', '2026-08-13 01:17:34', 1, '[]', 'تهران'),
('tech_73', '73', '09351550073', 'استاد رسول آرمونتن', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:33', '2026-08-12 21:52:46', 1, '[]', 'تهران'),
('tech_75', '75', '09179308257', 'مجید عابدی', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:34', '2026-08-12 21:58:49', 1, '[]', 'تهران'),
('tech_77', '77', '09035261058', 'بهزاد بهزادی', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:34', '2026-08-12 21:59:31', 1, '[]', 'تهران'),
('tech_tech_us_1785101979869', 'tech_us_1785101979869', '09128380616', 'میلاد ثابت', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:35', '2026-08-12 21:58:47', 1, '[]', 'تهران'),
('tech_tech_us_1785150218956', 'tech_us_1785150218956', '09109379012', 'عابدینی', '', 'مشهد', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:36', '2026-08-12 21:58:42', 1, '[]', 'مشهد'),
('tech_tech_us_1785171272998', 'tech_us_1785171272998', '09113912634', 'استاد مصطفی کرمیان', '', 'تهران، تمام نقاط', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:36', '2026-08-12 21:58:45', 1, '[]', 'تهران، تمام نقاط'),
('tech_tech_us_1785213863777', 'tech_us_1785213863777', '09166685475', 'محمد رهبری', '', 'تهران، تمام نقاط', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:37', '2026-08-12 21:58:43', 1, '[]', 'تهران، تمام نقاط'),
('tech_us_1783632926150', 'us_1783632926150', '09384753602', 'صادق دوستی', '', 'تهران پاکدشت', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:39', '2026-08-12 21:58:13', 1, '[]', 'تهران پاکدشت'),
('tech_us_1783704924879', 'us_1783704924879', '09196479362', 'مرادبازافکن', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:39', '2026-08-12 21:58:39', 1, '[]', 'تهران'),
('tech_us_1783752832590', 'us_1783752832590', '09399545004', 'هادی احمدیزاده', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:40', '2026-08-12 21:57:33', 1, '[]', 'تهران'),
('tech_us_1784467258450', 'us_1784467258450', '09393481132', 'استاد بلوچ', '', 'تهران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:41', '2026-08-12 21:57:30', 1, '[]', 'تهران'),
('tech_us_1784730917764', 'us_1784730917764', '09364284644', 'بینا خاوصی', '', 'کرمان', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:41', '2026-08-12 21:57:34', 1, '[]', 'کرمان'),
('tech_us_1784738756105', 'us_1784738756105', '09374163377', 'مهرداد سلیمی', '', 'شیراز', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:42', '2026-08-12 21:57:28', 1, '[]', 'شیراز'),
('tech_us_1784739415658', 'us_1784739415658', '09912793478', 'علیرضامقیمی', '', 'کرج', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:43', '2026-08-12 21:57:24', 1, '[]', 'کرج'),
('tech_us_1784777944356', 'us_1784777944356', '09352257809', 'محمدرضا درزی', '', 'مازندران', '[]', '', 'active', 5.00, 0, 0.00, '2026-08-12 21:40:43', '2026-08-12 21:57:25', 1, '[]', 'مازندران'),
('tech_user_1786735260399_97', NULL, '09130001122', 'تست امنیتی', '', 'تهران', '[\"تعمیرات عمومی\"]', NULL, 'active', 5.00, 0, 0.00, '2026-08-14 22:56:57', '2026-08-14 22:56:57', 1, '[]', 'تهران')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  city = VALUES(city),
  specialties = VALUES(specialties),
  status = VALUES(status),
  rating = VALUES(rating),
  is_verified = VALUES(is_verified);

-- ========================================================
-- RESTORED DATA: SETTINGS & SYSTEM CONFIGURATION
-- ========================================================
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('brandsList', '[\"بوتان\",\"جنرال\"]', '2026-08-14 22:00:15'),
('categoriesList', '[\"پکیج دیواری\",\"کولر گازی\"]', '2026-08-14 21:58:10'),
('citiesList', '[{\"name\":\"اراک\",\"regions\":[\"فرمهین\",\"ساوه\",\"خمین\",\"محلات\",\"شازند\"]},{\"name\":\"تهران\",\"regions\":[\"ری\",\"شمیرانات\",\"اسلامشهر\",\"شهریار\",\"دماوند\"]},{\"name\":\"مشهد\",\"regions\":[\"نیشابور\",\"سبزوار\",\"تربت حیدریه\",\"قوچان\",\"چناران\"]},{\"name\":\"اصفهان\",\"regions\":[\"کاشان\",\"خمینی‌شهر\",\"نجف‌آباد\",\"شاهین‌شهر\",\"فلاورجان\"]},{\"name\":\"شیراز\",\"regions\":[\"مرودشت\",\"کازرون\",\"جهرم\",\"لارستان\",\"فسا\"]},{\"name\":\"تبریز\",\"regions\":[\"مراغه\",\"مرند\",\"اهر\",\"شبستر\",\"اسکو\"]},{\"name\":\"کرج\",\"regions\":[\"ساوجبلاغ\",\"نظرآباد\",\"طالقان\",\"اشتهارد\"]},{\"name\":\"اهواز\",\"regions\":[\"دزفول\",\"آبادان\",\"خرمشهر\",\"شوش\",\"ماهشهر\"]},{\"name\":\"قم\",\"regions\":[\"جعفریه\",\"کهک\",\"دستجرد\"]},{\"name\":\"کرمان\",\"regions\":[\"رفسنجان\",\"سیرجان\",\"بم\",\"جیرفت\",\"زرند\"]},{\"name\":\"رشت\",\"regions\":[\"لاهیجان\",\"لنگرود\",\"رودسر\",\"آستانه اشرفیه\",\"فومن\"]},{\"name\":\"ارومیه\",\"regions\":[\"خوی\",\"مهاباد\",\"میاندوآب\",\"سلماس\",\"نقده\"]},{\"name\":\"زاهدان\",\"regions\":[\"چابهار\",\"ایرانشهر\",\"خاش\",\"زابل\"]},{\"name\":\"همدان\",\"regions\":[\"ملایر\",\"نهاوند\",\"تویسرکان\",\"اسدآباد\"]},{\"name\":\"کرمانشاه\",\"regions\":[\"اسلام‌آباد غرب\",\"جوانرود\",\"کنگاور\",\"سنقر\",\"هرسین\"]},{\"name\":\"یزد\",\"regions\":[\"میبد\",\"اردکان\",\"بافق\",\"مهریز\"]},{\"name\":\"بندرعباس\",\"regions\":[\"میناب\",\"بندر لنگه\",\"قشم\",\"رودان\"]},{\"name\":\"سنندج\",\"regions\":[\"سقز\",\"مریوان\",\"بانه\",\"کامیاران\"]},{\"name\":\"قزوین\",\"regions\":[\"تاکستان\",\"آبیک\",\"البرز\"]},{\"name\":\"خرم‌آباد\",\"regions\":[\"بروجرد\",\"دورود\",\"الیگودرز\",\"کوهدشت\"]},{\"name\":\"ساری\",\"regions\":[\"آمل\",\"بابل\",\"قائمشهر\",\"نکا\",\"بهشهر\"]},{\"name\":\"گرگان\",\"regions\":[\"گنبد کاووس\",\"علی‌آباد کتول\",\"آق‌قلا\"]},{\"name\":\"اردبیل\",\"regions\":[\"مشگین‌شهر\",\"پارس‌آباد\",\"خلخال\"]},{\"name\":\"ایلام\",\"regions\":[\"دهلران\",\"دره‌شهر\",\"ایوان\"]},{\"name\":\"بوشهر\",\"regions\":[\"دشتستان\",\"کنگان\",\"گناوه\",\"دیر\"]},{\"name\":\"بیرجند\",\"regions\":[\"قائنات\",\"فردوس\",\"طبس\"]},{\"name\":\"شهرکرد\",\"regions\":[\"بروجن\",\"فارسان\",\"لردگان\"]},{\"name\":\"یاسوج\",\"regions\":[\"دهدشت\",\"گچساران\",\"دنا\"]},{\"name\":\"زنجان\",\"regions\":[\"ابهر\",\"خرمدره\",\"خدابنده\"]},{\"name\":\"سمنان\",\"regions\":[\"شاهرود\",\"دامغان\",\"گرمسار\"]}]', '2026-08-14 22:51:57'),
('modelsList', '[\"همه مدل‌ها\"]', '2026-08-14 22:51:57')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO `system_state` (`state_key`, `state_value`) VALUES
('database', '{\n  \"adminPassword\": \"Abbasi163@#1234\",\n  \"smsSettings\": {\n    \"provider\": \"simulated\",\n    \"apiKey\": \"\",\n    \"lineNumber\": \"\",\n    \"otpPatternCode\": \"\",\n    \"statusNotificationPatternCode\": \"\",\n    \"enabled\": false\n  },\n  \"smsLogs\": [],\n  \"errorCodes\": [],\n  \"technicians\": [],\n  \"orders\": [],\n  \"spareParts\": [],\n  \"citiesList\": [],\n  \"brandsList\": [],\n  \"categoriesList\": [],\n  \"modelsList\": []\n}')
ON DUPLICATE KEY UPDATE state_value = VALUES(state_value);

-- Restore Error Codes
INSERT INTO `error_codes` (`id`, `code`, `brand`, `model`, `category`, `title`, `description`, `causes`, `steps`, `precautions`, `hazard_level`, `solution`, `is_approved`, `submitted_by`, `submitted_at`, `video_url`, `audio_url`, `tech_pdf_url`, `diagram_url`, `created_at`, `updated_at`) VALUES
('err_import_1786623835963_lx9me', 'E25', 'جنرال', 'عمومی', 'کولر گازی', 'اورلود کمپرستور', 'حرارت بالا موتور کولر', '[\"خرابی رله استارت یا افت ولتاژ شبکه\"]', '[\"خازن را تعویض کنید و لوله‌ها را شستشو دهید\"]', '[\"دست به بدنه نزنید خطر داغی بالا\"]', 'high', '', 1, '', '', '', '', '', '', '2026-08-13 15:54:53', '2026-08-13 15:54:53'),
('err_import_1786623835963_p8v7y', 'E01', 'بوتان', 'عمومی', 'پکیج دیواری', 'عدم تشکیل شعله', 'نرسیدن گاز به برنر یا معیوب بودن یون حسگر', '[\"سیم سوخته یا شیر برقی خراب\"]', '[\"۱. جریان شیر اصلی گاز را چک کنید ۲. یون را سمباده بکشید ۳. رله برد را تعویض کنید\"]', '[\"برق دستگاه قطع شده و بوی گاز استشمام نگردد\"]', 'critical', '', 1, '', '', '', '', '', '', '2026-08-13 15:54:52', '2026-08-13 15:54:52')
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

-- Restore Spare Parts
INSERT INTO `spare_parts` (`id`, `title`, `category`, `brand`, `model`, `price`, `stock`, `image_url`, `description`, `created_at`, `updated_at`, `part_number`, `compatible_models`, `code`, `status`) VALUES
('part_1786751238827', 'قطعه غیرواقعی تست', 'پکیج دیواری', 'بوتان', '', 10.00, 11, 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%23f1f5f9\'/><text x=\'50\' y=\'55\' font-size=\'28\' text-anchor=\'middle\'>⚙️</text></svg>', 'تی', '2026-08-15 03:18:15', '2026-08-15 03:20:37', 'SP-4817', '[\"بوتان\"]', 'SP-4817', 'available')
ON DUPLICATE KEY UPDATE stock = VALUES(stock);

-- Restore Part Orders
INSERT INTO `part_orders` (`id`, `user_id`, `part_id`, `buyer_name`, `buyer_phone`, `address`, `quantity`, `total_price`, `items`, `status`, `shipping_tracking_code`, `created_at`, `updated_at`) VALUES
('po_1786751437856_502', NULL, 'part_1786751238827', 'مشتری کدیاراز اپ', '09307446295', 'اراک فراهان فرمهین کوی ثامن', 1, 10.00, NULL, 'confirmed', '', '2026-08-15 03:20:37', '2026-08-15 03:26:54')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Restore Payments
INSERT INTO `payments` (`id`, `user_id`, `order_id`, `related_type`, `related_id`, `amount`, `payment_method`, `authority`, `ref_id`, `ref_code`, `card_number`, `tracking_code`, `receipt_img`, `admin_note`, `status`, `created_at`, `updated_at`) VALUES
('pay_1786751917379_251', 'user_1786751026589_446', NULL, 'subscription', '12_month', 1190000.00, 'zarinpal', 'ZARIN_1786751917379_8977', NULL, '', '', '', NULL, NULL, 'completed', '2026-08-15 03:28:37', '2026-08-15 03:31:20'),
('pay_1786752136764_221', 'user_1786751026589_446', NULL, 'subscription', '6_month', 690000.00, 'card_to_card', 'CARD_1786752136764_451', '55', '55', 'مشتری کدیاراز اپ', '', NULL, NULL, 'completed', '2026-08-15 03:32:16', '2026-08-15 03:32:45'),
('pay_1786752951565_491', 'user_1786751026589_446', NULL, 'subscription', '12_month', 1190000.00, 'card_to_card', 'CARD_1786752951565_137', '55', '55', 'مشتری کدیاراز اپ', '', NULL, NULL, 'completed', '2026-08-15 03:45:51', '2026-08-15 03:46:24')
ON DUPLICATE KEY UPDATE status = VALUES(status);

SET FOREIGN_KEY_CHECKS = 1;
