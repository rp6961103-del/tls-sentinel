import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    APP_NAME: str = "TLS Sentinel — Automated Certificate Lifecycle & Expiry Monitor"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./tls_sentinel.db")
    
    # Security Boundary: Strict Allowlist
    # Scanning is defensive and explicitly restricted to these hosts/patterns
    DEFAULT_ALLOWLIST: List[str] = [
        "localhost",
        "127.0.0.1",
        "::1",
        "*.demo.local",
        "api.demo.local",
        "payment.demo.local",
        "login.demo.local",
        "legacy.demo.local",
        "internal.demo.local",
        "sandbox.local",
        "test.local"
    ]
    
    # Configurable additional hosts via env
    EXTRA_ALLOWLIST: List[str] = [
        h.strip() for h in os.getenv("TLS_SENTINEL_ALLOWLIST", "").split(",") if h.strip()
    ]
    
    DEFAULT_TIMEOUT_SECONDS: int = 5
    MAX_DAYS_CONSIDERED_EXPIRING: int = 30

settings = Settings()
