"use client";
import { useState } from "react";
import { Phone, Mail, MapPin, ChevronDown, ChevronUp, Send, CheckCircle } from "lucide-react";

const SSS = [
  {
    soru: "Sisteme nasıl gemi ekleyebilirim?",
    cevap: "Sol menüden 'Gemiler' bölümüne gidin, ardından sağ üstteki 'Yeni Gemi Ekle' butonuna tıklayarak IMO numarası ve gemi bilgilerini girin.",
  },
  {
    soru: "Emisyon raporu nasıl oluşturulur?",
    cevap: "Öncelikle gemiye ait bir İzleme Planı oluşturulmuş olması gerekir. Ardından 'Emisyon Raporları' bölümünden 'Yeni Rapor Oluştur' butonuyla rapor oluşturabilirsiniz.",
  },
  {
    soru: "Doğrulama süreci nasıl işler?",
    cevap: "Emisyon raporu gönderildikten sonra sistem tarafından bir doğrulayıcıya atanır. Doğrulayıcı raporu inceleyerek onaylar veya reddeder. Onay sonrası uyum belgesi oluşturulabilir.",
  },
  {
    soru: "Şifremi unuttuğumda ne yapmalıyım?",
    cevap: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayın. Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderilecektir.",
  },
  {
    soru: "Hangi gemi tipleri sisteme kayıt edilebilir?",
    cevap: "5.000 GT ve üzeri deniz taşıtları sisteme kayıt edilebilir. Bu kapsamda kargo gemileri, tankerler, konteyner gemileri, ro-ro ve yolcu gemileri dahildir.",
  },
  {
    soru: "Verilerimi nasıl dışa aktarabilirim?",
    cevap: "Tüm tablolarda bulunan PDF, XLS ve CSV butonlarıyla verilerinizi dışa aktarabilirsiniz. Ayrıca 'Toplu Veri İndirme' özelliğiyle tam veri setini indirebilirsiniz.",
  },
];

export default function DestekPage() {
  const [acikSSS, setAcikSSS] = useState<number | null>(null);
  const [form, setForm] = useState({ ad: "", email: "", konu: "", mesaj: "" });
  const [gonderildi, setGonderildi] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGonderildi(true);
    setForm({ ad: "", email: "", konu: "", mesaj: "" });
    setTimeout(() => setGonderildi(false), 5000);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Destek</h1>
        <p className="text-gray-500 text-sm mt-1">TR-MRV Sistemi teknik destek ve yardım merkezi</p>
      </div>

      {/* İletişim kartları */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Telefon</p>
            <p className="text-sm text-gray-600 mt-1">+90 312 000 00 00</p>
            <p className="text-xs text-gray-400 mt-0.5">Hafta içi 09:00 – 17:00</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">E-posta</p>
            <p className="text-sm text-gray-600 mt-1">destek@trmrv.gov.tr</p>
            <p className="text-xs text-gray-400 mt-0.5">Yanıt süresi: 1 iş günü</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Adres</p>
            <p className="text-sm text-gray-600 mt-1">Ulaştırma ve Altyapı Bakanlığı</p>
            <p className="text-xs text-gray-400 mt-0.5">Ankara, Türkiye</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* SSS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Sık Sorulan Sorular</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {SSS.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setAcikSSS(acikSSS === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800 pr-4">{item.soru}</span>
                  {acikSSS === i
                    ? <ChevronUp className="w-4 h-4 text-navy-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {acikSSS === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed bg-navy-50/30">
                    {item.cevap}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* İletişim formu */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Destek Talebi Oluştur</h2>
          </div>
          <div className="p-5">
            {gonderildi ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="font-semibold text-gray-800">Talebiniz alındı!</p>
                <p className="text-sm text-gray-500">En kısa sürede e-posta ile geri dönüş yapılacaktır.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Ad Soyad *</label>
                    <input required className="input-field" value={form.ad} onChange={set("ad")} placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="label">E-posta *</label>
                    <input required type="email" className="input-field" value={form.email} onChange={set("email")} placeholder="ornek@sirket.com" />
                  </div>
                </div>
                <div>
                  <label className="label">Konu *</label>
                  <select required className="input-field" value={form.konu} onChange={set("konu")}>
                    <option value="">Konu seçin...</option>
                    <option value="teknik">Teknik Sorun</option>
                    <option value="hesap">Hesap İşlemleri</option>
                    <option value="veri">Veri Girişi</option>
                    <option value="rapor">Raporlama</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Mesaj *</label>
                  <textarea
                    required
                    className="input-field h-28 resize-none"
                    value={form.mesaj}
                    onChange={set("mesaj")}
                    placeholder="Sorununuzu veya talebinizi detaylı açıklayın..."
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Gönder
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
