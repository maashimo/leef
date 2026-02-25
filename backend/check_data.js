const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function checkData() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute("SELECT id, name, is_approved, final_price, is_ads FROM products WHERE is_approved = 1");

        console.log("Approved Products:");
        console.table(rows);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        if (conn) await conn.end();
    }
}

checkData();
