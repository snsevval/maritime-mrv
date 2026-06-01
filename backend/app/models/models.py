import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, JSON, Text, Boolean, Float, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
    shipping_company = "shipping_company"
    verifier = "verifier"
    ministry = "ministry"


class ReportStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_verification = "under_verification"
    approved = "approved"
    rejected = "rejected"


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    full_name = Column(String(255), nullable=False)
    company_name = Column(String(255))
    company_tax_id = Column(String(50))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ships = relationship("Ship", back_populates="owner", foreign_keys="Ship.owner_id")
    verifications = relationship("Verification", back_populates="verifier")
    compliance_documents_issued = relationship("ComplianceDocument", back_populates="issuer")


class Ship(Base):
    __tablename__ = "ships"

    id = Column(Integer, primary_key=True, index=True)
    imo_number = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    flag = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    registry_port = Column(String(255))
    ship_type = Column(String(100))
    gross_tonnage = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="ships", foreign_keys=[owner_id])
    monitoring_plans = relationship("MonitoringPlan", back_populates="ship")
    emission_reports = relationship("EmissionReport", back_populates="ship")
    compliance_documents = relationship("ComplianceDocument", back_populates="ship")


class MonitoringPlan(Base):
    __tablename__ = "monitoring_plans"

    id = Column(Integer, primary_key=True, index=True)
    ship_id = Column(Integer, ForeignKey("ships.id"), nullable=False)
    emission_sources = Column(JSON, default=list)
    fuel_methods = Column(JSON, default=list)
    procedures = Column(Text)
    status = Column(String(50), default="active")
    version = Column(Integer, default=1)
    revision_log = Column(JSON, default=list)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ship = relationship("Ship", back_populates="monitoring_plans")
    creator = relationship("User", foreign_keys=[created_by])


class EmissionReport(Base):
    __tablename__ = "emission_reports"

    id = Column(Integer, primary_key=True, index=True)
    ship_id = Column(Integer, ForeignKey("ships.id"), nullable=False)
    voyage_data = Column(JSON, default=dict)
    fuel_consumption = Column(JSON, default=dict)
    ghg_emissions = Column(JSON, default=dict)
    status = Column(SAEnum(ReportStatus), default=ReportStatus.draft)
    reporting_period_start = Column(DateTime, nullable=False)
    reporting_period_end = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ship = relationship("Ship", back_populates="emission_reports")
    creator = relationship("User", foreign_keys=[created_by])
    verifications = relationship("Verification", back_populates="report")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("emission_reports.id"), nullable=False)
    verifier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(VerificationStatus), default=VerificationStatus.pending)
    notes = Column(Text)
    verified_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("EmissionReport", back_populates="verifications")
    verifier = relationship("User", back_populates="verifications")


class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"

    id = Column(Integer, primary_key=True, index=True)
    ship_id = Column(Integer, ForeignKey("ships.id"), nullable=False)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(255), nullable=False)
    document_number = Column(String(100), unique=True, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    ship = relationship("Ship", back_populates="compliance_documents")
    issuer = relationship("User", back_populates="compliance_documents_issued")


class ShipReport(Base):
    __tablename__ = "ship_reports"

    id = Column(Integer, primary_key=True, index=True)
    imo_number = Column(String(20), nullable=False, index=True)
    ship_name = Column(String(255), nullable=False)
    ship_type = Column(String(100))
    company = Column(String(255))
    reporting_period = Column(Integer, nullable=False)
    co2_emissions = Column(Float)
    co2eq_emissions = Column(Float)
    report_coverage = Column(String(50), default="Full Reporting Period")
    created_at = Column(DateTime, default=datetime.utcnow)


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(Integer, primary_key=True, index=True)
    reporting_period = Column(Integer, nullable=False)
    version = Column(Integer, nullable=False)
    generation_date = Column(DateTime, nullable=False)
    file_name = Column(String(255))
    file_url = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow)
