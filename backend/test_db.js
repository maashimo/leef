require("dotenv").config();
const mysql = require("mysql2/promise");

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function verifyTable() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        console.log("Connected to database...");

        const [rows] = await conn.execute("SHOW TABLES LIKE 'password_resets'");

        if (rows.length > 0) {
            console.log("Table 'password_resets' exists ✅");

            const [columns] = await conn.execute("DESCRIBE password_resets");
            console.log("Columns:", columns.map(c => c.Field).join(", "));
        } else {
            console.error("Table 'password_resets' does NOT exist ❌");
        }

    } catch (err) {
        console.error("Verification failed ❌:", err.message);
    } finally {
        if (conn) await conn.end();
    }
}

verifyTable();
