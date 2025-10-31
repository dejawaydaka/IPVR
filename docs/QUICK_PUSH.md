# Quick Push Guide

## Current Situation
- ✅ SSH URL is valid: `git@github.com:dejawaydaka/IPVR.git`
- ✅ SSH authentication works
- ❌ Permission denied (need access to `dejawaydaka` account)

## Quick Solution - HTTPS Method

**Run these commands:**

```bash
# Switch to HTTPS
git remote set-url origin https://github.com/dejawaydaka/IPVR.git

# Push (will prompt for credentials)
git push -u origin main
```

**When prompted:**
- **Username**: `dejawaydaka`
- **Password**: Use a Personal Access Token (not your password)

**To create token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "Railway Deployment"
4. Select scope: `repo` (full control)
5. Generate and copy token
6. Use token as password when pushing

---

## Alternative: Add SSH Key to dejawaydaka Account

If you have access to `dejawaydaka` GitHub account:

1. Add this SSH key to that account:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBYI/a8R3zWQBR/XaRWOEDO0da8UaEA3VrG/+XdGzQbo victorlamja8@gmail.com
   ```

2. Then push:
   ```bash
   git push -u origin main
   ```

---

**After pushing, Railway will auto-deploy from GitHub! 🚀**

