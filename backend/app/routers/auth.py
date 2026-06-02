import logging
import secrets
import string
import secrets
import string
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, PasswordResetToken
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token
from app.auth.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Kimlik Doğrulama"])


def _gecici_sifre(uzunluk: int = 12) -> str:
    karakterler = string.ascii_letters + string.digits
    return "".join(secrets.choice(karakterler) for _ in range(uzunluk))


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı")

    temp_password = _gecici_sifre()

    user = User(
        email=payload.email,
        password_hash=hash_password(temp_password),
        role=payload.role,
        full_name=payload.full_name,
        company_name=payload.company_name,
        company_tax_id=payload.company_tax_id,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        from app.services.email import send_activation_email
        send_activation_email(payload.email, payload.full_name, temp_password)
        logger.info("Aktivasyon e-postası gönderildi: %s", payload.email)
    except Exception as exc:
        logger.error("Aktivasyon e-postası HATA [%s]: %s", type(exc).__name__, exc, exc_info=True)

    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    token = create_access_token(
        {"sub": str(user.id), "role": user.role},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password", status_code=200)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    # Güvenlik: kullanıcı yoksa da aynı mesajı döndür
    if user:
        # Eski tokenları geçersiz kıl
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).update({"used": True})
        db.commit()

        token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db.add(reset_token)
        db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        try:
            from app.services.email import send_reset_email
            send_reset_email(user.email, user.full_name, reset_url)
        except Exception as exc:
            logger.error("Şifre sıfırlama e-postası HATA: %s", exc)

    return {"message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."}


@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır")

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow(),
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş bağlantı")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    user.password_hash = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Şifreniz başarıyla güncellendi."}
