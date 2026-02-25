require("dotenv").config();
const nodemailer = require("nodemailer");
const { generateRegistrationOTPEmail } = require("./templates/email-templates");

async function reproduceIssue() {
    console.log("Testing email with server.js logic...");

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_APP_PASSWORD,
        },
    });

    const otpCode = "123456";
    const userName = "Test User";
    const emailContent = generateRegistrationOTPEmail(otpCode, userName);
    const recipient = process.env.MAIL_USER; // Send to self

    console.log(`Attempting to send to ${recipient}`);
    console.log(`From: leef 🍃 <${process.env.MAIL_USER}>`);

    try {
        const info = await transporter.sendMail({
            from: `leef 🍃 <${process.env.MAIL_USER}>`, // Exact format from server.js
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });

        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (err) {
        console.error("❌ Failed to send email:", err.message);
        console.error(err);
    }
}

reproduceIssue();
