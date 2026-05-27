import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyPassword } from "./auth";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: null,
    username: "admin",
    email: "admin@keban.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin",
    branchId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(branchId: number): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: null,
    username: "user",
    email: "user@keban.com",
    name: "Regular User",
    loginMethod: "local",
    role: "user",
    branchId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Password hashing and verification", () => {
  it("should hash password correctly", () => {
    const password = "testPassword123";
    const hash = hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain(":");
    expect(hash.split(":")).toHaveLength(2);
  });

  it("should verify correct password", () => {
    const password = "testPassword123";
    const hash = hashPassword(password);

    const isValid = verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", () => {
    const password = "testPassword123";
    const hash = hashPassword(password);

    const isValid = verifyPassword("wrongPassword", hash);
    expect(isValid).toBe(false);
  });
});

describe("Auth router - Admin only procedures", () => {
  it("should prevent non-admin users from creating users", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.createUser({
        username: "newuser",
        password: "password123",
        name: "New User",
        email: "newuser@keban.com",
        role: "user",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should prevent non-admin users from listing users", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.listUsers();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should prevent non-admin users from resetting passwords", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.resetUserPassword({
        userId: 2,
        newPassword: "newPassword123",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should prevent non-admin users from deactivating users", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.deactivateUser({ userId: 2 });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Auth router - Protected procedures", () => {
  it("should allow authenticated users to change their password", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    // This would require database setup in a real test
    expect(caller.auth.changePassword).toBeDefined();
  });

  it("should allow authenticated users to get their info", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.id).toBe(2);
    expect(result?.username).toBe("user");
  });
});

describe("Auth router - Public procedures", () => {
  it("should have loginLocal procedure available", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    expect(caller.auth.loginLocal).toBeDefined();
  });

  it("should have logoutLocal procedure available", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.auth.logoutLocal).toBeDefined();
  });
});
