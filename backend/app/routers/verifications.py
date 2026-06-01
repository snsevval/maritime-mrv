from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import (
    Verification, EmissionReport, Ship, User, UserRole,
    ReportStatus, VerificationStatus,
)
from app.schemas.schemas import VerificationCreate, VerificationUpdate, VerificationResponse
from app.auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/verifications", tags=["Doğrulamalar"])


def _load_verification(v_id: int, db: Session):
    return db.query(Verification)\
        .options(
            joinedload(Verification.report).joinedload(EmissionReport.ship).joinedload(Ship.owner),
            joinedload(Verification.verifier),
        )\
        .filter(Verification.id == v_id)\
        .first()


@router.post("", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
def assign_verification(
    payload: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ministry)),
):
    report = db.query(EmissionReport).filter(EmissionReport.id == payload.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    if report.status != ReportStatus.submitted:
        raise HTTPException(status_code=400, detail="Yalnızca gönderilmiş raporlar doğrulamaya atanabilir")

    verifier = db.query(User).filter(
        User.id == payload.verifier_id, User.role == UserRole.verifier
    ).first()
    if not verifier:
        raise HTTPException(status_code=404, detail="Doğrulayıcı bulunamadı")

    verification = Verification(
        report_id=payload.report_id,
        verifier_id=payload.verifier_id,
    )
    report.status = ReportStatus.under_verification
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return _load_verification(verification.id, db)


@router.get("", response_model=list[VerificationResponse])
def list_verifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Verification).options(
        joinedload(Verification.report).joinedload(EmissionReport.ship).joinedload(Ship.owner),
        joinedload(Verification.verifier),
    )
    if current_user.role == UserRole.verifier:
        q = q.filter(Verification.verifier_id == current_user.id)
    return q.order_by(Verification.created_at.desc()).all()


@router.get("/{verification_id}", response_model=VerificationResponse)
def get_verification(
    verification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = _load_verification(verification_id, db)
    if not v:
        raise HTTPException(status_code=404, detail="Doğrulama bulunamadı")
    if current_user.role == UserRole.verifier and v.verifier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim yetkiniz yok")
    return v


@router.patch("/{verification_id}", response_model=VerificationResponse)
def update_verification(
    verification_id: int,
    payload: VerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.verifier)),
):
    v = db.query(Verification).filter(
        Verification.id == verification_id,
        Verification.verifier_id == current_user.id,
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Doğrulama bulunamadı")
    if v.status != VerificationStatus.pending:
        raise HTTPException(status_code=400, detail="Bu doğrulama zaten tamamlanmış")

    v.status = payload.status
    v.notes = payload.notes
    v.verified_at = datetime.utcnow()

    report = db.query(EmissionReport).filter(EmissionReport.id == v.report_id).first()
    if payload.status == VerificationStatus.approved:
        report.status = ReportStatus.approved
    else:
        report.status = ReportStatus.rejected

    db.commit()
    return _load_verification(verification_id, db)
