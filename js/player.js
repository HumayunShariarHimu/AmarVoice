/**
 * Amar Voice — Player page controller (play.html)
 * ----------------------------------------------------
 * Public, no-login page. Reads a Drive file ID from the URL, fetches its
 * metadata + audio using the restricted API key (works because the
 * recorder set the file to "anyone with the link"), and plays it with
 * the same waveform scrubber used in the recorder. Listeners can also
 * reshare the recording from here.
 */
(function () {
  'use strict';

  const params  = new URLSearchParams(window.location.search);
  const fileId  = params.get('id');

  // DOM refs captured now — script is at end of <body>, DOM is parsed.
  const loadingState = document.getElementById('loadingState');
  const errorState   = document.getElementById('errorState');
  const errorMsg     = document.getElementById('errorMsg');
  const playerState  = document.getElementById('playerState');

  let currentTitle = '';
  let currentLink  = '';

  // ── FIX 1 ──────────────────────────────────────────────────────────────
  // Scripts at the bottom of <body> run while the document is still being
  // parsed, so DOMContentLoaded may have ALREADY fired by the time this
  // listener is registered → boot() would never be called → infinite loading.
  // Use readyState guard: call boot() immediately if DOM is already ready.
  // ────────────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  async function boot() {
    const shareBtnEl = document.getElementById('shareBtn');
    if (shareBtnEl) {
      shareBtnEl.addEventListener('click', () => {
        Share.open({
          url: currentLink,
          title: currentTitle
            ? `"${currentTitle}" — একটি ভয়েস কমেন্ট শুনুন 🎙️`
            : 'একটি ভয়েস কমেন্ট শুনুন 🎙️'
        });
      });
    }

    if (!CONFIG.GOOGLE_API_KEY || CONFIG.GOOGLE_API_KEY.indexOf('YOUR_') === 0) {
      showError('অ্যাপটি এখনো কনফিগার করা হয়নি। js/config.js ফাইলে API Key বসান।');
      return;
    }
    if (!fileId) {
      showError('অবৈধ লিংক — কোনো রেকর্ডিং আইডি পাওয়া যায়নি।');
      return;
    }

    currentLink = window.location.origin + '/s/' + fileId;

    try {
      const meta = await fetchMeta(fileId);

      // ── FIX 4 ──────────────────────────────────────────────────────────
      // Google Drive sometimes returns HTTP 200 with an error body, e.g.:
      //   { "error": { "code": 404, "message": "File not found." } }
      // The normal !res.ok check misses this — catch it here explicitly.
      // ────────────────────────────────────────────────────────────────────
      if (meta.error) {
        throw new Error('Drive API error ' + (meta.error.code || '') + ': ' + (meta.error.message || ''));
      }

      // ── FIX 2 ──────────────────────────────────────────────────────────
      // When a file is soft-deleted (moved to trash) Google returns 200 OK
      // with { trashed: true } — we must check this field explicitly.
      // ────────────────────────────────────────────────────────────────────
      if (meta.trashed) {
        showError('এই রেকর্ডিংটি মুছে ফেলা হয়েছে। লিংক শেয়ারকারী ফাইলটি ডিলিট করেছেন।');
        return;
      }

      renderPlayer(meta);
    } catch (err) {
      console.error('[AmarVoice player]', err);
      showError('এই রেকর্ডিংটি খুঁজে পাওয়া যায়নি। হয়তো এটি মুছে ফেলা হয়েছে বা লিংকটি সঠিক নয়।');
    }
  }

  async function fetchMeta(id) {
    // ── FIX 3 ──────────────────────────────────────────────────────────
    // No timeout in the original code → if Drive doesn't respond the page
    // hangs in loading state forever. AbortController gives a 12-second
    // ceiling; on abort the fetch rejects and the catch block fires.
    // ────────────────────────────────────────────────────────────────────
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    let res;
    try {
      res = await fetch(
        // FIX 2 (cont.) — include `trashed` in the requested fields
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}` +
        `?fields=name,createdTime,properties,mimeType,trashed&key=${encodeURIComponent(CONFIG.GOOGLE_API_KEY)}`,
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) throw new Error('meta fetch failed: ' + res.status);
    return res.json();
  }

  function renderPlayer(meta) {
    const title = (meta.properties && meta.properties.amarvoiceTitle) || 'ভয়েস কমেন্ট';
    currentTitle = (meta.properties && meta.properties.amarvoiceTitle) || '';
    let date = '';
    try {
      date = new Intl.DateTimeFormat('bn-BD', { dateStyle: 'long', timeStyle: 'short' })
        .format(new Date(meta.createdTime));
    } catch (e) {}

    document.getElementById('recTitle').textContent = title;
    document.getElementById('recDate').textContent  = date;
    document.title = title + ' · ' + CONFIG.APP_NAME;

    const audio = document.getElementById('audioEl');
    audio.src =
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
      `?alt=media&key=${encodeURIComponent(CONFIG.GOOGLE_API_KEY)}`;

    loadingState.classList.add('hidden');
    playerState.classList.remove('hidden');
    playerState.classList.add('anim-in');

    createAudioPlayerUI({
      audioEl:   audio,
      playBtn:   document.getElementById('playBtn'),
      waveEl:    document.getElementById('playerWave'),
      curTimeEl: document.getElementById('curTime'),
      durTimeEl: document.getElementById('durTime'),
      seed:      seedFromString(fileId)
    });
  }

  // ── FIX 5 ────────────────────────────────────────────────────────────────
  // Original showError() crashes with TypeError if any element is null
  // (edge case where IDs mismatch between HTML versions). A crash here is
  // uncaught — the catch block above has already exited — so the loading
  // card stays visible forever. Null-guard every element access.
  // ─────────────────────────────────────────────────────────────────────────
  function showError(msg) {
    if (loadingState) loadingState.classList.add('hidden');
    if (errorMsg)     errorMsg.textContent = msg;
    if (errorState)   errorState.classList.remove('hidden');
  }

})();
