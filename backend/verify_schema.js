const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function checkSchema() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute("SHOW COLUMNS FROM products");
        const columns = rows.map(r => r.Field);

        const hasFinalPrice = columns.includes('final_price');
        const hasSupplyPrice = columns.includes('supply_price');

        console.log("Schema Verification Results:");
        console.log(`- final_price exists: ${hasFinalPrice ? '✅ YES' : '❌ NO'}`);
        console.log(`- supply_price exists: ${hasSupplyPrice ? '⚠️ YES' : '✅ NO'}`);

        if (hasFinalPrice && !hasSupplyPrice) {
            console.log("\nSUCCESS: Schema is correct.");
        } else {
            console.log("\nWARNING: Schema mismatch.");
        }

    } catch (err) {
        console.error("Error checking schema:", err.message);
    } finally {
        if (conn) await conn.end();
    }
}

checkSchema();
