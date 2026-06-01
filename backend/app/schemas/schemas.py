from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.models import UserRole, ReportStatus, VerificationStatus


# ── Auth / User ────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    full_name: str
    company_name: Optional[str] = None
    company_tax_id: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Şifre en az 6 karakter olmalıdır")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    full_name: str
    company_name: Optional[str] = None
    company_tax_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Ship ──────────────────────────────────────────────────────────────────────

class ShipCreate(BaseModel):
    imo_number: str
    name: str
    flag: str
    registry_port: Optional[str] = None
    ship_type: Optional[str] = None
    gross_tonnage: Optional[int] = None


class ShipUpdate(BaseModel):
    name: Optional[str] = None
    flag: Optional[str] = None
    registry_port: Optional[str] = None
    ship_type: Optional[str] = None
    gross_tonnage: Optional[int] = None


class ShipResponse(BaseModel):
    id: int
    imo_number: str
    name: str
    flag: str
    owner_id: int
    registry_port: Optional[str] = None
    ship_type: Optional[str] = None
    gross_tonnage: Optional[int] = None
    created_at: datetime
    owner: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


# ── Monitoring Plan ───────────────────────────────────────────────────────────

class MonitoringPlanCreate(BaseModel):
    ship_id: int
    emission_sources: list[dict[str, Any]] = []
    fuel_methods: list[dict[str, Any]] = []
    procedures: Optional[str] = None


class MonitoringPlanUpdate(BaseModel):
    emission_sources: Optional[list[dict[str, Any]]] = None
    fuel_methods: Optional[list[dict[str, Any]]] = None
    procedures: Optional[str] = None
    revision_note: Optional[str] = None


class MonitoringPlanResponse(BaseModel):
    id: int
    ship_id: int
    emission_sources: list[dict[str, Any]]
    fuel_methods: list[dict[str, Any]]
    procedures: Optional[str] = None
    status: str
    version: int
    revision_log: list[dict[str, Any]]
    created_by: int
    created_at: datetime
    updated_at: datetime
    ship: Optional[ShipResponse] = None

    model_config = {"from_attributes": True}


# ── Emission Report ───────────────────────────────────────────────────────────

class VoyageData(BaseModel):
    departure_port: str = ""
    arrival_port: str = ""
    departure_date: Optional[str] = None
    arrival_date: Optional[str] = None
    distance_nm: Optional[float] = None
    sea_days: Optional[float] = None
    cargo_mt: Optional[float] = None


class FuelConsumption(BaseModel):
    hfo_mt: float = 0.0
    lfo_mt: float = 0.0
    mdo_mt: float = 0.0
    mgo_mt: float = 0.0
    lng_mt: float = 0.0
    methanol_mt: float = 0.0
    other_mt: float = 0.0


class GHGEmissions(BaseModel):
    co2_mt: float = 0.0
    ch4_mt: float = 0.0
    n2o_mt: float = 0.0
    total_co2eq_mt: float = 0.0
    eeoi: Optional[float] = None
    aer: Optional[float] = None
    cii_rating: Optional[str] = None


class EmissionReportCreate(BaseModel):
    ship_id: int
    reporting_period_start: datetime
    reporting_period_end: datetime
    voyage_data: dict[str, Any] = {}
    fuel_consumption: dict[str, Any] = {}
    ghg_emissions: dict[str, Any] = {}


class EmissionReportUpdate(BaseModel):
    voyage_data: Optional[dict[str, Any]] = None
    fuel_consumption: Optional[dict[str, Any]] = None
    ghg_emissions: Optional[dict[str, Any]] = None
    reporting_period_start: Optional[datetime] = None
    reporting_period_end: Optional[datetime] = None


class EmissionReportResponse(BaseModel):
    id: int
    ship_id: int
    voyage_data: dict[str, Any]
    fuel_consumption: dict[str, Any]
    ghg_emissions: dict[str, Any]
    status: ReportStatus
    reporting_period_start: datetime
    reporting_period_end: datetime
    submitted_at: Optional[datetime] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    ship: Optional[ShipResponse] = None

    model_config = {"from_attributes": True}


# ── Verification ──────────────────────────────────────────────────────────────

class VerificationCreate(BaseModel):
    report_id: int
    verifier_id: int


class VerificationUpdate(BaseModel):
    status: VerificationStatus
    notes: Optional[str] = None


class VerificationResponse(BaseModel):
    id: int
    report_id: int
    verifier_id: int
    status: VerificationStatus
    notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    report: Optional[EmissionReportResponse] = None
    verifier: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


# ── Compliance Document ───────────────────────────────────────────────────────

class ComplianceDocumentCreate(BaseModel):
    ship_id: int
    document_type: str
    document_number: str
    valid_from: datetime
    valid_until: datetime
    notes: Optional[str] = None


class ComplianceDocumentResponse(BaseModel):
    id: int
    ship_id: int
    issued_by: int
    document_type: str
    document_number: str
    valid_from: datetime
    valid_until: datetime
    notes: Optional[str] = None
    created_at: datetime
    ship: Optional[ShipResponse] = None
    issuer: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


# ── Ship Report ───────────────────────────────────────────────────────────────

class ShipReportCreate(BaseModel):
    imo_number: str
    ship_name: str
    ship_type: Optional[str] = None
    company: Optional[str] = None
    reporting_period: int
    co2_emissions: Optional[float] = None
    co2eq_emissions: Optional[float] = None
    report_coverage: Optional[str] = "Full Reporting Period"


class ShipReportResponse(BaseModel):
    id: int
    imo_number: str
    ship_name: str
    ship_type: Optional[str] = None
    company: Optional[str] = None
    reporting_period: int
    co2_emissions: Optional[float] = None
    co2eq_emissions: Optional[float] = None
    report_coverage: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ShipReportListResponse(BaseModel):
    items: list[ShipReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Dataset Version ────────────────────────────────────────────────────────────

class DatasetVersionResponse(BaseModel):
    id: int
    reporting_period: int
    version: int
    generation_date: datetime
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Stats ─────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_ships: int
    total_reports: int
    reports_by_status: dict[str, int]
    total_verifications: int
    total_compliance_docs: int
    total_co2_mt: float
