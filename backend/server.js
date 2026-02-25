const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Config & Routes
const { dbConfig } = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { generateSellerInvitationEmail, generateAccountApprovedEmail } = require("./templates/email-templates");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Initialize Database
async function initializeDatabase() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Create OTP table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS otp_verification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role ENUM('customer', 'seller', 'admin') NOT NULL,
        user_id INT DEFAULT NULL,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        purpose ENUM('registration', 'password_reset') NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_otp_code (otp_code),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create products table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150),
        price DECIMAL(10, 2),
        image_url VARCHAR(255),
        stock INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create product_updates
    await conn.execute(`
    CREATE TABLE IF NOT EXISTS product_updates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      seller_id INT,
      name VARCHAR(150),
      category VARCHAR(100),
      price VARCHAR(100),
      stock VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (seller_id) REFERENCES sellers(seller_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    // Create Notifications
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(255) NOT NULL,
        type ENUM('info', 'warning', 'error') DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create Questions
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create Feedback
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT DEFAULT 5,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create Order Requests (for Distributor Approval)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS order_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        seller_id INT NOT NULL,
        locations JSON NOT NULL,
        total_qty INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ALTERS
    const productAlterStmts = [
      "ALTER TABLE products ADD COLUMN seller_id INT NOT NULL AFTER id",
      "ALTER TABLE products ADD COLUMN category VARCHAR(100) AFTER name",
      "ALTER TABLE products ADD COLUMN description TEXT AFTER stock",
      "ALTER TABLE products ADD COLUMN is_approved TINYINT(1) DEFAULT 0 AFTER description",
      "ALTER TABLE products ADD COLUMN final_price VARCHAR(100) AFTER price",
      "ALTER TABLE products DROP COLUMN supply_price",
      "ALTER TABLE products ADD COLUMN coins_percent INT DEFAULT 0",
      "ALTER TABLE products ADD COLUMN sale_details VARCHAR(255)",
      "ALTER TABLE products ADD COLUMN is_ads TINYINT(1) DEFAULT 0",
      "ALTER TABLE products MODIFY COLUMN price VARCHAR(100)",
      "ALTER TABLE products MODIFY COLUMN stock VARCHAR(100)",
      "ALTER TABLE products MODIFY COLUMN final_price VARCHAR(100)"
    ];
    for (const sql of productAlterStmts) {
      try {
        await conn.execute(sql);
      } catch (e) {
        // Ignore if column already exists (ER_DUP_FIELDNAME) 
        // or if column to drop doesn't exist (ER_CANT_DROP_FIELD_OR_KEY)
        if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && e.errno !== 1091) {
          console.log(`Note: ${e.message}`);
        }
      }
    }

    const alterStatements = [
      { table: 'customers', sql: 'ALTER TABLE customers ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER password_hash' },
      { table: 'customers', sql: 'ALTER TABLE customers ADD COLUMN is_approved TINYINT(1) DEFAULT 0 AFTER is_verified' },
      { table: 'sellers', sql: 'ALTER TABLE sellers ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER password_hash' },
      { table: 'sellers', sql: 'ALTER TABLE sellers ADD COLUMN shop_town VARCHAR(100) AFTER shop_name' },
      { table: 'sellers', sql: 'ALTER TABLE sellers ADD COLUMN certificate_url VARCHAR(255) AFTER shop_details' },
      { table: 'admins', sql: 'ALTER TABLE admins ADD COLUMN is_verified TINYINT(1) DEFAULT 1 AFTER password_hash' },
      { table: 'order_requests', sql: 'ALTER TABLE order_requests ADD COLUMN admin_note TEXT DEFAULT NULL' },
      { table: 'order_requests', sql: 'ALTER TABLE order_requests ADD COLUMN rejection_reason TEXT DEFAULT NULL' },
      { table: 'customers', sql: 'ALTER TABLE customers ADD COLUMN loyalty_coins DECIMAL(10,2) DEFAULT 0' },
    ];
    for (const stmt of alterStatements) {
      try {
        await conn.execute(stmt.sql);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && e.errno !== 1091) {
          console.log(`Note: ${e.message}`);
        }
      }
    }

    console.log("✅ Database initialization complete");
  } catch (err) {
    console.error("⚠️  Database initialization warning:", err.message);
  } finally {
    if (conn) await conn.end();
  }
}

app.get("/", (req, res) => res.send("leef backend running ✅"));

// ADMIN: INVITE SELLER (Needs transporter, which is now in utils... but invite-seller was not refactored yet)
// We need to import transporter from utils if we use it here.
const { transporter } = require("./utils/authUtils");

app.post("/api/admin/invite-seller", async (req, res) => {
  let conn;
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send("Email is required");

    conn = await mysql.createConnection(dbConfig);
    // Check if email already exists
    const [existing] = await conn.execute("SELECT seller_id FROM sellers WHERE email=? LIMIT 1", [email]);
    if (existing.length > 0) return res.status(400).send("Seller with this email already exists.");

    const invitationLink = `http://localhost:5173/register-seller.html?email=${encodeURIComponent(email)}`;
    const emailContent = generateSellerInvitationEmail(email, invitationLink);

    await transporter.sendMail({
      from: `Leef <${process.env.MAIL_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`✅ Seller invitation sent to ${email}`);
    return res.json({ message: "Invitation sent successfully" });
  } catch (err) {
    console.error("❌ Failed to invite seller:", err);
    return res.status(500).send("Server error: " + err.message);
  } finally {
    if (conn) await conn.end();
  }
});

// ADMIN: CUSTOMER APPROVAL
app.get("/api/admin/requests/customers", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT customer_id, name, town, email, created_at FROM customers WHERE is_verified = 1 AND is_approved = 0 ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  } finally {
    if (conn) await conn.end();
  }
});

app.post("/api/admin/approve-customer", async (req, res) => {
  let conn;
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).send("Customer ID required");

    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute("SELECT name, email FROM customers WHERE customer_id=?", [customerId]);
    if (rows.length === 0) return res.status(404).send("Customer not found");

    const { name, email } = rows[0];
    await conn.execute("UPDATE customers SET is_approved = 1 WHERE customer_id = ?", [customerId]);

    const emailContent = generateAccountApprovedEmail(name);
    await transporter.sendMail({
      from: `Leef <${process.env.MAIL_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`✅ Customer ${email} approved.`);
    return res.json({ message: "Customer approved successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error: " + err.message);
  } finally {
    if (conn) await conn.end();
  }
});

// ADMIN: GET ALL USERS (Customers + Sellers)
app.get("/api/admin/users", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Fetch Customers
    const [customers] = await conn.execute(
      "SELECT customer_id as id, name, town, 'Customer' as role, created_at FROM customers ORDER BY created_at DESC"
    );

    // Fetch Sellers
    const [sellers] = await conn.execute(
      "SELECT seller_id as id, name, shop_town as town, 'Seller' as role, created_at FROM sellers ORDER BY created_at DESC"
    );

    // Combine and sort by date descending
    const allUsers = [...customers, ...sellers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json(allUsers);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  } finally {
    if (conn) await conn.end();
  }
});

