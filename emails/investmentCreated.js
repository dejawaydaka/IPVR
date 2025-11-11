exports.investmentCreated = (email, amount, planName, dailyPercent) => `
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
    .investment-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: 700; color: #22c55e; text-align: center; }
    .details { margin-top: 20px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Investment Created Successfully!</h1>
    </div>
    <div class="content">
      <p>Hi ${email},</p>
      <p>Congratulations! Your investment has been successfully created.</p>
      <div class="investment-box">
        <div style="text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 5px;">Investment Amount</div>
        <div class="amount">$${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
      </div>
      <div class="details">
        <div class="detail-row">
          <span><strong>Pricing Tier:</strong></span>
          <span>${planName}</span>
        </div>
        <div class="detail-row">
          <span><strong>Daily ROI:</strong></span>
          <span style="color: #22c55e; font-weight: 600;">${(dailyPercent * 100).toFixed(2)}%</span>
        </div>
        <div class="detail-row">
          <span><strong>Duration:</strong></span>
          <span>7 days</span>
        </div>
        <div class="detail-row">
          <span><strong>Total Expected Return:</strong></span>
          <span style="color: #22c55e; font-weight: 600;">$${(amount * dailyPercent * 7).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      </div>
      <p style="margin-top: 20px;">Your investment is now active and will start generating daily profits. You'll receive daily updates on your earnings.</p>
      <p style="margin-top: 30px;">
        <a href="https://realsphereltd.com/dashboard/index.html" style="color: #22c55e; text-decoration: none; font-weight: 600;">View Investment Dashboard →</a>
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

