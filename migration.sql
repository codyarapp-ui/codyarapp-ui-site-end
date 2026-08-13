-- migration.sql
-- Complete Unified Single Database Schema for Repair Shop Management System (Kodyar24)

-- 1. users table
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

-- 2. technicians table
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
  rating DECIMAL(3,2) DEFAULT 5.0,
  completed_orders INT DEFAULT 0,
  wallet_balance DECIMAL(15,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. error_codes table
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_error_codes_lookup (code, brand, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. problems table
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

-- 5. orders table
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

-- 6. order_status_history table
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

-- 7. spare_parts table
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. part_orders table
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

-- 9. subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'عضویت ویژه',
  payment_id VARCHAR(100) NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sub_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. payments table
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

-- 11. wallet_transactions table
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

-- 12. tickets table
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

-- 13. ticket_messages table
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

-- 14. sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id VARCHAR(100) PRIMARY KEY,
  recipient_phone VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  provider VARCHAR(50) DEFAULT '',
  status VARCHAR(50) DEFAULT 'sent',
  response_data TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. settings table
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value LONGTEXT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. sessions table
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

-- 17. usage_counters table
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

-- 18. activity_logs table
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
