// Face ID / Touch ID via WebAuthn platform authenticator
const RP_NAME = "Sofyan's First App";

export function biometricAvailable() {
  return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
}

export async function platformAuthenticatorAvailable() {
  if (!biometricAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

export async function registerBiometric() {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME, id: location.hostname },
      user: { id: userId, name: 'dashboard-user', displayName: 'Dashboard' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  });
  if (!cred) throw new Error('Geen credential aangemaakt');
  localStorage.setItem('bioCredId', b64(new Uint8Array(cred.rawId)));
  return true;
}

export async function verifyBiometric() {
  const credId = localStorage.getItem('bioCredId');
  if (!credId) throw new Error('Geen Face ID ingesteld');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: location.hostname,
      allowCredentials: [{
        type: 'public-key',
        id: ub64(credId),
        transports: ['internal'],
      }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
  return !!cred;
}

export function isBiometricEnabled() {
  return !!localStorage.getItem('bioCredId');
}

export function disableBiometric() {
  localStorage.removeItem('bioCredId');
}

function b64(arr) { return btoa(String.fromCharCode(...arr)); }
function ub64(s) { return new Uint8Array([...atob(s)].map(c => c.charCodeAt(0))); }
