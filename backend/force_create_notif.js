const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function createTable() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.execute(`
         CREATE TABLE IF NOT EXISTS notifications (
           id INT AUTO_INCREMENT PRIMARY KEY,
           message VARCHAR(255) NOT NULL,
           type ENUM('info', 'warning', 'error') DEFAULT 'info',
           is_read TINYINT(1) DEFAULT 0,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
       `);
        console.log("✅ Notifications table created.");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) await conn.end();
    }
}
createTable();
