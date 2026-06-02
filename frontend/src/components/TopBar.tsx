"use client";
import { Bell, HelpCircle, ChevronDown, ChevronRight, Home, Globe, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/types";

export type ViewMode = "halk" | "ozel";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":                        "Kontrol Paneli",
  "/dashboard/gemiler":                "Gemiler",
  "/dashboard/izleme-planlari":        "İzleme Planları",
  "/dashboard/emisyon-raporlari":      "Emisyon Raporları",
  "/dashboard/dogrulama":              "Doğrulama",
  "/dashboard/uyum-belgeleri":         "Uyum Belgeleri",
  "/dashboard/istatistikler":          "İstatistikler",
  "/dashboard/ozel/filom":             "Filom",
  "/dashboard/ozel/sirketlerim":       "Şirketlerim",
  "/dashboard/ozel/uyumluluk":         "Uyumluluk Dengeleri",
  "/dashboard/ozel/yapilandirma":      "Yapılandırma",
  "/dashboard/ozel/destek":            "Destek",
};

export function getViewMode(): ViewMode {
  if (typeof window === "undefined") return "halk";
  return (localStorage.getItem("viewMode") as ViewMode) ?? "halk";
}

export function setViewMode(mode: ViewMode) {
  localStorage.setItem("viewMode", mode);
  window.dispatchEvent(new Event("viewModeChange"));
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const pageLabel = PAGE_LABELS[pathname] ?? "";
  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const [mode, setMode] = useState<ViewMode>("halk");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(getViewMode());
    function onModeChange() { setMode(getViewMode()); }
    window.addEventListener("viewModeChange", onModeChange);
    return () => window.removeEventListener("viewModeChange", onModeChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectMode(m: ViewMode) {
    setViewMode(m);
    setDropdownOpen(false);
  }

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
        <button
          onClick={() => router.push("/dashboard/ozel/destek")}
          title="Destek"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User info + mode dropdown */}
        {user && (
          <div className="relative pl-3 ml-1 border-l border-gray-200" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 bg-navy-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">{initials}</span>
              </div>
              <div className="leading-tight text-left">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 text-xs text-gray-400 font-medium border-b border-gray-100">
                  Görünüm Modu
                </div>
                <button
                  onClick={() => selectMode("halk")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    mode === "halk"
                      ? "bg-navy-50 text-navy-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Halk
                  {mode === "halk" && <span className="ml-auto w-2 h-2 rounded-full bg-navy-500" />}
                </button>
                <button
                  onClick={() => selectMode("ozel")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    mode === "ozel"
                      ? "bg-navy-50 text-navy-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Özel
                  {mode === "ozel" && <span className="ml-auto w-2 h-2 rounded-full bg-navy-500" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
