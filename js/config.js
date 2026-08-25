/**
 * Amar Voice — App configuration
 * ---------------------------
 * Fill these two values in after creating credentials in Google Cloud
 * Console. Full step-by-step instructions are in README.md.
 *
 * GOOGLE_CLIENT_ID → OAuth 2.0 Client ID (Web application)
 * GOOGLE_API_KEY   → API key restricted to the Google Drive API
 *
 * Both values are meant to be public — they ship to the browser no
 * matter how they're stored. Real protection comes from restricting
 * the API key to your domain(s) in Google Cloud Console (see README).
 */
const CONFIG = {
  // 🔑 Add your Google OAuth 2.0 credentials below
  // Get these from: https://console.cloud.google.com/
  // See README.md for step-by-step setup instructions
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
  GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',

  // Name of the folder Amar Voice creates inside each user's own Google Drive.
  DRIVE_FOLDER_NAME: 'Amar Voice Recordings',

  // Hard cap on recording length, in seconds. Keeps uploads small & fast.
  MAX_RECORDING_SECONDS: 180,

  APP_NAME: 'Amar Voice'
};
