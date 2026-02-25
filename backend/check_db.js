const fs = require('fs');
const mysql = require('mysql2/promise');

async function check() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'leef'
        });

        try {
            await conn.execute('ALTER TABLE order_requests ADD COLUMN admin_note TEXT DEFAULT NULL');
            fs.writeFileSync('db_out.txt', 'Added admin_note column.');
        } catch (e) {
            fs.writeFileSync('db_out.txt', 'Error or exists: ' + e.message);
        }

        conn.end();
    } catch (e) {
        fs.writeFileSync('db_out.txt', 'Connection error: ' + e.message);
    }
}
check();
