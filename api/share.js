/**
 * Amar Voice — /api/share
 * -------------------------
 * This project is otherwise a fully static site (no backend). This one
 * serverless function exists for a single reason: link-preview crawlers
 * (Facebook, Twitter/X, WhatsApp, Telegram, LinkedIn...) don't run
 * JavaScript, so a client-rendered play.html can never show a recording's
 * real title in a shared-link preview card.
 *
 * This route fetches the recording's title server-side and returns a tiny
 * HTML shell with real <meta property="og:*"> tags — that's what crawlers
 * read. A real human visitor is redirected to the actual player instantly
 * (0-second meta refresh + JS redirect), so they never see this shell.
 *
 * Zero configuration needed: any file under /api becomes a Vercel
 * serverless function automatically. If this route is ever unavailable
 * for any reason, /play.html?id=... always works directly as a fallback.
 */

const APP_NAME = 'Amar Voice';
// 🔑 Set your Google API Key via environment variable: GOOGLE_API_KEY
// For Vercel: go to Project Settings → Environment Variables → add GOOGLE_API_KEY
// This ensures the /api/share route can fetch recording metadata for social preview cards
const FALLBACK_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const host = req.headers.host || 'localhost';
  const origin = `https://${host}`;
  const playUrl = `${origin}/play.html?id=${encodeURIComponent(id)}`;
  const coverUrl = `${origin}/assets/cover.png`;

  if (!id) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  let title = 'একটি ভয়েস কমেন্ট আপনার জন্য অপেক্ষা করছে';
  let description = `শুনতে ট্যাপ করুন — ${APP_NAME} দিয়ে তৈরি একটি ভয়েস কমেন্ট।`;

  try {
    const apiKey = process.env.GOOGLE_API_KEY || FALLBACK_API_KEY;
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=properties&key=${apiKey}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (metaRes.ok) {
      const data = await metaRes.json();
      const recTitle = data && data.properties && data.properties.amarvoiceTitle;
      if (recTitle && String(recTitle).trim()) {
        title = String(recTitle).trim();
        description = `"${title}" — একটি ভয়েস কমেন্ট শুনুন। ${APP_NAME} দিয়ে তৈরি।`;
      }
    }
  } catch (err) {
    // Metadata lookup failed or timed out — fall back to generic copy
    // rather than fail the whole redirect.
    console.error('[api/share] metadata lookup failed:', err && err.message);
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safePlayUrl = escapeHtml(playUrl);

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle} · ${APP_NAME}</title>
<meta property="og:site_name" content="${APP_NAME}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:image" content="${escapeHtml(coverUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${safePlayUrl}">
<meta property="og:type" content="music.song">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
<meta name="twitter:image" content="${escapeHtml(coverUrl)}">
<meta http-equiv="refresh" content="0;url=${safePlayUrl}">
<link rel="canonical" href="${safePlayUrl}">
<script>location.replace(${JSON.stringify(playUrl)});</script>
<style>body{background:#05050b;color:#9a9ab0;font-family:sans-serif;text-align:center;padding-top:40vh}a{color:#00fff2}</style>
</head>
<body>
<p>রিডাইরেক্ট হচ্ছে… স্বয়ংক্রিয়ভাবে না হলে <a href="${safePlayUrl}">এখানে ট্যাপ করুন</a>।</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
  res.status(200).send(html);
}
