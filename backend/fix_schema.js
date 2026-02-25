const mysql = require('mysql2/promise');
require('dotenv').config();

// Use the exact config from .env
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function fixSchema() {
    let conn;
    try {
        console.log("Connecting to DB...");
        conn = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        // Get columns
        const [rows] = await conn.execute("SHOW COLUMNS FROM products");
        const columns = rows.map(r => r.Field);
        console.log("Current Columns:", columns.join(", "));

        const hasSupply = columns.includes('supply_price');
        const hasFinal = columns.includes('final_price');

        if (hasSupply && !hasFinal) {
            console.log("Renaming supply_price to final_price...");
            await conn.execute("ALTER TABLE products CHANGE COLUMN supply_price final_price DECIMAL(10, 2)");
            console.log("Renamed successfully.");
        } else if (hasSupply && hasFinal) {
            console.log("Both exist. Dropping supply_price...");
            await conn.execute("ALTER TABLE products DROP COLUMN supply_price");
            console.log("Dropped supply_price.");
        } else if (!hasSupply && !hasFinal) {
            console.log("Neither exist. Adding final_price...");
            await conn.execute("ALTER TABLE products ADD COLUMN final_price DECIMAL(10, 2) AFTER price");
            console.log("Added final_price.");
        } else if (!hasSupply && hasFinal) {
            console.log("Schema looks correct (final_price exists, supply_price missing).");
        }

        // Add missing feature columns
        if (!columns.includes('sale_details')) {
            console.log("Adding sale_details...");
            await conn.execute("ALTER TABLE products ADD COLUMN sale_details VARCHAR(255)");
        }
        if (!columns.includes('coins_percent')) {
            console.log("Adding coins_percent...");
            await conn.execute("ALTER TABLE products ADD COLUMN coins_percent INT DEFAULT 0");
        }
        if (!columns.includes('is_ads')) {
            console.log("Adding is_ads...");
            await conn.execute("ALTER TABLE products ADD COLUMN is_ads TINYINT(1) DEFAULT 0");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        if (conn) await conn.end();
    }
}

fixSchema();
