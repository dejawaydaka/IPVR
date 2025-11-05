exports.passwordReset = (email, link) => `
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
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi ${email},</p>
      <p>We received a request to reset your password for your RealSphere account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${link}" class="button">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${link}</p>
      <div class="warning">
        <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
      </div>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} RealSphere. All rights reserved.</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

