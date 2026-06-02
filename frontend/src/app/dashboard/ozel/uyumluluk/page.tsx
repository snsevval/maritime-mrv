"use client";
import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, RotateCcw, Star } from "lucide-react";
import { ozelApi, getErrorMessage } from "@/lib/api";
import type { UyumlulukItem, UyumlulukList } from "@/types";
import { cn } from "@/lib/utils";

const BOŞ_FİLTRE = {
  imo_number: "", ship_name: "", company: "",
  cb_status: "", report_status: "", vr_status: "", reporting_period: "",
};

const CB_DURUMLAR = [
  { deger: "compliant",     etiket: "Uyumlu" },
  { deger: "non_compliant", etiket: "Uyumsuz" },
  { deger: "pending",       etiket: "Beklemede" },
];

const RAPOR_DURUMLAR = [
  { deger: "draft",              etiket: "Taslak" },
  { deger: "submitted",          etiket: "Gönderildi" },
  { deger: "under_verification", etiket: "Doğrulamada" },
  { deger: "approved",           etiket: "Onaylandı" },
  { deger: "rejected",           etiket: "Reddedildi" },
];

const VR_DURUMLAR = [
  { deger: "pending",  etiket: "Bekliyor" },
  { deger: "approved", etiket: "Onaylandı" },
  { deger: "rejected", etiket: "Reddedildi" },
];

const DÖNEMLER = ["2024", "2023", "2022", "2021", "2020"];

const BOŞ_VERİ: UyumlulukList = { items: [], total: 0, page: 1, page_size: 10, total_pages: 1 };

function cbRenk(durum?: string | null) {
  if (durum === "compliant")     return "bg-green-100 text-green-700";
  if (durum === "non_compliant") return "bg-red-100 text-red-700";
  if (durum === "pending")       return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

function cbEtiket(durum?: string | null) {
  if (durum === "compliant")     return "Uyumlu";
  if (durum === "non_compliant") return "Uyumsuz";
  if (durum === "pending")       return "Beklemede";
  return "—";
}

function raporRenk(durum?: string | null) {
  const harita: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600", submitted: "bg-blue-100 text-blue-700",
    under_verification: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  };
  return harita[durum ?? ""] ?? "bg-gray-100 text-gray-500";
}

function raporEtiket(durum?: string | null) {
  const harita: Record<string, string> = {
    draft: "Taslak", submitted: "Gönderildi", under_verification: "Doğrulamada",
    approved: "Onaylandı", rejected: "Reddedildi",
  };
  return harita[durum ?? ""] ?? "—";
}

