exports.verifyEmail = (email, link) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .content { background: #fff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #22c55e; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #16a34a; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to RealSphere!</h1>
    </div>
    <div class="content">
      <p>Hi ${email},</p>
      <p>Thank you for joining RealSphere - your premium real estate investment platform.</p>
      <p>To complete your registration and start investing, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${link}" class="button">Verify Account</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${link}</p>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} RealSphere. All rights reserved.</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

