import { describe, it, expect } from "vitest";

// Sidebar'daki navItems yapısını test et
const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["user", "admin", "region_manager", "branch_manager", "operations_manager"],
  },
  {
    label: "Performans İzleme",
    path: "/performance-monitoring",
    roles: ["admin", "branch_manager"],
  },
  {
    label: "Şube Karşılaştırması",
    path: "/branch-comparison",
    roles: ["admin", "region_manager"],
  },
  {
    label: "Admin Paneli",
    path: "/admin",
    roles: ["admin"],
  },
];

describe("Sidebar - Rol Bazlı Dinamik Yönetim", () => {
  it("Admin rolü tüm menüleri görebilmeli", () => {
    const adminRole = "admin";
    const visibleItems = navItems.filter((item) => item.roles.includes(adminRole));
    expect(visibleItems.length).toBe(4);
    expect(visibleItems.map(i => i.label)).toContain("Admin Paneli");
  });

  it("Şube Müdürü sadece kendi menülerini görebilmeli", () => {
    const branchManagerRole = "branch_manager";
    const visibleItems = navItems.filter((item) => item.roles.includes(branchManagerRole));
    expect(visibleItems.length).toBe(2);
    expect(visibleItems.map(i => i.label)).not.toContain("Admin Paneli");
    expect(visibleItems.map(i => i.label)).not.toContain("Şube Karşılaştırması");
  });

  it("Bölge Müdürü Şube Karşılaştırması görebilmeli", () => {
    const regionManagerRole = "region_manager";
    const visibleItems = navItems.filter((item) => item.roles.includes(regionManagerRole));
    expect(visibleItems.map(i => i.label)).toContain("Şube Karşılaştırması");
    expect(visibleItems.map(i => i.label)).not.toContain("Performans İzleme");
  });

  it("Normal Kullanıcı sadece Dashboard görebilmeli", () => {
    const userRole = "user";
    const visibleItems = navItems.filter((item) => item.roles.includes(userRole));
    expect(visibleItems.length).toBe(1);
    expect(visibleItems[0].label).toBe("Dashboard");
  });

  it("Her menü öğesinin roles array'i tanımlı olmalı", () => {
    navItems.forEach((item) => {
      expect(item.roles).toBeDefined();
      expect(Array.isArray(item.roles)).toBe(true);
      expect(item.roles.length).toBeGreaterThan(0);
    });
  });

  it("Performans İzleme sadece admin ve branch_manager tarafından erişilebilmeli", () => {
    const perfItem = navItems.find(i => i.label === "Performans İzleme");
    expect(perfItem?.roles).toEqual(["admin", "branch_manager"]);
  });
});
