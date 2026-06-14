// Server-only AES-256-GCM helper for encrypting secrets at rest.
// Key is derived from APP_ENCRYPTION_KEY via SHA-256 so any passphrase works.
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) throw new Error("APP_ENCRYPTION_KEY is not configured");
  return createHash("sha256").update(raw).digest();
}

export function encryptString(plaintext: string): { ciphertext: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptString(ciphertext: string, ivB64: string): string {
  const data = Buffer.from(ciphertext, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const tag = data.subarray(data.length - 16);
  const enc = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function maskSecret(s: string | null | undefined, keep = 4): string {
  if (!s) return "";
  if (s.length <= keep * 2) return "•".repeat(s.length);
  return s.slice(0, keep) + "••••" + s.slice(-keep);
}
