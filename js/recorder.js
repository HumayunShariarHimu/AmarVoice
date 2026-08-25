/**
 * Amar Voice — Recorder module
 * -------------------------
 * Handles microphone capture (MediaRecorder), the live radial audio
 * visualizer drawn around the record button, and small time-formatting
 * helpers shared with the rest of the app.
 */
const Recorder = (() => {
  let mediaRecorder = null;
  let stream = null;
  let chunks = [];
  let startTime = 0;
  let timerInterval = null;
  let visualizer = null;
  let mimeType = '';

  function getSupportedMimeType() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    for (const type of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }

  async function start({ canvas, onTick, maxSeconds, onMaxReached }) {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });

    mimeType = getSupportedMimeType();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start();
    startTime = Date.now();

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (onTick) onTick(elapsed);
      if (maxSeconds && elapsed >= maxSeconds) {
        stop().then(() => { if (onMaxReached) onMaxReached(); });
      }
    }, 250);

    if (canvas) visualizer = createRadialVisualizer(stream, canvas);
  }

  function stop() {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      clearInterval(timerInterval);
      mediaRecorder.onstop = () => {
        if (visualizer) { visualizer.stop(); visualizer = null; }
        if (stream) stream.getTracks().forEach((t) => t.stop());
        const finalMime = mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalMime });
        resolve({
          blob,
          mimeType: finalMime,
          durationSeconds: Math.max(1, Math.round((Date.now() - startTime) / 1000))
        });
      };
      mediaRecorder.stop();
    });
  }

  function cancel() {
    clearInterval(timerInterval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    if (visualizer) { visualizer.stop(); visualizer = null; }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    chunks = [];
  }

  // Draws a ring of glowing bars radiating outward from the record
  // button, each one modulated by live frequency-domain audio data —
  // the voice literally becomes light.
  function createRadialVisualizer(mediaStream, canvas) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(mediaStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvas.getContext('2d');
    let rafId;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const size = canvas.clientWidth || 280;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const barCount = 48;
    const step = Math.max(1, Math.floor(bufferLength / barCount));

    function draw() {
      rafId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const size = canvas.clientWidth || 280;
      const cx = size / 2;
      const cy = size / 2;
      const innerR = size * 0.24;
      const maxBarLen = size * 0.2;

      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barLen = 3 + value * maxBarLen;
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * (innerR + barLen);
        const y2 = cy + Math.sin(angle) * (innerR + barLen);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, 'rgba(0,255,242,0.95)');
        grad.addColorStop(1, 'rgba(255,47,208,0.85)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(2, size * 0.009);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    draw();

    return {
      stop() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        try { source.disconnect(); } catch (e) {}
        try { audioCtx.close(); } catch (e) {}
      }
    };
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  return { start, stop, cancel, formatTime, getSupportedMimeType };
})();