// =====================
// LOYALTY COINS API
// =====================

// GET coin balance
app.get("/api/coins/:customerId", async (req, res) => {
  let conn;
  try {
    const { customerId } = req.params;
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT loyalty_coins FROM customers WHERE customer_id = ?",
      [customerId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Customer not found" });
    return res.json({ coins: parseFloat(rows[0].loyalty_coins) || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// POST earn coins (1% of purchase total)
app.post("/api/coins/earn", async (req, res) => {
  let conn;
  try {
    const { customerId, amount } = req.body;
    if (!customerId || amount === undefined) return res.status(400).json({ error: "customerId and amount required" });
    const earned = parseFloat(amount) * 0.01;
    conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      "UPDATE customers SET loyalty_coins = loyalty_coins + ? WHERE customer_id = ?",
      [earned, customerId]
    );
    const [rows] = await conn.execute("SELECT loyalty_coins FROM customers WHERE customer_id = ?", [customerId]);
    return res.json({ earned: earned.toFixed(2), newBalance: parseFloat(rows[0].loyalty_coins) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// POST spend coins
app.post("/api/coins/spend", async (req, res) => {
  let conn;
  try {
    const { customerId, coinsToSpend } = req.body;
    if (!customerId || !coinsToSpend) return res.status(400).json({ error: "customerId and coinsToSpend required" });
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute("SELECT loyalty_coins FROM customers WHERE customer_id = ?", [customerId]);
    if (rows.length === 0) return res.status(404).json({ error: "Customer not found" });
    const current = parseFloat(rows[0].loyalty_coins) || 0;
    if (current < parseFloat(coinsToSpend)) {
      return res.status(400).json({ error: "Insufficient coins", balance: current });
    }
    await conn.execute(
      "UPDATE customers SET loyalty_coins = loyalty_coins - ? WHERE customer_id = ?",
      [parseFloat(coinsToSpend), customerId]
    );
    const [updated] = await conn.execute("SELECT loyalty_coins FROM customers WHERE customer_id = ?", [customerId]);
    return res.json({ spent: parseFloat(coinsToSpend), newBalance: parseFloat(updated[0].loyalty_coins) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Start Server
initializeDatabase().then(() => {
  app.listen(5000, () => {
    console.log("🚀 Backend running on http://localhost:5000");
  });
});
