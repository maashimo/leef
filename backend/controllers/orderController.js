const { pool } = require("../config/db");

// Create a new order request (distributor approval needed)
exports.createOrderRequest = async (req, res) => {
    try {
        const { userId, productId, sellerId, locations, totalQty } = req.body;

        if (!userId || !productId || !locations || locations.length === 0) {
            return res.status(400).json({ message: "Invalid request data" });
        }

        // Store locations as JSON
        const locationsJson = JSON.stringify(locations);

        await pool.execute(
            `INSERT INTO order_requests (user_id, product_id, seller_id, locations, total_qty, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, productId, sellerId, locationsJson, totalQty]
        );

        res.status(201).json({ message: "Order request sent for approval" });
    } catch (err) {
        console.error("Error creating order request:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get pending requests (for admin/distributor)
exports.getPendingRequests = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, p.name as product_name, p.image_url, c.name as customer_name, c.email as customer_email
            FROM order_requests r
            JOIN products p ON r.product_id = p.id
            JOIN customers c ON r.user_id = c.customer_id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        `);

        // Parse JSON locations for frontend convenience if needed, or let frontend parse
        const results = rows.map(r => ({
            ...r,
            locations: typeof r.locations === 'string' ? JSON.parse(r.locations) : r.locations
        }));

        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
// Get all requests (for admin/distributor view)
exports.getAllRequests = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, p.name as product_name, p.image_url, c.name as customer_name, c.email as customer_email
            FROM order_requests r
            JOIN products p ON r.product_id = p.id
            JOIN customers c ON r.user_id = c.customer_id
            ORDER BY r.created_at DESC
        `);

        // Parse JSON locations for frontend convenience
        const results = rows.map(r => ({
            ...r,
            locations: typeof r.locations === 'string' ? JSON.parse(r.locations) : r.locations
        }));

        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Accept an order request
exports.acceptOrderRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;

        await pool.execute(
            `UPDATE order_requests SET status = 'approved', admin_note = ? WHERE id = ?`,
            [adminNote || null, id]
        );

        res.status(200).json({ message: "Order accepted successfully" });
    } catch (err) {
        console.error("Error accepting order:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Reject an order request
exports.rejectOrderRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await pool.execute(
            `UPDATE order_requests SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
            [reason || 'No reason provided', id]
        );

        res.status(200).json({ message: "Order rejected successfully" });
    } catch (err) {
        console.error("Error rejecting order:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get requests for a specific customer
exports.getCustomerRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.execute(`
            SELECT r.*, p.name as product_name, p.image_url, p.price, s.shop_name
            FROM order_requests r
            JOIN products p ON r.product_id = p.id
            LEFT JOIN sellers s ON r.seller_id = s.seller_id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [userId]);

        const results = rows.map(r => ({
            ...r,
            locations: typeof r.locations === 'string' ? JSON.parse(r.locations) : r.locations
        }));

        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
