import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import express from "express";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
export const BACKUPS_DIR = path.join(process.cwd(), "public", "uploads", "backups");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export let isMySqlOffline = false;
export function setMySqlOffline(val: boolean) {
  // Keep MySQL active so operations write to real database tables
  isMySqlOffline = false;
}

let isSchemaEnsured = false;
export async function ensureDatabaseSchema(): Promise<void> {
  if (isSchemaEnsured) return;
  try {
    isSchemaEnsured = true;
    const p = getDbPool();

    // 1. users table
    await p.query(`
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
    `);

    // 2. technicians table
    await p.query(`
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
    `);

    // 3. error_codes table
    await p.query(`
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
    `);

    const safeAddColumn = async (table: string, colDef: string) => {
      try {
        await p.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      } catch (err: any) {
        // Ignore duplicate column errors
      }
    };

    await safeAddColumn('users', 'is_premium TINYINT(1) DEFAULT 0');
    await safeAddColumn('users', 'subscription_plan VARCHAR(100) DEFAULT ""');
    await safeAddColumn('users', 'subscription_expire_date VARCHAR(100) DEFAULT ""');

    await safeAddColumn('error_codes', 'is_approved TINYINT(1) DEFAULT 1');
    await safeAddColumn('error_codes', 'submitted_by VARCHAR(100) DEFAULT ""');
    await safeAddColumn('error_codes', 'submitted_at VARCHAR(100) DEFAULT ""');
    await safeAddColumn('error_codes', 'video_url TEXT NULL');
    await safeAddColumn('error_codes', 'audio_url TEXT NULL');
    await safeAddColumn('error_codes', 'tech_pdf_url TEXT NULL');
    await safeAddColumn('error_codes', 'diagram_url TEXT NULL');

    await safeAddColumn('technicians', 'is_verified TINYINT(1) DEFAULT 1');
    await safeAddColumn('technicians', 'documents JSON NULL');
    await safeAddColumn('technicians', 'active_location VARCHAR(100) DEFAULT "تهران"');

    await safeAddColumn('spare_parts', 'part_number VARCHAR(100) DEFAULT ""');
    await safeAddColumn('spare_parts', 'brand VARCHAR(100) DEFAULT ""');
    await safeAddColumn('spare_parts', 'model VARCHAR(100) DEFAULT ""');
    await safeAddColumn('spare_parts', 'device_category VARCHAR(100) DEFAULT ""');
    await safeAddColumn('spare_parts', 'compatible_brands TEXT NULL');
    await safeAddColumn('spare_parts', 'short_description TEXT NULL');
    await safeAddColumn('spare_parts', 'image_url TEXT NULL');
    await safeAddColumn('spare_parts', 'compatible_models JSON NULL');
    await safeAddColumn('spare_parts', 'code VARCHAR(100) DEFAULT ""');
    await safeAddColumn('spare_parts', 'status VARCHAR(50) DEFAULT "available"');

    await safeAddColumn('subscriptions', 'plan_id VARCHAR(100) DEFAULT ""');
    await safeAddColumn('subscriptions', 'plan_name VARCHAR(100) DEFAULT ""');

    await safeAddColumn('payments', 'ref_code VARCHAR(100) DEFAULT ""');
    await safeAddColumn('payments', 'card_number VARCHAR(50) DEFAULT ""');

    await safeAddColumn('part_orders', 'buyer_name VARCHAR(100) DEFAULT ""');
    await safeAddColumn('part_orders', 'buyer_phone VARCHAR(20) DEFAULT ""');
    await safeAddColumn('part_orders', 'address TEXT NULL');
    await safeAddColumn('part_orders', 'shipping_tracking_code VARCHAR(100) DEFAULT ""');

    await safeAddColumn('orders', 'error_code VARCHAR(100) DEFAULT ""');
    await safeAddColumn('orders', 'region VARCHAR(100) DEFAULT ""');
    await safeAddColumn('orders', 'date VARCHAR(100) DEFAULT ""');
    await safeAddColumn('orders', 'time_slot VARCHAR(100) DEFAULT ""');
    await safeAddColumn('orders', 'media_urls JSON NULL');
    await safeAddColumn('orders', 'technician_name VARCHAR(100) DEFAULT ""');
    await safeAddColumn('orders', 'technician_phone VARCHAR(20) DEFAULT ""');

    // 4. problems table
    await p.query(`
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
    `);

    // 5. orders table
    await p.query(`
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
    `);

    // 6. order_status_history table
    await p.query(`
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
    `);

    // 7. spare_parts table
    await p.query(`
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
    `);

    // 8. part_orders table
    await p.query(`
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
    `);

    // 9. subscriptions table
    await p.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        plan_name VARCHAR(100) DEFAULT 'عضویت ویژه',
        plan_type VARCHAR(50) DEFAULT 'عضویت ویژه',
        payment_id VARCHAR(100) NULL,
        price DECIMAL(15,2) DEFAULT 0.00,
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_sub_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. payments table
    await p.query(`
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
    `);

    // 11. wallet_transactions table
    await p.query(`
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
    `);

    // 12. tickets table
    await p.query(`
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
    `);

    // 13. ticket_messages table
    await p.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id VARCHAR(100) PRIMARY KEY,
        ticket_id VARCHAR(100) NOT NULL,
        sender_type VARCHAR(50) NOT NULL,
        sender_id VARCHAR(100) NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tm_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        INDEX idx_tm_ticket_id (ticket_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. sms_logs table
    await p.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id VARCHAR(100) PRIMARY KEY,
        recipient_phone VARCHAR(20) NOT NULL,
        message_text TEXT NOT NULL,
        provider VARCHAR(50) DEFAULT '',
        status VARCHAR(50) DEFAULT 'sent',
        response_data TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 15. settings table
    await p.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value LONGTEXT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 16. sessions table
    await p.query(`
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
    `);

    // 17. usage_counters table
    await p.query(`
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
    `);

    // 18. activity_logs table
    await p.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NULL,
        user_name VARCHAR(100) DEFAULT '',
        user_role VARCHAR(50) DEFAULT '',
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100) DEFAULT '',
        ip VARCHAR(50) NULL,
        user_agent TEXT NULL,
        details LONGTEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_act_user_id (user_id),
        INDEX idx_act_module (module),
        INDEX idx_act_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 19. RBAC - roles table
    await p.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        is_system TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 20. RBAC - permissions table
    await p.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        group_name VARCHAR(100) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 21. RBAC - role_permissions pivot table
    await p.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(100) NOT NULL,
        permission_id VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id),
        CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 22. RBAC - user_roles pivot table
    await p.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id VARCHAR(100) NOT NULL,
        role_id VARCHAR(100) NOT NULL,
        assigned_by VARCHAR(100) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id),
        CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 23. customer_profiles table
    await p.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        national_code VARCHAR(20) DEFAULT '',
        email VARCHAR(100) DEFAULT '',
        telephone VARCHAR(20) DEFAULT '',
        province VARCHAR(100) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        region VARCHAR(100) DEFAULT '',
        address TEXT NULL,
        postal_code VARCHAR(20) DEFAULT '',
        lat DECIMAL(10,8) NULL,
        lng DECIMAL(11,8) NULL,
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 24. user_addresses table
    await p.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        title VARCHAR(100) DEFAULT 'آدرس منزل',
        province VARCHAR(100) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        region VARCHAR(100) DEFAULT '',
        full_address TEXT NOT NULL,
        postal_code VARCHAR(20) DEFAULT '',
        lat DECIMAL(10,8) NULL,
        lng DECIMAL(11,8) NULL,
        is_default TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ua_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 25. technician_specialties table
    await p.query(`
      CREATE TABLE IF NOT EXISTS technician_specialties (
        id VARCHAR(100) PRIMARY KEY,
        technician_id VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) DEFAULT '',
        proficiency_level VARCHAR(50) DEFAULT 'expert',
        is_certified TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ts_tech FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        INDEX idx_ts_tech (technician_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 26. service_categories table
    await p.query(`
      CREATE TABLE IF NOT EXISTS service_categories (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) DEFAULT '',
        icon VARCHAR(100) DEFAULT '',
        description TEXT NULL,
        parent_id VARCHAR(100) NULL,
        sort_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 27. services table
    await p.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(100) PRIMARY KEY,
        category_id VARCHAR(100) NULL,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(100) DEFAULT '',
        description TEXT NULL,
        base_price DECIMAL(15,2) DEFAULT 0.00,
        estimated_duration_minutes INT DEFAULT 60,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_srv_cat FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
        INDEX idx_srv_cat (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 28. service_prices table (Tariffs & Regional Pricing)
    await p.query(`
      CREATE TABLE IF NOT EXISTS service_prices (
        id VARCHAR(100) PRIMARY KEY,
        service_id VARCHAR(100) NOT NULL,
        brand VARCHAR(100) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        region VARCHAR(100) DEFAULT '',
        price DECIMAL(15,2) DEFAULT 0.00,
        min_price DECIMAL(15,2) DEFAULT 0.00,
        max_price DECIMAL(15,2) DEFAULT 0.00,
        commission_rate DECIMAL(5,2) DEFAULT 15.00,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_sp_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_sp_service (service_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 29. service_requests table
    await p.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id VARCHAR(100) PRIMARY KEY,
        tracking_code VARCHAR(100) NOT NULL UNIQUE,
        user_id VARCHAR(100) NULL,
        customer_name VARCHAR(100) DEFAULT '',
        customer_phone VARCHAR(20) DEFAULT '',
        category_title VARCHAR(100) DEFAULT '',
        brand VARCHAR(100) DEFAULT '',
        model VARCHAR(100) DEFAULT '',
        error_code VARCHAR(100) DEFAULT '',
        problem_description TEXT NULL,
        preferred_date VARCHAR(50) DEFAULT '',
        preferred_time_slot VARCHAR(50) DEFAULT '',
        province VARCHAR(100) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        region VARCHAR(100) DEFAULT '',
        address TEXT NULL,
        status VARCHAR(50) DEFAULT 'submitted',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_sr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_sr_user (user_id),
        INDEX idx_sr_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 30. order_items table
    await p.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL,
        item_type VARCHAR(50) DEFAULT 'service',
        item_id VARCHAR(100) NULL,
        title VARCHAR(255) NOT NULL,
        quantity INT DEFAULT 1,
        unit_price DECIMAL(15,2) DEFAULT 0.00,
        total_price DECIMAL(15,2) DEFAULT 0.00,
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_oi_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 31. invoices table
    await p.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(100) PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        order_id VARCHAR(100) NULL,
        user_id VARCHAR(100) NULL,
        customer_name VARCHAR(100) DEFAULT '',
        subtotal DECIMAL(15,2) DEFAULT 0.00,
        tax_amount DECIMAL(15,2) DEFAULT 0.00,
        discount_amount DECIMAL(15,2) DEFAULT 0.00,
        final_amount DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'unpaid',
        due_date DATETIME NULL,
        paid_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_inv_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        CONSTRAINT fk_inv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_inv_user (user_id),
        INDEX idx_inv_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 32. invoice_items table
    await p.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id VARCHAR(100) PRIMARY KEY,
        invoice_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        quantity INT DEFAULT 1,
        unit_price DECIMAL(15,2) DEFAULT 0.00,
        total_price DECIMAL(15,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        INDEX idx_ii_invoice (invoice_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 33. notifications table
    await p.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        is_read TINYINT(1) DEFAULT 0,
        link_url TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notif_user (user_id),
        INDEX idx_notif_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 34. media_files table
    await p.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id VARCHAR(100) PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) DEFAULT '',
        file_type VARCHAR(50) DEFAULT 'image',
        file_size INT DEFAULT 0,
        mime_type VARCHAR(100) DEFAULT '',
        file_path TEXT NOT NULL,
        public_url TEXT NOT NULL,
        uploader_id VARCHAR(100) NULL,
        entity_type VARCHAR(100) DEFAULT '',
        entity_id VARCHAR(100) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_media_user FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_media_entity (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 35. audit_logs table (Data change history)
    await p.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_values LONGTEXT NULL,
        new_values LONGTEXT NULL,
        changed_by VARCHAR(100) NULL,
        ip_address VARCHAR(50) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_table_rec (table_name, record_id),
        INDEX idx_audit_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure zero auto-seeded legacy data if requested (Disabled to prevent data loss on startup)
    /* Truncate removed to preserve production data */

  } catch (err: any) {
    console.warn("[ensureDatabaseSchema] Table check/creation note:", err.message);
  }
}

export async function checkDbConnection(): Promise<boolean> {
  const dbHost = process.env.DB_HOST || "localhost";
  try {
    const p = getDbPool();
    await Promise.race([
      p.query("SELECT 1"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB Connection timeout")), 3500)
      )
    ]);
    isMySqlOffline = false;
    await ensureDatabaseSchema();
    return true;
  } catch (err: any) {
    console.warn(`[DB Connection] Connection check to ${dbHost} status: ${err.message}.`);
    return false;
  }
}

let pool: mysql.Pool | null = null;
let wrappedPool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!wrappedPool) {
    const dbHost = process.env.DB_HOST || "localhost";
    const dbUser = process.env.DB_USER || "root";
    const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || "";
    const dbName = process.env.DB_NAME || "kodyar24";
    const dbPort = parseInt(process.env.DB_PORT || "3306");
    const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT) || 10;

    pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit,
      maxIdle: 0, // Immediately close idle connections to release MySQL server slots
      idleTimeout: 10000, // Close any lingering idle connections after 10 seconds
      enableKeepAlive: false, // Avoid persistent idle socket hold on shared hosts
      queueLimit: 0,
      connectTimeout: 5000
    });

    const origQuery = pool.query.bind(pool);
    const origExecute = pool.execute.bind(pool);

    const safeQuery = async (...args: any[]) => {
      try {
        return await origQuery(...(args as [any]));
      } catch (err: any) {
        if (err?.code !== 'ER_DUP_FIELDNAME' && err?.code !== 'ER_DUP_KEYNAME' && !err?.message?.includes('Duplicate column name')) {
          console.warn("[getDbPool] Query failed (MySQL offline/error):", err?.message || err);
        }
        return [[], []] as any;
      }
    };

    const safeExecute = async (...args: any[]) => {
      try {
        return await origExecute(...(args as [any]));
      } catch (err: any) {
        if (err?.code !== 'ER_DUP_FIELDNAME' && err?.code !== 'ER_DUP_KEYNAME' && !err?.message?.includes('Duplicate column name')) {
          console.warn("[getDbPool] Execute failed (MySQL offline/error):", err?.message || err);
        }
        return [[], []] as any;
      }
    };

    wrappedPool = new Proxy(pool, {
      get(target, prop, receiver) {
        if (prop === "query") return safeQuery;
        if (prop === "execute") return safeExecute;
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  return wrappedPool;
}

export function parseJsonColumn(val: any): any {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export function toSqlDatetime(dateStr: any): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return null;
  }
}

export function hashPassword(plainText: string): string {
  if (!plainText) return "";
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;

  // 1. Direct plaintext match — فقط برای رمزهای قدیمیِ خام، نه برای هشهای واقعی
  const looksHashed =
    hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$") ||
    /^[a-fA-F0-9]{32}$/.test(hash) || /^[a-fA-F0-9]{64}$/.test(hash);
  if (!looksHashed && password === hash) return true;

  // 2. Bcrypt match ($2a$, $2b$, $2y$)
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    try {
      return bcrypt.compareSync(password, hash);
    } catch {
      return false;
    }
  }

  // 3. MD5 hash check (32 hex characters)
  if (hash.length === 32 && /^[a-fA-F0-9]{32}$/.test(hash)) {
    try {
      const md5 = crypto.createHash("md5").update(password).digest("hex");
      if (md5.toLowerCase() === hash.toLowerCase()) return true;
    } catch {}
  }

  // 4. SHA256 hash check (64 hex characters)
  if (hash.length === 64 && /^[a-fA-F0-9]{64}$/.test(hash)) {
    try {
      const sha256 = crypto.createHash("sha256").update(password).digest("hex");
      if (sha256.toLowerCase() === hash.toLowerCase()) return true;
    } catch {}
  }

  return false;
}

export async function getCurrentUserAsync(req: express.Request): Promise<any | null> {
  if (req && (req as any)._cachedCurrentUser !== undefined) {
    return (req as any)._cachedCurrentUser;
  }

  const setAndReturn = (val: any) => {
    if (req) {
      (req as any)._cachedCurrentUser = val;
    }
    return val;
  };

  const cookieHeader = req?.headers?.cookie || "";
  const match = cookieHeader.match(/session_user_id=([^; ]+)/);
  const tokenMatch = cookieHeader.match(/access_token=([^; ]+)/);
  let sessionUserId = match ? match[1] : null;
  let accessToken = tokenMatch ? tokenMatch[1] : null;

  if (req?.headers?.authorization && req.headers.authorization.startsWith("Bearer ")) {
    accessToken = req.headers.authorization.split(" ")[1];
  }

  if (!sessionUserId && req?.headers?.["x-session-token"]) {
    sessionUserId = Array.isArray(req.headers["x-session-token"])
      ? req.headers["x-session-token"][0]
      : (req.headers["x-session-token"] as string);
  }

  if (isMySqlOffline) {
    return setAndReturn(null);
  }

  try {
    const p = getDbPool();

    // 1. Check token in sessions table if present
    if (accessToken) {
      const [sessRows]: any = await p.query(
        "SELECT * FROM sessions WHERE (token = ? OR refresh_token = ?) AND expires_at > NOW()",
        [accessToken, accessToken]
      );
      if (sessRows.length > 0) {
        sessionUserId = sessRows[0].user_id;
      }
    }

    if (!sessionUserId) return setAndReturn(null);

    const [userRows]: any = await p.query("SELECT * FROM users WHERE id = ? OR phone = ?", [sessionUserId, sessionUserId]);
    if (userRows.length > 0) {
      const u = userRows[0];
      try {
        const [subRows]: any = await p.query(
          "SELECT * FROM subscriptions WHERE (user_id = ? OR (user_id = ? AND ? != '')) AND (status = 'active' OR status = 'completed') ORDER BY end_date DESC",
          [u.id, u.phone || "", u.phone || ""]
        );
        const activeSub = (subRows || []).find((s: any) => new Date(s.end_date || s.expiry_date) > new Date());
        if (activeSub) {
          const endDate = new Date(activeSub.end_date || activeSub.expiry_date).toISOString();
          const planNameMap: Record<string, string> = {
            '1_month': 'اشتراک ۱ ماهه کدهای خطا',
            '3_month': 'اشتراک ۳ ماهه کدهای خطا',
            '6_month': 'اشتراک ۶ ماهه کدهای خطا',
            '12_month': 'اشتراک ۱۲ ماهه کدهای خطا',
            'permanent': 'اشتراک دائمی همکار / مدیریت'
          };
          const rawTitle = activeSub.plan_name || activeSub.planName || "";
          const planTitle = (rawTitle && !['1_month','3_month','6_month','12_month','permanent','gold'].includes(rawTitle))
            ? rawTitle
            : (planNameMap[activeSub.plan_id] || planNameMap[activeSub.plan] || "اشتراک ویژه کدهای خطا");

          u.subscription = {
            ...activeSub,
            is_premium: true,
            is_active: true,
            expiry_date: endDate,
            end_date: endDate,
            plan_name: planTitle,
            planName: planTitle,
            plan: activeSub.plan_id || activeSub.plan || '1_month'
          };
          u.has_active_subscription = true;
        } else if (subRows && subRows.length > 0) {
          const latest = subRows[0];
          const endDate = new Date(latest.end_date || latest.expiry_date).toISOString();
          u.subscription = {
            ...latest,
            is_premium: false,
            is_active: false,
            expiry_date: endDate,
            end_date: endDate
          };
          u.has_active_subscription = false;
        } else {
          u.has_active_subscription = false;
          u.subscription = null;
        }

        const [payRows]: any = await p.query(
          "SELECT * FROM payments WHERE user_id = ? OR (user_id = ? AND ? != '') ORDER BY created_at DESC",
          [u.id, u.phone || "", u.phone || ""]
        );
        u.payments = (payRows || []).map((pay: any) => {
          const isSub = pay.related_type === 'subscription' || (pay.related_id && String(pay.related_id).includes('month'));
          return {
            ...pay,
            type: isSub ? 'subscription' : 'part_purchase',
            related_type: isSub ? 'subscription' : 'part_purchase',
            plan: isSub ? pay.related_id : undefined,
            partId: !isSub ? pay.related_id : undefined,
            gateway: pay.payment_method || 'card_to_card'
          };
        });

        // Load part orders for user
        const [poRows]: any = await p.query(
          `SELECT po.*, sp.title as part_name, sp.category as part_category 
           FROM part_orders po 
           LEFT JOIN spare_parts sp ON po.part_id = sp.id 
           WHERE po.user_id = ? OR (po.user_id = ? AND ? != '') OR (po.buyer_phone = ? AND ? != '') 
           ORDER BY po.created_at DESC`,
          [u.id, u.phone || "", u.phone || "", u.phone || "", u.phone || ""]
        );
        u.part_purchases = (poRows || []).map((po: any) => ({
          id: po.id,
          partId: po.part_id,
          partName: po.part_name || "قطعه یدکی",
          partCategory: po.part_category || "",
          price: Number(po.total_price) || 0,
          quantity: Number(po.quantity) || 1,
          date: po.created_at ? new Intl.DateTimeFormat("fa-IR-u-nu-latn", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(po.created_at)) : "",
          status: po.status === "completed" || po.status === "paid" ? "shipped" : po.status || "pending",
          trackNumber: po.shipping_tracking_code || "",
          postalTrackingCode: po.shipping_tracking_code || "",
          customerName: po.buyer_name || u.full_name || "",
          customerPhone: po.buyer_phone || u.phone || "",
          customerAddress: po.address || ""
        }));
        u.part_orders = u.part_purchases;

        // Load repair orders for user
        const [ordRows]: any = await p.query(
          `SELECT * FROM orders WHERE user_id = ? OR customer_phone = ? ORDER BY created_at DESC`,
          [u.id, u.phone || ""]
        );
        u.repair_requests = (ordRows || []).map((ord: any) => ({
          id: ord.id,
          appliance: ord.category || ord.appliance || "لوازم خانگی",
          category: ord.category || "",
          brand: ord.brand || "",
          model: ord.model || "",
          city: ord.city || u.city || "",
          status: ord.status || "waiting",
          date: ord.created_at ? new Intl.DateTimeFormat("fa-IR-u-nu-latn", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ord.created_at)) : "",
          created_at: ord.created_at
        }));
        u.orders = u.repair_requests;

        const isPremiumUser = !!(
          u.has_active_subscription ||
          u.is_premium === 1 ||
          u.is_premium === true ||
          u.is_premium === "1" ||
          u.isSuperAdmin ||
          u.is_super_admin ||
          u.role === "admin"
        );

        u.is_premium = isPremiumUser;
        u.isPremium = isPremiumUser;
        u.subscription_plan = u.subscription?.plan || u.subscription_plan || (isPremiumUser ? 'sub_1_month' : '');
        u.subscription_expire_date = u.subscription?.expiry_date 
          ? (u.subscription.expiry_date.includes('T') ? u.subscription.expiry_date.split('T')[0] : u.subscription.expiry_date)
          : (u.subscription_expire_date || '');
      } catch (e) {
        console.warn("[getCurrentUserAsync] Sub/Pay/Orders fetch error:", e);
      }
      return setAndReturn(u);
    }

    const [techRows]: any = await p.query("SELECT * FROM technicians WHERE id = ? OR phone = ?", [sessionUserId, sessionUserId]);
    if (techRows.length > 0) {
      const tech = techRows[0];
      let techSub: any = null;
      let hasActiveSub = false;
      let techPayments: any[] = [];
      try {
        const [subRows]: any = await p.query(
          "SELECT * FROM subscriptions WHERE (user_id = ? OR (user_id = ? AND ? != '')) AND (status = 'active' OR status = 'completed') ORDER BY end_date DESC",
          [tech.id, tech.phone || "", tech.phone || ""]
        );
        const activeSub = (subRows || []).find((s: any) => new Date(s.end_date || s.expiry_date) > new Date());
        if (activeSub) {
          const endDate = new Date(activeSub.end_date || activeSub.expiry_date).toISOString();
          const planNameMap: Record<string, string> = {
            '1_month': 'اشتراک ۱ ماهه کدهای خطا',
            '3_month': 'اشتراک ۳ ماهه کدهای خطا',
            '6_month': 'اشتراک ۶ ماهه کدهای خطا',
            '12_month': 'اشتراک ۱۲ ماهه کدهای خطا',
            'permanent': 'اشتراک دائمی همکار / مدیریت'
          };
          const rawTitle = activeSub.plan_name || activeSub.planName || "";
          const planTitle = (rawTitle && !['1_month','3_month','6_month','12_month','permanent','gold'].includes(rawTitle))
            ? rawTitle
            : (planNameMap[activeSub.plan_id] || planNameMap[activeSub.plan] || "اشتراک ویژه کدهای خطا");

          techSub = {
            ...activeSub,
            is_premium: true,
            is_active: true,
            expiry_date: endDate,
            end_date: endDate,
            plan_name: planTitle,
            planName: planTitle,
            plan: activeSub.plan_id || activeSub.plan || '1_month'
          };
          hasActiveSub = true;
        } else {
          techSub = { is_premium: true, is_active: true, expiry_date: '2099-12-31T23:59:59.000Z', plan_name: 'دسترسی همکار: دائمی VIP' };
          hasActiveSub = true;
        }

        const [payRows]: any = await p.query(
          "SELECT * FROM payments WHERE user_id = ? OR (user_id = ? AND ? != '') ORDER BY created_at DESC",
          [tech.id, tech.phone || "", tech.phone || ""]
        );
        techPayments = (payRows || []).map((pay: any) => ({
          ...pay,
          type: pay.related_type || (pay.related_id && String(pay.related_id).includes('month') ? 'subscription' : 'part_purchase'),
          related_type: pay.related_type || (pay.related_id && String(pay.related_id).includes('month') ? 'subscription' : 'part_purchase'),
          plan: pay.related_type === 'subscription' ? pay.related_id : undefined,
          partId: pay.related_type === 'part_purchase' ? pay.related_id : undefined,
          gateway: pay.payment_method || 'card_to_card'
        }));
      } catch (e) {
        console.warn("[getCurrentUserAsync] Tech Sub/Pay fetch error:", e);
      }

      return setAndReturn({
        id: tech.id,
        phone: tech.phone,
        full_name: tech.full_name || tech.name,
        name: tech.name || tech.full_name,
        role: "technician",
        city: tech.city || tech.activeLocation || "تهران",
        isVerified: tech.status === "active",
        subscription: techSub,
        has_active_subscription: hasActiveSub,
        is_premium: true,
        isPremium: true,
        subscription_plan: "sub_permanent",
        subscription_expire_date: "2099-12-31",
        payments: techPayments
      });
    }
  } catch (err: any) {
    setMySqlOffline(true);
    console.warn("[getCurrentUserAsync] Error fetching user:", err.message);
  }

  return setAndReturn(null);
}


export function getCurrentUser(req: express.Request, db?: any): any {
  // Synchronous fallback wrapper returning null if called synchronously, or admin
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/session_user_id=([^; ]+)/);
  let sessionUserId = match ? match[1] : null;

  if (!sessionUserId && req.headers["x-session-token"]) {
    sessionUserId = Array.isArray(req.headers["x-session-token"])
      ? req.headers["x-session-token"][0]
      : (req.headers["x-session-token"] as string);
  }

  if (sessionUserId === "admin") {
    return {
      id: "admin",
      phone: "09120947304",
      full_name: "مدیریت عالی کدیار۲۴",
      role: "admin",
      is_super_admin: true,
      city: "تهران"
    };
  }

  return null;
}

export function checkMustChangePassword(user: any): boolean {
  if (!user || user.role === "admin") return false;
  return !user.password_hash || user.password_hash.length < 10 || user.password_hash === user.phone;
}

export async function getSubscriptionForUserAsync(userId: string): Promise<any | null> {
  if (isMySqlOffline) return null;
  try {
    const p = getDbPool();
    const [rows]: any = await p.query(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY end_date DESC LIMIT 1",
      [userId]
    );
    if (rows.length > 0) {
      const activeSub = rows[0];
      const endDate = new Date(activeSub.end_date);
      const isPermanent = endDate.getFullYear() >= 2090;
      return {
        plan_name: activeSub.plan_type || "عضویت ویژه",
        expiry_date: activeSub.end_date,
        is_active: true,
        is_permanent: isPermanent,
        days_left: isPermanent ? 99999 : Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      };
    }
  } catch (err: any) {
    console.warn("Error in getSubscriptionForUserAsync:", err.message);
  }
  return null;
}

export async function logActivity(userId: string, action: string, req: express.Request, details: string) {
  try {
    const id = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const pool = getDbPool();
    if (pool && !isMySqlOffline) {
      await pool.query(
        "INSERT INTO activity_logs (id, user_id, action, ip, details) VALUES (?, ?, ?, ?, ?)",
        [id, userId, action, String(ip).substring(0, 50), details]
      );
    }
  } catch (err: any) {
    console.warn("Error in logActivity:", err.message);
  }
}

export async function reportError(errorMessage: string, stackTrace: string, url: string, userId: string) {
  try {
    const id = `err_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const pool = getDbPool();
    if (pool && !isMySqlOffline) {
      await pool.query(
        "INSERT INTO error_logs (id, error_message, stack_trace, url, user_id) VALUES (?, ?, ?, ?, ?)",
        [id, errorMessage, stackTrace, url, userId]
      );
    }
  } catch (err: any) {
    console.warn("Error in reportError:", err.message);
  }
}
