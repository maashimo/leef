require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { generateRegistrationOTPEmail, generatePasswordResetOTPEmail } = require("../templates/email-templates");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_APP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
});

function sha256Hex(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otpCode, purpose, userName = "User") {
    try {
        let emailContent;
        if (purpose === "registration") {
            emailContent = generateRegistrationOTPEmail(otpCode, userName);
        } else if (purpose === "password_reset") {
            emailContent = generatePasswordResetOTPEmail(otpCode, email);
        } else {
            throw new Error("Invalid email purpose");
        }

        await transporter.sendMail({
            from: `Leef <${process.env.MAIL_USER}>`,
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });
        console.log(`✅ OTP email sent to ${email} for ${purpose}`);
        return true;
    } catch (err) {
        console.error("❌ Failed to send OTP email:", err.message);
        return false;
    }
}

async function storeOTP(conn, role, userId, email, otpCode, purpose) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await conn.execute(
        "UPDATE otp_verification SET is_used = 1 WHERE email = ? AND purpose = ? AND is_used = 0",
        [email, purpose]
    );
    await conn.execute(
        "INSERT INTO otp_verification (role, user_id, email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
        [role, userId, email, otpCode, purpose, expiresAt]
    );
}

async function verifyOTP(conn, email, otpCode, purpose) {
    const [rows] = await conn.execute(
        `SELECT id, user_id, role, expires_at, is_used 
     FROM otp_verification 
     WHERE email = ? AND otp_code = ? AND purpose = ? 
     ORDER BY created_at DESC LIMIT 1`,
        [email, otpCode, purpose]
    );

    if (rows.length === 0) return { valid: false, error: "Invalid OTP code" };
    const otp = rows[0];
    if (otp.is_used) return { valid: false, error: "OTP already used" };
    if (new Date(otp.expires_at) < new Date()) return { valid: false, error: "OTP expired" };

    await conn.execute("UPDATE otp_verification SET is_used = 1 WHERE id = ?", [otp.id]);
    return { valid: true, userId: otp.user_id, role: otp.role };
}

async function makeUniqueUsername(conn, email) {
    const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
    let username = base || "user";
    for (let i = 0; i < 10; i++) {
        const [c] = await conn.execute("SELECT customer_id FROM customers WHERE username=? LIMIT 1", [username]);
        const [s] = await conn.execute("SELECT seller_id FROM sellers WHERE username=? LIMIT 1", [username]);
        if (c.length === 0 && s.length === 0) return username;
        username = base + Math.floor(100 + Math.random() * 900);
    }
    return base + Date.now();
}

async function verifyPassword(inputPassword, storedPasswordHash) {
    if (!storedPasswordHash) return false;
    if (typeof storedPasswordHash === "string" && storedPasswordHash.startsWith("$2")) {
        return await bcrypt.compare(inputPassword, storedPasswordHash);
    }
    return inputPassword === storedPasswordHash;
}

module.exports = {
    transporter,
    sha256Hex,
    generateOTP,
    sendOTPEmail,
    storeOTP,
    verifyOTP,
    makeUniqueUsername,
    verifyPassword
};
