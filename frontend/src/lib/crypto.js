// Client-side zero-knowledge crypto helpers.
// Master password never leaves the browser. Backend only stores/returns the encrypted blob.

const PBKDF2_ITERATIONS = 310000;
const KEY_LENGTH_BITS = 256;
const IV_BYTES = 12;
const SALT_BYTES = 16;
const HASH = "SHA-256";

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToBase64(bytes) {
  let bin = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: HASH },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

// Encrypt plaintext string with a fresh salt+iv. Returns blob suitable for backend PUT.
export async function encryptVault(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return {
    v: 1,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ct)),
  };
}

// Re-use existing salt when saving. This keeps salt stable per-vault so key derivation is deterministic per password.
export async function encryptVaultWithSalt(plaintext, password, saltB64) {
  const salt = base64ToBytes(saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return {
    v: 1,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: saltB64,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ct)),
  };
}

export async function decryptVault(blob, password) {
  const salt = base64ToBytes(blob.salt);
  const iv = base64ToBytes(blob.iv);
  const ct = base64ToBytes(blob.ct);
  const iterations = blob.iterations || PBKDF2_ITERATIONS;
  const key = await deriveKey(password, salt, iterations);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(plain);
}