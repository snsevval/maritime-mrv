"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, getErrorMessage } from "@/lib/api";
import { Ship } from "lucide-react";
import type { UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";

const ROLES: UserRole[] = ["shipping_company", "verifier", "ministry"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "shipping_company" as UserRole,
    company_name: "",
    company_tax_id: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      router.replace("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Ship className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Denizcilik MRV</h1>
          <p className="text-navy-200 mt-2">Yeni Hesap Oluştur</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Kayıt Ol</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Ad Soyad *</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={set("full_name")}
                  className="input-field"
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="col-span-2">
                <label className="label">E-posta *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  className="input-field"
                  placeholder="ornek@sirket.com"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Şifre *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={set("password")}
                  className="input-field"
                  placeholder="En az 6 karakter"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Kullanıcı Rolü *</label>
                <select
                  value={form.role}
                  onChange={set("role")}
                  className="input-field"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Şirket / Kurum Adı</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={set("company_name")}
                  className="input-field"
                  placeholder="Şirket / Kurum Adı"
                />
              </div>
              <div>
                <label className="label">Vergi Numarası</label>
                <input
                  type="text"
                  value={form.company_tax_id}
                  onChange={set("company_tax_id")}
                  className="input-field"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className="input-field"
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-navy-700 hover:underline font-medium">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
