from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import EmissionReport, Ship, User, UserRole, ReportStatus
from app.schemas.schemas import (
    EmissionReportCreate, EmissionReportUpdate, EmissionReportResponse,
)
from app.auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/emission-reports", tags=["Emisyon Raporları"])


def _load_report(report_id: int, db: Session):
    return db.query(EmissionReport)\
        .options(joinedload(EmissionReport.ship).joinedload(Ship.owner))\
        .filter(EmissionReport.id == report_id)\
        .first()


@router.post("", response_model=EmissionReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: EmissionReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    ship = db.query(Ship).filter(Ship.id == payload.ship_id, Ship.owner_id == current_user.id).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Gemi bulunamadı")
    report = EmissionReport(**payload.model_dump(), created_by=current_user.id)
    db.add(report)
    db.commit()
    db.refresh(report)
    return _load_report(report.id, db)


@router.get("", response_model=list[EmissionReportResponse])
def list_reports(
    ship_id: int | None = None,
    report_status: ReportStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(EmissionReport).options(joinedload(EmissionReport.ship).joinedload(Ship.owner))
    if current_user.role == UserRole.shipping_company:
        q = q.join(Ship).filter(Ship.owner_id == current_user.id)
    if ship_id:
        q = q.filter(EmissionReport.ship_id == ship_id)
    if report_status:
        q = q.filter(EmissionReport.status == report_status)
    return q.order_by(EmissionReport.created_at.desc()).all()


@router.get("/{report_id}", response_model=EmissionReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = _load_report(report_id, db)
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    if current_user.role == UserRole.shipping_company and report.ship.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim yetkiniz yok")
    return report


@router.put("/{report_id}", response_model=EmissionReportResponse)
def update_report(
    report_id: int,
    payload: EmissionReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    report = db.query(EmissionReport).filter(EmissionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    if report.ship.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim yetkiniz yok")
    if report.status not in (ReportStatus.draft, ReportStatus.rejected):
        raise HTTPException(status_code=400, detail="Bu rapor artık düzenlenemez")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(report, field, value)
    report.updated_at = datetime.utcnow()
    db.commit()
    return _load_report(report_id, db)


@router.post("/{report_id}/submit", response_model=EmissionReportResponse)
def submit_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    report = db.query(EmissionReport)\
        .join(Ship)\
        .filter(EmissionReport.id == report_id, Ship.owner_id == current_user.id)\
        .first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    if report.status != ReportStatus.draft:
        raise HTTPException(status_code=400, detail="Yalnızca taslak raporlar gönderilebilir")
    report.status = ReportStatus.submitted
    report.submitted_at = datetime.utcnow()
    db.commit()
    return _load_report(report_id, db)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    report = db.query(EmissionReport)\
        .join(Ship)\
        .filter(EmissionReport.id == report_id, Ship.owner_id == current_user.id)\
        .first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    if report.status not in (ReportStatus.draft,):
        raise HTTPException(status_code=400, detail="Yalnızca taslak raporlar silinebilir")
    db.delete(report)
    db.commit()
