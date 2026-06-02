import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

logger = logging.getLogger(__name__)


def send_activation_email(to_email: str, full_name: str, temp_password: str) -> None:
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        logger.warning("SMTP_EMAIL veya SMTP_PASSWORD tanımlanmamış, e-posta gönderilmiyor.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "TR-MRV Sistemi - Hesap Aktivasyonu"
    msg["From"] = settings.SMTP_EMAIL
    msg["To"] = to_email

    metin = (
        f"Sayın {full_name},\n\n"
        "TR-MRV Sistemi'nde hesabınız başarıyla oluşturulmuştur.\n\n"
        f"Geçici şifreniz: {temp_password}\n\n"
        "İlk girişinizde şifrenizi değiştirmeniz gerekmektedir.\n\n"
        "Saygılarımızla,\n"
        "TR-MRV Sistemi"
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
    <p style="color:#e55;font-size:13px">⚠ İlk girişinizde şifrenizi değiştirmeniz gerekmektedir.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#999">Bu e-posta TR-MRV Sistemi tarafından otomatik olarak gönderilmiştir.</p>
  </div>
</body></html>"""

    msg.attach(MIMEText(metin, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())
