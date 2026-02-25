require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
};

async function runMigration() {
    let conn;
    try {
        console.log("🚀 Connecting to database...");
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
        console.log("✅ Connected successfully!");

        const migrationPath = path.join(__dirname, "migrations", "create_otp_table.sql");
        const sql = fs.readFileSync(migrationPath, "utf8");

        console.log("📝 Running migration...");

        // Execute the main CREATE TABLE statement
        const createTableSQL = sql.split('--')[0]; // Get the CREATE TABLE part
        await conn.query(createTableSQL);
        console.log("✅ OTP verification table created/verified");

        // Try to add is_verified columns (ignore errors if they already exist)
        const alterStatements = [
            { table: 'customers', sql: 'ALTER TABLE customers ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER password_hash' },
            { table: 'sellers', sql: 'ALTER TABLE sellers ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER password_hash' },
            { table: 'admins', sql: 'ALTER TABLE admins ADD COLUMN is_verified TINYINT(1) DEFAULT 1 AFTER password_hash' },
        ];

        for (const stmt of alterStatements) {
            try {
                await conn.query(stmt.sql);
                console.log(`✅ Added is_verified column to ${stmt.table}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️  is_verified column already exists in ${stmt.table}`);
                } else {
                    console.log(`⚠️  Could not alter ${stmt.table}: ${err.message}`);
                }
            }
        }

        // Set existing users as verified (backward compatibility)
        try {
            await conn.query('UPDATE customers SET is_verified = 1 WHERE is_verified = 0');
            await conn.query('UPDATE sellers SET is_verified = 1 WHERE is_verified = 0');
            console.log("✅ Updated existing users to verified status");
        } catch (err) {
            console.log("ℹ️  Skipped updating existing users");
        }

        // Verify the table was created
        const [tables] = await conn.execute("SHOW TABLES LIKE 'otp_verification'");
        if (tables.length > 0) {
            console.log("\n✅ otp_verification table verified");

            const [columns] = await conn.execute("DESCRIBE otp_verification");
            console.log("\n📋 Table structure:");
            columns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type}`);
            });
        }

        console.log("\n🎉 Database migration complete!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        console.error("Full error:", err);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
