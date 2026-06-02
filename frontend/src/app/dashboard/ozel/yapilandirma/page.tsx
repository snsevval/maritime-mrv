"use client";
import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Search, RotateCcw, ChevronDown } from "lucide-react";
import { ozelApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/types";
import type { User } from "@/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

const BOŞ_FİLTRE = { full_name: "", email: "", role: "", is_active: "" };

const ROL_SEÇENEKLERİ = [
  { deger: "shipping_company", etiket: "Denizcilik Şirketi" },
  { deger: "verifier",         etiket: "Doğrulayıcı" },
  { deger: "ministry",         etiket: "Bakanlık" },
];

type Sekme = "kullanicilar" | "dogrulayicilar";

export default function YapilandirmaPage() {
  const currentUser = getCurrentUser();
  const [sekme, setSekme] = useState<Sekme>("kullanicilar");
  const [filtre, setFiltre] = useState(BOŞ_FİLTRE);
  const [aktifFiltre, setAktifFiltre] = useState(BOŞ_FİLTRE);
  const [kullanicilar, setKullanicilar] = useState<User[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [islemHata, setIslemHata] = useState("");
  const [acikMenu, setAcikMenu] = useState<number | null>(null);

  const yukle = useCallback(async (f: typeof BOŞ_FİLTRE, s: Sekme) => {
    setYukleniyor(true); setHata("");
    try {
      const params: Record<string, unknown> = {};
      if (f.full_name) params.full_name = f.full_name;
      if (f.email)     params.email = f.email;
      if (f.is_active !== "") params.is_active = f.is_active === "true";
      // Sekmeye göre rol filtresi
      if (s === "dogrulayicilar") {
        params.role = "verifier";
      } else if (f.role) {
        params.role = f.role;
      }
      const res = await ozelApi.kullanicilar(params);
      setKullanicilar(res.data as User[]);
    } catch (e) { setHata(getErrorMessage(e)); }
    finally { setYukleniyor(false); }
  }, []);

  useEffect(() => { yukle(aktifFiltre, sekme); }, [aktifFiltre, sekme, yukle]);

  function ara()     { setAktifFiltre({ ...filtre }); }
  function sifirla() { setFiltre(BOŞ_FİLTRE); setAktifFiltre(BOŞ_FİLTRE); }

  async function toggleActive(userId: number) {
    setIslemHata("");
    try {
      await ozelApi.toggleActive(userId);
      yukle(aktifFiltre, sekme);
    } catch (e) {
      setIslemHata(getErrorMessage(e));
    }
    setAcikMenu(null);
  }

  const set = (k: keyof typeof filtre) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFiltre((f) => ({ ...f, [k]: e.target.value }));

  const canManage = currentUser?.role === "ministry" || currentUser?.role === "verifier";

  return (
    <div className="space-y-4">
      {/* Profil kartı */}
      {currentUser && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">İsim</span>
              <span className="font-medium text-gray-800">{currentUser.full_name}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">Durum</span>
              <span className="badge bg-green-100 text-green-700">Aktif</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">Şehir</span>
              <span className="text-gray-700">{currentUser.company_name || "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">Varlık</span>
              <span className="text-gray-700">{ROLE_LABELS[currentUser.role]}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">E-posta</span>
              <span className="text-gray-700">{currentUser.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 flex">
          {(["kullanicilar", "dogrulayicilar"] as Sekme[]).map((s) => (
            <button key={s} onClick={() => setSekme(s)}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                sekme === s
                  ? "border-navy-500 text-navy-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}>
              {s === "kullanicilar" ? "Kullanıcılar" : "Doğrulayıcılar"}
            </button>
          ))}
        </div>

        {/* Filtreler */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16 flex-shrink-0">İsim</label>
              <input className="input-field text-xs h-8" value={filtre.full_name} onChange={set("full_name")} placeholder="Ad soyad" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-24 flex-shrink-0">Kullanıcı adı</label>
              <input className="input-field text-xs h-8" value={filtre.email} onChange={set("email")} placeholder="E-posta" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16 flex-shrink-0">Durum</label>
              <select className="input-field text-xs h-8" value={filtre.is_active} onChange={set("is_active")}>
                <option value="">Tümü</option>
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>
            {sekme === "kullanicilar" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-16 flex-shrink-0">Roller</label>
                <select className="input-field text-xs h-8" value={filtre.role} onChange={set("role")}>
                  <option value="">Tümü</option>
                  {ROL_SEÇENEKLERİ.map((r) => <option key={r.deger} value={r.deger}>{r.etiket}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={ara} className="btn-primary flex items-center gap-1.5 h-8 px-4 text-xs">
              <Search className="w-3.5 h-3.5" /> Aramak
            </button>
            <button onClick={sifirla} className="btn-secondary flex items-center gap-1.5 h-8 px-4 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
          </div>
        </div>

        {/* Hata */}
        {(hata || islemHata) && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {hata || islemHata}
          </div>
        )}

        {/* Tablo */}
        <div className="overflow-x-auto" onClick={() => setAcikMenu(null)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {canManage && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Eylemler</th>}
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Kullanıcı Adı</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">İsim</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">E-posta</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt Tarihi</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Roller</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Şirket / Kurum</th>
              </tr>
            </thead>
            <tbody>
              {yukleniyor ? (
                <tr><td colSpan={canManage ? 8 : 7} className="px-3 py-12 text-center">
                  <div className="w-7 h-7 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : kullanicilar.length === 0 ? (
                <tr><td colSpan={canManage ? 8 : 7} className="px-3 py-10 text-center text-gray-400 text-sm">Hiçbir kayıt bulunamadı!</td></tr>
              ) : (
                kullanicilar.map((u: User) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {canManage && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setAcikMenu(acikMenu === u.id ? null : u.id)}
                            className="flex items-center gap-1 bg-navy-500 text-white text-xs px-2.5 py-1.5 rounded hover:bg-navy-600 transition-colors"
                          >
                            Eylemler <ChevronDown className="w-3 h-3" />
                          </button>
                          {acikMenu === u.id && (
                            <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                              <button
                                onClick={() => toggleActive(u.id)}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors",
                                  u.is_active ? "text-red-600" : "text-green-600"
                                )}
                              >
                                {u.is_active ? "Devre Dışı Bırak" : "Aktifleştir"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-xs text-gray-600 font-mono">{u.email}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{u.full_name}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{u.email}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("badge", u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                        {u.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{ROLE_LABELS[u.role]}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{u.company_name || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Alt bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400">
            {kullanicilar.length > 0
              ? `1 - ${kullanicilar.length} / ${kullanicilar.length} arası gösteriliyor`
              : "Gösterilecek veri yok."}
          </span>
          <div className="flex items-center gap-2">
            {["PDF", "XLS", "CSV"].map((f) => (
              <button key={f} className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-600 transition-colors">{f}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
