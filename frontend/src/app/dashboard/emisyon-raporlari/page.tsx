"use client";
import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { shipReportsApi, getErrorMessage } from "@/lib/api";
import type { ShipReport, ShipReportList, DatasetVersion } from "@/types";
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Download, Eye, RotateCcw, History, Search,
} from "lucide-react";

// ── constants ──────────────────────────────────────────────────────────────────

const SHIP_TYPES = [
  "Bulk Carrier", "Container Ship", "Tanker", "Ro-Ro",
  "Passenger Ship", "General Cargo", "Gas Carrier", "Chemical Tanker",
];

const REPORTING_PERIODS = ["2024", "2023", "2022", "2021"];

const EMPTY_FILTERS = {
  imo_number: "",
  ship_name: "",
  reporting_period: "",
  ship_type: "",
  report_coverage: "",
};

type SortKey = keyof ShipReport;
type SortDir = "asc" | "desc";

// ── component ──────────────────────────────────────────────────────────────────

export default function EmisyonRaporlariPage() {
  const [data, setData] = useState<ShipReportList>({
    items: [], total: 0, page: 1, page_size: 10, total_pages: 1,
  });
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("ship_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [detailModal, setDetailModal] = useState<ShipReport | null>(null);
  const [versionModal, setVersionModal] = useState<DatasetVersion | null>(null);

  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [openVersionId, setOpenVersionId] = useState<number | null>(null);

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── data loading ────────────────────────────────────────────────────────────

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: 10 };
      if (activeFilters.imo_number)     params.imo_number      = activeFilters.imo_number;
      if (activeFilters.ship_name)      params.ship_name       = activeFilters.ship_name;
      if (activeFilters.reporting_period) params.reporting_period = parseInt(activeFilters.reporting_period);
      if (activeFilters.ship_type)      params.ship_type       = activeFilters.ship_type;
      if (activeFilters.report_coverage) params.report_coverage = activeFilters.report_coverage;
      const res = await shipReportsApi.list(params);
      setData(res.data as ShipReportList);
    } catch (e) {
      console.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, activeFilters]);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const res = await shipReportsApi.datasetVersions();
      setVersions(res.data as DatasetVersion[]);
    } catch (e) {
      console.error(getErrorMessage(e));
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);
  useEffect(() => { loadVersions(); }, [loadVersions]);

  // ── sort (client-side within page) ─────────────────────────────────────────

  const sorted = [...data.items].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  // ── filter actions ──────────────────────────────────────────────────────────

  function handleSearch() {
    setPage(1);
    setActiveFilters({ ...filters });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handleNameInput(value: string) {
    setFilters((f) => ({ ...f, ship_name: value }));
    if (value.length > 1) {
      const q = value.toLowerCase();
      const suggestions = [...new Set(
        data.items.map((r) => r.ship_name).filter((n) => n.toLowerCase().includes(q))
      )].slice(0, 6);
      setNameSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  // ── download ────────────────────────────────────────────────────────────────

  function handleDownload(v: DatasetVersion) {
    if (v.file_url) {
      window.open(v.file_url, "_blank");
    } else {
      const name = v.file_name ?? `dataset_${v.reporting_period}_v${v.version}.csv`;
      alert(`"${name}" dosyası indiriliyor…`);
    }
  }

  // ── helpers ─────────────────────────────────────────────────────────────────

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const displayStart = data.total === 0 ? 0 : (page - 1) * data.page_size + 1;
  const displayEnd   = Math.min(page * data.page_size, data.total);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const fmtNum = (n?: number) =>
    n != null ? n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "—";

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emisyon Raporları"
        subtitle="Gemi Emisyon Raporlama Veritabanı"
      />

      {/* ── Bilgilendirme Alanı ─────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Bilgilendirme
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside leading-relaxed">
          <li>
            Emisyon raporlama kuralları IMO DCS (Veri Toplama Sistemi) ve EU MRV yönetmeliği
            çerçevesinde uygulanmaktadır.
          </li>
          <li>
            MRV sistemi; deniz taşımacılığı emisyonlarının izlenmesi, raporlanması ve
            doğrulanması süreçlerini kapsamaktadır.
          </li>
          <li>
            CO₂ raporlama yükümlülükleri 5.000 GT ve üzeri gemiler için geçerlidir; yıllık
            olarak yetkili kurumlara iletilmelidir.
          </li>
          <li>
            Yıllık raporlama dönemi 1 Ocak – 31 Aralık arasındaki seyir verilerini kapsar ve
            raporlar bir sonraki yılın 30 Nisan tarihine kadar sunulur.
          </li>
        </ul>
      </div>

      {/* ── Arama ve Filtre Paneli ──────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Arama ve Filtrele</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div>
            <label className="label">IMO Number</label>
            <input
              type="text"
              className="input-field"
              placeholder="IMO numarası girin"
              value={filters.imo_number}
              onChange={(e) => setFilters((f) => ({ ...f, imo_number: e.target.value }))}
            />
          </div>

          <div className="relative">
            <label className="label">Ship Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Gemi adı ara…"
              value={filters.ship_name}
              onChange={(e) => handleNameInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                {nameSuggestions.map((s) => (
                  <button
                    key={s}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onMouseDown={() => {
                      setFilters((f) => ({ ...f, ship_name: s }));
                      setShowSuggestions(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Reporting Period</label>
            <select
              className="input-field"
              value={filters.reporting_period}
              onChange={(e) => setFilters((f) => ({ ...f, reporting_period: e.target.value }))}
            >
              <option value="">Tümü</option>
              {REPORTING_PERIODS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Ship Type</label>
            <select
              className="input-field"
              value={filters.ship_type}
              onChange={(e) => setFilters((f) => ({ ...f, ship_type: e.target.value }))}
            >
              <option value="">Tümü</option>
              {SHIP_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Report Coverage</label>
            <select
              className="input-field"
              value={filters.report_coverage}
              onChange={(e) => setFilters((f) => ({ ...f, report_coverage: e.target.value }))}
            >
              <option value="">Tümü</option>
              <option value="Full Reporting Period">Full Reporting Period</option>
              <option value="Partial Reporting Period">Partial Reporting Period</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={handleSearch} className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* ── Gemi Emisyon Raporları Tablosu ──────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Gemi Emisyon Raporları</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-28">Actions</th>
                {(
                  [
                    ["imo_number",     "IMO"],
                    ["ship_name",      "Name"],
                    ["ship_type",      "Ship Type"],
                    ["company",        "Company"],
                    ["reporting_period","RP"],
                    ["co2_emissions",  "Total CO₂ Emissions (t)"],
                    ["co2eq_emissions","Total CO₂eq Emissions (t)"],
                  ] as [SortKey, string][]
                ).map(([col, label]) => (
                  <th
                    key={col}
                    className="table-header cursor-pointer select-none hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSort(col)}
                  >
                    {label}
                    <SortIcon col={col} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <div className="w-7 h-7 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-gray-400 text-sm">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    {/* Actions dropdown */}
                    <td className="table-cell">
                      <div className="relative inline-block">
                        <button
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                          onClick={() =>
                            setOpenActionId(openActionId === r.id ? null : r.id)
                          }
                        >
                          Actions <ChevronDown className="w-3 h-3" />
                        </button>
                        {openActionId === r.id && (
                          <div className="absolute z-30 left-0 top-8 w-36 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => {
                                setDetailModal(r);
                                setOpenActionId(null);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{r.imo_number}</td>
                    <td className="table-cell font-medium text-navy-800">{r.ship_name}</td>
                    <td className="table-cell text-xs text-gray-500">{r.ship_type ?? "—"}</td>
                    <td className="table-cell text-xs text-gray-500">{r.company ?? "—"}</td>
                    <td className="table-cell text-center font-semibold">{r.reporting_period}</td>
                    <td className="table-cell text-right tabular-nums">{fmtNum(r.co2_emissions)}</td>
                    <td className="table-cell text-right tabular-nums">{fmtNum(r.co2eq_emissions)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Sayfalama ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              title="İlk sayfa"
            >
              «
            </button>
            <button
              className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 bg-navy-700 text-white rounded text-sm font-medium min-w-[2.5rem] text-center">
              {page}
            </span>
            <button
              className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
              onClick={() => setPage(data.total_pages)}
              disabled={page >= data.total_pages}
              title="Son sayfa"
            >
              »
            </button>
            <button
              className="btn-secondary px-2 py-1 text-xs flex items-center gap-1 ml-2"
              onClick={loadReports}
              title="Yenile"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="text-sm text-gray-500 text-right">
            <span>
              Page{" "}
              <span className="font-medium text-gray-700">{page}</span>
              {" "}of {data.total_pages.toLocaleString()}
            </span>
            <span className="ml-5">
              Displaying{" "}
              <span className="font-medium text-gray-700">
                {displayStart} – {displayEnd}
              </span>
              {" "}of {data.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dosya ve Versiyon Tablosu ───────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Dataset Versions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-36">Actions</th>
                <th className="table-header">Reporting Period</th>
                <th className="table-header">Version</th>
                <th className="table-header">Generation Date</th>
                <th className="table-header">File</th>
              </tr>
            </thead>
            <tbody>
              {versionsLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <div className="w-7 h-7 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                versions.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    {/* File actions dropdown */}
                    <td className="table-cell">
                      <div className="relative inline-block">
                        <button
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                          onClick={() =>
                            setOpenVersionId(openVersionId === v.id ? null : v.id)
                          }
                        >
                          Actions <ChevronDown className="w-3 h-3" />
                        </button>
                        {openVersionId === v.id && (
                          <div className="absolute z-30 left-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => {
                                handleDownload(v);
                                setOpenVersionId(null);
                              }}
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => {
                                setVersionModal(v);
                                setOpenVersionId(null);
                              }}
                            >
                              <History className="w-3.5 h-3.5" /> View Previous Versions
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell font-semibold">{v.reporting_period}</td>
                    <td className="table-cell">{v.version}</td>
                    <td className="table-cell">{fmtDate(v.generation_date)}</td>
                    <td className="table-cell">
                      <span className="text-xs font-mono text-navy-700">
                        {v.file_name ?? `dataset_${v.reporting_period}_v${v.version}.csv`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Gemi Detay Modalı ───────────────────────────────────────── */}
      <Modal
        open={detailModal !== null}
        onClose={() => setDetailModal(null)}
        title="Gemi Emisyon Raporu Detayı"
        size="lg"
      >
        {detailModal && (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-0.5">IMO Number</dt>
              <dd className="font-semibold font-mono">{detailModal.imo_number}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Ship Name</dt>
              <dd className="font-semibold">{detailModal.ship_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Ship Type</dt>
              <dd>{detailModal.ship_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Company</dt>
              <dd>{detailModal.company ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Reporting Period</dt>
              <dd className="font-semibold">{detailModal.reporting_period}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Report Coverage</dt>
              <dd>{detailModal.report_coverage ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Total CO₂ Emissions</dt>
              <dd className="font-semibold text-red-700">
                {fmtNum(detailModal.co2_emissions)} t
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-0.5">Total CO₂eq Emissions</dt>
              <dd className="font-semibold text-orange-700">
                {fmtNum(detailModal.co2eq_emissions)} t
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* ── Versiyon Geçmişi Modalı ─────────────────────────────────── */}
      <Modal
        open={versionModal !== null}
        onClose={() => setVersionModal(null)}
        title={
          versionModal
            ? `Version History — ${versionModal.reporting_period}`
            : "Version History"
        }
        size="lg"
      >
        {versionModal && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {versionModal.reporting_period} dönemine ait tüm versiyon geçmişi.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">Version</th>
                  <th className="table-header">Generation Date</th>
                  <th className="table-header">Download</th>
                </tr>
              </thead>
              <tbody>
                {versions
                  .filter((v) => v.reporting_period === versionModal.reporting_period)
                  .sort((a, b) => b.version - a.version)
                  .map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="table-cell font-semibold">{v.version}</td>
                      <td className="table-cell">{fmtDate(v.generation_date)}</td>
                      <td className="table-cell">
                        <button
                          className="text-navy-700 hover:underline flex items-center gap-1 text-xs"
                          onClick={() => handleDownload(v)}
                        >
                          <Download className="w-3 h-3" />
                          {v.file_name ?? `dataset_${v.reporting_period}_v${v.version}.csv`}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* overlay to close dropdowns on outside click */}
      {(openActionId !== null || openVersionId !== null) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setOpenActionId(null);
            setOpenVersionId(null);
          }}
        />
      )}
    </div>
  );
}
