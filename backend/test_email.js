require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
    console.log("Testing email configuration...");
    console.log("User:", process.env.MAIL_USER);
    console.log("Password set:", !!process.env.MAIL_APP_PASSWORD);

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_APP_PASSWORD,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,
        socketTimeout: 10000,
    });

    try {
        console.log("Attempting to verify connection...");
        await transporter.verify();
        console.log("Connection verified successfully! ✅");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `"Leef Test" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_USER,
            subject: "LEEF SMTP Diagnostic",
            text: "Diagnostic email successful! ✅",
            html: "<b>Diagnostic email successful! ✅</b>"
        });

        console.log("Email sent! ✅ Message ID:", info.messageId);
    } catch (err) {
        console.error("❌ Diagnostic Failed:");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
        if (err.stack) console.error("Stack Trace:", err.stack);
    }
}

testEmail();
