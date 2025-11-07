# Wallet Images Migration Guide

## Problem
Wallet logo and QR code images were being stored in `/public/uploads/admin/` which is ignored by git (via `.gitignore`). This caused images to become broken after each deployment/push to GitHub.

## Solution
Wallet images are now stored in `/public/wallet-assets/` which is **tracked in git**. This ensures images persist across deployments.

## What Changed
1. Created new `walletUpload` multer configuration that saves to `public/wallet-assets/`
2. Updated wallet API endpoint to use `walletUpload` instead of `adminUpload`
3. Filenames now use format: `{coinname}_logo.png` and `{coinname}_qr.png` for better organization
4. Frontend now sends files directly via FormData to the wallet endpoint

## Migrating Existing Images
If you have existing wallet images in `/public/uploads/admin/`, you can manually move them:

1. Copy images from `public/uploads/admin/` to `public/wallet-assets/`
2. Rename them to match the new format: `{coinname}_logo.png` and `{coinname}_qr.png`
3. Update the database URLs from `/uploads/admin/...` to `/wallet-assets/...`
4. Commit the images to git

## New Uploads
All new wallet logo and QR code uploads will automatically:
- Save to `public/wallet-assets/`
- Use descriptive filenames based on coin name
- Be tracked in git
- Persist across deployments

