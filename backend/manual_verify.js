const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

async function verifyUsers() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log("Connected to database...");

    // 1. Verify leef@gmail.com (Try all roles since role wasn't specified)
    const emailsToVerify = ['leef@gmail.com'];
    
    for (const email of emailsToVerify) {
        // Customer
        const [custResult] = await conn.execute(
            "UPDATE customers SET is_verified = 1 WHERE email = ?",
            [email]
        );
        if (custResult.affectedRows > 0) console.log(`✅ Verified CUSTOMER: ${email}`);

        // Seller
        const [sellResult] = await conn.execute(
            "UPDATE sellers SET is_verified = 1 WHERE email = ?",
            [email]
        );
        if (sellResult.affectedRows > 0) console.log(`✅ Verified SELLER: ${email}`);

        // Admin
        const [adminResult] = await conn.execute(
            "UPDATE admins SET is_verified = 1 WHERE email = ?",
            [email]
        );
        if (adminResult.affectedRows > 0) console.log(`✅ Verified ADMIN: ${email}`);
        
        if (custResult.affectedRows === 0 && sellResult.affectedRows === 0 && adminResult.affectedRows === 0) {
            console.log(`⚠️  User ${email} not found in any role table.`);
        }
    }

    // 2. Verify 3@gmail.com as a seller
    const sellerEmail = '3@gmail.com';
    const [sellerResult] = await conn.execute(
        "UPDATE sellers SET is_verified = 1 WHERE email = ?",
        [sellerEmail]
    );
    
    if (sellerResult.affectedRows > 0) {
        console.log(`✅ Verified SELLER: ${sellerEmail}`);
    } else {
        console.log(`⚠️  Seller ${sellerEmail} not found.`);
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    if (conn) await conn.end();
    console.log("Done.");
  }
}

verifyUsers();
