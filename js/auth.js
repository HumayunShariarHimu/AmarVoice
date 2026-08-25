/**
 * Amar Voice — Auth module
 * ---------------------------
 * Sign-in tries the Google-recommended popup flow first (Google
 * Identity Services token model). If a popup attempt ever fails to
 * complete — including the case where a mobile browser silently
 * reloads the tab while it's in the background, which leaves nothing
 * to catch — this module remembers that fact (in localStorage, which
 * survives a reload, unlike JS memory) and switches this browser over
 * to a full-page redirect sign-in instead. A redirect can't be broken
 * by a backgrounded tab being discarded, because there is no second
 * tab involved — it's the same tab navigating out and back.
 */
const Auth = (() => {
  const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
  ].join(' ');

  const LS_METHOD = 'amarvoice_signin_method';  // 'popup' | 'redirect'
  const LS_PENDING = 'amarvoice_signin_pending'; // timestamp while a popup attempt is in flight

  let tokenClient = null;
  let accessToken = null;
  let tokenExpiry = 0;
  let currentUser = null;

  function redirectUri() {
    // Must be added to "Authorized redirect URIs" in Google Cloud
    // Console (a different field from "Authorized JavaScript origins").
    return window.location.origin + '/';
  }

  function preferredMethod() {
    try { return localStorage.getItem(LS_METHOD) || 'popup'; } catch (e) { return 'popup'; }
  }
  function rememberMethod(method) {
    try { localStorage.setItem(LS_METHOD, method); } catch (e) {}
  }

  function randomState() {
    const arr = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    const state = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    try { sessionStorage.setItem('amarvoice_oauth_state', state); } catch (e) {}
    return state;
  }

  function buildRedirectAuthUrl(promptMode) {
    const params = new URLSearchParams({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri(),
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
      prompt: promptMode || 'select_account consent',
      state: randomState()
    });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  }

  function goToRedirectSignIn(promptMode) {
    rememberMethod('redirect');
    window.location.href = buildRedirectAuthUrl(promptMode);
  }

  function persistToken() {
    try {
      sessionStorage.setItem('amarvoice_token', accessToken);
      sessionStorage.setItem('amarvoice_token_expiry', String(tokenExpiry));
      localStorage.setItem('amarvoice_was_signed_in', 'true');
    } catch (e) {}
  }

  // Reads an access token back out of the URL fragment after Google
  // redirects to us (redirect sign-in only — popup sign-in never touches
  // the URL). Cleans the fragment either way so it never lingers in
  // history or gets shared if the user copies the address bar.
  function parseRedirectResult() {
    const hash = window.location.hash;
    if (!hash || (hash.indexOf('access_token') === -1 && hash.indexOf('error') === -1)) {
      return null;
    }
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const error = params.get('error');
    if (!token && !error) return null;

    history.replaceState(null, '', window.location.pathname + window.location.search);

    if (error) {
      console.warn('[Auth] redirect sign-in returned an error:', error);
      return { error };
    }

    let expected = null;
    try { expected = sessionStorage.getItem('amarvoice_oauth_state'); } catch (e) {}
    if (expected && params.get('state') !== expected) {
      console.warn('[Auth] OAuth state did not match expected value — proceeding, but flagging it.');
    }

    accessToken = token;
    tokenExpiry = Date.now() + Number(params.get('expires_in') || 3600) * 1000;
    persistToken();
    return { token: accessToken };
  }

  // Call immediately on every page load, before GIS has necessarily
  // finished loading — parsing a token out of the URL needs nothing but
  // the URL itself, so it must not be blocked on the GIS script.
  function checkRedirectResult() {
    let pendingSince = null;
    try { pendingSince = localStorage.getItem(LS_PENDING); } catch (e) {}
    if (pendingSince) {
      // A popup attempt started before and never confirmed success in
      // this browser — most likely the tab was reloaded in the
      // background. Stop trying the popup here.
      try { localStorage.removeItem(LS_PENDING); } catch (e) {}
      rememberMethod('redirect');
    }
    return parseRedirectResult();
  }

  // Call once GIS (accounts.google.com/gsi/client) has finished loading.
  // Only needed for the popup path and for revoke() on sign-out.
  function initTokenClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: () => {} // replaced per-request in requestTokenViaPopup()
    });
  }

  function requestTokenViaPopup(promptMode) {
    return new Promise((resolve, reject) => {
      if (!tokenClient) { reject(new Error('Token client not initialized')); return; }
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject({ type: 'timeout' });
      }, 25000);

      tokenClient.callback = (resp) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        try { localStorage.removeItem(LS_PENDING); } catch (e) {}
        if (resp && resp.error) { reject(resp); return; }
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + Number(resp.expires_in || 3600) * 1000;
        persistToken();
        resolve(accessToken);
      };
      tokenClient.error_callback = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        try { localStorage.removeItem(LS_PENDING); } catch (e) {}
        reject(err);
      };

      try { localStorage.setItem(LS_PENDING, String(Date.now())); } catch (e) {}
      try {
        tokenClient.requestAccessToken({ prompt: promptMode });
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          try { localStorage.removeItem(LS_PENDING); } catch (e) {}
          reject(err);
        }
      }
    });
  }

  async function loadProfile() {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    if (!res.ok) throw new Error('profile fetch failed: ' + res.status);
    currentUser = await res.json();
    return currentUser;
  }

  // Called by app.js after init() finds a token in the URL (i.e. we
  // just landed back here from a redirect sign-in).
  async function completeSignIn() {
    await loadProfile();
    return currentUser;
  }

  // "Sign in" button handler.
  async function signIn() {
    if (preferredMethod() === 'redirect') {
      goToRedirectSignIn('select_account consent');
      return new Promise(() => {}); // page is navigating away
    }
    try {
      await requestTokenViaPopup('consent');
      await loadProfile();
      return currentUser;
    } catch (err) {
      console.warn('[Auth] popup sign-in failed — switching this browser to redirect sign-in:', err);
      goToRedirectSignIn('select_account consent');
      return new Promise(() => {});
    }
  }

  // Best-effort silent restore for a returning visitor. Failure here is
  // low-stakes (worst case: they see the sign-in button), so it never
  // falls back to a redirect — that's reserved for the explicit click.
  async function trySilentSignIn() {
    let wasSignedIn = false;
    try { wasSignedIn = localStorage.getItem('amarvoice_was_signed_in') === 'true'; } catch (e) {}
    if (!wasSignedIn) return null;
    if (preferredMethod() === 'redirect') return null;
    try {
      await requestTokenViaPopup('');
      await loadProfile();
      return currentUser;
    } catch (e) {
      return null;
    }
  }

  async function getValidToken() {
    if (accessToken && Date.now() < tokenExpiry - 60000) return accessToken;
    if (preferredMethod() === 'redirect') {
      const err = new Error('token_expired_needs_redirect');
      err.code = 'token_expired_needs_redirect';
      throw err;
    }
    await requestTokenViaPopup('');
    return accessToken;
  }

  function signOut() {
    if (accessToken && window.google) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    currentUser = null;
    tokenExpiry = 0;
    try {
      sessionStorage.removeItem('amarvoice_token');
      sessionStorage.removeItem('amarvoice_token_expiry');
      sessionStorage.removeItem('amarvoice_oauth_state');
      localStorage.removeItem('amarvoice_was_signed_in');
      localStorage.removeItem('amarvoice_folder_id');
      localStorage.removeItem(LS_PENDING);
      // LS_METHOD is deliberately kept: if popup was unreliable on this
      // browser before, it still will be, so don't relearn that lesson.
    } catch (e) {}
  }

  function getUser() { return currentUser; }

  return { checkRedirectResult, initTokenClient, completeSignIn, signIn, trySilentSignIn, getValidToken, signOut, getUser };
})();
