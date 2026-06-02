import logging
import secrets
import string
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token
from app.auth.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

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
    except Exception as exc:
        logger.warning("Aktivasyon e-postası gönderilemedi: %s", exc)

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
