from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import Ship, User, UserRole
from app.schemas.schemas import ShipCreate, ShipUpdate, ShipResponse
from app.auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/ships", tags=["Gemiler"])


@router.post("", response_model=ShipResponse, status_code=status.HTTP_201_CREATED)
def create_ship(
    payload: ShipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    if db.query(Ship).filter(Ship.imo_number == payload.imo_number).first():
        raise HTTPException(status_code=400, detail="Bu IMO numarası zaten kayıtlı")
    ship = Ship(**payload.model_dump(), owner_id=current_user.id)
    db.add(ship)
    db.commit()
    db.refresh(ship)
    return db.query(Ship).options(joinedload(Ship.owner)).filter(Ship.id == ship.id).first()


@router.get("", response_model=list[ShipResponse])
def list_ships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ship).options(joinedload(Ship.owner))
    if current_user.role == UserRole.shipping_company:
        q = q.filter(Ship.owner_id == current_user.id)
    return q.order_by(Ship.created_at.desc()).all()


@router.get("/{ship_id}", response_model=ShipResponse)
def get_ship(
    ship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ship = db.query(Ship).options(joinedload(Ship.owner)).filter(Ship.id == ship_id).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Gemi bulunamadı")
    if current_user.role == UserRole.shipping_company and ship.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu gemiye erişim yetkiniz yok")
    return ship


@router.put("/{ship_id}", response_model=ShipResponse)
def update_ship(
    ship_id: int,
    payload: ShipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    ship = db.query(Ship).filter(Ship.id == ship_id, Ship.owner_id == current_user.id).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Gemi bulunamadı")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(ship, field, value)
    db.commit()
    db.refresh(ship)
    return db.query(Ship).options(joinedload(Ship.owner)).filter(Ship.id == ship.id).first()


@router.delete("/{ship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ship(
    ship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.shipping_company)),
):
    ship = db.query(Ship).filter(Ship.id == ship_id, Ship.owner_id == current_user.id).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Gemi bulunamadı")
    db.delete(ship)
    db.commit()
