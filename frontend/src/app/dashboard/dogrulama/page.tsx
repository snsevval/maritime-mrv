"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, CheckCircle, XCircle, Eye, CheckSquare, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { verificationsApi, reportsApi, statsApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Verification, EmissionReport } from "@/types";
import { VERIFICATION_LABELS, VERIFICATION_COLORS, STATUS_LABELS, STATUS_COLORS } from "@/types";

export default function DogrulamaPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [submittedReports, setSubmittedReports] = useState<EmissionReport[]>([]);
  const [verifiers, setVerifiers] = useState<{ id: number; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"assign" | "review" | "view" | null>(null);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [assignForm, setAssignForm] = useState({ report_id: "", verifier_id: "" });
  const [reviewForm, setReviewForm] = useState({ status: "approved" as "approved" | "rejected", notes: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const user = getCurrentUser();
  const isMinistry = user?.role === "ministry";
  const isVerifier = user?.role === "verifier";

  const load = useCallback(() => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [verificationsApi.list()];
    if (isMinistry) {
      tasks.push(reportsApi.list({ report_status: "submitted" }), statsApi.verifiers());
    }
    Promise.all(tasks)
      .then(([vr, rr, vfr]) => {
        setVerifications((vr as { data: Verification[] }).data);
        if (rr) setSubmittedReports((rr as { data: EmissionReport[] }).data);
        if (vfr) setVerifiers((vfr as { data: { id: number; full_name: string; email: string }[] }).data);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [isMinistry]);

  useEffect(() => { load(); }, [load]);

  function openAssign() {
    setAssignForm({
      report_id: submittedReports[0]?.id.toString() || "",
      verifier_id: verifiers[0]?.id.toString() || "",
    });
    setFormError("");
    setModal("assign");
  }

  function openReview(v: Verification) {
    setSelected(v);
    setReviewForm({ status: "approved", notes: "" });
    setFormError("");
    setModal("review");
  }

  async function handleAssign() {
    setSaving(true);
    setFormError("");
    try {
      await verificationsApi.assign({
        report_id: parseInt(assignForm.report_id),
        verifier_id: parseInt(assignForm.verifier_id),
      });
      setModal(null);
      load();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleReview() {
    if (!selected) return;
    setSaving(true);
    setFormError("");
    try {
      await verificationsApi.update(selected.id, reviewForm);
      setModal(null);
      load();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Doğrulama"
        subtitle={isVerifier ? "Size atanan doğrulama görevleri" : "Emisyon raporu doğrulama yönetimi"}
        action={
          isMinistry ? (
            <button onClick={openAssign} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Doğrulayıcı Ata
            </button>
          ) : undefined
        }
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
      ) : verifications.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {isVerifier ? "Atanmış doğrulama göreviniz bulunmuyor" : "Henüz doğrulama bulunmuyor"}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Gemi</th>
                <th className="table-header">Raporlama Dönemi</th>
                <th className="table-header">Rapor Durumu</th>
                <th className="table-header">Doğrulayıcı</th>
                <th className="table-header">Doğrulama Durumu</th>
                <th className="table-header">Doğrulama Tarihi</th>
                <th className="table-header">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-navy-700">
                    {v.report?.ship?.name || `Gemi #${v.report?.ship_id}`}
                  </td>
                  <td className="table-cell text-sm">
                    {v.report ? `${formatDate(v.report.reporting_period_start)} — ${formatDate(v.report.reporting_period_end)}` : "-"}
                  </td>
                  <td className="table-cell">
                    {v.report && (
                      <span className={`badge ${STATUS_COLORS[v.report.status]}`}>
                        {STATUS_LABELS[v.report.status]}
                      </span>
                    )}
                  </td>
                  <td className="table-cell">{v.verifier?.full_name || "-"}</td>
                  <td className="table-cell">
                    <span className={`badge ${VERIFICATION_COLORS[v.status]}`}>
                      {VERIFICATION_LABELS[v.status]}
                    </span>
                  </td>
                  <td className="table-cell">
                    {v.verified_at ? formatDateTime(v.verified_at) : "-"}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelected(v); setModal("view"); }}
                        className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                        title="Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isVerifier && v.status === "pending" && (
                        <button
                          onClick={() => openReview(v)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="İncele"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      <Modal open={modal === "assign"} onClose={() => setModal(null)} title="Doğrulayıcı Ata">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {formError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">Rapor *</label>
            <select
              className="input-field"
              value={assignForm.report_id}
              onChange={(e) => setAssignForm((f) => ({ ...f, report_id: e.target.value }))}
            >
              {submittedReports.length === 0 && <option value="">Gönderilmiş rapor yok</option>}
              {submittedReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.ship?.name} — {formatDate(r.reporting_period_start)} / {formatDate(r.reporting_period_end)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Doğrulayıcı *</label>
            <select
              className="input-field"
              value={assignForm.verifier_id}
              onChange={(e) => setAssignForm((f) => ({ ...f, verifier_id: e.target.value }))}
            >
              {verifiers.length === 0 && <option value="">Doğrulayıcı bulunamadı</option>}
              {verifiers.map((v) => (
                <option key={v.id} value={v.id}>{v.full_name} ({v.email})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">İptal</button>
            <button
              onClick={handleAssign}
              disabled={saving || !assignForm.report_id || !assignForm.verifier_id}
              className="btn-primary"
            >
              {saving ? "Atanıyor..." : "Ata"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={modal === "review"} onClose={() => setModal(null)} title="Raporu İncele">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {formError}
          </div>
        )}
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{selected?.report?.ship?.name}</strong> gemisinin{" "}
            {selected?.report && `${formatDate(selected.report.reporting_period_start)} — ${formatDate(selected.report.reporting_period_end)}`}{" "}
            dönemine ait raporu için karar verin.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setReviewForm((f) => ({ ...f, status: "approved" }))}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                reviewForm.status === "approved"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-green-300"
              }`}
            >
              <CheckCircle className="w-5 h-5" /> Onayla
            </button>
            <button
              onClick={() => setReviewForm((f) => ({ ...f, status: "rejected" }))}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                reviewForm.status === "rejected"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-500 hover:border-red-300"
              }`}
            >
              <XCircle className="w-5 h-5" /> Reddet
            </button>
          </div>
          <div>
            <label className="label">Notlar / Gerekçe</label>
            <textarea
              className="input-field h-24 resize-none"
              value={reviewForm.notes}
              onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Onay / ret gerekçesi veya ek notlar..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">İptal</button>
            <button
              onClick={handleReview}
              disabled={saving}
              className={reviewForm.status === "approved" ? "btn-success" : "btn-danger"}
            >
              {saving ? "İşleniyor..." : reviewForm.status === "approved" ? "Onayla" : "Reddet"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Doğrulama Detayı" size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className={`badge ${VERIFICATION_COLORS[selected.status]}`}>
                {VERIFICATION_LABELS[selected.status]}
              </span>
              {selected.verified_at && (
                <span className="text-gray-500">{formatDateTime(selected.verified_at)}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500">Doğrulayıcı</p>
                <p className="font-medium">{selected.verifier?.full_name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Rapor</p>
                <p className="font-medium">{selected.report?.ship?.name || "-"}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-gray-500 mb-1">Notlar</p>
                <p className="bg-gray-50 rounded-lg p-3 text-gray-700">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
