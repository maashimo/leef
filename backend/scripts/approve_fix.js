require("dotenv").config();
const mysql = require("mysql2/promise");
const { dbConfig } = require("../config/db");

async function approve() {
    const conn = await mysql.createConnection(dbConfig);
    try {
        const [res] = await conn.execute("UPDATE customers SET is_approved = 1 WHERE email = 'madhushipanchali03@gmail.com'");
        console.log("Approved users:", res.affectedRows);
    } catch (e) {
        console.error(e);
    } finally {
        conn.end();
    }
}
approve();
