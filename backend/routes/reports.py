import csv
import io
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Endpoint, Scan, Certificate, Finding, Alert
from ..services.recommendation_engine import prioritize_recommendation
from .endpoints import serialize_scan

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary", response_model=dict)
def get_reports_summary(db: Session = Depends(get_db)):
    endpoints = db.query(Endpoint).all()
    total = len(endpoints)
    healthy = 0
    critical = 0
    high = 0
    medium = 0
    low = 0
    
    expiring_7d = 0
    expiring_15d = 0
    expiring_30d = 0
    expired = 0
    
    legacy_tls = 0
    weak_ciphers = 0
    
    for ep in endpoints:
        latest = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).first()
        if latest:
            sev = (latest.severity or "LOW").upper()
            if sev == "CRITICAL":
                critical += 1
            elif sev == "HIGH":
                high += 1
            elif sev == "MEDIUM":
                medium += 1
            else:
                low += 1
                healthy += 1

            if latest.tls_version and any(v in latest.tls_version.upper() for v in ["TLS 1.0", "TLS 1.1", "SSL"]):
                legacy_tls += 1
            if latest.negotiated_cipher and any(c in latest.negotiated_cipher.upper() for c in ["3DES", "DES", "RC4", "NULL", "MD5", "EXP"]):
                weak_ciphers += 1

            if latest.certificate and latest.certificate.days_remaining is not None:
                d = latest.certificate.days_remaining
                if d < 0:
                    expired += 1
                elif d <= 7:
                    expiring_7d += 1
                elif d <= 15:
                    expiring_15d += 1
                elif d <= 30:
                    expiring_30d += 1
        else:
            low += 1
            healthy += 1

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_endpoints": total,
        "healthy_endpoints": healthy,
        "critical_endpoints": critical,
        "high_risk_endpoints": high,
        "medium_risk_endpoints": medium,
        "low_risk_endpoints": low,
        "certificates_expiring_within": {
            "expired": expired,
            "7_days": expiring_7d,
            "15_days": expiring_15d,
            "30_days": expiring_30d
        },
        "legacy_tls_count": legacy_tls,
        "weak_cipher_count": weak_ciphers,
        "risk_distribution": {
            "CRITICAL": critical,
            "HIGH": high,
            "MEDIUM": medium,
            "LOW": low
        }
    }

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Exact requested headers
    writer.writerow([
        "endpoint",
        "environment",
        "risk_score",
        "severity",
        "certificate_expiry",
        "days_remaining",
        "tls_version",
        "cipher",
        "finding",
        "recommendation",
        "priority"
    ])
    
    endpoints = db.query(Endpoint).all()
    for ep in endpoints:
        latest = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).first()
        cert = latest.certificate if latest else None
        
        endpoint_str = f"{ep.hostname}:{ep.port}"
        env_str = ep.environment
        risk_score = latest.risk_score if latest else 0
        severity = latest.severity if latest else "LOW"
        cert_expiry = cert.valid_until.strftime("%Y-%m-%d %H:%M:%S UTC") if (cert and cert.valid_until) else "N/A"
        days_rem = cert.days_remaining if (cert and cert.days_remaining is not None) else "N/A"
        tls_ver = latest.tls_version if (latest and latest.tls_version) else "N/A"
        cipher_str = latest.negotiated_cipher if (latest and latest.negotiated_cipher) else "N/A"

        findings = latest.findings if latest else []
        if findings:
            for f in findings:
                p_info = prioritize_recommendation({
                    "rule_id": f.rule_id,
                    "severity": f.severity,
                    "title": f.title,
                    "recommendation": f.recommendation,
                    "evidence": f.evidence
                }, ep.business_criticality)

                writer.writerow([
                    endpoint_str,
                    env_str,
                    risk_score,
                    severity,
                    cert_expiry,
                    days_rem,
                    tls_ver,
                    cipher_str,
                    f"[{f.rule_id}] {f.title}",
                    f.recommendation,
                    p_info.get("priority_label", "P3 Planned")
                ])
        else:
            writer.writerow([
                endpoint_str,
                env_str,
                risk_score,
                severity,
                cert_expiry,
                days_rem,
                tls_ver,
                cipher_str,
                "None (Clean Cryptographic Baseline)",
                "Maintain modern TLS 1.2/1.3 baseline.",
                "None"
            ])
        
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tls_sentinel_compliance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/export/json")
def export_json(db: Session = Depends(get_db)):
    endpoints = db.query(Endpoint).all()
    data = []
    for ep in endpoints:
        latest = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).first()
        serialized_scan = serialize_scan(latest)
        data.append({
            "endpoint": {
                "id": ep.id,
                "hostname": ep.hostname,
                "port": ep.port,
                "environment": ep.environment,
                "owner": ep.owner,
                "business_criticality": ep.business_criticality,
                "enabled": ep.enabled,
                "created_at": ep.created_at.isoformat() if ep.created_at else None,
                "last_scan_at": ep.last_scan_at.isoformat() if ep.last_scan_at else None
            },
            "security_posture": {
                "risk_score": latest.risk_score if latest else 0,
                "severity": latest.severity if latest else "LOW",
                "tls_version": latest.tls_version if latest else "N/A",
                "negotiated_cipher": latest.negotiated_cipher if latest else "N/A",
                "certificate_days_remaining": latest.certificate.days_remaining if (latest and latest.certificate) else None
            },
            "latest_scan": serialized_scan
        })
        
    return {
        "export_metadata": {
            "system": "TLS Sentinel — Automated Certificate Lifecycle & Expiry Monitor",
            "compliance_standard": "RFC 8996 & PCI-DSS Baseline",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "total_endpoints": len(data)
        },
        "endpoints": data
    }
