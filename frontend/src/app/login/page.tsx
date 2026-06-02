"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, getErrorMessage } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import type { AuthToken } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      const data = res.data as AuthToken;
      setAuth(data.access_token, data.user);
      localStorage.setItem("viewMode", "ozel");
      router.replace("/dashboard/ozel/filom");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">

      {/* Parallax arka plan */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/ship-bg.png')",
          transform: `scale(1.12) translate(${pos.x}px, ${pos.y}px)`,
          willChange: "transform",
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-navy-900/60 to-black/80" />

      {/* İnce vignette */}
      <div className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.6)" }} />

      {/* Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Giriş Yap</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">E-posta Adresi</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/25 text-white placeholder-white/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
                placeholder="ornek@sirket.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Şifre</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/25 text-white placeholder-white/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-white/50">
            <p>
              <Link href="/forgot-password" className="text-blue-300 hover:text-white transition-colors">
                Şifremi Unuttum
              </Link>
            </p>
            <p>
              Hesabınız yok mu?{" "}
              <Link href="/register" className="text-blue-300 hover:text-white transition-colors font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
