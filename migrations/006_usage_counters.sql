-- Migration 006: Create usage_counters table for server-side subscription usage tracking
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
  INDEX idx_usage_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
