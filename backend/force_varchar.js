const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function forceVarchar() {
    let conn;
    try {
        console.log("Connecting...");
        conn = await mysql.createConnection(dbConfig);
        console.log("Connected. Modifying final_price...");

        // This command forces the type change
        await conn.execute("ALTER TABLE products MODIFY COLUMN final_price VARCHAR(100)");

        console.log("✅ Success: final_price type updated to VARCHAR(100)");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

forceVarchar();
