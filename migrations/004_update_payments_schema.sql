-- 004_update_payments_schema.sql
-- Add related_type and related_id to payments table safely

DROP PROCEDURE IF EXISTS AddPaymentRelatedFields;

DELIMITER //
CREATE PROCEDURE AddPaymentRelatedFields()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'related_type'
    ) THEN
        ALTER TABLE payments ADD COLUMN related_type VARCHAR(50) AFTER order_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'related_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN related_id VARCHAR(255) AFTER related_type;
    END IF;
END //
DELIMITER ;

CALL AddPaymentRelatedFields();

DROP PROCEDURE IF EXISTS AddPaymentRelatedFields;
