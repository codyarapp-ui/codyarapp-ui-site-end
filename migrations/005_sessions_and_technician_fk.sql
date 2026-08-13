-- 005_sessions_and_technician_fk.sql
-- Add user_id column to technicians table and create sessions table

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  refresh_token TEXT,
  user_agent TEXT,
  ip VARCHAR(50),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user_id (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS AddTechnicianUserId;

DELIMITER //
CREATE PROCEDURE AddTechnicianUserId()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'technicians' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE technicians ADD COLUMN user_id VARCHAR(255) AFTER id;
    END IF;
END //
DELIMITER ;

CALL AddTechnicianUserId();
DROP PROCEDURE IF EXISTS AddTechnicianUserId;
