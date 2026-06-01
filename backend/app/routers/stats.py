from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Ship, EmissionReport, Verification, ComplianceDocument, User, UserRole, ReportStatus
from app.schemas.schemas import DashboardStats
from app.auth.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["İstatistikler"])


@router.get("", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ship_q = db.query(Ship)
    report_q = db.query(EmissionReport)
    ver_q = db.query(Verification)
    doc_q = db.query(ComplianceDocument)

    if current_user.role == UserRole.shipping_company:
        ship_q = ship_q.filter(Ship.owner_id == current_user.id)
        owner_ship_ids = [s.id for s in ship_q.all()]
        report_q = report_q.filter(EmissionReport.ship_id.in_(owner_ship_ids))
        doc_q = doc_q.filter(ComplianceDocument.ship_id.in_(owner_ship_ids))
    elif current_user.role == UserRole.verifier:
        ver_q = ver_q.filter(Verification.verifier_id == current_user.id)

    reports = report_q.all()
    status_counts: dict[str, int] = {}
    for s in ReportStatus:
        status_counts[s.value] = sum(1 for r in reports if r.status == s)

    total_co2 = sum(
        (r.ghg_emissions or {}).get("co2_mt", 0) for r in reports
    )

    return DashboardStats(
        total_ships=ship_q.count(),
        total_reports=len(reports),
        reports_by_status=status_counts,
        total_verifications=ver_q.count(),
        total_compliance_docs=doc_q.count(),
        total_co2_mt=round(total_co2, 2),
    )


@router.get("/verifiers", response_model=list[dict])
def list_verifiers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verifiers = db.query(User).filter(User.role == UserRole.verifier, User.is_active == True).all()
    return [{"id": v.id, "full_name": v.full_name, "email": v.email} for v in verifiers]
