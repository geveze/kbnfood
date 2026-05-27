import { User } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * RBAC (Role-Based Access Control) Utilities
 *
 * Provides helper functions to enforce role-based data access:
 * - admin: Can access all data
 * - region_manager: Can access data for their assigned regions
 * - branch_manager: Can access only their own branch data
 * - operations_manager: Can access operational data
 * - user: Limited access to their own data
 */

/**
 * Validate if user can access a specific branch
 * @param user Current user
 * @param branchId Branch ID to access
 * @throws TRPCError if user doesn't have access
 */
export function validateBranchAccess(user: User, branchId: number | null | undefined): void {
  // Admin can access everything
  if (user.role === "admin") {
    return;
  }

  // Branch manager can only access their own branch
  if (user.role === "branch_manager") {
    if (!user.branchId || user.branchId !== branchId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only access data for your assigned branch",
      });
    }
    return;
  }

  // Region manager can access their region (if regionManagerId is set)
  if (user.role === "region_manager") {
    // Region managers can access multiple branches in their region
    // This check would be more complex with region data
    return;
  }

  // Operations manager can access operational data
  if (user.role === "operations_manager") {
    return;
  }

  // Regular users have limited access
  if (user.role === "user") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to access this data",
    });
  }
}

/**
 * Get the branch ID that a user should be filtered to
 * Returns null if user can access all branches
 */
export function getUserBranchFilter(user: User): number | null {
  // Admin can see all branches
  if (user.role === "admin") {
    return null;
  }

  // Branch manager can only see their branch
  if (user.role === "branch_manager") {
    return user.branchId || null;
  }

  // Region manager can see all (handled separately with region logic)
  if (user.role === "region_manager") {
    return null;
  }

  // Operations manager can see all
  if (user.role === "operations_manager") {
    return null;
  }

  // Regular users are restricted
  return user.branchId || null;
}

/**
 * Check if user can perform admin operations
 */
export function requireAdmin(user: User): void {
  if (user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

/**
 * Check if user can perform region manager operations
 */
export function requireRegionManager(user: User): void {
  if (user.role !== "admin" && user.role !== "region_manager") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Region manager or admin access required",
    });
  }
}

/**
 * Check if user can perform branch manager operations
 */
export function requireBranchManager(user: User): void {
  if (user.role !== "admin" && user.role !== "branch_manager") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Branch manager or admin access required",
    });
  }
}

/**
 * Get visible branches for a user based on their role
 * @param user Current user
 * @param allBranches All available branches
 * @returns Filtered branches that user can see
 */
export function getVisibleBranches(user: User, allBranches: any[]): any[] {
  // Admin can see all branches
  if (user.role === "admin") {
    return allBranches;
  }

  // Branch manager can only see their branch
  if (user.role === "branch_manager" && user.branchId) {
    return allBranches.filter((branch) => branch.id === user.branchId);
  }

  // Region manager can see branches in their region
  if (user.role === "region_manager") {
    // TODO: Implement region filtering when region data is available
    return allBranches;
  }

  // Operations manager can see all
  if (user.role === "operations_manager") {
    return allBranches;
  }

  // Regular users see nothing
  return [];
}

/**
 * Filter data array to only include records for accessible branches
 */
export function filterByBranchAccess<T extends { branchId?: number | null }>(
  user: User,
  data: T[]
): T[] {
  const branchFilter = getUserBranchFilter(user);

  // If no filter (admin/region_manager), return all
  if (branchFilter === null) {
    return data;
  }

  // Filter to user's branch
  return data.filter((item) => item.branchId === branchFilter);
}

/**
 * Get role display name in Turkish
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: "Yönetici",
    branch_manager: "Şube Müdürü",
    region_manager: "Bölge Müdürü",
    operations_manager: "Operasyon Müdürü",
    user: "Kullanıcı",
  };
  return roleNames[role] || role;
}
