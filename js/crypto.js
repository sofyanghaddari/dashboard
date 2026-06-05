// AES-GCM encryptie met PBKDF2 voor backup
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return JSON.stringify({
    v: 1,
    s: b64(salt),
    i: b64(iv),
    c: b64(new Uint8Array(ct)),
  });
}

export async function decrypt(blob, password) {
  const { s, i, c } = JSON.parse(blob);
  const salt = ub64(s), iv = ub64(i), ct = ub64(c);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return dec.decode(pt);
}

function b64(arr) { return btoa(String.fromCharCode(...arr)); }
function ub64(s) { return new Uint8Array([...atob(s)].map(c => c.charCodeAt(0))); }

export function isEncrypted(blob) {
  try {
    const j = JSON.parse(blob);
    return j.v === 1 && typeof j.s === 'string' && typeof j.c === 'string';
  } catch { return false; }
}
