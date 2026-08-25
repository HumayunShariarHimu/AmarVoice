/**
 * Amar Voice — Drive module
 * ----------------------
 * All calls that touch the signed-in user's Google Drive. Every
 * recording lands inside a single app-created folder in *that user's
 * own* Drive — nothing is ever stored on a server Amar Voice controls.
 */
const Drive = (() => {
  const API_BASE = 'https://www.googleapis.com/drive/v3';
  const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

  async function driveFetch(url, accessToken, options) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: 'Bearer ' + accessToken,
        ...(options && options.headers ? options.headers : {})
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error('Drive API ' + res.status + ': ' + text);
    }
    return res;
  }

  // Finds (or creates, on first run) the folder that holds all of this
  // user's Amar Voice recordings, and caches its ID locally.
  async function ensureFolder(accessToken, folderName) {
    let cachedId = null;
    try { cachedId = localStorage.getItem('amarvoice_folder_id'); } catch (e) {}
    if (cachedId) return cachedId;

    const q = encodeURIComponent(
      `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const searchRes = await driveFetch(
      `${API_BASE}/files?q=${q}&fields=files(id,name)&spaces=drive`,
      accessToken
    );
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const id = searchData.files[0].id;
      try { localStorage.setItem('amarvoice_folder_id', id); } catch (e) {}
      return id;
    }

    const createRes = await driveFetch(`${API_BASE}/files?fields=id`, accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
    });
    const createData = await createRes.json();
    try { localStorage.setItem('amarvoice_folder_id', createData.id); } catch (e) {}
    return createData.id;
  }

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  // Uploads the recorded audio blob using the classic multipart/related
  // upload format (metadata part + base64 media part). Reliable and
  // needs only a single request — ideal for short voice clips.
  // Uses XMLHttpRequest (not fetch) specifically so we can report real
  // upload progress via xhr.upload.onprogress — fetch has no equivalent.
  // onProgress receives a 0..1 ratio.
  function uploadRecording(accessToken, { blob, mimeType, folderId, fileName, title, durationSeconds }, onProgress) {
    const metadata = {
      name: fileName,
      mimeType,
      parents: [folderId],
      properties: {
        amarvoiceTitle: title || '',
        amarvoiceDuration: String(durationSeconds || 0)
      }
    };

    const boundary = 'amarvoice-' + Math.random().toString(16).slice(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    return blob.arrayBuffer().then((arrayBuffer) => {
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const body =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        closeDelim;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,createdTime`);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`);
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded / e.total);
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch (e) { reject(new Error('Invalid response from Drive API')); }
          } else {
            reject(new Error('Drive upload failed: ' + xhr.status + ' ' + xhr.responseText));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(body);
      });
    });
  }

  // Makes the file readable by anyone who has the link — the same
  // sharing model as a normal Google Drive "Anyone with the link" share.
  async function makePublic(accessToken, fileId) {
    const res = await driveFetch(`${API_BASE}/files/${fileId}/permissions`, accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    return res.json();
  }

  async function listRecordings(accessToken, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const res = await driveFetch(
      `${API_BASE}/files?q=${q}&orderBy=createdTime desc&fields=files(id,name,createdTime,properties)&pageSize=100`,
      accessToken
    );
    const data = await res.json();
    return data.files || [];
  }

  async function deleteRecording(accessToken, fileId) {
    const res = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    return res.ok;
  }

  return { ensureFolder, uploadRecording, makePublic, listRecordings, deleteRecording };
})();
