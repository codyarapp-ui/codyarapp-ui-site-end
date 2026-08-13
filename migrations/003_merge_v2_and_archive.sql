-- 003_merge_v2_and_archive.sql
-- Merge _v2 tables into final tables and rename legacy tables to _archive without dropping them

DROP PROCEDURE IF EXISTS MergeAndArchiveTables;

DELIMITER //
CREATE PROCEDURE MergeAndArchiveTables()
BEGIN
    -- 1. Merge error_codes_v2 if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'error_codes_v2') THEN
        INSERT IGNORE INTO error_codes (id, code, brand, model, category, title, description, solution)
        SELECT id, code, brand, model, category, title, description, solution FROM error_codes_v2;
        
        RENAME TABLE error_codes_v2 TO error_codes_v2_archive;
    END IF;

    -- 2. Merge payments_v2 if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payments_v2') THEN
        INSERT IGNORE INTO payments (id, user_id, order_id, amount, authority, ref_id, status, payment_method, created_at)
        SELECT id, user_id, order_id, amount, authority, ref_id, status, payment_method, created_at FROM payments_v2;
        
        RENAME TABLE payments_v2 TO payments_v2_archive;
    END IF;

    -- 3. Merge part_purchases_v2 if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'part_purchases_v2') THEN
        INSERT IGNORE INTO part_orders (id, user_id, part_id, quantity, total_price, status, created_at)
        SELECT id, user_id, part_id, quantity, total_price, status, created_at FROM part_purchases_v2;
        
        RENAME TABLE part_purchases_v2 TO part_purchases_v2_archive;
    END IF;

    -- 4. Merge clients_v2 if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'clients_v2') THEN
        INSERT IGNORE INTO users (id, phone, full_name, role, password_hash, wallet_balance, created_at)
        SELECT id, phone, full_name, 'user', password_hash, wallet_balance, created_at FROM clients_v2;
        
        RENAME TABLE clients_v2 TO clients_v2_archive;
    END IF;

    -- 5. Merge technicians_v2 if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'technicians_v2') THEN
        INSERT IGNORE INTO technicians (id, phone, full_name, national_id, city, specialties, avatar_url, status, wallet_balance, created_at)
        SELECT id, phone, full_name, national_id, city, specialties, avatar_url, status, wallet_balance, created_at FROM technicians_v2;
        
        RENAME TABLE technicians_v2 TO technicians_v2_archive;
    END IF;

    -- 6. Merge orders_v2 if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'orders_v2') THEN
        INSERT IGNORE INTO orders (id, user_id, technician_id, category, brand, model, problem_description, customer_name, customer_phone, address, city, status, amount, report, created_at)
        SELECT id, user_id, technician_id, category, brand, model, problem_description, customer_name, customer_phone, address, city, status, amount, report, created_at FROM orders_v2;
        
        RENAME TABLE orders_v2 TO orders_v2_archive;
    END IF;
END //
DELIMITER ;

CALL MergeAndArchiveTables();

DROP PROCEDURE IF EXISTS MergeAndArchiveTables;
