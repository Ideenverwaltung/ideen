/**
 * Clientseitige Verschlüsselung (Zero-Knowledge).
 * Das Master-Passwort verlässt niemals den Browser. Aus ihm wird per PBKDF2
 * ein AES-GCM-Schlüssel abgeleitet; in der Datenbank liegt nur Chiffretext.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERATIONS = 250_000;
const VERIFIER_TEXT = "organisation-ideen::tresor::ok";

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function randomSaltBase64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToBase64(salt.buffer);
}

/** Leitet aus Master-Passwort + Salt den AES-GCM-Schlüssel ab. */
export async function deriveKey(password: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(base64ToBuf(saltB64)),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface Cipher {
  ciphertext: string;
  iv: string;
}

export async function encryptText(key: CryptoKey, plaintext: string): Promise<Cipher> {
  if (!plaintext) return { ciphertext: "", iv: "" };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return { ciphertext: bufToBase64(ct), iv: bufToBase64(iv.buffer) };
}

export async function decryptText(key: CryptoKey, cipher: Cipher): Promise<string> {
  if (!cipher.ciphertext) return "";
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(base64ToBuf(cipher.iv)) },
      key,
      base64ToBuf(cipher.ciphertext),
    );
    return dec.decode(pt);
  } catch {
    return "🔒 (Entschlüsselung fehlgeschlagen)";
  }
}

/** Erstellt den Verifier beim erstmaligen Einrichten des Tresors. */
export async function buildVerifier(password: string) {
  const salt = randomSaltBase64();
  const key = await deriveKey(password, salt);
  const { ciphertext, iv } = await encryptText(key, VERIFIER_TEXT);
  return { salt, verifier_ciphertext: ciphertext, verifier_iv: iv };
}

/** Prüft das Master-Passwort gegen den gespeicherten Verifier. */
export async function verifyPassword(
  password: string,
  salt: string,
  verifier_ciphertext: string,
  verifier_iv: string,
): Promise<CryptoKey | null> {
  const key = await deriveKey(password, salt);
  const text = await decryptText(key, {
    ciphertext: verifier_ciphertext,
    iv: verifier_iv,
  });
  return text === VERIFIER_TEXT ? key : null;
}
