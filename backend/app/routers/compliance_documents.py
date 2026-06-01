from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import ComplianceDocument, Ship, User, UserRole
from app.schemas.schemas import ComplianceDocumentCreate, ComplianceDocumentResponse
from app.auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/compliance-documents", tags=["Uyum Belgeleri"])


def _load_doc(doc_id: int, db: Session):
    return db.query(ComplianceDocument)\
        .options(
            joinedload(ComplianceDocument.ship).joinedload(Ship.owner),
            joinedload(ComplianceDocument.issuer),
        )\
        .filter(ComplianceDocument.id == doc_id)\
        .first()


@router.post("", response_model=ComplianceDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: ComplianceDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ministry)),
):
    if not db.query(Ship).filter(Ship.id == payload.ship_id).first():
        raise HTTPException(status_code=404, detail="Gemi bulunamadı")
    if db.query(ComplianceDocument).filter(
        ComplianceDocument.document_number == payload.document_number
    ).first():
        raise HTTPException(status_code=400, detail="Bu belge numarası zaten kullanılıyor")

    doc = ComplianceDocument(**payload.model_dump(), issued_by=current_user.id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _load_doc(doc.id, db)


@router.get("", response_model=list[ComplianceDocumentResponse])
def list_documents(
    ship_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ComplianceDocument).options(
        joinedload(ComplianceDocument.ship).joinedload(Ship.owner),
        joinedload(ComplianceDocument.issuer),
    )
    if current_user.role == UserRole.shipping_company:
        q = q.join(Ship).filter(Ship.owner_id == current_user.id)
    if ship_id:
        q = q.filter(ComplianceDocument.ship_id == ship_id)
    return q.order_by(ComplianceDocument.created_at.desc()).all()


@router.get("/{doc_id}", response_model=ComplianceDocumentResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _load_doc(doc_id, db)
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    if current_user.role == UserRole.shipping_company and doc.ship.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim yetkiniz yok")
    return doc
