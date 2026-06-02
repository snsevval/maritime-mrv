"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });

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
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-400/30">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">E-posta Gönderildi</h2>
              <p className="text-sm text-white/60">
                <strong className="text-white/80">{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
              </p>
              <Link href="/login" className="block w-full py-2.5 bg-navy-500 hover:bg-navy-600 text-white font-medium rounded-lg text-sm text-center transition-colors mt-4">
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Şifremi Unuttum</h2>
              <p className="text-sm text-white/60 mb-6">Kayıtlı e-posta adresinizi girin. Şifre sıfırlama bağlantısı göndereceğiz.</p>

              {error && (
                <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">E-posta Adresi</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/25 text-white placeholder-white/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
                    placeholder="ornek@sirket.com" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
                  {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
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
