// Email templates for OTP verification system

const generateRegistrationOTPEmail = (otpCode, userName = "User") => {
  return {
    subject: "Verify Your Email - leef 🍃",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #6c757d; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍃 Welcome to leef!</h1>
      <p>Verify your email to get started</p>
    </div>
    <div class="content">
      <h2>Hello ${userName}!</h2>
      <p>Thank you for registering with leef. To complete your registration and start your fresh journey, please verify your email address.</p>
      
      <div class="otp-box">
        <p style="margin: 0 0 10px; font-size: 14px; color: #6c757d;">Your verification code is:</p>
        <div class="otp-code">${otpCode}</div>
        <p style="margin: 15px 0 0; font-size: 12px; color: #6c757d;">This code expires in 10 minutes</p>
      </div>

      <p>Enter this code on the verification page to activate your account.</p>

      <div class="warning">
        <strong>⚠️ Security Note:</strong> Never share this code with anyone. leef staff will never ask for your verification code.
      </div>

      <p style="color: #6c757d; font-size: 14px;">If you didn't create an account with leef, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2026 leef 🍃 - Fresh & Organic Marketplace</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Welcome to leef!\n\nYour verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nEnter this code on the verification page to activate your account.\n\nIf you didn't create an account with leef, please ignore this email.`
  };
};

const generatePasswordResetOTPEmail = (otpCode, userEmail) => {
  return {
    subject: "Password Reset Code - leef 🍃",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .otp-box { background: #f8f9fa; border: 2px dashed #f5576c; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f5576c; font-family: 'Courier New', monospace; }
    .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px; color: #721c24; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
      <p>Reset your leef account password</p>
    </div>
    <div class="content">
      <h2>Password Reset Code</h2>
      <p>We received a request to reset the password for your account (<strong>${userEmail}</strong>).</p>
      
      <div class="otp-box">
        <p style="margin: 0 0 10px; font-size: 14px; color: #6c757d;">Your password reset code is:</p>
        <div class="otp-code">${otpCode}</div>
        <p style="margin: 15px 0 0; font-size: 12px; color: #6c757d;">This code expires in 10 minutes</p>
      </div>

      <p>Enter this code on the password reset page to set a new password for your account.</p>

      <div class="warning">
        <strong>⚠️ Security Warning:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure. Someone may have entered your email by mistake.
      </div>

      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">Need help? Contact our support team.</p>
    </div>
    <div class="footer">
      <p>© 2026 leef 🍃 - Fresh & Organic Marketplace</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Password Reset Request\n\nYour password reset code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nEnter this code on the password reset page to set a new password.\n\nIf you didn't request a password reset, please ignore this email.`
  };
};

const generateSellerInvitationEmail = (email, invitationLink) => {
  return {
    subject: "Invitation to Join leef 🍃 as a Seller",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .btn { display: inline-block; background: #16a34a; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.3); transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 8px rgba(22, 163, 74, 0.4); }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍃 Partner with leef!</h1>
      <p>Seller Invitation</p>
    </div>
    <div class="content">
      <h2>Hello!</h2>
      <p>You have been invited to join <strong>leef</strong> as a Seller. Expand your reach and sell your fresh produce to thousands of customers.</p>
      
      <p>Please click the button below to complete your registration and set up your shop profile.</p>
      
      <div style="text-align: center;">
        <a href="${invitationLink}" class="btn">Register as Seller</a>
      </div>

      <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #666; word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${invitationLink}</p>
      
      <p>We look forward to having you on board!</p>
    </div>
    <div class="footer">
      <p>© 2026 leef 🍃 - Fresh & Organic Marketplace</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `You have been invited to join leef as a Seller!\n\nClick the link below to register:\n${invitationLink}\n\nWe look forward to having you on board!`
  };
};

const generateAccountApprovedEmail = (name) => {
  return {
    subject: "Account Approved! Welcome to leef 🍃",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #16a34a; color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .btn { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Approved! 🎉</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Great news! Your account has been approved by our administrators.</p>
            <p>You can now log in and start shopping for fresh produce on leef.</p>
            <div style="text-align: center;">
                <a href="http://localhost:5173/login.html" class="btn">Login Now</a>
            </div>
        </div>
    </div>
</body>
</html>
    `,
    text: `Hello ${name}!\n\nYour account has been approved! You can now log in to leef.`
  };
};

module.exports = {
  generateRegistrationOTPEmail,
  generatePasswordResetOTPEmail,
  generateSellerInvitationEmail,
  generateAccountApprovedEmail
};
