const db = require('./config/db');
const fs = require('fs');

async function fixDB() {
    let log = "";
    try {
        try {
            await db.pool.execute("ALTER TABLE order_requests ADD COLUMN rejection_reason TEXT DEFAULT NULL");
            log += "rejection_reason added\n";
        } catch (e) {
            log += "rejection_reason err/exists: " + e.message + "\n";
        }
        try {
            await db.pool.execute("ALTER TABLE order_requests ADD COLUMN admin_note TEXT DEFAULT NULL");
            log += "admin_note added\n";
        } catch (e) {
            log += "admin_note err/exists: " + e.message + "\n";
        }
    } catch (err) {
        log += "FATAL ERR: " + err.message;
    }
    fs.writeFileSync('db_fix_log.txt', log);
    process.exit(0);
}
fixDB();
