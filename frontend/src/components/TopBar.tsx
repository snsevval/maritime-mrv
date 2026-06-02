"use client";
import { Bell, HelpCircle, ChevronDown, ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/types";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":                   "Kontrol Paneli",
  "/dashboard/gemiler":           "Gemiler",
  "/dashboard/izleme-planlari":   "İzleme Planları",
  "/dashboard/emisyon-raporlari": "Emisyon Raporları",
  "/dashboard/dogrulama":         "Doğrulama",
  "/dashboard/uyum-belgeleri":    "Uyum Belgeleri",
  "/dashboard/istatistikler":     "İstatistikler",
};

export default function TopBar() {
  const pathname = usePathname();
  const user = getCurrentUser();
  const pageLabel = PAGE_LABELS[pathname] ?? "";
  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Home className="w-3.5 h-3.5" />
        <span>Ana Sayfa</span>
        {pageLabel && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800 font-medium">{pageLabel}</span>
          </>
        )}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-navy-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Help */}
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200">
            <div className="w-8 h-8 bg-navy-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </header>
  );
}
