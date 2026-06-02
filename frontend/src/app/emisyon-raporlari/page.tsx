"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { publicApi, getErrorMessage } from "@/lib/api";
import type { ShipReport, ShipReportList, DatasetVersion } from "@/types";
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Download, Eye, RotateCcw, History, Search, Anchor,
} from "lucide-react";

const GEMI_TURLERI = [
  { deger: "Bulk Carrier",    etiket: "Dökme Yük Gemisi" },
  { deger: "Container Ship",  etiket: "Konteyner Gemisi" },
  { deger: "Tanker",          etiket: "Tanker" },
  { deger: "Ro-Ro",           etiket: "Ro-Ro" },
  { deger: "Passenger Ship",  etiket: "Yolcu Gemisi" },
  { deger: "General Cargo",   etiket: "Genel Kargo" },
  { deger: "Gas Carrier",     etiket: "Gaz Taşıyıcı" },
  { deger: "Chemical Tanker", etiket: "Kimyasal Tanker" },
];

const RAPORLAMA_DONEM = ["2024", "2023", "2022", "2021"];
const BOS_FILTRE = { imo_number: "", ship_name: "", reporting_period: "", ship_type: "", report_coverage: "" };

type SortKey = keyof ShipReport;
type SortDir = "asc" | "desc";

