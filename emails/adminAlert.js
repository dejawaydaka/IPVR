exports.adminAlert = (subject, message, type = 'info', details = {}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : type === 'warning' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)'}; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .content { background: #fff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .alert-box { background: ${type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#f0fdf4'}; border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#22c55e'}; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; font-size: 12px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p style="margin: 0; font-weight: 600;">${message}</p>
      </div>
      ${Object.keys(details).length > 0 ? `
      <h3>Details:</h3>
      <div class="details">
        ${Object.entries(details).map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`).join('')}
      </div>
      ` : ''}
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        <strong>Time:</strong> ${new Date().toLocaleString()}<br>
        <strong>Type:</strong> ${type.toUpperCase()}
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} RealSphere Admin Panel</p>
      <p>This is an automated system alert.</p>
    </div>
  </div>
</body>
</html>
`;

