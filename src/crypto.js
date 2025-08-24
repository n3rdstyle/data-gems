// Minimal WebCrypto helpers for PBKDF2 + AES-GCM
export async function deriveKeyFromPassphrase(passphrase, salt, iterations = 200000) {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateRandomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function encryptJson(key, data) {
  const iv = generateRandomBytes(12);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  );
  return { iv: Array.from(iv), ciphertext: Array.from(ciphertext) };
}

export async function decryptJson(key, payload) {
  const { iv, ciphertext } = payload;
  const dec = new TextDecoder();
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext)
  );
  return JSON.parse(dec.decode(new Uint8Array(plainBuf)));
}

export const StorageKeys = {
  ProfileBlob: 'profile_blob' // { version, salt: number[], iv: number[], ciphertext: number[] }
};

