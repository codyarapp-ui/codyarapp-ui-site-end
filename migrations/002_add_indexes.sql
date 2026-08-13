-- 002_add_indexes.sql
-- Create required indexes safely for performance optimization

DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

DELIMITER //
CREATE PROCEDURE AddIndexIfNotExists(
    IN tableName VARCHAR(128),
    IN indexName VARCHAR(128),
    IN indexColumns VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
          AND table_name = tableName 
          AND index_name = indexName
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, ' (', indexColumns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL AddIndexIfNotExists('orders', 'idx_orders_user_id', 'user_id');
CALL AddIndexIfNotExists('orders', 'idx_orders_status', 'status');
CALL AddIndexIfNotExists('payments', 'idx_payments_authority', 'authority');
CALL AddIndexIfNotExists('error_codes', 'idx_error_codes_lookup', 'code, brand, model');

DROP PROCEDURE IF EXISTS AddIndexIfNotExists;
