# 🎙️ AmarVoice

**Record → Share → One-Click Distribution.** A complete static web app (HTML/CSS/JS + Vercel serverless function) for recording voice comments and generating shareable links.

Users record voice messages, get a shareable link, and anyone can listen without signing in. All recordings are stored in the **user's own Google Drive** — AmarVoice stores nothing.

Dark neon theme with premium animations and full social media sharing support. Ready to deploy on GitHub + Vercel.

**Created by: Humayun Shariar Himu**

---

## ✨ Features

- **Google Sign-In** (unified signup & login)
- **In-browser voice recording** with live radial neon visualizer
- **Interactive waveform player** — scrub audio by tapping the waveform (like WhatsApp voice messages)
- **Real upload progress bar** with percentage
- **Auto-save to user's Google Drive** in an "AmarVoice Recordings" folder with "Anyone with the link" sharing
- **Share to 10+ platforms** in one sheet:
  - WhatsApp, Facebook, Messenger, Telegram, X (Twitter), Threads, LinkedIn, Email, SMS, QR Code, Native Share
- **Recording-specific social preview cards** — links show the actual recording title when shared on social media
- **Public player page** (`play.html`) — anyone can listen and re-share without signing in
- **Dashboard** to view, share, and delete your recordings
- **Download your recording** to your device
- **Keyboard shortcuts** — press Space to start/stop recording
- **Installable PWA** — "Add to Home Screen" on mobile
- **Responsive design** with premium animations
- **SEO optimized** with JSON-LD structured data
- **Google Analytics integration** (optional)

---

## 📂 Project Structure

```
AmarVoice/
├── index.html                # Main app: sign-in, recorder, dashboard
├── play.html                 # Public player page (no sign-in required)
├── manifest.webmanifest      # PWA manifest for home screen installation
├── package.json              # Node version guidance for Vercel
├── vercel.json               # Vercel routing, headers, and configuration
├── api/
│   └── share.js              # Serverless function for social preview metadata
├── assets/
│   ├── favicon.svg           # Browser tab icon (vector)
│   ├── favicon-16x16.png, favicon-32x32.png
│   ├── apple-touch-icon.png  # iOS home screen icon
│   ├── icon-192.png, icon-512.png # Android/PWA icons
│   └── cover.png             # Social media preview image (1200×630)
├── css/
│   └── style.css             # Dark neon design system
├── js/
│   ├── config.js             # Google OAuth credentials configuration
│   ├── auth.js               # Google sign-in logic
│   ├── drive.js              # Google Drive upload/list/delete logic
│   ├── recorder.js           # Microphone recording + visualizer
│   ├── audio-ui.js           # Waveform scrubber (preview & player)
│   ├── share.js              # Social share sheet (all platforms + QR)
│   ├── app.js                # Controller for index.html
│   └── player.js             # Controller for play.html
└── README.md
```

---

## 🔧 Setup Instructions

### Step 1: Google Cloud Configuration (Required)

This step is mandatory. Follow these instructions carefully to set up your Google credentials.

#### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select **NEW PROJECT**
3. Enter a project name (e.g., `AmarVoice`) → **CREATE**

#### 1.2 Enable Google Drive API

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for **"Google Drive API"**
3. Click it and press **ENABLE**

#### 1.3 Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services → OAuth consent screen**
2. Select **External** as the user type → **CREATE**
3. Fill in:
   - **App name:** AmarVoice
   - **User support email:** Your email
   - **Developer contact info:** Your email
4. Click **SAVE AND CONTINUE**

#### 1.4 Add OAuth Scopes

1. On the **Scopes** step, click **ADD OR REMOVE SCOPES**
2. Add these three scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click **UPDATE** → **SAVE AND CONTINUE** → **SAVE AND CONTINUE** again (skip the "Test users" step for now)

#### 1.5 Create OAuth Credentials

1. In the left sidebar, go to **APIs & Services → Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Web application**
4. Give it a name (e.g., `AmarVoice Web`)
5. Add these **Authorized JavaScript origins:**
   - `http://localhost:5500` (for local testing)
   - Your future Vercel domain (e.g., `https://amar-voice.vercel.app`)
6. Add these **Authorized redirect URIs:**
   - `http://localhost:5500/` (with trailing slash)
   - Your future Vercel domain with trailing slash (e.g., `https://amar-voice.vercel.app/`)
7. Click **CREATE** → Copy the **Client ID** (looks like `xxxxx-xxxxx.apps.googleusercontent.com`)

#### 1.6 Create an API Key

1. Still in **Credentials**, click **+ CREATE CREDENTIALS** → **API KEY**
2. Copy the API key that appears
3. Click the key to edit it:
   - Restrict it to **Google Drive API** only
   - Set **Application restrictions → Websites**
   - Add your Vercel domain (e.g., `https://amar-voice.vercel.app/*`)

#### 1.7 Update Your Config File

1. Open `js/config.js`
2. Replace:
   ```javascript
   GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
   GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
   ```
   with your actual values from steps 1.5 and 1.6

---

### Step 2: Test Locally

Google Sign-In requires a local server (not `file://` URLs):

```bash
# Option 1: Using npx serve
npx serve . -p 5500

# Option 2: Using Python
python3 -m http.server 5500
```

Then visit `http://localhost:5500` in your browser.

**Important:** Make sure `http://localhost:5500` is in your Google Cloud Console's **Authorized JavaScript origins** (Step 1.5).

---

### Step 3: Deploy to GitHub

