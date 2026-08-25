/**
 * Amar Voice — App controller (index.html)
 * --------------------------------------------
 * Wires together Auth, Drive, Recorder, the waveform player UI and the
 * Share sheet, and drives every visible state on the page: signed-out
 * hero, recorder, preview, upload progress, result + share, and the
 * "your recordings" dashboard.
 */
(function () {
  'use strict';

  const ICONS = {
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6 15.4 6.4M8.6 13.4l6.8 4.2"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>'
  };

  const el = (id) => document.getElementById(id);

  // ---------- DOM refs ----------
  const configBanner = el('configBanner');
  const userChip = el('userChip');
  const userAvatar = el('userAvatar');
  const userName = el('userName');
  const signOutBtn = el('signOutBtn');

  const heroSection = el('heroSection');
  const signInBtn = el('signInBtn');
  const signInBtnLabel = el('signInBtnLabel');

  const recorderSection = el('recorderSection');
  const visualizerCanvas = el('visualizer');
  const timerEl = el('timer');
  const recordBtn = el('recordBtn');
  const recordHint = el('recordHint');

  const previewArea = el('previewArea');
  const previewAudio = el('previewAudio');
  const downloadBtn = el('downloadBtn');
  const titleInput = el('titleInput');
  const reRecordBtn = el('reRecordBtn');
  const uploadBtn = el('uploadBtn');
  const uploadBtnLabel = el('uploadBtnLabel');
  const uploadProgress = el('uploadProgress');
  const uploadProgressFill = el('uploadProgressFill');
  const uploadProgressPct = el('uploadProgressPct');

  const resultArea = el('resultArea');
  const confettiHost = el('confettiHost');
  const linkOutput = el('linkOutput');
  const copyLinkBtn = el('copyLinkBtn');
  const shareResultBtn = el('shareResultBtn');
  const newRecordingBtn = el('newRecordingBtn');

  const dashboardSection = el('dashboardSection');
  const recordingsList = el('recordingsList');
  const emptyState = el('emptyState');
  const dashboardSkeleton = el('dashboardSkeleton');

  const toastContainer = el('toastContainer');

  // ---------- state ----------
  let isRecording = false;
  let lastBlob = null;
  let lastMimeType = '';
  let lastDuration = 0;
  let lastLocalUrl = null;
  let previewUI = null;
  let folderId = null;
  let recordingsCache = [];
  let lastUploadedLink = '';
  let lastUploadedTitle = '';
  const signInBtnOriginalHTML = signInBtn ? signInBtn.innerHTML : '';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    checkConfig();

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      recordHint.textContent = 'দুঃখিত, আপনার ব্রাউজার ভয়েস রেকর্ডিং সমর্থন করে না। সাম্প্রতিক Chrome, Firefox বা Safari ব্যবহার করুন।';
      recordBtn.disabled = true;
    } else if (!window.isSecureContext) {
      recordHint.textContent = 'মাইক্রোফোন ব্যবহার করতে HTTPS (বা localhost) প্রয়োজন।';
      recordBtn.disabled = true;
    }

    // Check for a returned sign-in token immediately — this only reads
    // the URL, so it must not wait on the GIS script (accounts.google.
    // com/gsi/client), which is only needed for the popup path below.
    const redirectResult = Auth.checkRedirectResult();
    if (redirectResult && redirectResult.token) {
      completeRedirectSignIn();
    } else if (redirectResult && redirectResult.error && redirectResult.error !== 'access_denied') {
      showToast('সাইন ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
    }

    whenGoogleReady(() => {
      Auth.initTokenClient();
      if (!redirectResult) {
        Auth.trySilentSignIn().then((user) => { if (user) onSignedIn(user); });
      }
    });

    signInBtn.addEventListener('click', handleSignIn);
    signOutBtn.addEventListener('click', handleSignOut);
    recordBtn.addEventListener('click', handleRecordToggle);
    reRecordBtn.addEventListener('click', resetToRecording);
    uploadBtn.addEventListener('click', handleUpload);
    copyLinkBtn.addEventListener('click', () => copyLink(linkOutput.value));
    newRecordingBtn.addEventListener('click', resetToRecording);
    recordingsList.addEventListener('click', handleListClick);
    shareResultBtn.addEventListener('click', () => {
      Share.open({ url: lastUploadedLink, title: shareText(lastUploadedTitle), onCopied: () => showToast('লিংক কপি হয়েছে!', 'success') });
    });

    document.addEventListener('keydown', handleGlobalKeydown);
  }

  function checkConfig() {
    const missing =
      !CONFIG.GOOGLE_CLIENT_ID || CONFIG.GOOGLE_CLIENT_ID.indexOf('YOUR_') === 0 ||
      !CONFIG.GOOGLE_API_KEY || CONFIG.GOOGLE_API_KEY.indexOf('YOUR_') === 0;
    if (missing) configBanner.classList.remove('hidden');
  }

  function whenGoogleReady(callback, attempts) {
    attempts = attempts || 0;
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      callback();
    } else if (attempts > 100) {
      showToast('Google সাইন-ইন লোড করা যায়নি। ইন্টারনেট সংযোগ বা অ্যাড-ব্লকার চেক করুন।', 'error');
    } else {
      setTimeout(() => whenGoogleReady(callback, attempts + 1), 100);
    }
  }

  // Wraps Auth.getValidToken() so every call site handles an expired
  // session the same way, instead of each showing a confusing raw error.
  async function ensureToken() {
    try {
      return await Auth.getValidToken();
    } catch (err) {
      if (err && err.code === 'token_expired_needs_redirect') {
        showToast('সেশনের মেয়াদ শেষ হয়ে গেছে — আবার সাইন ইন করুন।', 'info');
        handleSignOut();
      }
      throw err;
    }
  }

  function handleGlobalKeydown(e) {
    if (e.code !== 'Space') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (document.querySelector('.share-overlay.show') || document.querySelector('.modal-overlay.show')) return;
    if (!recorderSection || recorderSection.classList.contains('hidden')) return;
    if (!previewArea.classList.contains('hidden') || !resultArea.classList.contains('hidden')) return;
    e.preventDefault();
    handleRecordToggle();
  }

  // ---------- auth ----------
  async function completeRedirectSignIn() {
    try {
      const user = await Auth.completeSignIn();
      await onSignedIn(user);
    } catch (err) {
      console.error('[App] failed to complete redirect sign-in:', err);
      showToast('সাইন ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
    }
  }

  async function handleSignIn() {
    signInBtn.disabled = true;
    if (signInBtnLabel) signInBtnLabel.textContent = 'অপেক্ষা করুন...';
    try {
      const user = await Auth.signIn();
      if (user) await onSignedIn(user);
      // If Auth.signIn() instead falls back to a redirect, the page
      // navigates away here and this line is never reached — that's
      // expected, not an error.
    } catch (err) {
      console.error('[App] sign-in failed:', err);
      showToast('সাইন ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
      signInBtn.disabled = false;
      signInBtn.innerHTML = signInBtnOriginalHTML;
    }
  }

  async function onSignedIn(user) {
    heroSection.classList.add('hidden');
    recorderSection.classList.remove('hidden');
    dashboardSection.classList.remove('hidden');
    userChip.classList.remove('hidden');
    if (user.picture) userAvatar.src = user.picture;
    userName.textContent = user.name || user.email || '';
    animateIn(recorderSection);
    animateIn(dashboardSection);

    dashboardSkeleton.classList.remove('hidden');
    try {
      const token = await ensureToken();
      folderId = await Drive.ensureFolder(token, CONFIG.DRIVE_FOLDER_NAME);
      await refreshRecordings();
    } catch (err) {
      console.error(err);
      showToast('ড্রাইভ ফোল্ডার প্রস্তুত করা যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।', 'error');
    } finally {
      dashboardSkeleton.classList.add('hidden');
    }
  }

  function handleSignOut() {
    Recorder.cancel();
    Auth.signOut();
    userChip.classList.add('hidden');
    recorderSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    resultArea.classList.add('hidden');
    previewArea.classList.add('hidden');
    heroSection.classList.remove('hidden');
    recordingsList.innerHTML = '';
    recordingsCache = [];
    folderId = null;
    isRecording = false;
    recordBtn.classList.remove('recording');
  }

  // ---------- recording ----------
  async function handleRecordToggle() {
    if (!isRecording) await startRecording();
    else await finishRecording();
  }

  async function startRecording() {
    resultArea.classList.add('hidden');
    previewArea.classList.add('hidden');
    try {
      await Recorder.start({
        canvas: visualizerCanvas,
        maxSeconds: CONFIG.MAX_RECORDING_SECONDS,
        onTick: (elapsed) => {
          timerEl.textContent = Recorder.formatTime(elapsed);
          const remaining = CONFIG.MAX_RECORDING_SECONDS - elapsed;
          timerEl.classList.toggle('warning', remaining <= 10);
        },
        onMaxReached: () => showToast('সর্বোচ্চ রেকর্ডিং সময় শেষ হয়েছে।', 'info')
      });
      isRecording = true;
      recordBtn.classList.add('recording');
      recordHint.textContent = 'রেকর্ডিং চলছে... থামাতে আবার চাপ দিন';
    } catch (err) {
      console.error(err);
      if (err && err.name === 'NotAllowedError') {
        showToast('মাইক্রোফোন অ্যাক্সেসের অনুমতি প্রয়োজন। ব্রাউজার সেটিংস থেকে অনুমতি দিন।', 'error');
      } else {
        showToast('রেকর্ডিং শুরু করা যায়নি।', 'error');
      }
    }
  }

  async function finishRecording() {
    if (!isRecording) return;
    isRecording = false;
    recordBtn.classList.remove('recording');
    const result = await Recorder.stop();

    recordHint.innerHTML = 'রেকর্ড শুরু করতে বাটনে চাপ দিন <span class="kbd-hint">অথবা Space চাপুন</span>';
    timerEl.textContent = '00:00';
    timerEl.classList.remove('warning');

    if (result && result.blob.size > 500) {
      lastBlob = result.blob;
      lastMimeType = result.mimeType;
      lastDuration = result.durationSeconds;
      showPreview(lastBlob);
    } else {
      showToast('রেকর্ডিং অনেক ছোট বা ব্যর্থ হয়েছে, আবার চেষ্টা করুন।', 'error');
    }
  }

  function showPreview(blob) {
    if (lastLocalUrl) URL.revokeObjectURL(lastLocalUrl);
    lastLocalUrl = URL.createObjectURL(blob);
    previewAudio.src = lastLocalUrl;
    downloadBtn.href = lastLocalUrl;
    downloadBtn.download = 'amar-voice-' + Date.now() + extFromMime(lastMimeType);

    previewArea.classList.remove('hidden');
    animateIn(previewArea);

    if (previewUI) previewUI.destroy();
    previewUI = createAudioPlayerUI({
      audioEl: previewAudio,
      playBtn: el('previewPlayBtn'),
      waveEl: el('previewWave'),
      curTimeEl: el('previewCurTime'),
      durTimeEl: el('previewDurTime'),
      seed: Math.floor(Math.random() * 1000)
    });
    titleInput.focus({ preventScroll: true });
  }

  function resetToRecording() {
    resultArea.classList.add('hidden');
    previewArea.classList.add('hidden');
    titleInput.value = '';
    lastBlob = null;
    uploadProgress.classList.add('hidden');
    setUploadProgress(0);
  }

  // ---------- upload ----------
  function setUploadProgress(ratio) {
    const pct = Math.round(ratio * 100);
    uploadProgressFill.style.width = pct + '%';
    if (uploadProgressPct) uploadProgressPct.textContent = pct + '%';
  }

  async function handleUpload() {
    if (!lastBlob) return;
    uploadBtn.disabled = true;
    reRecordBtn.disabled = true;
    if (uploadBtnLabel) uploadBtnLabel.textContent = 'আপলোড হচ্ছে...';
    uploadProgress.classList.remove('hidden');
    setUploadProgress(0.02);

    try {
      const token = await ensureToken();
      if (!folderId) folderId = await Drive.ensureFolder(token, CONFIG.DRIVE_FOLDER_NAME);

      const ext = extFromMime(lastMimeType);
      const rawTitle = titleInput.value.trim();
      const safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
      const fileName = (safeTitle || 'voice-comment') + '-' + Date.now() + ext;

      const uploaded = await Drive.uploadRecording(
        token,
        { blob: lastBlob, mimeType: lastMimeType, folderId, fileName, title: safeTitle, durationSeconds: lastDuration },
        setUploadProgress
      );

      setUploadProgress(1);
      await Drive.makePublic(token, uploaded.id);

      const link = buildShareLink(uploaded.id);
      lastUploadedLink = link;
      lastUploadedTitle = safeTitle;
      linkOutput.value = link;

      previewArea.classList.add('hidden');
      resultArea.classList.remove('hidden');
      animateIn(resultArea);
      burstConfetti(confettiHost);

      recordingsCache.unshift({
        id: uploaded.id,
        name: fileName,
        createdTime: uploaded.createdTime || new Date().toISOString(),
        properties: { amarvoiceTitle: safeTitle, amarvoiceDuration: String(lastDuration) }
      });
      renderRecordings(recordingsCache);

      showToast('আপলোড সম্পন্ন! আপনার লিংক প্রস্তুত।', 'success');
    } catch (err) {
      console.error(err);
      showToast('আপলোড ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।', 'error');
    } finally {
      uploadBtn.disabled = false;
      reRecordBtn.disabled = false;
      uploadProgress.classList.add('hidden');
      if (uploadBtnLabel) uploadBtnLabel.textContent = 'আপলোড করে লিংক নিন';
    }
  }

  function extFromMime(mime) {
    if (!mime) return '.webm';
    if (mime.indexOf('webm') !== -1) return '.webm';
    if (mime.indexOf('mp4') !== -1) return '.m4a';
    if (mime.indexOf('ogg') !== -1) return '.ogg';
    return '.webm';
  }

  function buildShareLink(fileId) {
    return window.location.origin + '/s/' + fileId;
  }

  function shareText(title) {
    return title ? `"${title}" — আমার ভয়েস কমেন্ট শুনুন 🎙️` : 'আমার ভয়েস কমেন্ট শুনুন 🎙️';
  }

  // ---------- dashboard ----------
  async function refreshRecordings() {
    try {
      const token = await ensureToken();
      recordingsCache = await Drive.listRecordings(token, folderId);
      renderRecordings(recordingsCache);
    } catch (err) {
      console.error(err);
    }
  }

  function renderRecordings(files) {
    if (!files.length) {
      recordingsList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    recordingsList.innerHTML = files.map(cardHTML).join('');
  }

  function cardHTML(file) {
    const title = (file.properties && file.properties.amarvoiceTitle) || 'শিরোনামহীন রেকর্ডিং';
    let date = file.createdTime || '';
    try {
      date = new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(file.createdTime));
    } catch (e) {}
    const durSec = file.properties && file.properties.amarvoiceDuration ? Number(file.properties.amarvoiceDuration) : 0;
    const duration = durSec ? Recorder.formatTime(durSec) : '';
    const link = buildShareLink(file.id);

    return (
      '<div class="rec-card glass" data-id="' + escapeHTML(file.id) + '" data-link="' + escapeHTML(link) + '" data-title="' + escapeHTML(title) + '">' +
        '<div class="rec-info">' +
          '<h3>' + escapeHTML(title) + '</h3>' +
          '<span class="rec-meta">' + escapeHTML(date) + (duration ? ' · ' + escapeHTML(duration) : '') + '</span>' +
        '</div>' +
        '<div class="rec-actions">' +
          '<button type="button" class="icon-btn rec-share" title="শেয়ার করুন" aria-label="শেয়ার করুন">' + ICONS.share + '</button>' +
          '<a class="icon-btn rec-open" href="' + escapeHTML(link) + '" target="_blank" rel="noopener" title="শুনুন" aria-label="শুনুন">' + ICONS.play + '</a>' +
          '<button type="button" class="icon-btn rec-delete" title="মুছে ফেলুন" aria-label="মুছে ফেলুন">' + ICONS.trash + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  async function handleListClick(e) {
    const card = e.target.closest('.rec-card');
    if (!card) return;
    const id = card.dataset.id;
    const link = card.dataset.link;
    const title = card.dataset.title;

    if (e.target.closest('.rec-share')) {
      Share.open({ url: link, title: shareText(title === 'শিরোনামহীন রেকর্ডিং' ? '' : title) });
      return;
    }
    if (e.target.closest('.rec-delete')) {
      const ok = await confirmDialog('আপনি কি নিশ্চিত এই রেকর্ডিংটি মুছে ফেলতে চান? এটি ফিরিয়ে আনা যাবে না।');
      if (!ok) return;
      try {
        const token = await ensureToken();
        await Drive.deleteRecording(token, id);
        card.classList.add('removing');
        setTimeout(() => {
          card.remove();
          recordingsCache = recordingsCache.filter((f) => f.id !== id);
          if (!recordingsCache.length) emptyState.classList.remove('hidden');
        }, 250);
        showToast('রেকর্ডিং মুছে ফেলা হয়েছে।', 'success');
      } catch (err) {
        console.error(err);
        showToast('মুছে ফেলা যায়নি।', 'error');
      }
    }
  }

  // ---------- copy ----------
  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showToast('লিংক কপি হয়েছে!', 'success');
    } catch (err) {
      showToast('কপি করা যায়নি, ম্যানুয়ালি সিলেক্ট করে কপি করুন।', 'error');
    }
  }

  // ---------- confetti ----------
  function burstConfetti(host) {
    if (!host) return;
    const colors = ['#00fff2', '#ff2fd0', '#9d4dff', '#3dffa0'];
    const count = 26;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = (38 + Math.random() * 24) + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--dx', (Math.random() * 2 - 1).toFixed(2));
      piece.style.setProperty('--rot', Math.floor(Math.random() * 360) + 'deg');
      piece.style.animationDelay = (Math.random() * 0.12) + 's';
      host.appendChild(piece);
      setTimeout(() => piece.remove(), 1500);
    }
  }

  // ---------- small entrance animation helper ----------
  function animateIn(elm) {
    elm.classList.remove('anim-in');
    void elm.offsetWidth; // restart animation
    elm.classList.add('anim-in');
  }

  // ---------- toast ----------
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // ---------- confirm modal ----------
  function confirmDialog(message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML =
        '<div class="modal-box glass">' +
          '<p>' + escapeHTML(message) + '</p>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn btn-ghost" data-action="cancel">বাতিল</button>' +
            '<button type="button" class="btn btn-danger" data-action="confirm">মুছে ফেলুন</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));

      overlay.addEventListener('click', (e) => {
        const action = e.target && e.target.dataset ? e.target.dataset.action : null;
        if (action === 'confirm') cleanup(true);
        else if (action === 'cancel' || e.target === overlay) cleanup(false);
      });

      function cleanup(result) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      }
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }
})();
