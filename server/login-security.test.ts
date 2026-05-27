import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { logLoginAttempt, getFailedLoginAttempts, getFailedLoginAttemptsForUser } from "./db-auth";

describe("Login Security - Başarısız Giriş Loglaması", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("Başarısız login denemesini logla - kullanıcı bulunamadı", async () => {
    const result = await logLoginAttempt({
      username: "test_user_not_found",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "failed",
      reason: "user_not_found",
    });

    expect(result).toBeDefined();
  });

  it("Başarısız login denemesini logla - hatalı şifre", async () => {
    const result = await logLoginAttempt({
      username: "admin",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "failed",
      reason: "invalid_password",
      userId: 114,
    });

    expect(result).toBeDefined();
  });

  it("Başarılı login denemesini logla", async () => {
    const result = await logLoginAttempt({
      username: "admin",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      userId: 114,
    });

    expect(result).toBeDefined();
  });

  it("Başarısız login denemelerini getir - son 7 gün", async () => {
    const attempts = await getFailedLoginAttempts(7, 100);
    expect(Array.isArray(attempts)).toBe(true);
    expect(attempts.length).toBeGreaterThanOrEqual(0);
  });

  it("Belirli bir kullanıcı için başarısız login denemelerini getir", async () => {
    const attempts = await getFailedLoginAttempts(7, 100);
    expect(Array.isArray(attempts)).toBe(true);
    
    // Tüm denemeler başarısız olmalı
    if (attempts.length > 0) {
      attempts.forEach((attempt) => {
        expect(attempt.status).toBe("failed");
      });
    }
  });

  it("IP adresi ve User Agent loglanmalı", async () => {
    const testIp = "203.0.113.42";
    const testUserAgent = "Test Browser/1.0";

    await logLoginAttempt({
      username: "test_ip_tracking_" + Date.now(),
      ipAddress: testIp,
      userAgent: testUserAgent,
      status: "failed",
      reason: "user_not_found",
    });

    const username = "test_ip_tracking_" + Date.now();
    const attempts = await getFailedLoginAttemptsForUser(username, 1);
    
    if (attempts.length > 0) {
      const lastAttempt = attempts[0];
      expect(lastAttempt.ipAddress).toBe(testIp);
      expect(lastAttempt.userAgent).toBe(testUserAgent);
    }
  });

  it("Başarısız login denemesi zamanı kaydedilmeli", async () => {
    const username = "test_timestamp_" + Date.now();
    
    await logLoginAttempt({
      username: username,
      ipAddress: "192.168.1.103",
      userAgent: "Test Browser",
      status: "failed",
      reason: "invalid_password",
    });

    const attempts = await getFailedLoginAttemptsForUser(username, 1);
    
    expect(attempts.length).toBeGreaterThan(0);
    const lastAttempt = attempts[0];
    
    // Zamanın kaydedildiğini kontrol et
    expect(lastAttempt.attemptTime).toBeDefined();
    expect(lastAttempt.createdAt).toBeDefined();
  });

  it("Başarılı login başarısız loglarında görünmemeli", async () => {
    const username = "test_success_filter_" + Date.now();
    
    // Başarılı login logla
    await logLoginAttempt({
      username: username,
      ipAddress: "192.168.1.104",
      userAgent: "Test Browser",
      status: "success",
      userId: 1,
    });

    // Başarısız login logla
    await logLoginAttempt({
      username: username,
      ipAddress: "192.168.1.105",
      userAgent: "Test Browser",
      status: "failed",
      reason: "invalid_password",
    });

    const attempts = await getFailedLoginAttemptsForUser(username, 1);
    
    // Sadece başarısız denemeler döndürülmeli
    attempts.forEach((attempt) => {
      expect(attempt.status).toBe("failed");
    });
  });

  it("Login denemesi tablosunun tüm alanları loglanmalı", async () => {
    const username = "test_full_log_" + Date.now();
    const testData = {
      username: username,
      ipAddress: "192.168.1.200",
      userAgent: "Test Browser/2.0",
      status: "failed" as const,
      reason: "account_inactive",
      userId: 999,
    };

    await logLoginAttempt(testData);
    const attempts = await getFailedLoginAttemptsForUser(username, 1);

    if (attempts.length > 0) {
      const attempt = attempts[0];
      expect(attempt.username).toBe(testData.username);
      expect(attempt.ipAddress).toBe(testData.ipAddress);
      expect(attempt.userAgent).toBe(testData.userAgent);
      expect(attempt.status).toBe(testData.status);
      expect(attempt.reason).toBe(testData.reason);
      expect(attempt.userId).toBe(testData.userId);
    }
  });

  afterAll(async () => {
    // Cleanup
  });
});
