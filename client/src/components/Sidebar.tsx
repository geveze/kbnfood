"use client";

import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Building2,
  Target,
  FileText,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  TrendingUp,
  GitCompare,
  Download,
  ClipboardList,
  Mail,
  History,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  hidden_for_branch_manager?: boolean;
}

const navItems: NavItem[] = [
  // Bölge Müdürü (region_manager) navigasyonu
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <Home className="w-4 h-4" />,
    roles: ["admin", "region_manager", "user", "operations_manager"],
  },
  {
    label: "KPI Hedef Kartıları",
    path: "/kpi-target-cards",
    icon: <Target className="w-4 h-4" />,
    roles: ["admin", "region_manager", "user", "branch_manager", "operations_manager"],
  },
  {
    label: "Performans İzleme",
    path: "/performance-monitoring",
    icon: <FileText className="w-4 h-4" />,
    roles: ["admin", "branch_manager", "region_manager"],
    hidden_for_branch_manager: false,
  },
  {
    label: "Değerlendirme Geçmişi",
    path: "/evaluation-history",
    icon: <ClipboardList className="w-4 h-4" />,
    roles: ["admin", "branch_manager", "user", "region_manager"],
    hidden_for_branch_manager: false,
  },
  {
    label: "Deneme Süresi Değerlendirme",
    path: "/probation-evaluation",
    icon: <ClipboardList className="w-4 h-4" />,
    roles: ["admin", "branch_manager", "region_manager"],
    hidden_for_branch_manager: false,
  },
  {
    label: "Deneme Süresi Raporu",
    path: "/probation-evaluation-report",
    icon: <FileText className="w-4 h-4" />,
    roles: ["admin", "branch_manager", "region_manager"],
    hidden_for_branch_manager: false,
  },
  {
    label: "Denetim Özeti",
    path: "/inspection-dashboard",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["admin", "region_manager"],
  },
  {
    label: "Saha Denetim",
    path: "/field-inspection",
    icon: <ClipboardList className="w-4 h-4" />,
    roles: ["admin", "region_manager"],
  },
  {
    label: "Geçmiş Denetimler",
    path: "/field-inspection-history",
    icon: <History className="w-4 h-4" />,
    roles: ["admin", "region_manager", "branch_manager"],
  },

  // Admin ve diğer roller için menü öğeleri
  {
    label: "Performans Analizi",
    path: "/performance",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["user", "admin", "operations_manager"],
  },
  {
    label: "Şube Karşılaştırması",
    path: "/branch-comparison",
    icon: <GitCompare className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Performans Sıralama",
    path: "/branch-performance-ranking",
    icon: <TrendingUp className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Aylık Karşılaştırma",
    path: "/monthly-comparison",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["admin", "operations_manager"],
  },
  {
    label: "Değerlendirme Raporu",
    path: "/evaluation-report",
    icon: <FileText className="w-4 h-4" />,
    roles: ["admin", "branch_manager"],
    hidden_for_branch_manager: false,
  },
  {
    label: "DS Mail",
    path: "/probation-mail",
    icon: <Mail className="w-4 h-4" />,
    roles: ["admin"],
    hidden_for_branch_manager: true,
  },
  {
    label: "Raporlar",
    path: "/reports",
    icon: <FileText className="w-4 h-4" />,
    roles: ["user", "admin", "operations_manager"],
  },
  {
    label: "Tum Subeler Raporu",
    path: "/all-branches-report",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Admin Paneli",
    path: "/admin",
    icon: <Settings className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Şube Yönetimi",
    path: "/branches",
    icon: <Building2 className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Kullanıcı Yönetimi",
    path: "/users",
    icon: <Users className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "KPI Yönetimi",
    path: "/kpi-management",
    icon: <TrendingUp className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Excel Yükleme",
    path: "/excel-upload",
    icon: <Upload className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    label: "Gerçekleşen Veri Girişi",
    path: "/actual-value-input",
    icon: <FileText className="w-4 h-4" />,
    roles: ["admin", "operations_manager"],
  },
  {
    label: "PDF Çıktısı",
    path: "/kpi-target-cards-pdf",
    icon: <Download className="w-4 h-4" />,
    roles: ["admin", "operations_manager"],
  },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "user")
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
            KB
          </div>
          <div>
            <h1 className="font-bold text-sm">Keban Food</h1>
            <p className="text-xs text-gray-500">Performans Sistemi</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.role === "region_manager" ? "Bölge Müdürü" : user?.role}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              location === item.path
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white border border-gray-200"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:bg-white md:border-r md:border-border md:flex md:flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 h-screen w-64 bg-white border-r border-border flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
