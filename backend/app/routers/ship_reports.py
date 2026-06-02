from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ShipReport, DatasetVersion
from app.schemas.schemas import ShipReportListResponse, DatasetVersionResponse

router = APIRouter(tags=["Ship Reports"])


@router.get("/api/ship-reports", response_model=ShipReportListResponse)
def list_ship_reports(
    imo_number: str | None = None,
    ship_name: str | None = None,
    reporting_period: int | None = None,
    ship_type: str | None = None,
    report_coverage: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(ShipReport)
    if imo_number:
        q = q.filter(ShipReport.imo_number.ilike(f"%{imo_number}%"))
    if ship_name:
        q = q.filter(ShipReport.ship_name.ilike(f"%{ship_name}%"))
    if reporting_period:
        q = q.filter(ShipReport.reporting_period == reporting_period)
    if ship_type:
        q = q.filter(ShipReport.ship_type == ship_type)
    if report_coverage:
        q = q.filter(ShipReport.report_coverage == report_coverage)

    total = q.count()
    items = (
        q.order_by(ShipReport.reporting_period.desc(), ShipReport.ship_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/api/dataset-versions", response_model=list[DatasetVersionResponse])
def list_dataset_versions(
    db: Session = Depends(get_db),
):
    return (
        db.query(DatasetVersion)
        .order_by(DatasetVersion.reporting_period.desc(), DatasetVersion.version.desc())
        .all()
    )
