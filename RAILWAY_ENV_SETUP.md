# Setting Railway Environment Variables

## Option 1: Railway Web Dashboard (Recommended)

1. Go to https://railway.app
2. Log in to your account
3. Select your **RealSphere** project
4. Click on your **service** (the one running your Node.js app)
5. Go to the **Variables** tab
6. Click **"New Variable"** or **"Raw Editor"**
7. Add the following environment variable:

```
ZOHO_APP_PASSWORD=khKp hW68 JRqU
```

⚠️ **IMPORTANT**: Copy the password exactly as shown above (with spaces)

**Optional but recommended:**
```
BASE_URL=https://your-domain.railway.app
ADMIN_EMAIL=support@realsphereltd.com
```

8. Click **"Save"** - Railway will automatically redeploy your service

## Option 2: Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variable
railway variables set ZOHO_APP_PASSWORD="khKp hW68 JRqU"

# Optional variables
railway variables set BASE_URL=https://your-domain.railway.app
railway variables set ADMIN_EMAIL=support@realsphereltd.com
```

## Getting Your Zoho App Password

1. Log in to your Zoho Mail account
2. Go to **Settings** → **Security** → **App Passwords**
3. Click **"Generate New Password"**
4. Name it (e.g., "RealSphere SMTP")
5. Copy the generated password (you'll only see it once!)
6. Use this password as your `ZOHO_APP_PASSWORD`

## Verification

After setting the environment variable:

1. Railway will automatically redeploy
2. Check your Railway service logs
3. You should see: `✅ Email service ready (Zoho SMTP)`
4. If you see: `⚠️ Email service not configured`, the password might be incorrect

## Troubleshooting

- **"Email service not configured"**: Check that `ZOHO_APP_PASSWORD` is set correctly
- **Emails not sending**: Verify your Zoho app password is valid and not expired
- **Connection timeout**: Check Zoho SMTP settings (smtp.zoho.com:465)

