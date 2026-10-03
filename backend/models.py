from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), nullable=False, index=True)
    port = Column(Integer, default=443, nullable=False)
    environment = Column(String(50), default="production", nullable=False)  # production, staging, development, internal
    owner = Column(String(100), default="Security Engineering", nullable=False)
    business_criticality = Column(String(20), default="HIGH", nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    last_scan_at = Column(DateTime, nullable=True)

    scans = relationship("Scan", back_populates="endpoint", cascade="all, delete-orphan", order_by="desc(Scan.timestamp)")
    alerts = relationship("Alert", back_populates="endpoint", cascade="all, delete-orphan", order_by="desc(Alert.created_at)")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utcnow, nullable=False)
    status = Column(String(50), default="COMPLETED", nullable=False)  # COMPLETED, FAILED, TIMEOUT, UNREACHABLE
    tls_version = Column(String(50), nullable=True)
    negotiated_cipher = Column(String(100), nullable=True)
    risk_score = Column(Integer, default=0, nullable=False)
    severity = Column(String(20), default="LOW", nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW

    endpoint = relationship("Endpoint", back_populates="scans")
    certificate = relationship("Certificate", back_populates="scan", uselist=False, cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    subject = Column(String(255), nullable=True)
    issuer = Column(String(255), nullable=True)
    serial_number = Column(String(100), nullable=True)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    days_remaining = Column(Integer, nullable=True)
    signature_algorithm = Column(String(100), nullable=True)
    public_key_algorithm = Column(String(100), nullable=True)
    public_key_size = Column(Integer, nullable=True)
    san_names = Column(Text, nullable=True)  # Comma-separated or JSON list of SAN DNS names

    scan = relationship("Scan", back_populates="certificate")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)  # EXPIRY, PROTOCOL, CIPHER, CERTIFICATE, VALIDATION
    title = Column(String(255), nullable=False)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    evidence = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    score = Column(Integer, default=0, nullable=False)

    scan = relationship("Scan", back_populates="findings")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="SET NULL"), nullable=True)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    message = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN", nullable=False)  # OPEN, RESOLVED
    created_at = Column(DateTime, default=utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    endpoint = relationship("Endpoint", back_populates="alerts")
    finding = relationship("Finding")
