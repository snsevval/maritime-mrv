"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, FileCheck, AlertTriangle, Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { docsApi, shipsApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { ComplianceDocument, Ship } from "@/types";

const DOC_TYPES = [
  "Deniz Kirliliğini Önleme Belgesi (MARPOL)",
  "Enerji Verimliliği Yönetim Planı (EEMP)",
  "Karbon Yoğunluğu Göstergesi (CII)",
  "Uyum Belgesi (Statement of Compliance)",
  "Diğer",
];

export default function UyumBelgeleriPage() {
  const [docs, setDocs] = useState<ComplianceDocument[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "view" | null>(null);
  const [selected, setSelected] = useState<ComplianceDocument | null>(null);
  const [form, setForm] = useState({
    ship_id: "",
    document_type: DOC_TYPES[0],
    document_number: "",
    valid_from: "",
    valid_until: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const user = getCurrentUser();
  const isMinistry = user?.role === "ministry";

  const load = useCallback(() => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [docsApi.list()];
    if (isMinistry) tasks.push(shipsApi.list());
    Promise.all(tasks)
      .then(([dr, sr]) => {
        setDocs((dr as { data: ComplianceDocument[] }).data);
        if (sr) setShips((sr as { data: Ship[] }).data);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [isMinistry]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({
      ship_id: ships[0]?.id.toString() || "",
      document_type: DOC_TYPES[0],
      document_number: "",
      valid_from: "",
      valid_until: "",
      notes: "",
    });
    setFormError("");
    setModal("create");
  }

  async function handleCreate() {
    setSaving(true);
    setFormError("");
    try {
      await docsApi.create({
        ship_id: parseInt(form.ship_id),
        document_type: form.document_type,
        document_number: form.document_number,
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: new Date(form.valid_until).toISOString(),
        notes: form.notes || undefined,
      });
      setModal(null);
      load();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function isExpired(doc: ComplianceDocument) {
    return new Date(doc.valid_until) < new Date();
  }

  function isExpiringSoon(doc: ComplianceDocument) {
    const diff = new Date(doc.valid_until).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }

  return (
    <div>
      <PageHeader
        title="Uyum Belgeleri"
        subtitle="Gemi uyum belgelerini görüntüleyin ve yönetin"
        action={
          isMinistry ? (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Belge Düzenle
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
      ) : docs.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz uyum belgesi düzenlenmemiş</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Belge No</th>
                <th className="table-header">Gemi</th>
                <th className="table-header">Belge Türü</th>
                <th className="table-header">Geçerlilik Başlangıcı</th>
                <th className="table-header">Geçerlilik Bitişi</th>
                <th className="table-header">Durum</th>
                <th className="table-header">Düzenleyen</th>
                <th className="table-header">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const expired = isExpired(doc);
                const soon = isExpiringSoon(doc);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-sm font-medium">{doc.document_number}</td>
                    <td className="table-cell font-medium text-navy-700">
                      {doc.ship?.name || `Gemi #${doc.ship_id}`}
                    </td>
                    <td className="table-cell text-sm max-w-xs truncate">{doc.document_type}</td>
                    <td className="table-cell">{formatDate(doc.valid_from)}</td>
                    <td className="table-cell">{formatDate(doc.valid_until)}</td>
                    <td className="table-cell">
                      {expired ? (
                        <span className="badge bg-red-100 text-red-700">Süresi Dolmuş</span>
                      ) : soon ? (
                        <span className="badge bg-yellow-100 text-yellow-700">Yakında Doluyor</span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700">Geçerli</span>
                      )}
                    </td>
                    <td className="table-cell">{doc.issuer?.full_name || "-"}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => { setSelected(doc); setModal("view"); }}
                        className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Uyum Belgesi Düzenle" size="lg">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {formError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">Gemi *</label>
            <select
              className="input-field"
              value={form.ship_id}
              onChange={(e) => setForm((f) => ({ ...f, ship_id: e.target.value }))}
            >
              {ships.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.imo_number})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Belge Türü *</label>
            <select
              className="input-field"
              value={form.document_type}
              onChange={(e) => setForm((f) => ({ ...f, document_type: e.target.value }))}
            >
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Belge Numarası *</label>
            <input
              className="input-field"
              value={form.document_number}
              onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))}
              placeholder="MRV-2024-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Geçerlilik Başlangıcı *</label>
              <input
                type="date"
                className="input-field"
                value={form.valid_from}
                onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Geçerlilik Bitişi *</label>
              <input
                type="date"
                className="input-field"
                value={form.valid_until}
                onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Notlar</label>
            <textarea
              className="input-field h-20 resize-none"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ek bilgiler veya açıklamalar..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">İptal</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? "Düzenleniyor..." : "Belgeyi Düzenle"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Belge Detayı" size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Belge No:</span>
                <span className="font-mono font-medium">{selected.document_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Belge Türü:</span>
                <span className="font-medium text-right max-w-xs">{selected.document_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gemi:</span>
                <span className="font-medium">{selected.ship?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IMO No:</span>
                <span className="font-mono">{selected.ship?.imo_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Geçerlilik:</span>
                <span>{formatDate(selected.valid_from)} — {formatDate(selected.valid_until)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Düzenleyen:</span>
                <span>{selected.issuer?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Düzenleme Tarihi:</span>
                <span>{formatDate(selected.created_at)}</span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-gray-500 mb-1">Notlar</p>
                <p className="bg-gray-50 rounded-lg p-3">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
