import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Şifre hash'leme - bcrypt yerine Node.js built-in crypto kullanıyoruz
 * Üretim ortamında bcrypt veya argon2 kullanılması önerilir
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Şifre doğrulama
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, storedHash] = hash.split(":");
    if (!salt || !storedHash) {
      return false;
    }
    const computedHash = scryptSync(password, salt, 64).toString("hex");
    // Timing-safe comparison kullanarak timing attacks'tan korunma
    return timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

/**
 * Session token oluştur
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Geçerli session token süresi (24 saat)
 */
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
