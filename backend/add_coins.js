const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root1234',
        database: 'leef-db'
    });

    // Ensure column exists
    try {
        await conn.execute('ALTER TABLE customers ADD COLUMN loyalty_coins DECIMAL(10,2) DEFAULT 0');
        console.log('Column created');
    } catch (e) {
        console.log('Column already exists');
    }

    // Add 3000 coins
    await conn.execute(
        'UPDATE customers SET loyalty_coins = loyalty_coins + 3000 WHERE email = ?',
        ['madhushipanchali03@gmail.com']
    );

    const [rows] = await conn.execute(
        'SELECT customer_id, email, loyalty_coins FROM customers WHERE email = ?',
        ['madhushipanchali03@gmail.com']
    );
    console.log('Result:', rows);
    await conn.end();
    process.exit(0);
})();
