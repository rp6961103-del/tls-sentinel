from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# --- Endpoint Schemas ---
class EndpointBase(BaseModel):
    hostname: str = Field(..., description="Hostname of the TLS endpoint (e.g. localhost, payment.demo.local)")
    port: int = Field(443, ge=1, le=65535, description="Port number")
    environment: str = Field("production", description="Environment: production, staging, development, internal")
    owner: str = Field("Security Engineering", description="Team or person responsible")
    business_criticality: str = Field("HIGH", description="Criticality: CRITICAL, HIGH, MEDIUM, LOW")
    enabled: bool = True

class EndpointCreate(EndpointBase):
    pass

class EndpointUpdate(BaseModel):
    hostname: Optional[str] = None
    port: Optional[int] = Field(None, ge=1, le=65535)
    environment: Optional[str] = None
    owner: Optional[str] = None
    business_criticality: Optional[str] = None
    enabled: Optional[bool] = None

class CertificateOut(BaseModel):
    id: int
    scan_id: int
    subject: Optional[str] = None
    issuer: Optional[str] = None
    serial_number: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    days_remaining: Optional[int] = None
    signature_algorithm: Optional[str] = None
    public_key_algorithm: Optional[str] = None
    public_key_size: Optional[int] = None
    san_names: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FindingOut(BaseModel):
    id: int
    scan_id: int
    rule_id: str
    category: str
    title: str
    severity: str
    evidence: str
    explanation: str
    recommendation: str
    score: int

    model_config = ConfigDict(from_attributes=True)

class RiskFactor(BaseModel):
    rule: str
    score: int
    evidence: str
    title: Optional[str] = None
    category: Optional[str] = None
    recommendation: Optional[str] = None

class ScanOut(BaseModel):
    id: int
    endpoint_id: int
    timestamp: datetime
    status: str
    tls_version: Optional[str] = None
    negotiated_cipher: Optional[str] = None
    risk_score: int
    severity: str
    certificate: Optional[CertificateOut] = None
    findings: List[FindingOut] = []
    factors: Optional[List[RiskFactor]] = []

    model_config = ConfigDict(from_attributes=True)

class EndpointOut(EndpointBase):
    id: int
    created_at: datetime
    last_scan_at: Optional[datetime] = None
    latest_scan: Optional[ScanOut] = None
    open_alerts_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# --- Alert Schemas ---
class AlertOut(BaseModel):
    id: int
    endpoint_id: int
    finding_id: Optional[int] = None
    hostname: Optional[str] = None
    severity: str
    message: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & Reports ---
class DashboardStats(BaseModel):
    total_endpoints: int
    critical_risks: int
    high_risks: int
    medium_risks: int
    low_risks: int
    expiring_soon_count: int  # <= 30 days
    expired_count: int
    weak_tls_count: int
    active_alerts_count: int

class ReportSummary(BaseModel):
    total_endpoints: int
    healthy_endpoints: int
    critical_endpoints: int
    high_risk_endpoints: int
    expiring_7d: int
    expiring_15d: int
    expiring_30d: int
    expired: int
    legacy_tls_count: int
    weak_cipher_count: int
    risk_distribution: dict
