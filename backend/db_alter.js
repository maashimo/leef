const db = require('./config/db');

async function ensureAdminNote() {
    try {
        await db.pool.execute('ALTER TABLE order_requests ADD COLUMN admin_note TEXT DEFAULT NULL');
        console.log("admin_note column added successfully.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("admin_note column already exists.");
        } else {
            console.error("Error modifying table:", err);
        }
    } finally {
        process.exit();
    }
}

ensureAdminNote();
