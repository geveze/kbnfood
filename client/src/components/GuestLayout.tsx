import React from "react";

interface GuestLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * GuestLayout - İzole görünüm için layout
 * Menü, sidebar ve diğer navigasyon öğeleri gizlenir
 * Sadece logo ve içerik gösterilir
 */
export default function GuestLayout({ children, title = "Keban Food" }: GuestLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Üst Bilgi Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          {/* Keban Food Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">KB</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Keban Food</p>
              <p className="text-xs text-gray-600">Şube Performans Yönetim Sistemi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>

      {/* Alt Bilgi */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>© 2026 Keban Food İnsan Kaynakları. Tüm hakları saklıdır.</p>
          <p className="mt-2 text-xs text-gray-500">Bu sayfa salt okunur modda açılmıştır.</p>
        </div>
      </div>
    </div>
  );
}
