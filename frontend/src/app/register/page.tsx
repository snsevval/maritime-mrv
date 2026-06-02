"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Rol = "shipping_company" | "verifier" | "ministry";

const ROL_ETIKETLER: Record<Rol, string> = {
  shipping_company: "Şirket",
  verifier: "Doğrulayıcı",
  ministry: "Devlet",
};

const ULKELER = [
  "Türkiye",
  "Afganistan",
  "Almanya",
  "Amerika Birleşik Devletleri",
  "Arjantin",
  "Avustralya",
  "Avusturya",
  "Azerbaycan",
  "Bahreyn",
  "Belçika",
  "Birleşik Arap Emirlikleri",
  "Birleşik Krallık",
  "Bulgaristan",
  "Çin",
  "Danimarka",
  "Finlandiya",
  "Fransa",
  "Güney Kore",
  "Gürcistan",
  "Hollanda",
  "Irak",
  "İran",
  "İspanya",
  "İsveç",
  "İsviçre",
  "İtalya",
  "Japonya",
  "Kanada",
  "Kazakistan",
  "Katar",
  "Kıbrıs",
  "Kuveyt",
  "Libya",
  "Mısır",
  "Norveç",
  "Pakistan",
  "Polonya",
  "Portekiz",
  "Romanya",
  "Rusya",
  "Sırbistan",
  "Suudi Arabistan",
  "Türkmenistan",
  "Ukrayna",
  "Umman",
  "Yunanistan",
];

const KOSULLAR = [
  {
    baslik: "1. SİSTEME ERİŞİM",
    icerik:
      "TR-MRV Sistemi tüm yetkili kullanıcılar için ücretsizdir. Sistem herhangi bir nedenle askıya alınabilir veya sonlandırılabilir.",
  },
  {
    baslik: "2. SİSTEMİN KABUL EDİLEBİLİR KULLANIMI",
    icerik:
      "Sistem aracılığıyla yürütülen faaliyetler hiçbir yürürlükteki yasayı veya yönetmeliği ihlal etmemelidir.",
  },
  {
    baslik: "3. SORUMLULUK REDDİ",
    icerik:
      "TR-MRV Sistemi kullanıcıları, hizmetin kesintisiz veya hatasız olmayabileceğini kabul eder.",
  },
  {
    baslik: "4. KİŞİSEL VERİLERİN KORUNMASI",
    icerik:
      "Kişisel veriler KVKK hükümleri çerçevesinde işlenir.",
  },
];

function parseApiHata(error: unknown): string[] {
  if (!error || typeof error !== "object") {
    return ["Beklenmedik bir hata oluştu. Lütfen tekrar deneyin."];
  }
  const err = error as { response?: { data?: { detail?: unknown }; status?: number } };
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") return [detail];

  if (Array.isArray(detail)) {
    return detail.map((d) => {
      const raw =
        typeof d === "object" && d !== null
          ? String((d as Record<string, unknown>).msg ?? d)
          : String(d);
      return raw;
    });
  }

  if (err.response?.status === 422) {
    return ["Form alanlarını kontrol edin ve tekrar deneyin."];
  }

  return ["Beklenmedik bir hata oluştu. Lütfen tekrar deneyin."];
}

