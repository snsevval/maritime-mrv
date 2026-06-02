"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Ship, FileText, LogOut, Anchor, Building2, Scale, Settings, Headphones,
} from "lucide-react";
import { clearAuth, getCurrentUser } from "@/lib/auth";
import { getViewMode, type ViewMode } from "@/components/TopBar";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const HALK_NAV_ITEMS: NavItem[] = [
  { href: "/emisyon-raporlari", label: "Emisyon Raporları", icon: FileText, roles: ["shipping_company", "verifier", "ministry"] },
];

const OZEL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/ozel/filom",          label: "Filom",                 icon: Ship,       roles: ["shipping_company", "verifier", "ministry"] },
  { href: "/dashboard/ozel/sirketlerim",    label: "Şirketlerim",           icon: Building2,  roles: ["shipping_company", "verifier", "ministry"] },
  { href: "/dashboard/ozel/uyumluluk",      label: "Uyumluluk Dengeleri",   icon: Scale,      roles: ["shipping_company", "verifier", "ministry"] },
  { href: "/dashboard/ozel/yapilandirma",   label: "Yapılandırma",          icon: Settings,   roles: ["shipping_company", "verifier", "ministry"] },
  { href: "/dashboard/ozel/destek",         label: "Destek",                icon: Headphones, roles: ["shipping_company", "verifier", "ministry"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const [mode, setMode] = useState<ViewMode>("halk");

  useEffect(() => {
    setMode(getViewMode());
    function onModeChange() { setMode(getViewMode()); }
    window.addEventListener("viewModeChange", onModeChange);
    return () => window.removeEventListener("viewModeChange", onModeChange);
  }, []);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  const allItems = mode === "halk" ? HALK_NAV_ITEMS : OZEL_NAV_ITEMS;
  const visibleItems = allItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-16 bg-navy-900 min-h-screen flex flex-col items-center py-4 flex-shrink-0">
      {/* Logo */}
      <div className="w-10 h-10 bg-navy-700 rounded-xl flex items-center justify-center mb-6">
        <Anchor className="w-5 h-5 text-white" />
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                isActive
                  ? "bg-white text-navy-700"
                  : "text-navy-300 hover:bg-navy-700 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Çıkış Yap"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-navy-300 hover:bg-navy-700 hover:text-white transition-all"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </aside>
  );
}
