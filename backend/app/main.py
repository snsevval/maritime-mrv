from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import auth, ships, monitoring_plans, emission_reports, verifications, compliance_documents, stats

Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {"message": "Denizcilik MRV Platformu API'sine Hoş Geldiniz"}


@app.get("/health")
def health():
    return {"status": "ok"}
