"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Ship as ShipIcon, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { shipsApi, getErrorMessage } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { Ship } from "@/types";

const EMPTY_FORM = {
  imo_number: "", name: "", flag: "", registry_port: "",
  ship_type: "", gross_tonnage: "",
};

export default function GemilerPage() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const user = getCurrentUser();
  const isCompany = user?.role === "shipping_company";

  const load = useCallback(() => {
    setLoading(true);
    shipsApi.list()
      .then((r) => setShips(r.data as Ship[]))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditId(null);
    setModal("create");
  }

  function openEdit(ship: Ship) {
    setForm({
      imo_number: ship.imo_number,
      name: ship.name,
      flag: ship.flag,
      registry_port: ship.registry_port || "",
      ship_type: ship.ship_type || "",
      gross_tonnage: ship.gross_tonnage?.toString() || "",
    });
    setFormError("");
    setEditId(ship.id);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        gross_tonnage: form.gross_tonnage ? parseInt(form.gross_tonnage) : undefined,
      };
      if (modal === "create") {
        await shipsApi.create(payload);
      } else if (editId) {
        const { imo_number: _, ...updatePayload } = payload;
        await shipsApi.update(editId, updatePayload);
      }
      setModal(null);
      load();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu gemiyi silmek istediğinizden emin misiniz?")) return;
    try {
      await shipsApi.delete(id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Gemiler"
        subtitle="Kayıtlı gemilerin listesi"
        action={
          isCompany ? (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Gemi Ekle
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
      ) : ships.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <ShipIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz gemi eklenmemiş</p>
          {isCompany && (
            <p className="text-sm mt-1">Yeni gemi eklemek için üstteki butonu kullanın</p>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">IMO No</th>
                <th className="table-header">Gemi Adı</th>
                <th className="table-header">Bayrak</th>
                <th className="table-header">Tür</th>
                <th className="table-header">Kayıt Limanı</th>
                <th className="table-header">GT</th>
                <th className="table-header">Kayıt Tarihi</th>
                {isCompany && <th className="table-header">İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {ships.map((ship) => (
                <tr key={ship.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono font-medium">{ship.imo_number}</td>
                  <td className="table-cell font-medium text-navy-700">{ship.name}</td>
                  <td className="table-cell">{ship.flag}</td>
                  <td className="table-cell">{ship.ship_type || "-"}</td>
                  <td className="table-cell">{ship.registry_port || "-"}</td>
                  <td className="table-cell">{ship.gross_tonnage?.toLocaleString("tr-TR") || "-"}</td>
                  <td className="table-cell">{formatDate(ship.created_at)}</td>
                  {isCompany && (
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(ship)}
                          className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ship.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Yeni Gemi Ekle" : "Gemi Bilgilerini Düzenle"}
      >
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {formError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">IMO Numarası *</label>
            <input
              className="input-field"
              value={form.imo_number}
              onChange={set("imo_number")}
              placeholder="IMO1234567"
              disabled={modal === "edit"}
            />
          </div>
          <div>
            <label className="label">Gemi Adı *</label>
            <input className="input-field" value={form.name} onChange={set("name")} placeholder="Gemi Adı" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bayrak *</label>
              <input className="input-field" value={form.flag} onChange={set("flag")} placeholder="Türkiye" />
            </div>
            <div>
              <label className="label">Kayıt Limanı</label>
              <input className="input-field" value={form.registry_port} onChange={set("registry_port")} placeholder="İstanbul" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Gemi Türü</label>
              <input className="input-field" value={form.ship_type} onChange={set("ship_type")} placeholder="Konteyner" />
            </div>
            <div>
              <label className="label">Gross Tonaj</label>
              <input className="input-field" type="number" value={form.gross_tonnage} onChange={set("gross_tonnage")} placeholder="50000" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">İptal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
