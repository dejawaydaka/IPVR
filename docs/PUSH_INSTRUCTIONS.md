# Push Instructions - HTTPS Method

## ✅ SSH Key Already Added

Since your SSH key is already in use on GitHub, let's use HTTPS method instead.

## 🚀 Quick Push Steps

**1. Check current remote:**
```bash
git remote -v
```

**2. Push using HTTPS:**
```bash
git push -u origin main
```

**3. When prompted:**
- **Username**: `dejawaydaka`
- **Password**: Use a **Personal Access Token** (not your GitHub password)

## 🔑 Creating Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Railway Deployment` or `IPVR Push`
4. Select scope: ✅ **repo** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## 📝 Alternative: Use GitHub CLI

If you have GitHub CLI installed:
```bash
gh auth login
git push -u origin main
```

This will handle authentication automatically.

---

## ✅ After Successful Push

Once pushed, Railway will automatically:
1. Detect the new commit
2. Deploy your application
3. Link the PostgreSQL database (when you add it)

**Next Steps:**
1. Go to Railway dashboard
2. Create new project
3. Connect to GitHub repository `dejawaydaka/IPVR`
4. Add PostgreSQL database service
5. Run `database/schema.sql` in PostgreSQL Query tab
6. Deploy!

---

**Note:** If you see authentication prompts, use the Personal Access Token as the password, not your GitHub account password.

