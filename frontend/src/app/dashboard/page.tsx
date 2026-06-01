"use client";
import { useEffect, useState } from "react";
import { Ship, FileText, CheckSquare, FileCheck, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { statsApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { DashboardStats } from "@/types";
import { STATUS_LABELS, ROLE_LABELS } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    statsApi.get()
      .then((r) => setStats(r.data as DashboardStats))
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  return (
    <div>
      <PageHeader
        title="Kontrol Paneli"
        subtitle={user ? `Hoş geldiniz, ${user.full_name} — ${ROLE_LABELS[user.role]}` : undefined}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Toplam Gemi"
              value={stats.total_ships}
              icon={<Ship className="w-5 h-5" />}
              color="bg-navy-700"
            />
            <StatCard
              title="Toplam Rapor"
              value={stats.total_reports}
              icon={<FileText className="w-5 h-5" />}
              color="bg-blue-600"
            />
            <StatCard
              title="Doğrulama"
              value={stats.total_verifications}
              icon={<CheckSquare className="w-5 h-5" />}
              color="bg-purple-600"
            />
            <StatCard
              title="Uyum Belgesi"
              value={stats.total_compliance_docs}
              icon={<FileCheck className="w-5 h-5" />}
              color="bg-green-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Raporlar — Durum Özeti</h2>
              <div className="space-y-3">
                {Object.entries(stats.reports_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-navy-600 h-2 rounded-full"
                          style={{
                            width: stats.total_reports
                              ? `${(count / stats.total_reports) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Toplam CO₂ Emisyonu</h2>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-navy-700">
                  {stats.total_co2_mt.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                </span>
                <span className="text-gray-500 text-lg mb-1">ton CO₂</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Raporlanan tüm emisyon verilerinin toplamı
              </p>
            </div>
          </div>
        </>
      )}

      {!stats && !error && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
