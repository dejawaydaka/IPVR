exports.depositNotification = (email, amount, currency, status) => `
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
    .amount-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: 700; color: #22c55e; }
    .status { display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.approved { background: #d1fae5; color: #065f46; }
    .status.rejected { background: #fee2e2; color: #991b1b; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Deposit ${status === 'approved' ? 'Approved' : status === 'pending' ? 'Received' : 'Update'}</h1>
    </div>
    <div class="content">
      <p>Hi ${email},</p>
      ${status === 'pending' ? `
      <p>Your deposit has been received and is currently under review.</p>
      <div class="amount-box">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Deposit Amount</div>
        <div class="amount">$${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency}</div>
      </div>
      <p>Our team will review your deposit and update your balance once approved. This usually takes a few hours.</p>
      <p>You will receive another email notification when your deposit is approved.</p>
      ` : status === 'approved' ? `
      <p>Great news! Your deposit has been approved and credited to your account.</p>
      <div class="amount-box">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Deposit Amount</div>
        <div class="amount">$${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency}</div>
      </div>
      <p>Your balance has been updated. You can now start investing and earning profits!</p>
      ` : `
      <p>Unfortunately, your deposit request has been rejected.</p>
      <div class="amount-box">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Deposit Amount</div>
        <div class="amount">$${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency}</div>
      </div>
      <p>Please contact support@realsphereltd.com if you have any questions or concerns.</p>
      `}
      <p style="margin-top: 30px;">
        <a href="https://realsphereltd.com/dashboard/index.html" style="color: #22c55e; text-decoration: none; font-weight: 600;">View Dashboard →</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} RealSphere. All rights reserved.</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

