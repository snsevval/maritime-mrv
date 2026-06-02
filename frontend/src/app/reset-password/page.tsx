"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Geçersiz bağlantı.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
    if (form.password !== form.confirm) { setError("Şifreler eşleşmiyor."); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset-password", { token, new_password: form.password });
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? "Geçersiz veya süresi dolmuş bağlantı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Denizcilik MRV</h1>
          <p className="text-navy-200 mt-2">Yeni Şifre Belirle</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Şifre Güncellendi</h2>
              <p className="text-sm text-gray-500">Yeni şifrenizle giriş yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Yeni Şifre Belirle</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Yeni Şifre</label>
                  <input type="password" required className="input-field" placeholder="En az 6 karakter"
                    value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Şifre Tekrar</label>
                  <input type="password" required className="input-field" placeholder="Şifreyi tekrar girin"
                    value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
                </div>
                <button type="submit" disabled={loading || !token} className="btn-primary w-full py-2.5">
                  {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="text-navy-700 hover:underline font-medium">
                  Giriş Sayfasına Dön
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
