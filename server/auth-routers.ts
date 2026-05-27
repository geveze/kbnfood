import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { branches } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  getUserByUsername,
  createLocalUser,
  createSession,
  verifySession,
  deleteSession,
  updateLastSignedIn,
  updateUserPassword,
  updateUser,
  getAllUsers,
  deactivateUser,
  logLoginAttempt,
  getFailedLoginAttempts,
  getFailedLoginAttemptsForUser,
} from "./db-auth";
import { hashPassword, verifyPassword, generateSessionToken, SESSION_EXPIRY_MS } from "./auth";

// Admin procedure - sadece admin kullanıcılar erişebilir
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const authRouter = router({
  /**
   * Kullanıcı adı ve şifre ile giriş
   */
  loginLocal: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
        password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Türkçe karakterleri normalize et (ı -> i, İ -> I vb.)
      const normalizedUsername = input.username.toLowerCase();
      console.log(`[Auth] Login attempt for username: ${normalizedUsername}`);
      
      // Kullanıcıyı bul
      const user = await getUserByUsername(normalizedUsername);
      console.log(`[Auth] User found: ${user ? 'YES' : 'NO'}, User ID: ${user?.id}, Has password: ${!!user?.passwordHash}`);

      if (!user || !user.passwordHash) {
        console.log(`[Auth] Login failed: User not found or no password hash for ${input.username}`);
        // Başarısız login denemesini logla
        await logLoginAttempt({
          username: normalizedUsername,
          ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || '(unknown)',
          userAgent: ctx.req?.headers?.['user-agent']?.toString() || '(unknown)',
          status: 'failed',
          reason: 'user_not_found',
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı adı veya şifre hatalı",
        });
      }

      // Eski session'ı sil (logout'tan sonra login yaparken eski session'ı temizle)
      const oldToken = ctx.req.headers.cookie
        ?.split("; ")
        .find((c) => c.startsWith("auth_token="))
        ?.split("=")[1];
      if (oldToken) {
        await deleteSession(oldToken);
      }

      // Kullanıcı aktif mi kontrol et
      if (!user.isActive) {
        console.log(`[Auth] Login failed: User ${input.username} is inactive`);
        // Başarısız login denemesini logla
        await logLoginAttempt({
          username: normalizedUsername,
          ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || '(unknown)',
          userAgent: ctx.req?.headers?.['user-agent']?.toString() || '(unknown)',
          status: 'failed',
          reason: 'account_inactive',
          userId: user.id,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu kullanıcı hesabı deaktif edilmiştir",
        });
      }

      // Şifre doğrula
      const isPasswordValid = verifyPassword(input.password, user.passwordHash);
      console.log(`[Auth] Password verification for ${input.username}: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
      
      if (!isPasswordValid) {
        console.log(`[Auth] Login failed: Invalid password for ${normalizedUsername}`);
        // Başarısız login denemesini logla
        await logLoginAttempt({
          username: normalizedUsername,
          ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || '(unknown)',
          userAgent: ctx.req?.headers?.['user-agent']?.toString() || '(unknown)',
          status: 'failed',
          reason: 'invalid_password',
          userId: user.id,
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı adı veya şifre hatalı",
        });
      }

      // Session token oluştur
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

      // Session'ı veritabanına kaydet
      await createSession(user.id, token, expiresAt);

      // Son giriş zamanını güncelle
      await updateLastSignedIn(user.id);

      // Başarılı login denemesini logla
      await logLoginAttempt({
        username: normalizedUsername,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || '(unknown)',
        userAgent: ctx.req?.headers?.['user-agent']?.toString() || '(unknown)',
        status: 'success',
        userId: user.id,
      });
      console.log(`[Auth] Login successful for user: ${user.username} (ID: ${user.id})`);
      console.log(`[Auth] Session token created: ${token.substring(0, 10)}...`);
      console.log(`[Auth] Cookie set with expiry: ${expiresAt.toISOString()}`);

      // Session cookie'sini ayarla
      // Geliştirme ortamında proxy kullanıldığı için cookie ayarlarını esnek yap
      const isSecure = ctx.req.protocol === "https" || process.env.NODE_ENV === "production";
      const securePart = isSecure ? "; Secure" : "";
      
      // tRPC istemcisi cookie'leri otomatik olarak gönderir
      // SameSite=Lax kullanarak cross-site isteklerde cookie gönderilmesini sağla
      ctx.res.setHeader(
        "Set-Cookie",
        `auth_token=${token}; Path=/; HttpOnly${securePart}; SameSite=Lax; Max-Age=${SESSION_EXPIRY_MS / 1000}`
      );
      
      console.log(`[Auth] Cookie set successfully for user ${user.id}`);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
        },
        token,
      };
    }),

  /**
   * Logout
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    console.log(`[Auth] Logout initiated for user: ${ctx.user.username}`);
    
    // Session'ı sil
    const token = ctx.req.headers.cookie
      ?.split("; ")
      .find((c) => c.startsWith("auth_token="))
      ?.split("=")[1];

    if (token) {
      await deleteSession(token);
      console.log(`[Auth] Session deleted for token: ${token.substring(0, 10)}...`);
    }

    // Cookie'yi temizle - birden fazla format dene
    ctx.res.setHeader(
      "Set-Cookie",
      [
        "auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
        "auth_token=; Path=/; Max-Age=0",
      ]
    );

    console.log("[Auth] Logout successful");
    return { success: true };
  }),

  /**
   * Mevcut kullanıcı bilgilerini getir
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    
    // Şube adını al
    let branchName = "";
    if (ctx.user.branchId) {
      const db = await getDb();
      if (db) {
        const { branches } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const result = await (db as any)
          .select()
          .from(branches)
          .where(eq(branches.id, ctx.user.branchId))
          .limit(1);
        if (result.length > 0) {
          branchName = result[0].name;
        }
      }
    }
    
    return {
      ...ctx.user,
      branchName,
    };
  }),

  /**
   * Admin: Yeni kullanıcı oluştur
   */
  createUser: adminProcedure
    .input(
      z.object({
        username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
        password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
        name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
        email: z.string().email("Geçerli bir email adresi giriniz"),
        role: z.enum(["user", "admin", "branch_manager", "operations_manager", "region_manager"]),
        branchId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Kullanıcı adı zaten var mı kontrol et
      const existingUser = await getUserByUsername(input.username);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bu kullanıcı adı zaten kullanılıyor",
        });
      }

      // Şifre hash'le
      const passwordHash = hashPassword(input.password);

      // Kullanıcı oluştur
      await createLocalUser({
        username: input.username,
        passwordHash,
        name: input.name,
        email: input.email,
        role: input.role,
        branchId: input.branchId,
      });

      return {
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
      };
    }),

  /**
   * Admin: Kullanıcıları listele
   */
  listUsers: adminProcedure.query(async () => {
    const allUsers = await getAllUsers();
    return allUsers.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      isActive: user.isActive,
      lastSignedIn: user.lastSignedIn,
      createdAt: user.createdAt,
    }));
  }),

  /**
   * Admin: Kullanıcı bilgilerini güncelle
   */
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin", "branch_manager", "operations_manager", "region_manager"]).optional(),
        branchId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...updateData } = input;
      await updateUser(userId, updateData);
      return { success: true, message: "Kullanıcı başarıyla güncellendi" };
    }),

  /**
   * Admin: Kullanıcı şifresini sıfırla
   */
  resetUserPassword: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
      })
    )
    .mutation(async ({ input }) => {
      const passwordHash = hashPassword(input.newPassword);
      await updateUserPassword(input.userId, passwordHash);
      return { success: true, message: "Şifre başarıyla sıfırlandı" };
    }),

  /**
   * Admin: Kullanıcıyı deaktif et
   */
  deactivateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await deactivateUser(input.userId);
      return { success: true, message: "Kullanıcı deaktif edildi" };
    }),

  /**
   * Kullanıcı: Kendi şifresini değiştir
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mevcut şifreyi doğrula
      const user = await getUserByUsername(ctx.user.username!);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı bulunamadı",
        });
      }

      const isPasswordValid = verifyPassword(
        input.currentPassword,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mevcut şifre hatalı",
        });
      }

      // Yeni şifreyi hash'le ve güncelle
      const newPasswordHash = hashPassword(input.newPassword);
      await updateUserPassword(user.id, newPasswordHash);

      return { success: true, message: "Şifre başarıyla değiştirildi" };
    }),


  /**
   * Admin: Başarısız login denemelerini listele
   */
  getFailedLoginAttempts: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      const attempts = await getFailedLoginAttempts(input.days, input.limit);
      return attempts.map((attempt) => ({
        id: attempt.id,
        username: attempt.username,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        attemptTime: attempt.attemptTime,
        success: attempt.success,
        createdAt: attempt.createdAt,
      }));
    }),

  /**
   * Admin: Belirli bir kullanıcı için başarısız login denemelerini listele
   */
  getFailedLoginAttemptsForUser: adminProcedure
    .input(
      z.object({
        username: z.string().min(1),
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ input }) => {
      const attempts = await getFailedLoginAttemptsForUser(input.username, input.days);
      return attempts.map((attempt) => ({
        id: attempt.id,
        username: attempt.username,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        attemptTime: attempt.attemptTime,
        success: attempt.success,
        createdAt: attempt.createdAt,
      }));
    }),
});
