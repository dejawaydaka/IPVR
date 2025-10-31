# RealSphere PostgreSQL Migration & Railway Deployment Guide

## ✅ Migration Complete

All endpoints have been successfully migrated from JSON file storage to PostgreSQL database.

---

## 🗄️ Database Setup

### **1. Create Database on Railway**

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database service
4. Copy the `DATABASE_URL` from the database service

### **2. Run Database Schema**

Execute the SQL schema on your Railway PostgreSQL database:

**Option A: Using Railway CLI**
```bash
railway link
railway run psql $DATABASE_URL -f database/schema.sql
```

**Option B: Using Railway Dashboard**
1. Go to your PostgreSQL service
2. Click "Query" tab
3. Copy and paste contents of `database/schema.sql`
4. Execute

**Option C: Using psql directly**
```bash
psql $DATABASE_URL -f database/schema.sql
```

---

## 🔧 Environment Variables

### **Required Variables**

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@hostname:port/database
```

### **Railway Setup**

Railway automatically sets:
- `DATABASE_URL` - Auto-linked when you add PostgreSQL service
- `PORT` - Auto-set by Railway

You don't need to manually set these in Railway dashboard if the database is linked to your app service.

---

## 🚀 Deployment Steps

### **1. Connect GitHub Repository**

1. In Railway, create a new project
2. Click "New" → "GitHub Repo"
3. Select `dejawaydaka/IPVR`
4. Railway will auto-detect it's a Node.js project

### **2. Add PostgreSQL Database**

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create and link the database
3. The `DATABASE_URL` environment variable will be automatically set

### **3. Configure Build Settings**

Railway auto-detects Node.js, but ensure:
- **Build Command**: (auto-detected) `npm install`
- **Start Command**: `npm start` or `node server.js`

### **4. Deploy**

1. Railway will auto-deploy on every push to main branch
2. Or click "Deploy" button to trigger manual deployment

### **5. Initialize Database**

After first deployment, run the schema:
- Use Railway's Query tab in PostgreSQL service
- Or connect via psql and run `database/schema.sql`

---

## ✅ Verification

After deployment, check:

1. **Server logs** should show:
   ```
   ✅ Connected to PostgreSQL
   Server running at http://...
   ```

2. **Test endpoints**:
   - `POST /register` - Create a test user
   - `POST /login` - Login with test user
   - `GET /api/user/:email` - Fetch user data

3. **Database connection**:
   - Check Railway PostgreSQL service logs
   - Verify tables were created (users, investments, deposits, withdrawals)

---

## 🔄 Migration Checklist

- ✅ All `/api/*` endpoints migrated
- ✅ `/register` and `/login` migrated
- ✅ `/dashboard` endpoint migrated
- ✅ `/invest` endpoints migrated
- ✅ `/deposit` endpoints migrated
- ✅ `/withdraw` endpoints migrated
- ✅ Admin endpoints migrated
- ✅ Profit calculation updated
- ✅ Daily profit auto-updater configured
- ✅ File uploads still working
- ✅ All response formats preserved (frontend compatible)

---

## 📊 Database Schema

### **Tables Created**

1. **users** - User accounts with balances and settings
2. **investments** - Investment records linked to users
3. **deposits** - Deposit history with proof files
4. **withdrawals** - Withdrawal requests

### **Key Fields**

- All numeric fields use `NUMERIC(12, 2)` for precision
- Timestamps stored as BIGINT (Unix milliseconds)
- Foreign key constraints ensure data integrity
- Indexes on email and user_id for performance

---

## 🔍 Troubleshooting

### **Connection Issues**

If you see "❌ Database connection error":
1. Check `DATABASE_URL` is set correctly
2. Verify PostgreSQL service is running on Railway
3. Check network connectivity
4. Ensure SSL settings are correct (Railway requires SSL)

### **Schema Errors**

If tables fail to create:
1. Check SQL syntax in `database/schema.sql`
2. Verify you have CREATE TABLE permissions
3. Check for existing tables (schema uses `CREATE TABLE IF NOT EXISTS`)

### **Data Migration**

If you have existing `data.json` users:
1. The old JSON file is no longer used
2. Users need to re-register (or create migration script)
3. Existing investments/deposits are not migrated automatically

---

## 📝 Post-Deployment

### **What Changed**

- ✅ No more `data.json` file (removed from codebase)
- ✅ All data now in PostgreSQL
- ✅ Better scalability and performance
- ✅ ACID transactions for data integrity
- ✅ Concurrent request handling improved

### **Frontend Compatibility**

- ✅ All API response formats unchanged
- ✅ No frontend code changes needed
- ✅ All endpoints work exactly as before
- ✅ Error messages and status codes preserved

---

## 🔒 Security Notes

- ✅ Passwords still hashed with bcrypt
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation maintained
- ✅ Rate limiting still active
- ✅ File upload validation preserved

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)

---

**Migration Status**: ✅ **COMPLETE**  
**Ready for Production**: ✅ **YES** (after database setup)  
**Frontend Changes Required**: ❌ **NONE**

