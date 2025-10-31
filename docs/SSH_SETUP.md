# SSH Setup Instructions

## ✅ SSH Authentication Status

**Current Status:**
- ✅ SSH keys found (`~/.ssh/id_ed25519`)
- ✅ SSH connection to GitHub works
- ❌ Permission denied to `dejawaydaka/IPVR` repository

## 🔧 Solution

The SSH key is authenticated as `sokoyebomlamja`, but the repository `dejawaydaka/IPVR` belongs to a different account.

### **Option 1: Add SSH Key to dejawaydaka Account (Recommended)**

1. **Copy your SSH public key** (shown below)
2. **Login to GitHub as `dejawaydaka`**
3. Go to: GitHub → Settings → SSH and GPG keys
4. Click "New SSH key"
5. Paste the public key and save
6. Try pushing again: `git push -u origin main`

### **Option 2: Use HTTPS with Personal Access Token**

If you can't access the `dejawaydaka` account, use HTTPS:

```bash
git remote set-url origin https://github.com/dejawaydaka/IPVR.git
git push -u origin main
# Username: dejawaydaka
# Password: [use Personal Access Token, not password]
```

To create a token:
1. Login as `dejawaydaka`
2. Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate token with `repo` scope
4. Use token as password when pushing

---

## 📋 Your SSH Public Key

Copy this key and add it to the `dejawaydaka` GitHub account:

```
[See output above]
```

---

**After adding the key to GitHub, run:**
```bash
git push -u origin main
```

