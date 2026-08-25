# 🚀 Quick Start Guide

## 📋 Before You Begin

This is a **static web app** that requires Google Cloud credentials to work. You'll need:
- A Google account
- ~10 minutes to set up Google Cloud credentials
- A code editor (VS Code, etc.)
- Git installed on your computer

---

## ⚡ 3 Minute Overview

1. **Get Google Credentials** (5-10 min)
   - Create a Google Cloud project
   - Enable Drive API
   - Create OAuth 2.0 client ID and API key
   
2. **Add Credentials to Config** (1 min)
   - Open `js/config.js`
   - Replace placeholders with your real values
   
3. **Test Locally** (2 min)
   - Run `python3 -m http.server 5500` or `npx serve . -p 5500`
   - Visit `http://localhost:5500`
   
4. **Deploy to Vercel** (1 min)
   - Connect GitHub to Vercel
   - Select your AmarVoice repo
   - Click Deploy

---

## 🔑 Step 1: Get Google Credentials (5-10 minutes)

### Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click project dropdown → **NEW PROJECT**
3. Name it `AmarVoice` → **CREATE**

### Enable Google Drive API
1. Left menu → **APIs & Services → Library**
2. Search "Google Drive API" → **ENABLE**

### Create OAuth Consent Screen
1. Left menu → **APIs & Services → OAuth consent screen**
2. Choose **External** → **CREATE**
3. Fill in:
   - App name: `AmarVoice`
   - Your email
4. **SAVE AND CONTINUE**

### Add Scopes
1. Click **ADD OR REMOVE SCOPES**
2. Add these three:
   - `drive.file`
   - `userinfo.email`
   - `userinfo.profile`
3. **UPDATE** → **SAVE AND CONTINUE** twice

### Create OAuth Client ID
1. Left menu → **APIs & Services → Credentials**
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Add these **Authorized JavaScript origins:**
   - `http://localhost:5500`
   - `https://your-domain.vercel.app` (add later after deploying)
5. Add these **Authorized redirect URIs:**
   - `http://localhost:5500/`
   - `https://your-domain.vercel.app/` (add later)
6. **CREATE** → Copy the **Client ID**

### Create API Key
1. Still in **Credentials** → **+ CREATE CREDENTIALS** → **API KEY**
2. Copy the key that appears
3. Click the key to edit it
4. Restrict to **Google Drive API**
5. Set **Application restrictions → Websites**
6. Add: `https://*.vercel.app/*` (add your specific domain later)

---

## 🔧 Step 2: Update Configuration (1 minute)

1. Open `js/config.js`
2. Replace:
   ```javascript
   GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
   GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
   ```
   with your actual values from Step 1

3. Save the file

---

## 💻 Step 3: Test Locally (2 minutes)

### Start a Local Server
```bash
# Option A: Python
python3 -m http.server 5500

# Option B: npm
npx serve . -p 5500
```

### Test the App
1. Open `http://localhost:5500`
2. Click "Sign in with Google"
3. Grant permissions
4. Record a test message
5. Upload and share

---

## 🌐 Step 4: Deploy to GitHub (1 minute)

```bash
git init
git add .
git commit -m "Initial commit: AmarVoice"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AmarVoice.git
git push -u origin main
```

---

## 🚀 Step 5: Deploy to Vercel (2 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. **Add New → Project**
4. Select `AmarVoice` repository
5. **Framework:** Other
6. **Deploy**
7. Copy your Vercel URL (e.g., `https://amar-voice.vercel.app`)

### Update Google Cloud Console

Now add your Vercel domain:

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. Edit OAuth Client ID:
   - Add `https://amar-voice.vercel.app` to **Authorized JavaScript origins**
   - Add `https://amar-voice.vercel.app/` to **Authorized redirect URIs**
3. Edit API Key:
   - Add `https://amar-voice.vercel.app/*` to website restrictions

### Add Environment Variable to Vercel (Optional)

For the social preview feature (`/api/share`):
1. Go to Vercel project settings
2. **Environment Variables**
3. Add: `GOOGLE_API_KEY` = your API key value

(Without this, social previews use a fallback, but it's better to set it)

---

## ✅ Done!

Your app should now be live at your Vercel URL. 

**Test it:**
- Visit your domain
- Sign in with Google
- Record a message
- Share the link on WhatsApp, Facebook, etc.
- Anyone can listen without signing in

---

## 📚 Need More Help?

- **Full setup guide:** See `README.md`
- **Security & credentials:** See `SECURITY.md`
- **Customization:** See `README.md` → Customization section
- **Troubleshooting:** See `README.md` → Troubleshooting

---

## 🆘 Common Issues

| Issue | Fix |
|-------|-----|
| "Sign-in doesn't work" | Check `js/config.js` has real credentials |
| `Error 400: origin_mismatch` | Add your domain to "Authorized JavaScript origins" |
| Recording uploads fail | Check API key domain restrictions in Google Cloud |
| Can't test locally | Make sure `http://localhost:5500` is in authorized origins |

---

## ✨ You're All Set!

AmarVoice is now ready to use. Happy recording! 🎙️

---

**Created by: Humayun Shariar Himu**
