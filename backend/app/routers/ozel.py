import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import Ship, User, MonitoringPlan, EmissionReport, Verification, ComplianceDocument, UserRole
from app.schemas.schemas import FilomListResponse, FilomItemResponse, SirketListResponse, SirketItemResponse
from app.auth.auth import get_current_user

router = APIRouter(tags=["Özel"])


@router.get("/api/ozel/filom", response_model=FilomListResponse)
def list_filom(
    imo_number: Optional[str] = Query(None),
    ship_name: Optional[str] = Query(None),
    ship_type: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    mp_status: Optional[str] = Query(None),
    report_status: Optional[str] = Query(None),
    vr_status: Optional[str] = Query(None),
    gt_min: Optional[int] = Query(None),
    gt_max: Optional[int] = Query(None),
    reporting_period: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ship).options(joinedload(Ship.owner))

    if current_user.role == UserRole.shipping_company:
        q = q.filter(Ship.owner_id == current_user.id)

    if imo_number:
        q = q.filter(Ship.imo_number.ilike(f"%{imo_number}%"))
    if ship_name:
        q = q.filter(Ship.name.ilike(f"%{ship_name}%"))
    if ship_type:
        q = q.filter(Ship.ship_type == ship_type)
    if flag:
        q = q.filter(Ship.flag.ilike(f"%{flag}%"))
    if gt_min is not None:
        q = q.filter(Ship.gross_tonnage >= gt_min)
    if gt_max is not None:
        q = q.filter(Ship.gross_tonnage <= gt_max)

    ships = q.order_by(Ship.name).all()

    items: list[FilomItemResponse] = []
    for ship in ships:
        latest_mp = (
            db.query(MonitoringPlan)
            .filter(MonitoringPlan.ship_id == ship.id)
            .order_by(MonitoringPlan.updated_at.desc())
            .first()
        )

        report_q = db.query(EmissionReport).filter(EmissionReport.ship_id == ship.id)
        if reporting_period:
            from sqlalchemy import extract
            report_q = report_q.filter(
                extract("year", EmissionReport.reporting_period_start) == reporting_period
            )
        latest_report = report_q.order_by(EmissionReport.updated_at.desc()).first()

        latest_vr = None
        verifier_name = None
        if latest_report:
            latest_vr = (
                db.query(Verification)
                .options(joinedload(Verification.verifier))
                .filter(Verification.report_id == latest_report.id)
                .order_by(Verification.created_at.desc())
                .first()
            )
            if latest_vr and latest_vr.verifier:
                verifier_name = latest_vr.verifier.full_name

        item_mp_status = latest_mp.status if latest_mp else None
        item_report_status = latest_report.status.value if latest_report else None
        item_vr_status = latest_vr.status.value if latest_vr else None
        item_company = ship.owner.company_name if ship.owner else None
        item_period = latest_report.reporting_period_start.year if latest_report else None

        if company and (not item_company or company.lower() not in item_company.lower()):
            continue
        if mp_status and item_mp_status != mp_status:
            continue
        if report_status and item_report_status != report_status:
            continue
        if vr_status and item_vr_status != vr_status:
            continue

        items.append(FilomItemResponse(
            id=ship.id,
            imo_number=ship.imo_number,
            name=ship.name,
            flag=ship.flag,
            ship_type=ship.ship_type,
            gross_tonnage=ship.gross_tonnage,
            company_name=item_company,
            mp_status=item_mp_status,
            report_status=item_report_status,
            reporting_period=item_period,
            vr_status=item_vr_status,
            verifier_name=verifier_name,
        ))

    total = len(items)
    start = (page - 1) * page_size
    paginated = items[start: start + page_size]

    return FilomListResponse(
        items=paginated,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/api/ozel/sirketlerim", response_model=SirketListResponse)
def list_sirketlerim(
    company: Optional[str] = Query(None),
    cer_status: Optional[str] = Query(None),
    cvr_status: Optional[str] = Query(None),
    reporting_period: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(User).options(joinedload(User.ships)).filter(
        User.role == UserRole.shipping_company,
        User.is_active == True,
    )

    if current_user.role == UserRole.shipping_company:
        q = q.filter(User.id == current_user.id)

    if company:
        q = q.filter(User.company_name.ilike(f"%{company}%"))

    users = q.order_by(User.company_name).all()

    items: list[SirketItemResponse] = []
    for u in users:
        ships = u.ships
        ship_ids = [s.id for s in ships]
        ship_imos = [s.imo_number for s in ships]

        # CO2 toplamı
        co2_total: Optional[float] = None
        verifier_name: Optional[str] = None
        latest_period: Optional[int] = None
        item_cvr_status: Optional[str] = None
        item_cer_status: Optional[str] = None

        if ship_ids:
            report_q = db.query(EmissionReport).filter(EmissionReport.ship_id.in_(ship_ids))
            if reporting_period:
                from sqlalchemy import extract
                report_q = report_q.filter(
                    extract("year", EmissionReport.reporting_period_start) == reporting_period
                )
            reports = report_q.all()
            if reports:
                vals = [
                    r.ghg_emissions.get("total_co2eq_mt", 0)
                    for r in reports
                    if isinstance(r.ghg_emissions, dict)
                ]
                co2_total = sum(float(v) for v in vals if v)
                latest_report = max(reports, key=lambda r: r.updated_at)
                latest_period = latest_report.reporting_period_start.year

                latest_vr = (
                    db.query(Verification)
                    .options(joinedload(Verification.verifier))
                    .filter(Verification.report_id == latest_report.id)
                    .order_by(Verification.created_at.desc())
                    .first()
                )
                if latest_vr:
                    item_cvr_status = latest_vr.status.value
                    if latest_vr.verifier:
                        verifier_name = latest_vr.verifier.full_name

            latest_doc = (
                db.query(ComplianceDocument)
                .filter(ComplianceDocument.ship_id.in_(ship_ids))
                .order_by(ComplianceDocument.created_at.desc())
                .first()
            )
            if latest_doc:
                from datetime import datetime
                now = datetime.utcnow()
                item_cer_status = "valid" if latest_doc.valid_until >= now else "expired"

        if cer_status and item_cer_status != cer_status:
            continue
        if cvr_status and item_cvr_status != cvr_status:
            continue

        items.append(SirketItemResponse(
            id=u.id,
            company_name=u.company_name,
            email=u.email,
            phone=u.phone,
            total_ships=len(ships),
            ship_imos=ship_imos,
            co2_total=round(co2_total, 4) if co2_total else None,
            cer_status=item_cer_status,
            cvr_status=item_cvr_status,
            reporting_period=latest_period,
            verifier_name=verifier_name,
        ))

    total = len(items)
    start = (page - 1) * page_size
    paginated = items[start: start + page_size]

    return SirketListResponse(
        items=paginated,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )
