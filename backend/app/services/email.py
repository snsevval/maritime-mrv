import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

_BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def send_activation_email(to_email: str, full_name: str, temp_password: str) -> None:
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY tanımlanmamış, e-posta gönderilmiyor.")
        return

    sender_email = settings.SMTP_EMAIL or "dururenova@gmail.com"

    metin = (
        f"Sayın {full_name},\n\n"
        "TR-MRV Sistemi'nde hesabınız başarıyla oluşturulmuştur.\n\n"
        f"Geçici şifreniz: {temp_password}\n\n"
        "İlk girişinizde şifrenizi değiştirmeniz gerekmektedir.\n\n"
        "Saygılarımızla,\nTR-MRV Sistemi"
    )

    html = f"""\
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
  <div style="background:#1A7A8A;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">TR-MRV Sistemi</h1>
    <p style="color:#d0eff3;margin:4px 0 0">Hesap Aktivasyonu</p>
  </div>
  <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
    <p>Sayın <strong>{full_name}</strong>,</p>
    <p>TR-MRV Sistemi'nde hesabınız başarıyla oluşturulmuştur.</p>
    <div style="background:#fff;border:1px solid #d0e8eb;border-radius:6px;padding:16px;margin:20px 0;text-align:center">
      <p style="margin:0 0 8px;color:#555;font-size:13px">Geçici Şifreniz</p>
      <p style="margin:0;font-size:22px;font-weight:bold;color:#1A7A8A;letter-spacing:2px">{temp_password}</p>
    </div>
    <p style="color:#e55;font-size:13px">&#9888; İlk girişinizde şifrenizi değiştirmeniz gerekmektedir.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#999">Bu e-posta TR-MRV Sistemi tarafından otomatik olarak gönderilmiştir.</p>
  </div>
</body></html>"""

    payload = {
        "sender": {"name": "TR-MRV Sistemi", "email": sender_email},
        "to": [{"email": to_email, "name": full_name}],
        "subject": "TR-MRV Sistemi - Hesap Aktivasyonu",
        "textContent": metin,
        "htmlContent": html,
    }

    with httpx.Client(timeout=15) as client:
        r = client.post(
            _BREVO_URL,
            json=payload,
            headers={"api-key": settings.BREVO_API_KEY, "Content-Type": "application/json"},
        )
        r.raise_for_status()


def send_reset_email(to_email: str, full_name: str, reset_url: str) -> None:
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY tanımlanmamış, e-posta gönderilmiyor.")
        return

    sender_email = settings.SMTP_EMAIL or "dururenova@gmail.com"

    metin = (
        f"Sayın {full_name},\n\n"
        "TR-MRV Sistemi için şifre sıfırlama talebiniz alındı.\n\n"
        f"Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n{reset_url}\n\n"
        "Bu bağlantı 1 saat geçerlidir.\n\n"
        "Bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız.\n\n"
        "Saygılarımızla,\nTR-MRV Sistemi"
    )

    html = f"""\
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
  <div style="background:#1A7A8A;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">TR-MRV Sistemi</h1>
    <p style="color:#d0eff3;margin:4px 0 0">Şifre Sıfırlama</p>
  </div>
  <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
    <p>Sayın <strong>{full_name}</strong>,</p>
    <p>TR-MRV Sistemi için şifre sıfırlama talebiniz alındı.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="{reset_url}" style="background:#1A7A8A;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">
        Şifremi Sıfırla
      </a>
    </div>
    <p style="color:#777;font-size:13px">Bu bağlantı <strong>1 saat</strong> geçerlidir.</p>
    <p style="color:#777;font-size:13px">Bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#999">TR-MRV Sistemi tarafından otomatik gönderilmiştir.</p>
  </div>
</body></html>"""

    payload = {
        "sender": {"name": "TR-MRV Sistemi", "email": sender_email},
        "to": [{"email": to_email, "name": full_name}],
        "subject": "TR-MRV Sistemi - Şifre Sıfırlama",
        "textContent": metin,
        "htmlContent": html,
    }

    with httpx.Client(timeout=15) as client:
        r = client.post(
            _BREVO_URL,
            json=payload,
            headers={"api-key": settings.BREVO_API_KEY, "Content-Type": "application/json"},
        )
        r.raise_for_status()
