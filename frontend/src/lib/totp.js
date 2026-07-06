// RFC 6238 TOTP implementation using Web Crypto (HMAC-SHA1).
// Also includes base32 decoding for the shared secret.

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input) {
  const clean = input.replace(/\s+/g, "").replace(/=+$/, "").toUpperCase();
  if (!clean) return new Uint8Array(0);
  const out = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function intToBuffer(num) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // JS bitwise limited to 32-bit; hi bits are 0 for our range.
  view.setUint32(0, Math.floor(num / 0x100000000));
  view.setUint32(4, num >>> 0);
  return buf;
}

export async function generateTOTP(secretB32, options = {}) {
  const { step = 30, digits = 6, timestamp = Date.now() } = options;
  const keyBytes = base32Decode(secretB32);
  if (keyBytes.length === 0) throw new Error("Empty TOTP secret");
  const counter = Math.floor(timestamp / 1000 / step);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, intToBuffer(counter)),
  );
  const offset = sig[sig.length - 1] & 0x0f;
  const binCode =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  const modulus = 10 ** digits;
  return String(binCode % modulus).padStart(digits, "0");
}

export function secondsRemaining(step = 30, timestamp = Date.now()) {
  const seconds = Math.floor(timestamp / 1000);
  return step - (seconds % step);
}


export function base32Encode(buffer) {
  const bytes = new Uint8Array(buffer);
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}
export function generateBase32Secret(length = 20) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}
export async function verifyTOTP(secretB32, code, window = 1) {
  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    const ts = now + i * 30000;
    const generated = await generateTOTP(secretB32, { timestamp: ts });
    if (generated === code) return true;
  }
  return false;
}