/**
 * Amar Voice — Audio player UI module
 * --------------------------------------
 * A premium, voice-message-style waveform scrubber wired onto a plain
 * <audio> element. The bars themselves ARE the seek control — tap or
 * drag anywhere on the waveform to jump to that point, just like
 * WhatsApp/Telegram voice notes. Shared by the post-recording preview
 * and the public player so both feel identical.
 *
 * Usage: createAudioPlayerUI({ audioEl, playBtn, waveEl, curTimeEl, durTimeEl, seed })
 */
function seedFromString(str) {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 1000;
}

function createAudioPlayerUI({ audioEl, playBtn, waveEl, curTimeEl, durTimeEl, barCount, seed = 0 }) {
  // Pick a bar count that actually fits the container so the scrubber
  // can never force the page wider than the viewport. Falls back to a
  // window-width estimate if the container isn't laid out yet (e.g.
  // still inside a display:none parent when this runs).
  if (!barCount) {
    const BAR_MIN_PX = 3;
    const BAR_GAP_PX = 2.5;
    let available = waveEl.clientWidth;
    if (!available) {
      available = Math.max(140, Math.min(360, window.innerWidth) - 130);
    }
    const fit = Math.floor((available + BAR_GAP_PX) / (BAR_MIN_PX + BAR_GAP_PX));
    barCount = Math.max(18, Math.min(56, fit));
  }

  function barHeightRatio(i) {
    const t = i / barCount;
    const phase = (seed % 100) / 100 * Math.PI * 2;
    const base =
      0.32 +
      0.28 * Math.abs(Math.sin(t * Math.PI * 5.3 + phase)) +
      0.22 * Math.abs(Math.sin(t * Math.PI * 11 - phase * 0.6));
    const x = Math.sin((i + seed + 1) * 12.9898) * 43758.5453;
    const jitter = (x - Math.floor(x)) * 0.24;
    return Math.max(0.16, Math.min(1, base * 0.72 + jitter));
  }

  const bars = [];
  waveEl.innerHTML = '';
  waveEl.classList.add('waveform-scrubber');
  waveEl.setAttribute('role', 'slider');
  waveEl.setAttribute('tabindex', '0');
  waveEl.setAttribute('aria-label', 'অডিও পজিশন — বাঁ/ডান কী চাপুন অথবা টেনে সরান');
  waveEl.setAttribute('aria-valuemin', '0');
  waveEl.setAttribute('aria-valuemax', '100');
  waveEl.setAttribute('aria-valuenow', '0');

  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('span');
    bar.className = 'wf-bar';
    bar.style.height = Math.round(barHeightRatio(i) * 34 + 4) + 'px';
    waveEl.appendChild(bar);
    bars.push(bar);
  }

  function formatTime(t) {
    if (!isFinite(t) || t < 0) return '00:00';
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function setProgress(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const activeIndex = Math.floor(clamped * barCount);
    for (let i = 0; i < bars.length; i++) {
      bars[i].classList.toggle('played', i < activeIndex);
      bars[i].classList.toggle('current', i === activeIndex && clamped < 1);
    }
    waveEl.setAttribute('aria-valuenow', String(Math.round(clamped * 100)));
  }

  function onLoadedMeta() {
    if (durTimeEl) durTimeEl.textContent = formatTime(audioEl.duration);
  }
  function onTimeUpdate() {
    const d = audioEl.duration || 0;
    if (d > 0) setProgress(audioEl.currentTime / d);
    if (curTimeEl) curTimeEl.textContent = formatTime(audioEl.currentTime);
  }
  function onPlay() {
    playBtn.classList.add('playing');
    waveEl.classList.add('live');
  }
  function onPause() {
    playBtn.classList.remove('playing');
    waveEl.classList.remove('live');
  }
  function onEnded() {
    onPause();
    setProgress(0);
    if (curTimeEl) curTimeEl.textContent = '00:00';
  }
  function onPlayBtnClick() {
    if (audioEl.paused) audioEl.play().catch(() => {});
    else audioEl.pause();
  }

  function seekFromClientX(clientX) {
    const rect = waveEl.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    if (audioEl.duration) audioEl.currentTime = clamped * audioEl.duration;
    setProgress(clamped);
  }

  let dragging = false;
  function onPointerDown(e) {
    dragging = true;
    try { waveEl.setPointerCapture(e.pointerId); } catch (err) {}
    seekFromClientX(e.clientX);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    seekFromClientX(e.clientX);
  }
  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    try { waveEl.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  function onKeyDown(e) {
    const d = audioEl.duration || 0;
    if (!d) return;
    if (e.key === 'ArrowRight') { audioEl.currentTime = Math.min(d, audioEl.currentTime + 5); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { audioEl.currentTime = Math.max(0, audioEl.currentTime - 5); e.preventDefault(); }
    else if (e.key === 'Home') { audioEl.currentTime = 0; e.preventDefault(); }
    else if (e.key === 'End') { audioEl.currentTime = d; e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Enter') { onPlayBtnClick(); e.preventDefault(); }
  }

  audioEl.addEventListener('loadedmetadata', onLoadedMeta);
  audioEl.addEventListener('timeupdate', onTimeUpdate);
  audioEl.addEventListener('play', onPlay);
  audioEl.addEventListener('pause', onPause);
  audioEl.addEventListener('ended', onEnded);
  playBtn.addEventListener('click', onPlayBtnClick);
  waveEl.addEventListener('pointerdown', onPointerDown);
  waveEl.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  waveEl.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      audioEl.removeEventListener('loadedmetadata', onLoadedMeta);
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
      audioEl.removeEventListener('play', onPlay);
      audioEl.removeEventListener('pause', onPause);
      audioEl.removeEventListener('ended', onEnded);
      playBtn.removeEventListener('click', onPlayBtnClick);
      waveEl.removeEventListener('pointerdown', onPointerDown);
      waveEl.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      waveEl.removeEventListener('keydown', onKeyDown);
    },
    reset() {
      setProgress(0);
      if (curTimeEl) curTimeEl.textContent = '00:00';
      if (durTimeEl) durTimeEl.textContent = '00:00';
      onPause();
    }
  };
}
