"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ship, FileText, ClipboardList, CheckSquare, FileCheck,
  BarChart2, LogOut, Anchor,
} from "lucide-react";
import { clearAuth, getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",                   label: "Kontrol Paneli",    icon: BarChart2,     roles: ["shipping_company", "verifier", "ministry"] },
  { href: "/dashboard/gemiler",           label: "Gemiler",           icon: Ship,          roles: ["shipping_company", "ministry"] },
  { href: "/dashboard/izleme-planlari",   label: "İzleme Planları",   icon: ClipboardList, roles: ["shipping_company", "ministry"] },
  { href: "/dashboard/emisyon-raporlari", label: "Emisyon Raporları", icon: FileText,      roles: ["shipping_company", "ministry"] },
  { href: "/dashboard/dogrulama",         label: "Doğrulama",         icon: CheckSquare,   roles: ["verifier", "ministry"] },
  { href: "/dashboard/uyum-belgeleri",    label: "Uyum Belgeleri",    icon: FileCheck,     roles: ["shipping_company", "ministry"] },
  { href: "/dashboard/istatistikler",     label: "İstatistikler",     icon: BarChart2,     roles: ["ministry"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  const visibleItems = NAV_ITEMS.filter(
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
