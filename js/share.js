/**
 * Amar Voice — Share module
 * ---------------------------
 * A single reusable bottom-sheet: one tap to send a recording's link to
 * any major platform, copy it, or reveal a scannable QR code. Used after
 * a fresh upload, from every dashboard card, and on the public player so
 * listeners can pass a recording along too.
 *
 * Usage: Share.open({ url, title, onCopied })
 */
const Share = (() => {
  const ICONS = {
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.36-1.36"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.6-1.2-1.4-1.4-1.7-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2.9 2.4.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13.5 21v-7.6h2.6l.4-3H13.5V8.4c0-.9.2-1.5 1.5-1.5h1.6V4.2C16.3 4.1 15.2 4 14 4c-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2v3h2.6V21h3.7z"/></svg>',
    messenger: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.5 2 2 6.1 2 11.4c0 2.9 1.4 5.5 3.6 7.3V22l3.3-1.8c.9.2 1.9.4 2.9.4 5.5 0 10-4.1 10-9.4S17.5 2 12 2zm1 12.6-2.6-2.7-5 2.7 5.5-5.8L13.4 12l4.9-2.7L11.9 14.6z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21.9 4.3 18.7 20c-.2 1-.9 1.2-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.6 13 1.9 11.5c-1-.3-1-1 .2-1.5L20.6 3c.8-.3 1.6.2 1.3 1.3z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M18.9 3H22l-7 8 8 10h-6.3l-4.9-6.4L5.9 21H3l7.5-8.6L3 3h6.4l4.5 5.9L18.9 3zm-1.1 16.2h1.7L7.3 4.7H5.5l12.3 14.5z"/></svg>',
    threads: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3c4 0 7 2.5 7 7.5S17 21 12 21c-3.5 0-6.2-1.7-6.2-4.4 0-2.5 2.1-3.8 5-3.8 1.6 0 2.9.3 3.9.8"/><path d="M14 8.6c-.4-.4-1.2-.8-2.2-.8-1.7 0-2.8 1-2.8 2.3 0 1.6 1.5 2 2.7 2 2.4 0 3.6-1.4 3.6-3.6 0-2.7-1.8-4.3-4.6-4.3"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.9 8.4H3.6V20h3.3V8.4zM5.3 3.7a1.9 1.9 0 1 0 0 3.9 1.9 1.9 0 0 0 0-3.9zM20.4 20h-3.3v-6.1c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V20H9.5V8.4h3.2v1.6h.1c.4-.8 1.6-1.7 3.2-1.7 3.4 0 4.4 2.2 4.4 5.2V20z"/></svg>',
    email: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    sms: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    qr: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/><rect x="18" y="14" width="3" height="3" rx="0.5"/><rect x="14" y="18" width="3" height="3" rx="0.5"/><rect x="18" y="18" width="3" height="3" rx="0.5"/></svg>',
    more: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6 15.4 6.4M8.6 13.4l6.8 4.2"/></svg>'
  };

  const PLATFORMS = [
    { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', dark: false,
      href: (u, t) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}` },
    { id: 'facebook', label: 'Facebook', color: '#1877F2', dark: false,
      href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
    { id: 'messenger', label: 'Messenger', color: '#00B2FF', dark: false,
      href: (u) => `fb-messenger://share/?link=${encodeURIComponent(u)}` },
    { id: 'telegram', label: 'Telegram', color: '#26A5E4', dark: false,
      href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
    { id: 'twitter', label: 'X', color: '#0b0b0f', dark: true,
      href: (u, t) => `https://x.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
    { id: 'threads', label: 'Threads', color: '#0b0b0f', dark: true,
      href: (u, t) => `https://www.threads.net/intent/post?text=${encodeURIComponent(t + ' ' + u)}` },
    { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', dark: false,
      href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
    { id: 'email', label: 'ইমেইল', color: '#4b4b63', dark: false,
      href: (u, t) => `mailto:?subject=${encodeURIComponent('একটি ভয়েস কমেন্ট শুনুন')}&body=${encodeURIComponent(t + '\n\n' + u)}` },
    { id: 'sms', label: 'SMS', color: '#4b4b63', dark: false,
      href: (u, t) => `sms:?body=${encodeURIComponent(t + ' ' + u)}` }
  ];

  let overlayEl = null;
  let currentUrl = '';
  let currentTitle = '';
  let onCopiedCb = null;
  let qrLibPromise = null;

  function ensureQrLib() {
    if (window.QRCode) return Promise.resolve();
    if (qrLibPromise) return qrLibPromise;
    qrLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('QR library failed to load'));
      document.head.appendChild(s);
    });
    return qrLibPromise;
  }

  function tileHTML(p) {
    const style = p.dark
      ? `background:${p.color};color:#fff;border:1px solid rgba(255,255,255,0.15)`
      : `background:${p.color};color:#fff`;
    return `<button type="button" class="share-tile" data-platform="${p.id}">
      <span class="share-tile-icon" style="${style}">${ICONS[p.id]}</span>
      <span class="share-tile-label">${p.label}</span>
    </button>`;
  }

  function extraTileHTML(id, icon, label) {
    return `<button type="button" class="share-tile" data-action="${id}">
      <span class="share-tile-icon share-tile-icon-ghost">${icon}</span>
      <span class="share-tile-label">${label}</span>
    </button>`;
  }

  function gridHTML() {
    let html = PLATFORMS.map(tileHTML).join('');
    html += extraTileHTML('qr', ICONS.qr, 'QR কোড');
    if (navigator.share) html += extraTileHTML('native', ICONS.more, 'আরও');
    return html;
  }

  function build() {
    const overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    overlay.innerHTML = `
      <div class="share-sheet glass">
        <div class="share-handle"></div>
        <div class="share-header">
          <button type="button" class="icon-btn share-back hidden" aria-label="ফিরুন">${ICONS.back}</button>
          <h3 class="share-title-text">শেয়ার করুন</h3>
          <button type="button" class="icon-btn share-close" aria-label="বন্ধ করুন">${ICONS.close}</button>
        </div>

        <div class="share-view share-view-grid">
          <div class="share-grid">${gridHTML()}</div>
          <div class="share-link-row">
            <span class="share-link-icon">${ICONS.link}</span>
            <input type="text" class="share-link-input" readonly>
            <button type="button" class="btn btn-primary share-copy-btn">কপি</button>
          </div>
        </div>

        <div class="share-view share-view-qr hidden">
          <div class="qr-box"><div class="qr-canvas"></div></div>
          <p class="qr-hint">লিংকটি স্ক্যান করে সরাসরি শোনা যাবে</p>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    wire(overlay);
    return overlay;
  }

  function wire(overlay) {
    const sheet = overlay.querySelector('.share-sheet');
    const gridView = overlay.querySelector('.share-view-grid');
    const qrView = overlay.querySelector('.share-view-qr');
    const backBtn = overlay.querySelector('.share-back');
    const titleText = overlay.querySelector('.share-title-text');
    const linkInput = overlay.querySelector('.share-link-input');
    const copyBtn = overlay.querySelector('.share-copy-btn');

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('.share-close').addEventListener('click', close);

    overlay.querySelector('.share-grid').addEventListener('click', async (e) => {
      const tile = e.target.closest('.share-tile');
      if (!tile) return;
      const platformId = tile.dataset.platform;
      const action = tile.dataset.action;

      if (platformId) {
        const p = PLATFORMS.find((x) => x.id === platformId);
        const href = p.href(currentUrl, currentTitle);
        if (/^https?:/.test(href)) {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = href;
        }
      } else if (action === 'qr') {
        titleText.textContent = 'QR কোড';
        backBtn.classList.remove('hidden');
        gridView.classList.add('hidden');
        qrView.classList.remove('hidden');
        try {
          await ensureQrLib();
          const box = overlay.querySelector('.qr-canvas');
          box.innerHTML = '';
          // eslint-disable-next-line no-undef
          new QRCode(box, {
            text: currentUrl,
            width: 200,
            height: 200,
            colorDark: '#0d0d17',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        } catch (err) {
          overlay.querySelector('.qr-canvas').innerHTML =
            '<p style="color:var(--text-mute);font-size:0.85rem;padding:20px">QR কোড লোড করা যায়নি</p>';
        }
      } else if (action === 'native') {
        try {
          await navigator.share({ title: currentTitle, url: currentUrl });
          close();
        } catch (err) { /* user cancelled */ }
      }
    });

    backBtn.addEventListener('click', () => {
      titleText.textContent = 'শেয়ার করুন';
      backBtn.classList.add('hidden');
      qrView.classList.add('hidden');
      gridView.classList.remove('hidden');
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(linkInput.value);
        copyBtn.textContent = 'কপি হয়েছে!';
        if (onCopiedCb) onCopiedCb();
        setTimeout(() => { copyBtn.textContent = 'কপি'; }, 1800);
      } catch (err) {
        linkInput.select();
      }
    });

    function close() {
      sheet.classList.remove('show');
      overlay.classList.remove('show');
      setTimeout(() => {
        titleText.textContent = 'শেয়ার করুন';
        backBtn.classList.add('hidden');
        qrView.classList.add('hidden');
        gridView.classList.remove('hidden');
      }, 250);
    }
    overlay._close = close;
  }

  function open({ url, title, onCopied }) {
    currentUrl = url;
    currentTitle = title || 'আমার ভয়েস কমেন্ট শুনুন 🎙️';
    onCopiedCb = onCopied || null;

    if (!overlayEl) overlayEl = build();
    overlayEl.querySelector('.share-link-input').value = url;

    overlayEl.classList.add('show');
    requestAnimationFrame(() => {
      overlayEl.querySelector('.share-sheet').classList.add('show');
    });

    document.addEventListener('keydown', escHandler);
  }

  function escHandler(e) {
    if (e.key === 'Escape' && overlayEl && overlayEl.classList.contains('show')) {
      overlayEl._close();
      document.removeEventListener('keydown', escHandler);
    }
  }

  return { open };
})();
