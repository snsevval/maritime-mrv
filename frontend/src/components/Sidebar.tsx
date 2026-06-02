"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ship, FileText, ClipboardList, CheckSquare, FileCheck,
  BarChart2, LogOut, ChevronRight, Anchor,
} from "lucide-react";
import { clearAuth, getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Kontrol Paneli",
    icon: BarChart2,
    roles: ["shipping_company", "verifier", "ministry"],
  },
  {
    href: "/dashboard/gemiler",
    label: "Gemiler",
    icon: Ship,
    roles: ["shipping_company", "ministry"],
  },
  {
    href: "/dashboard/izleme-planlari",
    label: "İzleme Planları",
    icon: ClipboardList,
    roles: ["shipping_company", "ministry"],
  },
  {
    href: "/dashboard/emisyon-raporlari",
    label: "Emisyon Raporları",
    icon: FileText,
    roles: ["shipping_company", "ministry"],
  },
  {
    href: "/dashboard/dogrulama",
    label: "Doğrulama",
    icon: CheckSquare,
    roles: ["verifier", "ministry"],
  },
  {
    href: "/dashboard/uyum-belgeleri",
    label: "Uyum Belgeleri",
    icon: FileCheck,
    roles: ["shipping_company", "ministry"],
  },
  {
    href: "/dashboard/istatistikler",
    label: "İstatistikler",
    icon: BarChart2,
    roles: ["ministry"],
  },
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
    <aside className="w-64 bg-navy-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Denizcilik MRV</p>
            <p className="text-navy-300 text-xs">Platformu</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-navy-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-navy-800">
        {user && (
          <div className="mb-3 px-3">
            <p className="text-white text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-navy-400 text-xs">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
