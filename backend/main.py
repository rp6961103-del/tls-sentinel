from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import settings
from .database import engine, Base, SessionLocal
from .models import Endpoint, Scan
from .routes import endpoints, scans, dashboard, alerts, reports, demo
from .services.tls_scanner import run_tls_scan
from .routes.endpoints import save_scan_result

# Ensure tables exist on module load
Base.metadata.create_all(bind=engine)

def seed_initial_demo_data():
    """Seeds the 5 specified demo endpoints and performs initial scans."""
    db: Session = SessionLocal()
    try:
        if db.query(Endpoint).count() == 0:
            demo_endpoints = [
                {
                    "hostname": "payment.demo.local",
                    "port": 443,
                    "environment": "production",
                    "owner": "Fintech Payments Team",
                    "business_criticality": "CRITICAL"
                },
                {
                    "hostname": "api.demo.local",
                    "port": 443,
                    "environment": "production",
                    "owner": "API Platform Engineering",
                    "business_criticality": "HIGH"
                },
                {
                    "hostname": "login.demo.local",
                    "port": 443,
                    "environment": "staging",
                    "owner": "IAM & Identity",
                    "business_criticality": "HIGH"
                },
                {
                    "hostname": "legacy.demo.local",
                    "port": 443,
                    "environment": "development",
                    "owner": "Legacy Systems Team",
                    "business_criticality": "MEDIUM"
                },
                {
                    "hostname": "internal.demo.local",
                    "port": 443,
                    "environment": "internal",
                    "owner": "Corporate IT",
                    "business_criticality": "LOW"
                }
            ]

            for item in demo_endpoints:
                ep = Endpoint(
                    hostname=item["hostname"],
                    port=item["port"],
                    environment=item["environment"],
                    owner=item["owner"],
                    business_criticality=item["business_criticality"],
                    enabled=True
                )
                db.add(ep)
                db.commit()
                db.refresh(ep)

                # Execute initial scan
                try:
                    scan_data = run_tls_scan(ep.hostname, ep.port, ep.business_criticality)
                    save_scan_result(db, ep, scan_data)
                except Exception as err:
                    print(f"Error scanning demo endpoint {ep.hostname}: {err}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_initial_demo_data()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Automated Certificate Lifecycle & Expiry Monitor with explainable risk scoring and defensive allowlist enforcement.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(endpoints.router, prefix=settings.API_V1_PREFIX)
app.include_router(scans.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(demo.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "operational",
        "docs": "/docs",
        "security_boundary": "Defensive allowlist enforced. Unrestricted scanning prohibited."
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "TLS Sentinel Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
