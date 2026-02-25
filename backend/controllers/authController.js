const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const { generateOTP, sendOTPEmail, storeOTP, verifyOTP, makeUniqueUsername, verifyPassword } = require("../utils/authUtils");

/* =========================
   REGISTER
========================= */
exports.register = async (req, res) => {
    try {
        const { fullname, email, password, address, role, town, shop_name, shop_town, bio } = req.body;
        let { username } = req.body; // get custom username if present

        if (!fullname || !email || !password || !address || !role) {
            return res.status(400).send("Missing required fields");
        }

        if (password.length < 6) return res.status(400).send("Password must be at least 6 characters long");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return res.status(400).send("Password must contain at least one special character");

        // Email & Username check
        const [c] = await pool.execute("SELECT customer_id FROM customers WHERE email=? LIMIT 1", [email]);
        const [s] = await pool.execute("SELECT seller_id FROM sellers WHERE email=? LIMIT 1", [email]);
        if (c.length > 0 || s.length > 0) return res.status(409).send("Email already registered");

        if (username) {
            // Check username uniqueness if provided
            username = username.trim().toLowerCase();
            const [uc] = await pool.execute("SELECT customer_id FROM customers WHERE username=? LIMIT 1", [username]);
            const [us] = await pool.execute("SELECT seller_id FROM sellers WHERE username=? LIMIT 1", [username]);
            if (uc.length > 0 || us.length > 0) return res.status(409).send("Username already taken. Please choose another.");
        } else {
            // Auto-generate if not provided
            username = await makeUniqueUsername(pool, email);
        }

        const password_hash = await bcrypt.hash(password, 10);
        let userId;

        if (role === "customer") {
            const [result] = await pool.execute(
                "INSERT INTO customers (name, email, phone, username, password_hash, address, town, role, is_verified, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [fullname, email, null, username, password_hash, address, town || null, "CUSTOMER", 0, 0]
            );
            userId = result.insertId;
        } else if (role === "seller") {
            const shop_details = `Bio: ${bio || ""}`;
            const [result] = await pool.execute(
                "INSERT INTO sellers (name, email, phone, shop_name, shop_town, shop_details, username, password_hash, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [fullname, email, null, shop_name || "", shop_town || null, shop_details, username, password_hash, 0]
            );
            userId = result.insertId;

            if (req.file) {
                const certPath = "/uploads/" + req.file.filename;
                await pool.execute("INSERT INTO seller_certificates (seller_id, certificate) VALUES (?, ?)", [userId, certPath]);
            }
        } else {
            return res.status(400).send("Role must be customer or seller");
        }

        const otpCode = generateOTP();
        await storeOTP(pool, role, userId, email, otpCode, "registration");
        const emailSent = await sendOTPEmail(email, otpCode, "registration", fullname);

        if (!emailSent) return res.status(500).send("Registration successful but failed to send verification email.");

        return res.status(201).json({
            message: "Registration successful! Please check your email for verification code.",
            email: email,
            role: role
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error: " + err.message);
    }
};

/* =========================
   VERIFY EMAIL
========================= */
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otpCode, role } = req.body;
        if (!email || !otpCode || !role) return res.status(400).send("Required fields missing");

        const verification = await verifyOTP(pool, email, otpCode, "registration");
        if (!verification.valid) return res.status(400).send(verification.error);

        let table = role === "customer" ? "customers" : role === "seller" ? "sellers" : role === "admin" ? "admins" : null;
        let idCol = role === "customer" ? "customer_id" : role === "seller" ? "seller_id" : "admin_id"; // Assuming admin_id for admin

        if (table) {
            await pool.execute(`UPDATE ${table} SET is_verified = 1 WHERE ${idCol} = ?`, [verification.userId]);
        }

        return res.status(200).json({ message: "Email verified successfully!", success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error: " + err.message);
    }
};

/* =========================
   RESEND OTP
========================= */
exports.resendOTP = async (req, res) => {
    try {
        const { email, purpose, role } = req.body;
        if (!email || !purpose || !role) return res.status(400).send("Required fields missing");

        let userId, userName;
        if (role === "customer") {
            const [rows] = await pool.execute("SELECT customer_id, name FROM customers WHERE email = ? LIMIT 1", [email]);
            if (rows.length === 0) return res.status(404).send("User not found");
            userId = rows[0].customer_id;
            userName = rows[0].name;
        } else if (role === "seller") {
            const [rows] = await pool.execute("SELECT seller_id, name FROM sellers WHERE email = ? LIMIT 1", [email]);
            if (rows.length === 0) return res.status(404).send("User not found");
            userId = rows[0].seller_id;
            userName = rows[0].name;
        } else {
            return res.status(400).send("Invalid role");
        }

        const otpCode = generateOTP();
        await storeOTP(pool, role, userId, email, otpCode, purpose);
        const emailSent = await sendOTPEmail(email, otpCode, purpose, userName);

        if (!emailSent) return res.status(500).json({ message: "Failed to send verification code email.", success: false });

        return res.status(200).json({ message: "OTP code sent successfully!", success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error: " + err.message);
    }
};

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).send("Missing login fields");

        let user = null;
        let role = "";

        // Check Admin
        const [adminRows] = await pool.execute("SELECT admin_id AS id, username, email, password_hash, is_verified FROM admins WHERE email=? OR username=? LIMIT 1", [identifier, identifier]);
        if (adminRows.length > 0) { user = adminRows[0]; role = "admin"; }

        // Check Customer
        if (!user) {
            const [customerRows] = await pool.execute("SELECT customer_id AS id, username, email, password_hash, is_verified, is_approved FROM customers WHERE email=? OR username=? LIMIT 1", [identifier, identifier]);
            if (customerRows.length > 0) { user = customerRows[0]; role = "customer"; }
        }

        // Check Seller
        if (!user) {
            const [sellerRows] = await pool.execute("SELECT seller_id AS id, username, email, password_hash, is_verified FROM sellers WHERE email=? OR username=? LIMIT 1", [identifier, identifier]);
            if (sellerRows.length > 0) { user = sellerRows[0]; role = "seller"; }
        }

        if (!user) return res.status(401).send("User not found");
        if (user.is_verified === 0) return res.status(403).send("Please verify your email.");
        if (role === "customer" && user.is_approved === 0) return res.status(403).send("Account pending approval.");

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return res.status(401).send("Wrong password");

        return res.status(200).json({
            message: "Login success ✅",
            role,
            id: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error: " + err.message);
    }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPassword = async (req, res) => {
    try {
        let { role, email } = req.body;
        if (!email) return res.status(400).send("Email is required");

        // We return generic success to prevent user enumeration, but for our flow we return role too?
        // Actually, the next step usually needs the role to Verify OTP.
        // We should send the role back in the response? 
        // Or the verify endpoint also needs to be smart.
        // Wait, verifyOTP uses role to verify.
        // I should return the detected role in the response so the frontend can store it for the next step (Verify OTP).

        let userRow = null;
        let userName = "User";

        // Auto-detect role
        if (!role) {
            // Check Customers
            const [c] = await pool.execute("SELECT customer_id AS id, name FROM customers WHERE email=? LIMIT 1", [email]);
            if (c.length > 0) {
                role = "customer"; userRow = c[0];
            } else {
                // Check Sellers
                const [s] = await pool.execute("SELECT seller_id AS id, name FROM sellers WHERE email=? LIMIT 1", [email]);
                if (s.length > 0) {
                    role = "seller"; userRow = s[0];
                } else {
                    // Check Admins
                    const [a] = await pool.execute("SELECT admin_id AS id, username as name FROM admins WHERE email=? LIMIT 1", [email]);
                    if (a.length > 0) {
                        role = "admin"; userRow = a[0];
                    }
                }
            }
        } else {
            // Explicit role logic
            let table = role === "customer" ? "customers" : role === "seller" ? "sellers" : "admins";
            let idCol = role === "customer" ? "customer_id" : role === "seller" ? "seller_id" : "admin_id";
            const [r] = await pool.execute(`SELECT ${idCol} AS id, ${role === 'admin' ? 'username' : 'name'} as name FROM ${table} WHERE email=? LIMIT 1`, [email]);
            if (r.length > 0) userRow = r[0];
        }

        const generic = { message: "If the email exists, a reset code was sent to your email.", role: role, success: true }; // Include role for frontend

        if (!userRow) return res.json(generic);

        userName = userRow.name || "User";

        const otpCode = generateOTP();
        await storeOTP(pool, role, userRow.id, email, otpCode, "password_reset");
        const emailSent = await sendOTPEmail(email, otpCode, "password_reset", userName);

        if (!emailSent) {
            return res.status(500).json({ message: "Failed to send reset code email.", success: false });
        }

        return res.json(generic);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
};

/* =========================
   RESET PASSWORD
========================= */
exports.resetPassword = async (req, res) => {
    try {
        const { email, otpCode, newPassword, role } = req.body;
        if (!email || !otpCode || !newPassword || !role) return res.status(400).send("Missing fields");

        const verification = await verifyOTP(pool, email, otpCode, "password_reset");
        if (!verification.valid) return res.status(400).send(verification.error);

        const password_hash = await bcrypt.hash(newPassword, 10);

        let table = role === "customer" ? "customers" : role === "seller" ? "sellers" : "admins";
        let idCol = role === "customer" ? "customer_id" : role === "seller" ? "seller_id" : "admin_id";

        if (table) {
            await pool.execute(`UPDATE ${table} SET password_hash=? WHERE ${idCol}=?`, [password_hash, verification.userId]);
        }

        return res.json({ message: "Password updated successfully!" });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
};

/* =========================
   GET PROFILE
========================= */
exports.getProfile = async (req, res) => {
    try {
        const { role, id } = req.params;
        if (!role || !id) return res.status(400).send("Role and ID required");

        let user = null;
        if (role === "customer") {
            const [rows] = await pool.execute("SELECT customer_id as id, name, email, phone, address, town, username, loyalty_coins FROM customers WHERE customer_id = ?", [id]);
            if (rows.length > 0) user = rows[0];
        } else if (role === "seller") {
            const [rows] = await pool.execute("SELECT seller_id as id, name, email, phone, shop_name, shop_details, shop_town, username FROM sellers WHERE seller_id = ?", [id]);
            if (rows.length > 0) user = rows[0];
        }

        if (!user) return res.status(404).send("User not found");

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* =========================
   UPDATE PROFILE
========================= */
exports.updateProfile = async (req, res) => {
    try {
        const { role, id, name, phone, address, town, shop_name, shop_details, username } = req.body;
        if (!role || !id) return res.status(400).send("Role and ID required");

        // Validate username uniqueness if changing
        if (username) {
            const checkUserStr = username.trim().toLowerCase();
            // Check against OTHER users
            let query = "";
            let params = [checkUserStr, id];

            if (role === "customer") {
                const [conflict] = await pool.execute("SELECT customer_id FROM customers WHERE username=? AND customer_id != ? LIMIT 1", params);
                if (conflict.length > 0) return res.status(409).send("Username already taken");
            } else if (role === "seller") {
                const [conflict] = await pool.execute("SELECT seller_id FROM sellers WHERE username=? AND seller_id != ? LIMIT 1", params);
                if (conflict.length > 0) return res.status(409).send("Username already taken");
            }
        }

        if (role === "customer") {
            await pool.execute(
                "UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), town = COALESCE(?, town), username = COALESCE(?, username) WHERE customer_id = ?",
                [name || null, phone || null, address || null, town || null, username || null, id]
            );
        } else if (role === "seller") {
            await pool.execute(
                "UPDATE sellers SET name = COALESCE(?, name), phone = COALESCE(?, phone), shop_name = COALESCE(?, shop_name), shop_details = COALESCE(?, shop_details), username = COALESCE(?, username) WHERE seller_id = ?",
                [name || null, phone || null, shop_name || null, shop_details || null, username || null, id]
            );
        } else {
            return res.status(400).send("Invalid role");
        }

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* =========================
   CHANGE PASSWORD (LOGGED IN)
========================= */
exports.changePassword = async (req, res) => {
    try {
        const { role, id, oldPassword, newPassword } = req.body;
        if (!role || !id || !oldPassword || !newPassword) return res.status(400).send("Missing fields");

        let user = null;
        let table = "";
        let idCol = "";

        if (role === "customer") { table = "customers"; idCol = "customer_id"; }
        else if (role === "seller") { table = "sellers"; idCol = "seller_id"; }
        else if (role === "admin") { table = "admins"; idCol = "admin_id"; }
        else return res.status(400).send("Invalid role");

        const [rows] = await pool.execute(`SELECT password_hash FROM ${table} WHERE ${idCol} = ?`, [id]);
        if (rows.length === 0) return res.status(404).send("User not found");
        user = rows[0];

        const match = await verifyPassword(oldPassword, user.password_hash);
        if (!match) return res.status(400).send("Incorrect current password");

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute(`UPDATE ${table} SET password_hash = ? WHERE ${idCol} = ?`, [newHash, id]);

        return res.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
};
