# GitHub & Railway Deployment Instructions

## ✅ PostgreSQL Migration Complete

All code has been successfully migrated to PostgreSQL and is ready to push to GitHub.

---

## 🔐 Push to GitHub

You need to authenticate with GitHub first. Choose one method:

### **Option 1: Using GitHub CLI (Recommended)**
```bash
gh auth login
git push -u origin main
```

### **Option 2: Using Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` permissions
3. Use token as password when pushing:
```bash
git push -u origin main
# Username: dejawaydaka
# Password: [your personal access token]
```

### **Option 3: Using SSH (Most Secure)**
1. Generate SSH key if you don't have one:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```
2. Add SSH key to GitHub (Settings → SSH and GPG keys)
3. Change remote URL:
```bash
git remote set-url origin git@github.com:dejawaydaka/IPVR.git
git push -u origin main
```

---

## 🚂 Railway Deployment

### **After Pushing to GitHub:**

1. **Connect Repository**
   - Go to [Railway Dashboard](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `dejawaydaka/IPVR`

2. **Add PostgreSQL Database**
   - In your Railway project, click "New" → "Database" → "PostgreSQL"
   - Railway will auto-create and link the database
   - `DATABASE_URL` will be automatically set

3. **Run Database Schema**
   - Go to PostgreSQL service → "Query" tab
   - Copy contents of `database/schema.sql`
   - Paste and execute

4. **Deploy**
   - Railway will auto-deploy on push
   - Or click "Deploy" to trigger manually
   - Check logs to see: `✅ Connected to PostgreSQL`

---

## ✅ What's Been Done

### **Backend Migration**
- ✅ All JSON file operations replaced with PostgreSQL queries
- ✅ Database connection pool configured
- ✅ All `/api/*` endpoints migrated
- ✅ All legacy endpoints (`/register`, `/login`, `/dashboard`) migrated
- ✅ Profit calculation functions updated
- ✅ Daily profit auto-updater configured
- ✅ File uploads preserved (multer still works)

### **Files Created**
- ✅ `database/schema.sql` - Complete database schema
- ✅ `.env.example` - Environment variable template
- ✅ `.gitignore` - Proper exclusions
- ✅ `README.md` - Project documentation
- ✅ `DEPLOYMENT.md` - Deployment guide

### **Code Changes**
- ✅ `server.js` - Fully migrated to PostgreSQL
- ✅ All endpoints use `pool.query()` instead of JSON
- ✅ Response formats preserved (100% frontend compatible)
- ✅ Error handling maintained
- ✅ Security features preserved

---

## 🧪 Testing Locally

Before deploying, test locally:

1. **Set up local PostgreSQL** (optional):
   ```bash
   # Install PostgreSQL locally, then:
   createdb realsphere
   psql realsphere -f database/schema.sql
   ```

2. **Set environment variable**:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/realsphere"
   ```

3. **Start server**:
   ```bash
   npm start
   ```

4. **Verify connection**:
   - Should see: `✅ Connected to PostgreSQL`
   - Test endpoints with Postman or curl

---

## 📊 Database Schema Overview

### **Tables:**
1. **users** - User accounts
   - id, email, password (hashed), name, balance, etc.

2. **investments** - Investment records
   - id, user_id (FK), plan, amount, daily_percent, start_date, profit

3. **deposits** - Deposit history
   - id, user_id (FK), amount, currency, proof, status

4. **withdrawals** - Withdrawal requests
   - id, user_id (FK), amount, crypto_type, wallet_address, status

### **Indexes:**
- Email lookup optimized
- Foreign key relationships
- Query performance indexes

---

## 🔄 Migration Notes

### **What Changed:**
- ❌ No more `data.json` file
- ❌ No more `readData()` or `writeData()` functions
- ✅ All queries use PostgreSQL
- ✅ Better concurrent access handling
- ✅ ACID transactions
- ✅ Scalable architecture

### **What Stayed the Same:**
- ✅ All API response formats
- ✅ All endpoint URLs
- ✅ All request/response structures
- ✅ Frontend code (no changes needed)
- ✅ Security features
- ✅ Error handling

---

## 🎯 Next Steps

1. **Push to GitHub** (authenticate first)
2. **Connect Railway** to GitHub repo
3. **Add PostgreSQL** service on Railway
4. **Run schema** in Railway PostgreSQL Query tab
5. **Deploy** and verify connection
6. **Test endpoints** on deployed URL

---

**Status**: ✅ Code ready, awaiting GitHub push and Railway deployment

