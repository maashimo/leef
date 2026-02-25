-- ==========================================
-- OTP Email Verification System
-- Database Migration Script
-- ==========================================

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS otp_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('customer', 'seller', 'admin') NOT NULL,
    user_id INT DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose ENUM('registration', 'password_reset') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_otp_code (otp_code),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add is_verified column to customers table (ignore error if exists)
-- ALTER TABLE customers ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER password_hash;

-- Add is_verified column to sellers table (ignore error if exists)
-- ALTER TABLE sellers ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER password_hash;

-- Add is_verified column to admins table (ignore error if exists)
-- ALTER TABLE admins ADD COLUMN is_verified TINYINT(1) DEFAULT 1 AFTER password_hash;
-- Note: Admin accounts default to verified=1 since they're typically created manually

-- Set existing users as verified (backward compatibility)
UPDATE customers SET is_verified = 1 WHERE is_verified = 0;
UPDATE sellers SET is_verified = 1 WHERE is_verified = 0;

-- Display success message
SELECT 'OTP verification tables created successfully!' AS Status;