export default function PublicEmisyonRaporlariPage() {
  const [data, setData] = useState<ShipReportList>({ items: [], total: 0, page: 1, page_size: 10, total_pages: 1 });
  const [surumler, setSurumler] = useState<DatasetVersion[]>([]);
  const [filtre, setFiltre] = useState(BOS_FILTRE);
  const [aktifFiltre, setAktifFiltre] = useState(BOS_FILTRE);
  const [sayfa, setSayfa] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("ship_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [detayModal, setDetayModal] = useState<ShipReport | null>(null);
  const [surumModal, setSurumModal] = useState<DatasetVersion | null>(null);
  const [acikIslemId, setAcikIslemId] = useState<number | null>(null);
  const [acikSurumId, setAcikSurumId] = useState<number | null>(null);
  const [adOneri, setAdOneri] = useState<string[]>([]);
  const [oneriGoster, setOneriGoster] = useState(false);

  const raporlariYukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const params: Record<string, string | number> = { page: sayfa, page_size: 10 };
      if (aktifFiltre.imo_number)       params.imo_number       = aktifFiltre.imo_number;
      if (aktifFiltre.ship_name)        params.ship_name        = aktifFiltre.ship_name;
      if (aktifFiltre.reporting_period) params.reporting_period = parseInt(aktifFiltre.reporting_period);
      if (aktifFiltre.ship_type)        params.ship_type        = aktifFiltre.ship_type;
      if (aktifFiltre.report_coverage)  params.report_coverage  = aktifFiltre.report_coverage;
      const res = await publicApi.get("/api/ship-reports", { params });
      setData(res.data as ShipReportList);
    } catch (e) { console.error(getErrorMessage(e)); }
    finally { setYukleniyor(false); }
  }, [sayfa, aktifFiltre]);

  useEffect(() => { raporlariYukle(); }, [raporlariYukle]);
  useEffect(() => {
    publicApi.get("/api/dataset-versions").then((r) => setSurumler(r.data as DatasetVersion[])).catch(() => {});
  }, []);

  const sirali = [...data.items].sort((a, b) => {
    const av = a[sortKey] ?? ""; const bv = b[sortKey] ?? "";
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function siralamaToggle(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function ara() { setSayfa(1); setAktifFiltre({ ...filtre }); }
  function sifirla() { setFiltre(BOS_FILTRE); setAktifFiltre(BOS_FILTRE); setSayfa(1); }

  function adGirisi(deger: string) {
    setFiltre((f) => ({ ...f, ship_name: deger }));
    if (deger.length > 1) {
      const q = deger.toLowerCase();
      const oneriler = Array.from(new Set(
        data.items.map((r) => r.ship_name).filter((n) => n.toLowerCase().includes(q))
      )).slice(0, 6);
      setAdOneri(oneriler);
      setOneriGoster(oneriler.length > 0);
    } else { setOneriGoster(false); }
  }

  function indir(v: DatasetVersion) {
    if (v.file_url) window.open(v.file_url, "_blank");
    else alert(`"${v.file_name ?? `veri_seti_${v.reporting_period}_s${v.version}.csv`}" dosyası indiriliyor…`);
  }

  function SiralamaIkonu({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const sayiFormat = (n?: number) => n != null ? n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "—";
  const tarihFormat = (iso: string) => new Date(iso).toLocaleDateString("tr-TR");
  const gosterimBaslangic = data.total === 0 ? 0 : (sayfa - 1) * data.page_size + 1;
  const gosterimBitis = Math.min(sayfa * data.page_size, data.total);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-700 rounded-lg flex items-center justify-center">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">TR-MRV Sistemi</p>
              <p className="text-navy-300 text-xs">GHG Emisyon Raporu</p>
            </div>
          </div>
          <Link href="/login" className="bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Giriş Yap
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Bilgilendirme */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-gray-600 leading-relaxed">
          <p className="mb-3">
            (EU) 2015/757 Yönetmeliği&apos;nin 21. Maddesi uyarınca deniz taşımacılığından kaynaklanan
            sera gazı emisyonlarının izlenmesi, raporlanması ve doğrulanmasına ilişkin bilgilerin
            kamuoyuyla paylaşılması. Bilgilere arama aracı üzerinden erişilebilir veya daha fazla
            analiz için elektronik tabloya aktarılabilir.
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Emisyon raporlama kuralları IMO DCS ve AB MRV yönetmeliği çerçevesinde uygulanmaktadır.</li>
            <li>CO₂ raporlama yükümlülükleri 5.000 GT ve üzeri gemiler için geçerlidir.</li>
            <li>Yıllık raporlama dönemi 1 Ocak – 31 Aralık arasındaki seyir verilerini kapsar.</li>
            <li>Raporlar bir sonraki yılın 30 Nisan tarihine kadar sunulur.</li>
          </ul>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">IMO Numarası</label>
              <input className="input-field" placeholder="IMO numarası girin" value={filtre.imo_number}
                onChange={(e) => setFiltre((f) => ({ ...f, imo_number: e.target.value }))} />
            </div>
            <div className="relative">
              <label className="label">Gemi Adı</label>
              <input className="input-field" placeholder="Gemi adı ara…" value={filtre.ship_name}
                onChange={(e) => adGirisi(e.target.value)}
                onBlur={() => setTimeout(() => setOneriGoster(false), 150)} />
              {oneriGoster && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {adOneri.map((s) => (
                    <button key={s} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onMouseDown={() => { setFiltre((f) => ({ ...f, ship_name: s })); setOneriGoster(false); }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Raporlama Dönemi</label>
              <select className="input-field" value={filtre.reporting_period}
                onChange={(e) => setFiltre((f) => ({ ...f, reporting_period: e.target.value }))}>
                <option value="">Tümü</option>
                {RAPORLAMA_DONEM.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Gemi Türü</label>
              <select className="input-field" value={filtre.ship_type}
                onChange={(e) => setFiltre((f) => ({ ...f, ship_type: e.target.value }))}>
                <option value="">Tümü</option>
                {GEMI_TURLERI.map((t) => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rapor Kapsamı</label>
              <select className="input-field" value={filtre.report_coverage}
                onChange={(e) => setFiltre((f) => ({ ...f, report_coverage: e.target.value }))}>
                <option value="">Tümü</option>
                <option value="Full Reporting Period">Tam Raporlama Dönemi</option>
                <option value="Partial Reporting Period">Kısmi Raporlama Dönemi</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={ara} className="btn-primary flex items-center gap-2">
              <Search className="w-4 h-4" /> Ara
            </button>
            <button onClick={sifirla} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Sıfırla
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Gemi Emisyon Raporları</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-28">İşlemler</th>
                  {([
                    ["imo_number", "IMO"], ["ship_name", "Gemi Adı"], ["ship_type", "Gemi Türü"],
                    ["company", "Şirket"], ["reporting_period", "Dönem"],
                    ["co2_emissions", "Toplam CO₂ (t)"], ["co2eq_emissions", "Toplam CO₂e (t)"],
                  ] as [SortKey, string][]).map(([col, etiket]) => (
                    <th key={col} className="table-header cursor-pointer select-none hover:bg-gray-100"
                      onClick={() => siralamaToggle(col)}>
                      {etiket}<SiralamaIkonu col={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yukleniyor ? (
                  <tr><td colSpan={8} className="text-center py-14">
                    <div className="w-7 h-7 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : sirali.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-14 text-gray-400 text-sm">Kayıt bulunamadı</td></tr>
                ) : sirali.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                    <td className="table-cell">
                      <div className="relative inline-block">
                        <button className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                          onClick={() => setAcikIslemId(acikIslemId === r.id ? null : r.id)}>
                          İşlemler <ChevronDown className="w-3 h-3" />
                        </button>
                        {acikIslemId === r.id && (
                          <div className="absolute z-30 left-0 top-8 w-36 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => { setDetayModal(r); setAcikIslemId(null); }}>
                              <Eye className="w-3.5 h-3.5" /> Görüntüle
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{r.imo_number}</td>
                    <td className="table-cell font-medium text-navy-800">{r.ship_name}</td>
                    <td className="table-cell text-xs text-gray-500">
                      {GEMI_TURLERI.find((t) => t.deger === r.ship_type)?.etiket ?? r.ship_type ?? "—"}
                    </td>
                    <td className="table-cell text-xs text-gray-500">{r.company ?? "—"}</td>
                    <td className="table-cell text-center font-semibold">{r.reporting_period}</td>
                    <td className="table-cell text-right tabular-nums">{sayiFormat(r.co2_emissions)}</td>
                    <td className="table-cell text-right tabular-nums">{sayiFormat(r.co2eq_emissions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button className="btn-secondary px-2 py-1 text-xs disabled:opacity-40" onClick={() => setSayfa(1)} disabled={sayfa <= 1}>«</button>
              <button className="btn-secondary px-2 py-1 text-xs disabled:opacity-40" onClick={() => setSayfa((p) => Math.max(1, p - 1))} disabled={sayfa <= 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 bg-navy-700 text-white rounded text-sm font-medium min-w-[2.5rem] text-center">{sayfa}</span>
              <button className="btn-secondary px-2 py-1 text-xs disabled:opacity-40" onClick={() => setSayfa((p) => Math.min(data.total_pages, p + 1))} disabled={sayfa >= data.total_pages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button className="btn-secondary px-2 py-1 text-xs disabled:opacity-40" onClick={() => setSayfa(data.total_pages)} disabled={sayfa >= data.total_pages}>»</button>
            </div>
            <span className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{gosterimBaslangic} – {gosterimBitis}</span> gösteriliyor, toplam {data.total.toLocaleString("tr-TR")}
            </span>
          </div>
        </div>

        {/* Veri Seti Sürümleri */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Veri Seti Sürümleri</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-36">İşlemler</th>
                  <th className="table-header">Raporlama Dönemi</th>
                  <th className="table-header">Sürüm</th>
                  <th className="table-header">Oluşturulma Tarihi</th>
                  <th className="table-header">Dosya</th>
                </tr>
              </thead>
              <tbody>
                {surumler.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Kayıt bulunamadı</td></tr>
                ) : surumler.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="relative inline-block">
                        <button className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                          onClick={() => setAcikSurumId(acikSurumId === v.id ? null : v.id)}>
                          İşlemler <ChevronDown className="w-3 h-3" />
                        </button>
                        {acikSurumId === v.id && (
                          <div className="absolute z-30 left-0 top-8 w-52 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => { indir(v); setAcikSurumId(null); }}>
                              <Download className="w-3.5 h-3.5" /> İndir
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => { setSurumModal(v); setAcikSurumId(null); }}>
                              <History className="w-3.5 h-3.5" /> Önceki Sürümleri Görüntüle
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell font-semibold">{v.reporting_period}</td>
                    <td className="table-cell">{v.version}</td>
                    <td className="table-cell">{tarihFormat(v.generation_date)}</td>
                    <td className="table-cell font-mono text-xs text-navy-700">
                      {v.file_name ?? `veri_seti_${v.reporting_period}_s${v.version}.csv`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detay Modal */}
      <Modal open={detayModal !== null} onClose={() => setDetayModal(null)} title="Gemi Emisyon Raporu Detayı" size="lg">
        {detayModal && (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div><dt className="text-gray-500 mb-0.5">IMO Numarası</dt><dd className="font-semibold font-mono">{detayModal.imo_number}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Gemi Adı</dt><dd className="font-semibold">{detayModal.ship_name}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Gemi Türü</dt><dd>{GEMI_TURLERI.find((t) => t.deger === detayModal.ship_type)?.etiket ?? detayModal.ship_type ?? "—"}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Şirket</dt><dd>{detayModal.company ?? "—"}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Raporlama Dönemi</dt><dd className="font-semibold">{detayModal.reporting_period}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Rapor Kapsamı</dt><dd>{detayModal.report_coverage === "Full Reporting Period" ? "Tam Raporlama Dönemi" : detayModal.report_coverage ?? "—"}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Toplam CO₂</dt><dd className="font-semibold text-red-700">{sayiFormat(detayModal.co2_emissions)} t</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Toplam CO₂e</dt><dd className="font-semibold text-orange-700">{sayiFormat(detayModal.co2eq_emissions)} t</dd></div>
          </dl>
        )}
      </Modal>

      {/* Sürüm Modal */}
      <Modal open={surumModal !== null} onClose={() => setSurumModal(null)} title="Veri Seti Sürümü" size="md">
        {surumModal && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Raporlama Dönemi</dt><dd className="font-semibold">{surumModal.reporting_period}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Sürüm</dt><dd>{surumModal.version}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Oluşturulma Tarihi</dt><dd>{tarihFormat(surumModal.generation_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Dosya</dt><dd className="font-mono text-xs text-navy-700">{surumModal.file_name}</dd></div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
