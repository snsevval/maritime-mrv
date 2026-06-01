from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.routers import auth, ships, monitoring_plans, emission_reports, verifications, compliance_documents, stats
from app.routers import ship_reports

Base.metadata.create_all(bind=engine)


def _seed_dataset_versions() -> None:
    from app.models.models import DatasetVersion
    db = SessionLocal()
    try:
        if db.query(DatasetVersion).count() == 0:
            seeds = [
                DatasetVersion(reporting_period=2024, version=221, generation_date=datetime(2026, 5, 26), file_name="dataset_2024_v221.csv"),
                DatasetVersion(reporting_period=2023, version=89,  generation_date=datetime(2026, 4, 15), file_name="dataset_2023_v89.csv"),
                DatasetVersion(reporting_period=2022, version=241, generation_date=datetime(2026, 2, 6),  file_name="dataset_2022_v241.csv"),
                DatasetVersion(reporting_period=2021, version=217, generation_date=datetime(2026, 3, 17), file_name="dataset_2021_v217.csv"),
            ]
            db.add_all(seeds)
            db.commit()
    finally:
        db.close()


_seed_dataset_versions()

app = FastAPI(
    title="Denizcilik MRV Platformu",
    description="Deniz Taşımacılığı İzleme, Raporlama ve Doğrulama Platformu",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ships.router)
app.include_router(monitoring_plans.router)
app.include_router(emission_reports.router)
app.include_router(verifications.router)
app.include_router(compliance_documents.router)
app.include_router(stats.router)
app.include_router(ship_reports.router)


@app.get("/")
def root():
    return {"message": "Denizcilik MRV Platformu API'sine Hoş Geldiniz"}


@app.get("/health")
def health():
    return {"status": "ok"}
