"use client";
import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, RotateCcw } from "lucide-react";
import { ozelApi, getErrorMessage } from "@/lib/api";
import type { SirketItem, SirketList } from "@/types";
import { cn } from "@/lib/utils";

const BOŞ_FİLTRE = { company: "", cer_status: "", cvr_status: "", reporting_period: "" };

const CER_DURUMLAR = [
  { deger: "valid", etiket: "Geçerli" },
  { deger: "expired", etiket: "Süresi Dolmuş" },
];

const CVR_DURUMLAR = [
  { deger: "pending", etiket: "Bekliyor" },
  { deger: "approved", etiket: "Onaylandı" },
  { deger: "rejected", etiket: "Reddedildi" },
];

const DÖNEMLER = ["2024", "2023", "2022", "2021", "2020"];

const BOŞ_VERİ: SirketList = { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 };

function cerRenk(durum?: string | null) {
  if (durum === "valid") return "bg-green-100 text-green-700";
  if (durum === "expired") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-500";
}

function cvrRenk(durum?: string | null) {
  if (durum === "approved") return "bg-green-100 text-green-700";
  if (durum === "rejected") return "bg-red-100 text-red-700";
  if (durum === "pending") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

function cerEtiket(durum?: string | null) {
  if (durum === "valid") return "Geçerli";
  if (durum === "expired") return "Süresi Dolmuş";
  return "—";
}

function cvrEtiket(durum?: string | null) {
  if (durum === "approved") return "Onaylandı";
  if (durum === "rejected") return "Reddedildi";
  if (durum === "pending") return "Bekliyor";
  return "—";
}

export default function SirketlerimPage() {
  const [filtre, setFiltre] = useState(BOŞ_FİLTRE);
  const [aktifFiltre, setAktifFiltre] = useState(BOŞ_FİLTRE);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBasi] = useState(10);
  const [data, setData] = useState<SirketList>(BOŞ_VERİ);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const yukle = useCallback(async (f: typeof BOŞ_FİLTRE, s: number, sp: number) => {
    setYukleniyor(true);
    setHata("");
    try {
      const params: Record<string, unknown> = { page: s, page_size: sp };
      if (f.company)          params.company = f.company;
      if (f.cer_status)       params.cer_status = f.cer_status;
      if (f.cvr_status)       params.cvr_status = f.cvr_status;
      if (f.reporting_period) params.reporting_period = parseInt(f.reporting_period);
      const res = await ozelApi.sirketlerim(params);
      setData(res.data as SirketList);
    } catch (e) {
      setHata(getErrorMessage(e));
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(aktifFiltre, sayfa, sayfaBasi); }, [aktifFiltre, sayfa, sayfaBasi, yukle]);

  function ara() { setSayfa(1); setAktifFiltre({ ...filtre }); }
  function sifirla() { setFiltre(BOŞ_FİLTRE); setSayfa(1); setAktifFiltre(BOŞ_FİLTRE); }
  const set = (k: keyof typeof filtre) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFiltre((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Filtrele</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">Şirket</label>
              <input className="input-field text-xs h-8" value={filtre.company} onChange={set("company")} placeholder="Şirket adı" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">CER Durumu</label>
              <select className="input-field text-xs h-8" value={filtre.cer_status} onChange={set("cer_status")}>
                <option value="">Tümü</option>
                {CER_DURUMLAR.map((d) => <option key={d.deger} value={d.deger}>{d.etiket}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">CVR Durumu</label>
              <select className="input-field text-xs h-8" value={filtre.cvr_status} onChange={set("cvr_status")}>
                <option value="">Tümü</option>
                {CVR_DURUMLAR.map((d) => <option key={d.deger} value={d.deger}>{d.etiket}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">Raporlama Dönemi</label>
              <select className="input-field text-xs h-8" value={filtre.reporting_period} onChange={set("reporting_period")}>
                <option value="">Tümü</option>
                {DÖNEMLER.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={ara} className="btn-primary flex items-center gap-1.5 h-8 px-4 text-xs">
              <Search className="w-3.5 h-3.5" /> Aramak
            </button>
            <button onClick={sifirla} className="btn-secondary flex items-center gap-1.5 h-8 px-4 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {hata && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {hata}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Şirket</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">E-posta</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefon</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gemiler</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CER Durumu</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CVR Durumu</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Raporlama Dönemi</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">CO₂e Toplam (ton)</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Doğrulayıcı</th>
              </tr>
            </thead>
            <tbody>
              {yukleniyor ? (
                <tr><td colSpan={9} className="px-3 py-12 text-center">
                  <div className="w-7 h-7 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-gray-400 text-sm">Hiçbir kayıt bulunamadı!</td></tr>
              ) : (
                data.items.map((s: SirketItem) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-navy-700">{s.company_name || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{s.email}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.phone || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-gray-700">{s.total_ships} gemi</span>
                        {s.ship_imos.slice(0, 3).map((imo) => (
                          <span key={imo} className="text-xs text-gray-400">{imo}</span>
                        ))}
                        {s.ship_imos.length > 3 && (
                          <span className="text-xs text-gray-400">+{s.ship_imos.length - 3} daha</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {s.cer_status
                        ? <span className={cn("badge", cerRenk(s.cer_status))}>{cerEtiket(s.cer_status)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {s.cvr_status
                        ? <span className={cn("badge", cvrRenk(s.cvr_status))}>{cvrEtiket(s.cvr_status)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{s.reporting_period ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                      {s.co2_total != null ? s.co2_total.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{s.verifier_name || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Sayfa</span>
              <input type="number" min={1} max={data.total_pages} value={sayfa}
                onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= data.total_pages) setSayfa(v); }}
                className="w-12 border border-gray-300 rounded px-1.5 py-0.5 text-center text-xs" />
              <span>{data.total_pages}&apos;den</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setSayfa((p) => Math.max(1, p - 1))} disabled={sayfa === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setSayfa(p)}
                  className={cn("w-7 h-7 text-xs rounded font-medium transition-colors",
                    sayfa === p ? "bg-navy-500 text-white" : "hover:bg-gray-200 text-gray-600")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setSayfa((p) => Math.min(data.total_pages, p + 1))} disabled={sayfa === data.total_pages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <span className="text-xs text-gray-400">
              {data.total > 0
                ? `${(sayfa - 1) * sayfaBasi + 1} - ${Math.min(sayfa * sayfaBasi, data.total)} / ${data.total} arası gösteriliyor`
                : "Gösterilecek veri yok."}
            </span>
          </div>
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
