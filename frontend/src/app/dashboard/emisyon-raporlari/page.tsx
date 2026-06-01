"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Eye, Pencil, Trash2, Send, FileText, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { reportsApi, shipsApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { EmissionReport, Ship } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";

const EMPTY_FORM = {
  ship_id: "",
  reporting_period_start: "",
  reporting_period_end: "",
  departure_port: "",
  arrival_port: "",
  distance_nm: "",
  sea_days: "",
  cargo_mt: "",
  hfo_mt: "0", lfo_mt: "0", mdo_mt: "0", mgo_mt: "0", lng_mt: "0", other_mt: "0",
  co2_mt: "0", ch4_mt: "0", n2o_mt: "0", total_co2eq_mt: "0",
  eeoi: "", cii_rating: "",
};

export default function EmisyonRaporlariPage() {
  const [reports, setReports] = useState<EmissionReport[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<EmissionReport | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const user = getCurrentUser();
  const isCompany = user?.role === "shipping_company";

  const load = useCallback(() => {
    setLoading(true);
    const tasks = [reportsApi.list(), ...(isCompany ? [shipsApi.list()] : [])];
    Promise.all(tasks)
      .then(([rr, sr]) => {
        setReports(rr.data as EmissionReport[]);
        if (sr) setShips(sr.data as Ship[]);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [isCompany]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, ship_id: ships[0]?.id.toString() || "" });
    setFormError("");
    setSelected(null);
    setModal("create");
  }

  function openEdit(r: EmissionReport) {
    const fc = r.fuel_consumption as Record<string, unknown>;
    const gh = r.ghg_emissions as Record<string, unknown>;
    const vd = r.voyage_data as Record<string, unknown>;
    setForm({
      ship_id: r.ship_id.toString(),
      reporting_period_start: r.reporting_period_start.split("T")[0],
      reporting_period_end: r.reporting_period_end.split("T")[0],
      departure_port: String(vd.departure_port || ""),
      arrival_port: String(vd.arrival_port || ""),
      distance_nm: String(vd.distance_nm || ""),
      sea_days: String(vd.sea_days || ""),
      cargo_mt: String(vd.cargo_mt || ""),
      hfo_mt: String(fc.hfo_mt || 0),
      lfo_mt: String(fc.lfo_mt || 0),
      mdo_mt: String(fc.mdo_mt || 0),
      mgo_mt: String(fc.mgo_mt || 0),
      lng_mt: String(fc.lng_mt || 0),
      other_mt: String(fc.other_mt || 0),
      co2_mt: String(gh.co2_mt || 0),
      ch4_mt: String(gh.ch4_mt || 0),
      n2o_mt: String(gh.n2o_mt || 0),
      total_co2eq_mt: String(gh.total_co2eq_mt || 0),
      eeoi: String(gh.eeoi || ""),
      cii_rating: String(gh.cii_rating || ""),
    });
    setFormError("");
    setSelected(r);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    const n = (v: string) => (v ? parseFloat(v) : undefined);
    const payload = {
      ship_id: parseInt(form.ship_id),
      reporting_period_start: new Date(form.reporting_period_start).toISOString(),
      reporting_period_end: new Date(form.reporting_period_end).toISOString(),
      voyage_data: {
        departure_port: form.departure_port,
        arrival_port: form.arrival_port,
        distance_nm: n(form.distance_nm),
        sea_days: n(form.sea_days),
        cargo_mt: n(form.cargo_mt),
      },
      fuel_consumption: {
        hfo_mt: n(form.hfo_mt) || 0, lfo_mt: n(form.lfo_mt) || 0,
        mdo_mt: n(form.mdo_mt) || 0, mgo_mt: n(form.mgo_mt) || 0,
        lng_mt: n(form.lng_mt) || 0, other_mt: n(form.other_mt) || 0,
      },
      ghg_emissions: {
        co2_mt: n(form.co2_mt) || 0, ch4_mt: n(form.ch4_mt) || 0,
        n2o_mt: n(form.n2o_mt) || 0, total_co2eq_mt: n(form.total_co2eq_mt) || 0,
        eeoi: n(form.eeoi), cii_rating: form.cii_rating || undefined,
      },
    };
    try {
      if (modal === "create") {
        await reportsApi.create(payload);
      } else if (selected) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ship_id: _, ...updatePayload } = payload;
        await reportsApi.update(selected.id, updatePayload);
      }
      setModal(null);
      load();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(id: number) {
    if (!confirm("Bu raporu doğrulamaya göndermek istiyor musunuz?")) return;
    try {
      await reportsApi.submit(id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu raporu silmek istediğinizden emin misiniz?")) return;
    try {
      await reportsApi.delete(id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Emisyon Raporları"
        subtitle="Gemi emisyon raporlarını yönetin"
        action={
          isCompany ? (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Yeni Rapor Oluştur
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
      ) : reports.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz emisyon raporu oluşturulmamış</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Gemi</th>
                <th className="table-header">Raporlama Dönemi</th>
                <th className="table-header">Durum</th>
                <th className="table-header">CO₂ (ton)</th>
                <th className="table-header">Gönderim Tarihi</th>
                <th className="table-header">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const ghg = r.ghg_emissions as Record<string, unknown>;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-navy-700">
                      {r.ship?.name || `Gemi #${r.ship_id}`}
                    </td>
                    <td className="table-cell text-sm">
                      {formatDate(r.reporting_period_start)} — {formatDate(r.reporting_period_end)}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      {typeof ghg.co2_mt === "number" ? ghg.co2_mt.toLocaleString("tr-TR") : "-"}
                    </td>
                    <td className="table-cell">{r.submitted_at ? formatDate(r.submitted_at) : "-"}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelected(r); setModal("view"); }}
                          className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isCompany && r.status === "draft" && (
                          <>
                            <button
                              onClick={() => openEdit(r)}
                              className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                              title="Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSubmit(r.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Gönder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Yeni Emisyon Raporu" : "Raporu Düzenle"}
        size="xl"
      >
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {formError}
          </div>
        )}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Genel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-3">
              {modal === "create" && (
                <div className="col-span-2">
                  <label className="label">Gemi *</label>
                  <select className="input-field" value={form.ship_id} onChange={set("ship_id")}>
                    {ships.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.imo_number})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Dönem Başlangıcı *</label>
                <input type="date" className="input-field" value={form.reporting_period_start} onChange={set("reporting_period_start")} />
              </div>
              <div>
                <label className="label">Dönem Bitişi *</label>
                <input type="date" className="input-field" value={form.reporting_period_end} onChange={set("reporting_period_end")} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Sefer Verisi</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Kalkış Limanı</label>
                <input className="input-field" value={form.departure_port} onChange={set("departure_port")} placeholder="İstanbul" />
              </div>
              <div>
                <label className="label">Varış Limanı</label>
                <input className="input-field" value={form.arrival_port} onChange={set("arrival_port")} placeholder="Hamburg" />
              </div>
              <div>
                <label className="label">Mesafe (deniz mili)</label>
                <input type="number" className="input-field" value={form.distance_nm} onChange={set("distance_nm")} />
              </div>
              <div>
                <label className="label">Denizde Geçen Süre (gün)</label>
                <input type="number" className="input-field" value={form.sea_days} onChange={set("sea_days")} />
              </div>
              <div>
                <label className="label">Yük (ton)</label>
                <input type="number" className="input-field" value={form.cargo_mt} onChange={set("cargo_mt")} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Yakıt Tüketimi (ton)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[["hfo_mt","HFO"], ["lfo_mt","LFO"], ["mdo_mt","MDO"], ["mgo_mt","MGO"], ["lng_mt","LNG"], ["other_mt","Diğer"]].map(([k, label]) => (
                <div key={k}>
                  <label className="label">{label}</label>
                  <input type="number" step="0.01" className="input-field" value={(form as Record<string, string>)[k]} onChange={set(k)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">GHG Emisyonları</h3>
            <div className="grid grid-cols-3 gap-3">
              {[["co2_mt","CO₂ (ton)"], ["ch4_mt","CH₄ (ton)"], ["n2o_mt","N₂O (ton)"], ["total_co2eq_mt","Toplam CO₂e (ton)"]].map(([k, label]) => (
                <div key={k}>
                  <label className="label">{label}</label>
                  <input type="number" step="0.01" className="input-field" value={(form as Record<string, string>)[k]} onChange={set(k)} />
                </div>
              ))}
              <div>
                <label className="label">EEOI</label>
                <input type="number" step="0.01" className="input-field" value={form.eeoi} onChange={set("eeoi")} />
              </div>
              <div>
                <label className="label">CII Notu</label>
                <select className="input-field" value={form.cii_rating} onChange={(e) => setForm((f) => ({ ...f, cii_rating: e.target.value }))}>
                  <option value="">Seçiniz</option>
                  {["A","B","C","D","E"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
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
        title={`Emisyon Raporu — ${selected?.ship?.name || ""}`}
        size="xl"
      >
        {selected && (() => {
          const vd = selected.voyage_data as Record<string, unknown>;
          const fc = selected.fuel_consumption as Record<string, unknown>;
          const gh = selected.ghg_emissions as Record<string, unknown>;
          return (
            <div className="space-y-6 text-sm">
              <div className="flex items-center gap-3">
                <span className={`badge ${STATUS_COLORS[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
                <span className="text-gray-500">
                  {formatDate(selected.reporting_period_start)} — {formatDate(selected.reporting_period_end)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Sefer Verisi</h3>
                  <dl className="space-y-1.5">
                    <div className="flex justify-between"><dt className="text-gray-500">Kalkış:</dt><dd>{String(vd.departure_port || "-")}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Varış:</dt><dd>{String(vd.arrival_port || "-")}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Mesafe:</dt><dd>{vd.distance_nm ? `${vd.distance_nm} nm` : "-"}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Denizde Gün:</dt><dd>{String(vd.sea_days || "-")}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Yük:</dt><dd>{vd.cargo_mt ? `${vd.cargo_mt} ton` : "-"}</dd></div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">GHG Emisyonları</h3>
                  <dl className="space-y-1.5">
                    <div className="flex justify-between"><dt className="text-gray-500">CO₂:</dt><dd>{typeof gh.co2_mt === "number" ? `${gh.co2_mt.toLocaleString("tr-TR")} ton` : "-"}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">CH₄:</dt><dd>{typeof gh.ch4_mt === "number" ? `${gh.ch4_mt} ton` : "-"}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">N₂O:</dt><dd>{typeof gh.n2o_mt === "number" ? `${gh.n2o_mt} ton` : "-"}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Toplam CO₂e:</dt><dd className="font-semibold">{typeof gh.total_co2eq_mt === "number" ? `${gh.total_co2eq_mt.toLocaleString("tr-TR")} ton` : "-"}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">CII Notu:</dt><dd>{String(gh.cii_rating || "-")}</dd></div>
                  </dl>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Yakıt Tüketimi</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[["hfo_mt","HFO"], ["lfo_mt","LFO"], ["mdo_mt","MDO"], ["mgo_mt","MGO"], ["lng_mt","LNG"], ["other_mt","Diğer"]].map(([k, label]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-gray-500 text-xs">{label}</p>
                      <p className="font-semibold">{fc[k] ?? 0} ton</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