export default function RegisterPage() {
  const [adim, setAdim] = useState<1 | 2 | "basarili">(1);
  const [scrollEdildi, setScrollEdildi] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    email_tekrar: "",
    role: "shipping_company" as Rol,
    phone: "",
    adres: "",
    sehir: "",
    ulke: "Türkiye",
  });
  const [hatalar, setHatalar] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const hataRef = useRef<HTMLDivElement>(null);

  function kosulKaydirma(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setScrollEdildi(true);
    }
  }

  function dogrula(): string[] {
    const e: string[] = [];
    if (!form.full_name.trim()) e.push("Ad Soyad zorunludur.");
    if (!form.email.trim()) e.push("E-posta adresi zorunludur.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.push("Geçerli bir e-posta adresi giriniz.");
    if (!form.email_tekrar.trim()) e.push("E-posta tekrarı zorunludur.");
    else if (form.email !== form.email_tekrar)
      e.push("E-posta adresleri eşleşmiyor.");
    if (!form.phone.trim()) e.push("Telefon numarası zorunludur.");
    if (!form.adres.trim()) e.push("Adres zorunludur.");
    if (!form.sehir.trim()) e.push("Şehir zorunludur.");
    return e;
  }

  function hataGoster(msgs: string[]) {
    setHatalar(msgs);
    setTimeout(
      () => hataRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      40,
    );
  }

  async function handleGonder(e: React.FormEvent) {
    e.preventDefault();
    const dogrulamaHatalari = dogrula();
    if (dogrulamaHatalari.length > 0) {
      hataGoster(dogrulamaHatalari);
      return;
    }
    setHatalar([]);
    setYukleniyor(true);
    try {
      await authApi.register({
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        phone: form.phone,
        company_name: [form.adres, form.sehir, form.ulke].filter(Boolean).join(", "),
      });
      setAdim("basarili");
    } catch (err) {
      hataGoster(parseApiHata(err));
    } finally {
      setYukleniyor(false);
    }
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const ALAN =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Üst başlık */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#1A7A8A" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M3 17l9 4 9-4M3 12l9 4 9-4M3 7l9-4 9 4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-gray-900 text-base leading-none">TR-MRV</span>
            <span className="text-gray-500 text-sm ml-2">İzleme, Raporlama ve Doğrulama Sistemi</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-10 px-4">
        {/* ── ADIM 1: Kullanım Koşulları ─────────────────────────────── */}
        {adim === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h1 className="text-xl font-semibold text-gray-900">
                Kullanım Koşulları ve Gizlilik Bildirimi
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Devam edebilmek için lütfen aşağıdaki koşulları okuyun.
              </p>
            </div>

            <div
              className="h-72 overflow-y-auto px-8 py-6 space-y-5 text-sm text-gray-700 border-b border-gray-100"
              onScroll={kosulKaydirma}
            >
              {KOSULLAR.map((k) => (
                <div key={k.baslik}>
                  <p className="font-semibold text-gray-900 mb-1">{k.baslik}</p>
                  <p className="leading-relaxed">{k.icerik}</p>
                </div>
              ))}
              <div className="pt-2 text-gray-400 text-xs text-center">— Son —</div>
            </div>

            <div className="px-8 py-5 flex items-center justify-between bg-gray-50">
              <p className="text-xs text-gray-400">
                {scrollEdildi
                  ? "Koşulları okudunuz."
                  : "Butonu etkinleştirmek için aşağı kaydırın."}
              </p>
              <button
                disabled={!scrollEdildi}
                onClick={() => setAdim(2)}
                className={
                  scrollEdildi
                    ? "px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all"
                    : "px-6 py-2.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-400 cursor-not-allowed"
                }
                style={scrollEdildi ? { backgroundColor: "#1A7A8A" } : undefined}
              >
                Kabul Ediyorum
              </button>
            </div>
          </div>
        )}

        {/* ── ADIM 2: Kayıt Formu ─────────────────────────────────────── */}
        {adim === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h1 className="text-xl font-semibold text-gray-900">Kullanıcı Kayıt Formu</h1>
              <p className="text-sm text-gray-500 mt-1">
                Hesap oluşturulduktan sonra hesabınızı etkinleştirmek için e-posta ile
                bilgilendirileceksiniz.
              </p>
            </div>

            <form onSubmit={handleGonder} className="px-8 py-6 space-y-5" noValidate>
              {hatalar.length > 0 && (
                <div
                  ref={hataRef}
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {hatalar.length === 1 ? (
                        <p>{hatalar[0]}</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5">
                          {hatalar.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Soyad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={set("full_name")}
                  className={ALAN}
                  placeholder="Ad Soyad"
                  autoComplete="name"
                />
              </div>

              {/* E-posta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    className={ALAN}
                    placeholder="ornek@sirket.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-posta Tekrar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email_tekrar}
                    onChange={set("email_tekrar")}
                    className={ALAN}
                    placeholder="ornek@sirket.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Kayıt Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kayıt Türü <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  {(Object.entries(ROL_ETIKETLER) as [Rol, string][]).map(([deger, etiket]) => (
                    <label key={deger} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={deger}
                        checked={form.role === deger}
                        onChange={() => setForm((f) => ({ ...f, role: deger }))}
                        className="w-4 h-4"
                        style={{ accentColor: "#1A7A8A" }}
                      />
                      <span className="text-sm text-gray-700">{etiket}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className={ALAN}
                  placeholder="+90 5xx xxx xx xx"
                  autoComplete="tel"
                />
              </div>

              {/* Adres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adres <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.adres}
                  onChange={set("adres")}
                  rows={3}
                  className={`${ALAN} resize-none`}
                  placeholder="Cadde, sokak, bina bilgileri..."
                />
              </div>

              {/* Şehir + Ülke */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Şehir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.sehir}
                    onChange={set("sehir")}
                    className={ALAN}
                    placeholder="İstanbul"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ülke <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.ulke}
                    onChange={set("ulke")}
                    className={`${ALAN} bg-white`}
                  >
                    {ULKELER.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAdim(1)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="px-8 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "#1A7A8A" }}
                >
                  {yukleniyor ? "Gönderiliyor..." : "Hesap Oluştur"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── BAŞARILI ─────────────────────────────────────────────────── */}
        {adim === "basarili" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#e6f4f6" }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: "#1A7A8A" }} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Kaydınız Alındı</h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              Geçici şifreniz <strong>{form.email}</strong> adresine gönderildi. İlk girişinizde
              şifrenizi değiştirmeniz gerekmektedir.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="px-8 py-2.5 rounded-lg text-white text-sm font-medium inline-block"
                style={{ backgroundColor: "#1A7A8A" }}
              >
                Giriş Sayfasına Git
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-medium" style={{ color: "#1A7A8A" }}>
            Giriş Yap
          </Link>
        </p>
      </main>
    </div>
  );
}
