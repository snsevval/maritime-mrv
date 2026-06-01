"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { Ship, AlertCircle } from "lucide-react";
import type { UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";

const ROLES: UserRole[] = ["shipping_company", "verifier", "ministry"];

// Pydantic v2 mesajlarını Türkçeye çevir
const PYDANTIC_TR: Record<string, string> = {
  "Field required": "Bu alan zorunludur",
  "value is not a valid email address": "Geçerli bir e-posta adresi giriniz",
  "String should have at least 6 characters": "Şifre en az 6 karakter olmalıdır",
  "String should have at most": "Bu alan çok uzun",
  "value is not a valid": "Geçersiz değer",
};

function toTurkish(msg: string): string {
  for (const [en, tr] of Object.entries(PYDANTIC_TR)) {
    if (msg.includes(en)) return tr;
  }
  return msg;
}

function parseApiError(error: unknown): string[] {
  if (!error || typeof error !== "object") {
    return ["Beklenmedik bir hata oluştu. Lütfen tekrar deneyin."];
  }
  const err = error as { response?: { data?: { detail?: unknown }; status?: number } };
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") return [detail];

  if (Array.isArray(detail)) {
    return detail.map((d) => {
      const raw = typeof d === "object" && d !== null ? String((d as Record<string, unknown>).msg ?? d) : String(d);
      return toTurkish(raw);
    });
  }

  if (err.response?.status === 422) {
    return ["Form alanlarını kontrol edin ve tekrar deneyin."];
  }

  return ["Beklenmedik bir hata oluştu. Lütfen tekrar deneyin."];
}

function clientValidate(form: {
  full_name: string;
  email: string;
  password: string;
}): string[] {
  const errs: string[] = [];
  if (!form.full_name.trim()) errs.push("Ad Soyad zorunludur.");
  if (!form.email.trim()) errs.push("E-posta adresi zorunludur.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.push("Geçerli bir e-posta adresi giriniz.");
  if (!form.password) errs.push("Şifre zorunludur.");
  else if (form.password.length < 6) errs.push("Şifre en az 6 karakter olmalıdır.");
  return errs;
}

export default function RegisterPage() {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "shipping_company" as UserRole,
    company_name: "",
    company_tax_id: "",
    phone: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function showErrors(msgs: string[]) {
    setErrors(msgs);
    setTimeout(
      () => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      40,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clientErrors = clientValidate(form);
    if (clientErrors.length > 0) {
      showErrors(clientErrors);
      return;
    }

    setErrors([]);
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        company_name: form.company_name || undefined,
        company_tax_id: form.company_tax_id || undefined,
        phone: form.phone || undefined,
      });
      router.replace("/login");
    } catch (err) {
      showErrors(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Ship className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Denizcilik MRV</h1>
          <p className="text-navy-200 mt-2">Yeni Hesap Oluştur</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Kayıt Ol</h2>

          {/* Hata bloğu — her zaman görünür, kaybolmuyor */}
          {errors.length > 0 && (
            <div
              ref={errorRef}
              role="alert"
              className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  {errors.length === 1 ? (
                    <p>{errors[0]}</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Ad Soyad */}
            <div>
              <label className="label">Ad Soyad *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={set("full_name")}
                className="input-field"
                placeholder="Ad Soyad"
                autoComplete="name"
              />
            </div>

            {/* E-posta */}
            <div>
              <label className="label">E-posta *</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                className="input-field"
                placeholder="ornek@sirket.com"
                autoComplete="email"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="label">Şifre *</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                className="input-field"
                placeholder="En az 6 karakter"
                autoComplete="new-password"
              />
            </div>

            {/* Rol */}
            <div>
              <label className="label">Kullanıcı Rolü *</label>
              <select value={form.role} onChange={set("role")} className="input-field">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Şirket adı */}
            <div>
              <label className="label">Şirket / Kurum Adı</label>
              <input
                type="text"
                value={form.company_name}
                onChange={set("company_name")}
                className="input-field"
                placeholder="Şirket / Kurum Adı"
                autoComplete="organization"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Vergi no */}
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

              {/* Telefon */}
              <div>
                <label className="label">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className="input-field"
                  placeholder="+90 5xx xxx xx xx"
                  autoComplete="tel"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? "Kayıt oluşturuluyor…" : "Kayıt Ol"}
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
