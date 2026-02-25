require('dotenv').config();
const { pool } = require('./config/db');

async function checkData() {
    try {
        console.log("Checking 'products' table structure and data...");

        // Check columns
        const [columns] = await pool.execute("SHOW COLUMNS FROM products");
        const hasSaleDetails = columns.some(c => c.Field === 'sale_details');
        console.log("Has 'sale_details' column:", hasSaleDetails);
        if (!hasSaleDetails) {
            console.log("Columns found:", columns.map(c => c.Field));
        }

        // Check data
        const [rows] = await pool.execute("SELECT id, name, price, sale_details FROM products LIMIT 5");
        console.log("Recent Products:");
        console.table(rows);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
