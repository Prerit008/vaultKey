const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generatePassword({
  length = 20,
  upper = true,
  lower = true,
  numbers = true,
  symbols = true,
} = {}) {
  let pool = "";
  if (upper) pool += UPPER;
  if (lower) pool += LOWER;
  if (numbers) pool += NUMBERS;
  if (symbols) pool += SYMBOLS;
  if (!pool) pool = LOWER;

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  let out = "";
  for (let i = 0; i < length; i++) {
    out += pool[arr[i] % pool.length];
  }

  return out;
}

export function generateTOTPSecret(length = 32) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);

  let secret = "";

  for (let i = 0; i < length; i++) {
    secret += BASE32[arr[i] % BASE32.length];
  }

  return secret;
}

export function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "empty" };

  let score = 0;
  const len = pw.length;

  if (len >= 8) score++;
  if (len >= 12) score++;
  if (len >= 20) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const label = [
    "very weak",
    "weak",
    "fair",
    "good",
    "strong",
    "very strong",
    "excellent",
  ][score] || "weak";

  return { score, label };
}