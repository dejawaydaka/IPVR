# Railway Deployment Setup Guide

## ✅ Code Successfully Pushed to GitHub!

Your code is now live at: **https://github.com/dejawaydaka/IPVR**

---

## 🚂 Railway Deployment Steps

### **Step 1: Create Railway Project**

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub (if first time)
5. Select repository: **`dejawaydaka/IPVR`**
6. Railway will auto-detect it's a Node.js project

### **Step 2: Add PostgreSQL Database**

1. In your Railway project dashboard
2. Click **"New"** → **"Database"** → **"PostgreSQL"**
3. Railway will automatically:
   - Create PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Link it to your app service

### **Step 3: Initialize Database Schema**

**Option A: Using Railway Query Tab (Easiest)**
1. Click on your PostgreSQL service in Railway
2. Go to **"Query"** tab
3. Copy the entire contents of `database/schema.sql`
4. Paste into the query editor
5. Click **"Run"** or execute
6. You should see: `CREATE TABLE` messages

**Option B: Using Railway CLI**
```bash
railway link
railway run psql $DATABASE_URL -f database/schema.sql
```

**Option C: Using psql directly**
```bash
# Get connection string from Railway
psql $DATABASE_URL -f database/schema.sql
```

### **Step 4: Verify Deployment**

1. Railway will auto-deploy on every push to `main` branch
2. Check deployment logs - should see:
   ```
   ✅ Connected to PostgreSQL
   Server running at http://...
   ```

3. Railway will provide a public URL (like `https://your-app.up.railway.app`)

---

## 🔧 Environment Variables

Railway automatically sets:
- ✅ `DATABASE_URL` - Auto-linked from PostgreSQL service
- ✅ `PORT` - Auto-set by Railway

**No manual configuration needed!**

---

## ✅ Verification Checklist

After deployment, test:

1. **Server Health**
   - Visit Railway-provided URL
   - Should see your landing page

2. **Database Connection**
   - Check Railway logs for: `✅ Connected to PostgreSQL`

3. **API Endpoints**
   - Test registration: `POST /register`
   - Test login: `POST /login`
   - Test dashboard: `GET /api/user/:email`

4. **Database Tables**
   - Go to PostgreSQL → Query tab
   - Run: `SELECT * FROM users;`
   - Should see any test users you've created

---

## 🐛 Troubleshooting

### **Database Connection Failed**
- Check `DATABASE_URL` is set in Railway
- Verify PostgreSQL service is running
- Ensure schema was executed

### **Deployment Failed**
- Check Railway build logs
- Verify `package.json` has correct dependencies
- Ensure `npm start` command works

### **Tables Not Found**
- Run `database/schema.sql` again
- Check PostgreSQL Query tab for errors

---

## 📊 Deployment Status

Once deployed, your platform will have:
- ✅ PostgreSQL database on Railway
- ✅ Auto-scaling web service
- ✅ HTTPS enabled (Railway provides SSL)
- ✅ Automatic deployments on git push
- ✅ Production-ready infrastructure

---

## 🎯 Next Steps After Deployment

1. **Test Registration** - Create a test user
2. **Test Login** - Verify authentication works
3. **Test Dashboard** - Check metrics load from database
4. **Test Investments** - Create a test investment
5. **Monitor Logs** - Check Railway logs for any issues

---

**Your RealSphere platform is now production-ready! 🚀**

---

## 📝 Important Notes

- **Database URL**: Railway auto-generates and links `DATABASE_URL`
- **Auto-Deploy**: Every push to `main` triggers automatic deployment
- **Scaling**: Railway auto-scales based on traffic
- **Monitoring**: Check Railway dashboard for metrics and logs

---

**Status**: ✅ Ready for Railway deployment!
**Repository**: https://github.com/dejawaydaka/IPVR
**Next**: Connect to Railway and deploy! 🚂