```bash
cd AmarVoice
git init
git add .
git commit -m "Initial commit: AmarVoice voice recording app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AmarVoice.git
git push -u origin main
```

---

### Step 4: Deploy to Vercel

1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Select your `AmarVoice` repository
4. **Framework Preset:** Select **Other** (it's a static site)
5. Click **Deploy**
6. Once deployed, copy your Vercel domain (e.g., `https://amar-voice.vercel.app`)

#### Update Google Cloud Console:

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Under **APIs & Services → Credentials**, edit your OAuth Client ID:
   - Add your Vercel domain to **Authorized JavaScript origins**
   - Add your Vercel domain (with trailing slash) to **Authorized redirect URIs**
3. Edit your API Key:
   - Add your Vercel domain to the **Websites** restriction

---

### Step 5: Make It Public (Optional)

By default, the OAuth consent screen is in **Testing mode** — only you can sign in. To allow public signups:

1. Go to **APIs & Services → OAuth consent screen**
2. Click **PUBLISH APP**
3. Google may verify your app (usually takes a few days)

Without publishing, users will see an "Unverified app" warning but can still access it by clicking "Advanced → Go to AmarVoice (unsafe)".

---

## 🎨 Customization

- **Change colors:** Edit `css/style.css` — look for `:root { }` at the top with `--cyan`, `--pink`, `--purple`
- **Change app name:** Update `APP_NAME` in `js/config.js` and the `<title>` tags in `index.html` and `play.html`
- **Change max recording length:** Edit `MAX_RECORDING_SECONDS` in `js/config.js` (currently 180 seconds)
- **Change Google Drive folder name:** Edit `DRIVE_FOLDER_NAME` in `js/config.js`
- **Add/remove share platforms:** Edit the `PLATFORMS` array in `js/share.js`
- **Change favicon/logo:** Replace images in the `assets/` folder with the same filenames (maintain sizes: cover.png = 1200×630)
- **Update Google Analytics:** Replace `G-YOUR_GA_ID_HERE` with your actual GA4 ID in `index.html` and `play.html`

---

## ⚙️ How It Works

1. User clicks "Sign in with Google" → browser gets an access token (no backend involved)
2. User records audio in the browser → previews it in an interactive waveform player
3. User uploads the audio blob directly to Google Drive API using their own access token
4. File automatically gets "Anyone with the link → Viewer" permissions
5. Share link is generated: `/s/DRIVE_FILE_ID`
6. When social media crawlers visit `/s/xxxx`, the `api/share.js` serverless function fetches the recording title from Drive and returns Open Graph meta tags
7. When a real person visits the same link, they're instantly redirected to `/play.html?id=FILE_ID`
8. `play.html` loads the audio using the public Drive link and plays it without requiring sign-in

---

## 📝 Important Notes

- **Privacy:** Share links are "unlisted" (like unlisted YouTube videos) — guessing a Drive file ID is practically impossible, so this is safe but not password-protected
- **Storage:** Each recording counts against the user's own 15GB Google Drive quota — not yours
- **Messenger sharing:** Works best on mobile when the Messenger app is installed
- **QR codes:** Load a small external library on first use (requires internet)
- **Safari:** Uses mp4 format instead of webm (handled automatically)
- **Testing social previews:** Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **SEO:** Check structured data with [Google Rich Results Test](https://search.google.com/test/rich-results)
- **HTTPS required:** Microphone recording only works on HTTPS or localhost

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Sign-in button doesn't work | Check `js/config.js` has real credentials. Verify your origin is in "Authorized JavaScript origins" in Google Cloud Console |
| `Error 400: origin_mismatch` | Add your current domain to "Authorized JavaScript origins" in Google Cloud Console |
| `Error 400: redirect_uri_mismatch` | Add your domain (with trailing slash) to "Authorized redirect URIs" |
| Sign-in fails on mobile | Make sure "Authorized redirect URIs" includes your domain. The app auto-falls back to redirect mode if popup fails |
| Upload fails | Check browser console (F12). Usually caused by API key restrictions or token expiry |
| `play.html` shows "Not found" | Check your API Key has the correct HTTP referrer restrictions for your domain |
| `/s/xxxx` link shows 404 | Verify `api/` folder uploaded correctly to Vercel. Fallback: use `/play.html?id=xxxx` directly |
| Social preview shows generic card | Social platforms cache previews. Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) → "Scrape Again" |
| Microphone not working | Requires HTTPS or localhost. Check browser permissions |
| QR code won't load | Check internet connection and that cdnjs.cloudflare.com isn't blocked |

---

## 📄 License

**Humayun Shariar Himu**

See the `LICENSE` file for full license details.

---

## 🚀 What's Included in This Release

- ✅ Full static HTML/CSS/JS application
- ✅ Vercel serverless function for social preview metadata
- ✅ Complete setup documentation
- ✅ Dark neon UI with premium animations
- ✅ Google Drive integration
- ✅ 10+ social platform sharing
- ✅ Interactive waveform player
- ✅ PWA manifest for app installation
- ✅ Mobile-responsive design
- ✅ All credentials replaced with placeholders for security

---

## 🎙️ Getting Help

1. **Google Cloud issues?** Check Step 1 of the setup instructions again
2. **Deployment issues?** Ensure your GitHub repo is connected to Vercel
3. **Sign-in not working?** Double-check your Client ID and API Key in `js/config.js`
4. **Still stuck?** Check browser console (F12) for error messages

---

Made with 🎙️ by Humayun Shariar Himu