function vrRenk(durum?: string | null) {
  if (durum === "approved") return "bg-green-100 text-green-700";
  if (durum === "rejected") return "bg-red-100 text-red-700";
  if (durum === "pending")  return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

function vrEtiket(durum?: string | null) {
  if (durum === "approved") return "Onaylandı";
  if (durum === "rejected") return "Reddedildi";
  if (durum === "pending")  return "Bekliyor";
  return "—";
}

export default function UyumlulukPage() {
  const [filtre, setFiltre] = useState(BOŞ_FİLTRE);
  const [aktifFiltre, setAktifFiltre] = useState(BOŞ_FİLTRE);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBasi] = useState(10);
  const [data, setData] = useState<UyumlulukList>(BOŞ_VERİ);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [favoriler, setFavoriler] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const k = localStorage.getItem("uyumluluk_favoriler");
      if (k) setFavoriler(new Set(JSON.parse(k)));
    } catch { /* ignore */ }
  }, []);

  const yukle = useCallback(async (f: typeof BOŞ_FİLTRE, s: number, sp: number) => {
    setYukleniyor(true); setHata("");
    try {
      const params: Record<string, unknown> = { page: s, page_size: sp };
      if (f.imo_number)       params.imo_number = f.imo_number;
      if (f.ship_name)        params.ship_name = f.ship_name;
      if (f.company)          params.company = f.company;
      if (f.cb_status)        params.cb_status = f.cb_status;
      if (f.report_status)    params.report_status = f.report_status;
      if (f.vr_status)        params.vr_status = f.vr_status;
      if (f.reporting_period) params.reporting_period = parseInt(f.reporting_period);
      const res = await ozelApi.uyumluluk(params);
      setData(res.data as UyumlulukList);
    } catch (e) { setHata(getErrorMessage(e)); }
    finally { setYukleniyor(false); }
  }, []);

  useEffect(() => { yukle(aktifFiltre, sayfa, sayfaBasi); }, [aktifFiltre, sayfa, sayfaBasi, yukle]);

  function ara()     { setSayfa(1); setAktifFiltre({ ...filtre }); }
  function sifirla() { setFiltre(BOŞ_FİLTRE); setSayfa(1); setAktifFiltre(BOŞ_FİLTRE); }

  function favoriToggle(id: number) {
    setFavoriler((prev) => {
      const y = new Set(prev);
      y.has(id) ? y.delete(id) : y.add(id);
      localStorage.setItem("uyumluluk_favoriler", JSON.stringify(Array.from(y)));
      return y;
    });
  }

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
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">IMO Numarası</label>
              <input className="input-field text-xs h-8" value={filtre.imo_number} onChange={set("imo_number")} placeholder="IMO numarası" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">Gemi Adı</label>
              <input className="input-field text-xs h-8" value={filtre.ship_name} onChange={set("ship_name")} placeholder="Gemi adı" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">CB Durumu</label>
              <select className="input-field text-xs h-8" value={filtre.cb_status} onChange={set("cb_status")}>
                <option value="">Tümü</option>
                {CB_DURUMLAR.map((d) => <option key={d.deger} value={d.deger}>{d.etiket}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">Şirket</label>
              <input className="input-field text-xs h-8" value={filtre.company} onChange={set("company")} placeholder="Şirket adı" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">Rapor Durumu</label>
              <select className="input-field text-xs h-8" value={filtre.report_status} onChange={set("report_status")}>
                <option value="">Tümü</option>
                {RAPOR_DURUMLAR.map((d) => <option key={d.deger} value={d.deger}>{d.etiket}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-600 flex-shrink-0">VR Durumu</label>
              <select className="input-field text-xs h-8" value={filtre.vr_status} onChange={set("vr_status")}>
                <option value="">Tümü</option>
                {VR_DURUMLAR.map((d) => <option key={d.deger} value={d.deger}>{d.etiket}</option>)}
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
                <th className="w-8 px-3 py-2.5 text-center"></th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">İsim</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IMO</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Raporlama Dönemi</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CB Durumu</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">CO₂ [ton]</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">CO₂e [ton]</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Uyum Belgesi No</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Belge Geçerlilik</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rapor Durumu</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">VR Durumu</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Doğrulayıcı</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Şirket</th>
              </tr>
            </thead>
            <tbody>
              {yukleniyor ? (
                <tr><td colSpan={13} className="px-3 py-12 text-center">
                  <div className="w-7 h-7 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={13} className="px-3 py-10 text-center text-gray-400 text-sm">Hiçbir kayıt bulunamadı!</td></tr>
              ) : (
                data.items.map((item: UyumlulukItem) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => favoriToggle(item.id)}>
                        <Star className={cn("w-4 h-4", favoriler.has(item.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-navy-700">{item.ship_name}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-600 text-xs">{item.imo_number}</td>
                    <td className="px-3 py-2.5 text-gray-600">{item.reporting_period ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {item.cb_status
                        ? <span className={cn("badge", cbRenk(item.cb_status))}>{cbEtiket(item.cb_status)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                      {item.co2_total != null ? item.co2_total.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                      {item.co2eq_total != null ? item.co2eq_total.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 font-mono">{item.compliance_doc_number || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {item.compliance_valid_until
                        ? new Date(item.compliance_valid_until).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.report_status
                        ? <span className={cn("badge", raporRenk(item.report_status))}>{raporEtiket(item.report_status)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.vr_status
                        ? <span className={cn("badge", vrRenk(item.vr_status))}>{vrEtiket(item.vr_status)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{item.verifier_name || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600">{item.company_name || "—"}</td>
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
