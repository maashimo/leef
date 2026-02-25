const mysql = require('mysql2/promise');

async function fixDB() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'leef'
        });

        console.log("Connected to DB. Adding columns...");

        try {
            await conn.execute("ALTER TABLE order_requests ADD COLUMN rejection_reason TEXT DEFAULT NULL");
            console.log("Added rejection_reason");
        } catch (e) {
            console.log("rejection_reason err: " + e.message);
        }

        try {
            await conn.execute("ALTER TABLE order_requests ADD COLUMN admin_note TEXT DEFAULT NULL");
            console.log("Added admin_note");
        } catch (e) {
            console.log("admin_note err: " + e.message);
        }

    } catch (e) {
        console.error("Connection error: " + e.message);
    } finally {
        if (conn) await conn.end();
        process.exit(0);
    }
}
fixDB();
