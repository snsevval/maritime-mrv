"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Eye, Pencil, ClipboardList, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { plansApi, shipsApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { MonitoringPlan, Ship } from "@/types";

const DEFAULT_SOURCES = [
  { id: "ME1", name: "Ana Motor", type: "main_engine", fuel_types: ["HFO"] },
  { id: "AE1", name: "Yardımcı Motor 1", type: "auxiliary_engine", fuel_types: ["MDO"] },
];

const DEFAULT_METHODS = [
  { fuel_type: "HFO", method: "BDN", description: "Yakıt Teslimat Belgesi yöntemi" },
  { fuel_type: "MDO", method: "flow_meter", description: "Akış sayacı yöntemi" },
];

export default function IzlemePlanlariPage() {
  const [plans, setPlans] = useState<MonitoringPlan[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<MonitoringPlan | null>(null);
  const [form, setForm] = useState({
    ship_id: "",
    procedures: "",
    revision_note: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const user = getCurrentUser();
  const isCompany = user?.role === "shipping_company";

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([plansApi.list(), shipsApi.list()])
      .then(([pr, sr]) => {
        setPlans(pr.data as MonitoringPlan[]);
        setShips(sr.data as Ship[]);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ship_id: ships[0]?.id.toString() || "", procedures: "", revision_note: "" });
    setFormError("");
    setSelected(null);
    setModal("create");
  }

  function openEdit(plan: MonitoringPlan) {
    setForm({
      ship_id: plan.ship_id.toString(),
      procedures: plan.procedures || "",
      revision_note: "",
    });
    setFormError("");
    setSelected(plan);
    setModal("edit");
  }

  function openView(plan: MonitoringPlan) {
    setSelected(plan);
    setModal("view");
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      if (modal === "create") {
        await plansApi.create({
          ship_id: parseInt(form.ship_id),
          procedures: form.procedures,
          emission_sources: DEFAULT_SOURCES,
          fuel_methods: DEFAULT_METHODS,
        });
      } else if (selected) {
        await plansApi.update(selected.id, {
          procedures: form.procedures,
          revision_note: form.revision_note || "Güncellendi",
        });
      }
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
        title="İzleme Planları"
        subtitle="Gemilere ait emisyon izleme planları"
        action={
          isCompany ? (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Yeni Plan Oluştur
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
      ) : plans.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz izleme planı oluşturulmamış</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Gemi</th>
                <th className="table-header">Versiyon</th>
                <th className="table-header">Durum</th>
                <th className="table-header">Emisyon Kaynakları</th>
                <th className="table-header">Oluşturulma</th>
                <th className="table-header">Güncelleme</th>
                <th className="table-header">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-navy-700">
                    {plan.ship?.name || `Gemi #${plan.ship_id}`}
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-gray-100 text-gray-700">v{plan.version}</span>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-green-100 text-green-700">{plan.status}</span>
                  </td>
                  <td className="table-cell text-gray-500">{plan.emission_sources.length} kaynak</td>
                  <td className="table-cell">{formatDate(plan.created_at)}</td>
                  <td className="table-cell">{formatDate(plan.updated_at)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openView(plan)}
                        className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isCompany && (
                        <button
                          onClick={() => openEdit(plan)}
                          className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Yeni İzleme Planı" : "İzleme Planını Düzenle"}
        size="lg"
      >
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {formError}
          </div>
        )}
        <div className="space-y-4">
          {modal === "create" && (
            <div>
              <label className="label">Gemi *</label>
              <select
                className="input-field"
                value={form.ship_id}
                onChange={(e) => setForm((f) => ({ ...f, ship_id: e.target.value }))}
              >
                {ships.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.imo_number})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">İzleme Prosedürleri</label>
            <textarea
              className="input-field h-32 resize-none"
              value={form.procedures}
              onChange={(e) => setForm((f) => ({ ...f, procedures: e.target.value }))}
              placeholder="İzleme ve ölçüm prosedürlerini açıklayın..."
            />
          </div>
          {modal === "edit" && (
            <div>
              <label className="label">Revizyon Notu</label>
              <input
                className="input-field"
                value={form.revision_note}
                onChange={(e) => setForm((f) => ({ ...f, revision_note: e.target.value }))}
                placeholder="Bu güncellemenin nedeni..."
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">İptal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title={`İzleme Planı — ${selected?.ship?.name || ""}`}
        size="xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Gemi:</span>
                <span className="ml-2 font-medium">{selected.ship?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Versiyon:</span>
                <span className="ml-2 font-medium">v{selected.version}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Emisyon Kaynakları</h3>
              <div className="space-y-2">
                {selected.emission_sources.map((src, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="font-medium">{String(src.name)}</span>
                    <span className="text-gray-500 ml-2">({String(src.type)})</span>
                    <span className="text-gray-400 ml-2">
                      Yakıt: {Array.isArray(src.fuel_types) ? src.fuel_types.join(", ") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Yakıt Ölçüm Yöntemleri</h3>
              <div className="space-y-2">
                {selected.fuel_methods.map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="font-medium">{String(m.fuel_type)}</span>
                    <span className="text-gray-500 ml-2">— {String(m.method)}</span>
                    <p className="text-gray-400 text-xs mt-1">{String(m.description || "")}</p>
                  </div>
                ))}
              </div>
            </div>

            {selected.procedures && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">İzleme Prosedürleri</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                  {selected.procedures}
                </p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Revizyon Geçmişi</h3>
              <div className="space-y-2">
                {selected.revision_log.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="badge bg-navy-100 text-navy-700 flex-shrink-0">
                      v{String(log.version)}
                    </span>
                    <div>
                      <p className="text-gray-700">{String(log.note)}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(String(log.date)).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
