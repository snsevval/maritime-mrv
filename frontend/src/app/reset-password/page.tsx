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
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!token) setError("Geçersiz bağlantı.");
  }, [token]);

  useEffect(() => {
    let raf: number;
    let current = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    function onMove(e: MouseEvent) {
      target.x = (e.clientX / window.innerWidth  - 0.5) * 24;
      target.y = (e.clientY / window.innerHeight - 0.5) * 14;
    }
    function loop() {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      setPos({ x: current.x, y: current.y });
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

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
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/ship-bg.png')", transform: `scale(1.12) translate(${pos.x}px, ${pos.y}px)`, willChange: "transform" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-navy-900/60 to-black/80" />
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.6)" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-400/30">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Şifre Güncellendi</h2>
              <p className="text-sm text-white/60">Yeni şifrenizle giriş yapabilirsiniz. Yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Yeni Şifre Belirle</h2>

              {error && (
                <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Yeni Şifre</label>
                  <input type="password" required className="w-full bg-white/10 border border-white/25 text-white placeholder-white/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
                    placeholder="En az 6 karakter" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Şifre Tekrar</label>
                  <input type="password" required className="w-full bg-white/10 border border-white/25 text-white placeholder-white/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
                    placeholder="Şifreyi tekrar girin" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
                </div>
                <button type="submit" disabled={loading || !token}
                  className="w-full py-2.5 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
                  {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
                </button>
              </form>

              <p className="text-center text-sm text-white/50 mt-6">
                <Link href="/login" className="text-blue-300 hover:text-white transition-colors">Giriş Sayfasına Dön</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
