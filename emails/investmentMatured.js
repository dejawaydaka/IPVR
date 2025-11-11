exports.investmentMatured = (email, planName, amount, totalProfit) => `
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
    .profit-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .profit-amount { font-size: 36px; font-weight: 700; color: #22c55e; }
    .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Investment Matured!</h1>
    </div>
    <div class="content">
      <p>Hi ${email},</p>
      <div class="celebration">🎊</div>
      <p style="text-align: center; font-size: 18px; font-weight: 600;">Congratulations! Your investment has completed successfully!</p>
      <div class="profit-box">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Total Profit Earned</div>
        <div class="profit-amount">$${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Pricing Tier:</strong> ${planName}</p>
        <p style="margin: 5px 0;"><strong>Principal Amount:</strong> $${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        <p style="margin: 5px 0;"><strong>Total Profit:</strong> $${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
      </div>
      <p>Your profits have been automatically credited to your account balance. You can now:</p>
      <ul>
        <li>Reinvest your profits in a new investment plan</li>
        <li>Request a withdrawal to your crypto wallet</li>
        <li>Continue earning with your current balance</li>
      </ul>
      <p style="margin-top: 30px;">
        <a href="https://realsphereltd.com/dashboard/index.html" style="color: #22c55e; text-decoration: none; font-weight: 600;">View Dashboard & Invest Again →</a>
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

