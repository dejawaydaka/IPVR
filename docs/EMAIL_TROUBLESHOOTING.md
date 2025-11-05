# Email Connection Timeout Troubleshooting

## Issue: Connection Timeout Errors

If you're seeing:
```
❌ Email send error: Connection timeout
```

This guide will help you resolve it.

---

## 🔍 Common Causes

### 1. Railway Network Restrictions
**Railway's Hobby Plan** may block outbound SMTP traffic on port 465/587.

**Solution:**
- Upgrade to **Railway Pro Plan** ($5/month) which allows outbound SMTP
- Or use an alternative email service (SendGrid, Mailgun, etc.)

### 2. Zoho SMTP Configuration
Zoho may require specific settings or your app password might be incorrect.

**Solution:**
- Verify your Zoho app password is correct
- Ensure SMTP access is enabled in your Zoho account settings
- Check if your Zoho account has any restrictions

### 3. Firewall/Network Issues
Railway's network may block SMTP ports.

**Solution:**
- The code now automatically tries both:
  - Port 465 (SSL) - Primary
  - Port 587 (TLS) - Fallback
- If both fail, check Railway's network restrictions

---

## ✅ What We've Fixed

The updated email configuration now includes:

1. **Connection Timeouts:**
   - 20-second timeout for all connections
   - Prevents indefinite hanging

2. **Automatic Retry:**
   - Retries failed emails up to 2 times
   - Exponential backoff between retries

3. **Dual Port Support:**
   - Tries SSL (port 465) first
   - Falls back to TLS (port 587) if SSL fails
   - Automatically switches if connection fails

4. **Better Error Handling:**
   - Detailed error messages
   - Connection status tracking
   - Graceful degradation (app continues working even if email fails)

---

## 🧪 Testing Email Connection

After deployment, check your Railway logs for:

**Success:**
```
✅ Email service ready (Zoho SMTP - SSL on port 465)
```
or
```
✅ Email service ready (Zoho SMTP - TLS on port 587)
```

**Failure:**
```
❌ Email connection failed: { ssl: '...', tls: '...' }
```

---

## 🔧 Manual Configuration Options

### Option 1: Upgrade Railway Plan
1. Go to Railway Dashboard
2. Upgrade to **Pro Plan** ($5/month)
3. This allows outbound SMTP traffic

### Option 2: Use Alternative Email Service

**SendGrid (Free tier: 100 emails/day):**
```javascript
// In server.js, replace transporter with:
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

**Mailgun (Free tier: 5,000 emails/month):**
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILGUN_SMTP_USER,
    pass: process.env.MAILGUN_SMTP_PASSWORD
  }
});
```

### Option 3: Use Railway's Email Service
Railway offers email services that work with their platform.

---

## 📊 Current Status

Check your Railway deployment logs to see:
- Which port is working (465 or 587)
- Connection status
- Any error messages

---

## 🆘 If Still Not Working

1. **Verify ZOHO_APP_PASSWORD:**
   - Check Railway environment variables
   - Ensure password has no extra spaces
   - Regenerate app password in Zoho if needed

2. **Check Railway Plan:**
   - Verify you're on Pro plan (if using Hobby, upgrade)

3. **Test SMTP Connection:**
   - Try connecting from a different network
   - Verify Zoho SMTP is accessible

4. **Consider Alternative:**
   - Use SendGrid, Mailgun, or AWS SES
   - These services are designed for cloud platforms

---

## 📝 Notes

- The email system will **gracefully degrade** - your app continues working even if emails fail
- Failed emails are logged but don't crash the application
- Admin alerts and user notifications will be queued if email fails

---

**Last Updated:** After implementing improved SMTP configuration with retry logic and TLS fallback.

