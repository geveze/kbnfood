import { eq, and, gt } from "drizzle-orm";
import { getDb } from "./db";
import { users, userSessions, type InsertUser, type InsertUserSession } from "../drizzle/schema";

/**
 * Kullanıcı adı ile kullanıcı bul (keban_app veritabanından)
 */
export async function getUserByUsername(username: string) {
  try {
    // Doğrudan keban_app.users tablosundan veri çek
    const mysql = await import('mysql2/promise');
    const { manualDbConfig } = await import('./db-config');
    
    const connection = await mysql.default.createConnection({
      host: manualDbConfig.host,
      port: manualDbConfig.port,
      user: manualDbConfig.user,
      password: manualDbConfig.password,
      database: manualDbConfig.database,
      ssl: manualDbConfig.ssl
    });
    
    const [rows] = await connection.execute(
      `SELECT * FROM users WHERE username = ? LIMIT 1`,
      [username]
    );
    
    await connection.end();
    
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0] as any;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Error fetching user by username:', error);
    return null;
  }
}

/**
 * Yeni kullanıcı oluştur (Admin tarafından)
 */
export async function createLocalUser(data: {
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: "user" | "admin" | "region_manager" | "branch_manager" | "operations_manager";
  branchId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values({
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    email: data.email,
    role: data.role,
    branchId: data.branchId || null,
    loginMethod: "local",
    isActive: true,
    openId: null,
    lastSignedIn: new Date(),
  });

  return result;
}

/**
 * Session oluştur
 */
export async function createSession(
  userId: number,
  token: string,
  expiresAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userSessions).values({
    userId,
    token,
    expiresAt,
  });
}

/**
 * Session doğrula ve kullanıcı bilgilerini getir
 */
export async function verifySession(token: string) {
  console.log('[verifySession] Starting verification for token:', token.substring(0, 10) + '...');
  const db = await getDb();
  if (!db) {
    console.log('[verifySession] DB connection failed');
    return null;
  }
  console.log('[verifySession] DB connection established');

  const session = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.token, token),
        gt(userSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  console.log('[verifySession] Session lookup result:', session.length > 0 ? 'FOUND' : 'NOT_FOUND');
  if (session.length === 0) {
    console.log('[verifySession] No valid session found');
    return null;
  }

  console.log('[verifySession] Looking up user with ID:', session[0].userId);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session[0].userId))
    .limit(1);

  console.log('[verifySession] User lookup result:', user.length > 0 ? 'FOUND' : 'NOT_FOUND');
  return user.length > 0 ? user[0] : null;
}

/**
 * Session'ı sil (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userSessions).where(eq(userSessions.token, token));
}

/**
 * Kullanıcının son giriş zamanını güncelle
 */
export async function updateLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Kullanıcı şifresini güncelle
 */
export async function updateUserPassword(
  userId: number,
  passwordHash: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Kullanıcı bilgilerini güncelle
 */
export async function updateUser(
  userId: number,
  data: {
    name?: string;
    email?: string;
    role?: "user" | "admin" | "branch_manager" | "operations_manager" | "region_manager";
    branchId?: number | null;
    isActive?: boolean;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Tüm kullanıcıları listele
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(eq(users.isActive, true));
}

/**
 * Kullanıcıyı deaktif et (sil değil)
 */
export async function deactivateUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, userId));
}


/**
 * Login denemesini logla
 */
export async function logLoginAttempt(data: {
  username: string;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failed" | "blocked";
  reason?: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.error("[LoginLog] Database not available");
    return null;
  }

  try {
    // loginAttempts table'ı şu an schema'da tanımlı değil - skip
    console.log("[LoginLog] Login attempt logged (table not available):", data);
    return null;
  } catch (error) {
    console.error("[LoginLog] Error logging login attempt:", error);
    return null;
  }
}

/**
 * Son N gün içindeki başarısız login denemelerini al
 */
export async function getFailedLoginAttempts(days: number = 7, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { loginAttempts } = await import("../drizzle/schema");
    const { desc, gte } = await import("drizzle-orm");
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db
      .select()
      .from(loginAttempts)
      .where(
        gte(loginAttempts.attemptTime, cutoffDate)
      )
      .orderBy(desc(loginAttempts.attemptTime))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[LoginLog] Error fetching failed login attempts:", error);
    return [];
  }
}

/**
 * Belirli bir kullanıcı adı için son N gün içindeki başarısız login denemelerini al
 */
export async function getFailedLoginAttemptsForUser(username: string, days: number = 7) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { loginAttempts } = await import("../drizzle/schema");
    const { desc, gte, eq } = await import("drizzle-orm");
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db
      .select()
      .from(loginAttempts)
      .where(
        gte(loginAttempts.attemptTime, cutoffDate) &&
        eq(loginAttempts.username, username) &&
        eq(loginAttempts.success, false)
      )
      .orderBy(desc(loginAttempts.attemptTime));

    return result;
  } catch (error) {
    console.error("[LoginLog] Error fetching failed login attempts for user:", error);
    return [];
  }
}
