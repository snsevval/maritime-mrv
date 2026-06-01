from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import MonitoringPlan, Ship, User, UserRole
from app.schemas.schemas import MonitoringPlanCreate, MonitoringPlanUpdate, MonitoringPlanResponse
from app.auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/monitoring-plans", tags=["İzleme Planları"])


def _check_ship_access(ship_id: int, user: User, db: Session) -> Ship:
    ship = db.query(Ship).filter(Ship.id == ship_id).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Gemi bulunamadı")
    if user.role == UserRole.shipping_company and ship.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Bu gemiye erişim yetkiniz yok")
    return ship


@router.post("", response_model=MonitoringPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: MonitoringPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    _check_ship_access(payload.ship_id, current_user, db)
    plan = MonitoringPlan(
        **payload.model_dump(),
        created_by=current_user.id,
        revision_log=[{"date": datetime.utcnow().isoformat(), "note": "İlk versiyon oluşturuldu", "version": 1}],
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _load_plan(plan.id, db)


@router.get("", response_model=list[MonitoringPlanResponse])
def list_plans(
    ship_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MonitoringPlan).options(joinedload(MonitoringPlan.ship).joinedload(Ship.owner))
    if current_user.role == UserRole.shipping_company:
        q = q.join(Ship).filter(Ship.owner_id == current_user.id)
    if ship_id:
        q = q.filter(MonitoringPlan.ship_id == ship_id)
    return q.order_by(MonitoringPlan.created_at.desc()).all()


@router.get("/{plan_id}", response_model=MonitoringPlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _load_plan(plan_id, db)
    if not plan:
        raise HTTPException(status_code=404, detail="İzleme planı bulunamadı")
    if current_user.role == UserRole.shipping_company and plan.ship.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim yetkiniz yok")
    return plan


@router.put("/{plan_id}", response_model=MonitoringPlanResponse)
def update_plan(
    plan_id: int,
    payload: MonitoringPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    plan = db.query(MonitoringPlan).filter(MonitoringPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="İzleme planı bulunamadı")
    _check_ship_access(plan.ship_id, current_user, db)

    data = payload.model_dump(exclude_none=True)
    revision_note = data.pop("revision_note", "Güncellendi")

    for field, value in data.items():
        setattr(plan, field, value)

    plan.version += 1
    log = list(plan.revision_log or [])
    log.append({
        "date": datetime.utcnow().isoformat(),
        "note": revision_note,
        "version": plan.version,
        "updated_by": current_user.id,
    })
    plan.revision_log = log
    plan.updated_at = datetime.utcnow()

    db.commit()
    return _load_plan(plan_id, db)


def _load_plan(plan_id: int, db: Session):
    return db.query(MonitoringPlan)\
        .options(joinedload(MonitoringPlan.ship).joinedload(Ship.owner))\
        .filter(MonitoringPlan.id == plan_id)\
        .first()
