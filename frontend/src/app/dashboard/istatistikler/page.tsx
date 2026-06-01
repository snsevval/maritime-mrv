"use client";
import { useEffect, useState } from "react";
import { Ship, FileText, CheckSquare, FileCheck, BarChart2, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { statsApi, getErrorMessage } from "@/lib/api";
import type { DashboardStats } from "@/types";
import { STATUS_LABELS } from "@/types";

const STATUS_BG: Record<string, string> = {
  draft: "bg-gray-400",
  submitted: "bg-blue-500",
  under_verification: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

export default function IstatistiklerPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get()
      .then((r) => setStats(r.data as DashboardStats))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="İstatistikler"
        subtitle="Platform genelinde veri özeti ve emisyon istatistikleri"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Toplam Gemi" value={stats.total_ships} icon={<Ship className="w-5 h-5" />} color="bg-navy-700" />
            <StatCard title="Toplam Rapor" value={stats.total_reports} icon={<FileText className="w-5 h-5" />} color="bg-blue-600" />
            <StatCard title="Doğrulama" value={stats.total_verifications} icon={<CheckSquare className="w-5 h-5" />} color="bg-purple-600" />
            <StatCard title="Uyum Belgesi" value={stats.total_compliance_docs} icon={<FileCheck className="w-5 h-5" />} color="bg-green-600" />
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="w-5 h-5 text-navy-700" />
              <h2 className="text-base font-semibold text-gray-900">Toplam CO₂ Emisyonu</h2>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-navy-700">
                {stats.total_co2_mt.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
              </span>
              <span className="text-xl text-gray-500">ton CO₂</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Onaylanmış tüm raporlardaki kümülatif CO₂ emisyonu</p>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Raporlar — Durum Dağılımı</h2>
            <div className="space-y-4">
              {Object.entries(stats.reports_by_status).map(([status, count]) => {
                const pct = stats.total_reports ? Math.round((count / stats.total_reports) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">
                        {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`${STATUS_BG[status] || "bg-gray-400"} h-3 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-navy-900 to-navy-700 text-white">
              <p className="text-navy-300 text-sm">Onay Oranı</p>
              <p className="text-3xl font-bold mt-1">
                {stats.total_reports
                  ? Math.round(((stats.reports_by_status.approved || 0) / stats.total_reports) * 100)
                  : 0}%
              </p>
              <p className="text-navy-400 text-xs mt-2">Onaylanan / Toplam rapor</p>
            </div>
            <div className="card bg-gradient-to-br from-green-700 to-green-500 text-white">
              <p className="text-green-200 text-sm">Onaylanan Rapor</p>
              <p className="text-3xl font-bold mt-1">{stats.reports_by_status.approved || 0}</p>
              <p className="text-green-200 text-xs mt-2">Başarıyla doğrulanmış</p>
            </div>
            <div className="card bg-gradient-to-br from-yellow-600 to-yellow-400 text-white">
              <p className="text-yellow-100 text-sm">Bekleyen</p>
              <p className="text-3xl font-bold mt-1">
                {(stats.reports_by_status.submitted || 0) + (stats.reports_by_status.under_verification || 0)}
              </p>
              <p className="text-yellow-100 text-xs mt-2">Gönderilmiş + Doğrulamada</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
