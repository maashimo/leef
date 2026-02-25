const { pool } = require("../config/db");

// Add a new product (Seller)
exports.addProduct = async (req, res) => {
    try {
        const { name, category, price, stock, note, seller_id } = req.body;
        const imageUrl = req.file ? 'uploads/' + req.file.filename : null;

        if (!name || !category || !price || !stock || !seller_id) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Default status: not approved yet (or catalogued)
        const [result] = await pool.execute(
            `INSERT INTO products 
       (seller_id, name, category, price, stock, description, image_url, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [seller_id, name, category, price, stock, note || "", imageUrl]
        );

        res.status(201).json({
            message: "Product added successfully",
            productId: result.insertId
        });

    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
};

// Request Product Update
exports.requestUpdate = async (req, res) => {
    try {
        const { productId, sellerId, name, category, price, stock, note } = req.body;

        await pool.execute(
            `INSERT INTO product_updates 
            (product_id, seller_id, name, category, price, stock, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [productId, sellerId, name, category, price, stock, note || ""]
        );

        res.status(200).json({ message: "Update requested successfully" });
    } catch (err) {
        console.error("Error requesting update:", err);
        res.status(500).json({ message: "Server error requesting update" });
    }
};

// Get pending products (New + Updates)
exports.getPendingProducts = async (req, res) => {
    try {
        // Fetch new products
        const [newProducts] = await pool.execute(
            `SELECT p.id as product_id, p.*, s.name AS seller_name, s.shop_name, s.seller_id, 'New' as type 
       FROM products p
       JOIN sellers s ON p.seller_id = s.seller_id
       WHERE p.is_approved = 0
       ORDER BY p.created_at DESC`
        );

        // Fetch updates
        const [updates] = await pool.execute(
            `SELECT u.id as request_id, u.product_id, u.name, u.category, u.price, u.stock, u.description, 
             s.name AS seller_name, s.shop_name, s.seller_id, 'Update' as type
             FROM product_updates u
             JOIN sellers s ON u.seller_id = s.seller_id
             ORDER BY u.created_at DESC`
        );

        res.status(200).json([...newProducts, ...updates]);
    } catch (err) {
        console.error("Error fetching pending products:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Approve product (Mark as catalogued/done)
exports.approveProduct = async (req, res) => {
    try {
        const { id, type, finalPrice, coinsPercent, saleDetails, isAds } = req.body;

        if (type === 'New' || !type) {
            const pid = id || req.body.productId;
            const { name, stock } = req.body;
            const imageUrl = req.file ? 'uploads/' + req.file.filename : null;

            // Update product with final details
            await pool.execute(
                `UPDATE products SET 
                 name = COALESCE(?, name),
                 stock = COALESCE(?, stock),
                 final_price = ?, 
                 image_url = COALESCE(?, image_url),
                 coins_percent = ?,
                 sale_details = ?,
                 is_ads = ?,
                 is_approved = 1 
                 WHERE id = ?`,
                [name || null, stock || null, finalPrice, imageUrl, coinsPercent || 0, saleDetails || null, isAds ? 1 : 0, pid]
            );
        } else if (type === 'Update') {
            const [rows] = await pool.execute("SELECT * FROM product_updates WHERE id = ?", [id]);
            if (rows.length === 0) return res.status(404).json({ message: "Update request not found" });
            const update = rows[0];

            await pool.execute(
                `UPDATE products SET name=?, category=?, price=?, stock=?, description=?, final_price=?, coins_percent=?, sale_details=?, is_ads=? WHERE id=?`,
                [update.name, update.category, update.price, update.stock, update.description, finalPrice, coinsPercent || 0, saleDetails || null, isAds ? 1 : 0, update.product_id]
            );
            await pool.execute("DELETE FROM product_updates WHERE id = ?", [id]);
        }

        res.status(200).json({ message: "Approved successfully" });
    } catch (err) {
        console.error("Error approving product:", err);
        res.status(500).json({ message: "Server error approving product" });
    }
};

// Reject product (Hard Delete)
exports.rejectProduct = async (req, res) => {
    try {
        const { id, type } = req.body;
        const pid = id || req.body.productId;

        if (type === 'New' || !type) {
            // Hard delete from products table
            await pool.execute("DELETE FROM products WHERE id = ?", [pid]);
        } else if (type === 'Update') {
            // Delete request
            await pool.execute("DELETE FROM product_updates WHERE id = ?", [id]);
        }

        res.status(200).json({ message: "Rejected and deleted successfully" });
    } catch (err) {
        console.error("Error rejecting product:", err);
        res.status(500).json({ message: "Server error rejecting product" });
    }
};

// Get products for a specific seller
exports.getSellerProducts = async (req, res) => {
    try {
        const { sellerId } = req.params;
        if (!sellerId) return res.status(400).json({ message: "Seller ID required" });

        const [rows] = await pool.execute(
            `SELECT p.id, p.seller_id, p.name, p.category, p.price, p.stock, p.description, p.image_url, p.is_approved, p.created_at, p.sale_details, p.is_ads, p.coins_percent,
             CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_pending_update
             FROM products p
             LEFT JOIN product_updates u ON p.id = u.product_id
             WHERE p.seller_id = ? 
             ORDER BY p.created_at DESC`,
            [sellerId]
        );

        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching seller products:", err);
        res.status(500).json({ message: "Server error fetching products" });
    }
};

// Get all approved products for marketplace (Customers)
exports.getMarketplaceProducts = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.id, p.seller_id, p.name, p.category, p.final_price as price, p.stock, p.description, p.image_url, p.coins_percent, p.sale_details, p.is_ads, p.created_at, s.name as seller_name, s.shop_name 
             FROM products p
             JOIN sellers s ON p.seller_id = s.seller_id
             WHERE p.is_approved = 1
             ORDER BY p.created_at DESC`
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching marketplace products:", err);
        res.status(500).json({ message: "Server error fetching products" });
    }
};

// Seller delete product
exports.deleteProductBySeller = async (req, res) => {
    try {
        const { id } = req.params;
        const { sellerId } = req.body;

        const [rows] = await pool.execute("SELECT name, seller_id FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Product not found" });

        const product = rows[0];
        if (parseInt(product.seller_id) !== parseInt(sellerId)) {
            return res.status(403).json({ message: "Unauthorized: You do not own this product" });
        }

        await pool.execute("DELETE FROM products WHERE id = ?", [id]);

        const msg = `Seller (ID: ${sellerId}) removed product '${product.name}' (ID: ${id})`;
        await pool.execute("INSERT INTO notifications (message, type) VALUES (?, 'warning')", [msg]);

        res.status(200).json({ message: "Product deleted and admin notified" });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ message: "Server error deleting product" });
    }
};

// Get admin notifications
exports.getNotifications = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20");
        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Server error fetching notifications" });
    }
};

// Get Single Product Details (Public)
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `SELECT p.id, p.seller_id, p.name, COALESCE(p.final_price, p.price) as price, p.stock, p.description, p.image_url, p.sale_details, 
             s.name as seller_name, s.shop_name, s.shop_town, s.certificate_url 
             FROM products p
             LEFT JOIN sellers s ON p.seller_id = s.seller_id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ message: "Product not found" });

        // Mocking sold amount as table 'orders' joins would be needed
        rows[0].sold_amount = 0;

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error("Error fetching product details:", err);
        res.status(500).json({ message: "Server error" });
    }
};
