# Security & Configuration Guide

## ⚠️ Important: Configure Your Credentials

This repository has been prepared for public release with **all sensitive credentials replaced with placeholders**. Before deploying, you MUST add your own Google Cloud credentials.

---

## What Was Removed/Replaced

### 1. **Google OAuth 2.0 Credentials** (`js/config.js`)
- ✅ **GOOGLE_CLIENT_ID**: Replaced with placeholder `YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com`
- ✅ **GOOGLE_API_KEY**: Replaced with placeholder `YOUR_GOOGLE_API_KEY_HERE`

### 2. **Google Analytics ID** (index.html, play.html)
- ✅ **GA4_ID**: Replaced with `G-YOUR_GA_ID_HERE`

---

## Before You Deploy

### 1. Add Your Google Cloud Credentials

Follow the setup instructions in `README.md` → **Step 1: Google Cloud Configuration** to:
1. Create a Google Cloud project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Create an API key
5. Update `js/config.js` with your real values

### 2. (Optional) Add Your Google Analytics ID

If you want to track user analytics:
1. Create a Google Analytics 4 property
2. Find your **Measurement ID** (looks like `G-XXXXXXXXXX`)
3. Replace `G-YOUR_GA_ID_HERE` in:
   - `index.html`
   - `play.html`

### 3. Protect Your Credentials

Once you have real credentials:
- **DO NOT** commit them to your public repository
- **ALWAYS** use Vercel's environment variables or Google Cloud's domain restrictions instead
- Use `.gitignore` to prevent accidental commits (already included)

---

## Best Practices

✅ **DO:**
- Use Vercel's API restrictions for your domain
- Restrict your API key to specific domains in Google Cloud Console
- Keep your Client ID public (it's browser-side code)
- Rotate your API key periodically
- Use separate credentials for development/production

❌ **DON'T:**
- Commit real API keys to GitHub
- Use the same credentials across multiple projects
- Share your API key with others
- Test with production credentials

---

## API Key Restrictions in Google Cloud

1. Go to **APIs & Services → Credentials**
2. Click on your API Key
3. Set **Application restrictions → Websites**
4. Add your domain: `https://yourdomain.com/*`

This prevents anyone from using your key on other domains.

---

## OAuth Credentials Restrictions

1. Go to **APIs & Services → Credentials**
2. Click on your OAuth Client ID
3. Update **Authorized JavaScript origins** with your deployment domain
4. Update **Authorized redirect URIs** with your deployment domain (with trailing slash)

---

## File Inventory

| File | Status | Action Needed |
|------|--------|---------------|
| `js/config.js` | ⚠️ Placeholder values | Add your credentials |
| `index.html` | ⚠️ Placeholder GA ID | Add your GA4 ID (optional) |
| `play.html` | ⚠️ Placeholder GA ID | Add your GA4 ID (optional) |
| `.gitignore` | ✅ Added | Prevents accidental commits |
| All other files | ✅ Safe | No changes needed |

---

## Verification Checklist

Before going live, verify:

- [ ] `js/config.js` has real Google credentials (not placeholders)
- [ ] Your domain is in Google Cloud Console's authorized origins
- [ ] Your domain is in Google Cloud Console's authorized redirect URIs
- [ ] API key is restricted to your domain
- [ ] `.gitignore` exists and includes `.env*` files
- [ ] You tested locally with `http://localhost:5500`
- [ ] You tested on your Vercel deployment domain
- [ ] Google Analytics ID is updated (if using analytics)

---

## Questions?

Refer to the main `README.md` for complete setup instructions and troubleshooting.

---

**Created by Humayun Shariar Himu**
