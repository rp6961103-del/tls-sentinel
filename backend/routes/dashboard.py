from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Endpoint, Scan, Certificate, Finding, Alert
from .endpoints import serialize_scan

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=Dict[str, Any])
def get_dashboard_data(db: Session = Depends(get_db)):
    endpoints = db.query(Endpoint).all()
    total_endpoints = len(endpoints)
    
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    
    expiring_soon_count = 0  # <= 30 days
    expired_count = 0
    weak_tls_count = 0
    
    expiry_buckets = {
        "Expired": 0,
        "0-7 Days": 0,
        "8-15 Days": 0,
        "16-30 Days": 0,
        ">30 Days": 0
    }
    
    for ep in endpoints:
        latest_scan = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).first()
        if latest_scan:
            sev = (latest_scan.severity or "LOW").upper()
            if sev == "CRITICAL":
                critical_count += 1
            elif sev == "HIGH":
                high_count += 1
            elif sev == "MEDIUM":
                medium_count += 1
            else:
                low_count += 1

            # TLS check
            has_weak_tls = False
            if latest_scan.tls_version and any(x in latest_scan.tls_version.upper() for x in ["TLS 1.0", "TLS 1.1", "SSL"]):
                has_weak_tls = True
            if latest_scan.negotiated_cipher and any(x in latest_scan.negotiated_cipher.upper() for x in ["3DES", "DES", "RC4", "NULL", "MD5", "EXP"]):
                has_weak_tls = True
            if has_weak_tls:
                weak_tls_count += 1

            # Certificate check
            if latest_scan.certificate and latest_scan.certificate.days_remaining is not None:
                days = latest_scan.certificate.days_remaining
                if days < 0:
                    expired_count += 1
                    expiry_buckets["Expired"] += 1
                elif days <= 7:
                    expiring_soon_count += 1
                    expiry_buckets["0-7 Days"] += 1
                elif days <= 15:
                    expiring_soon_count += 1
                    expiry_buckets["8-15 Days"] += 1
                elif days <= 30:
                    expiring_soon_count += 1
                    expiry_buckets["16-30 Days"] += 1
                else:
                    expiry_buckets[">30 Days"] += 1
        else:
            low_count += 1
            expiry_buckets[">30 Days"] += 1

    open_alerts_count = db.query(Alert).filter(Alert.status == "OPEN").count()

    # Risk distribution chart data
    risk_distribution = [
        {"name": "Critical", "value": critical_count, "color": "#ef4444"},
        {"name": "High", "value": high_count, "color": "#f97316"},
        {"name": "Medium", "value": medium_count, "color": "#eab308"},
        {"name": "Low", "value": low_count, "color": "#10b981"}
    ]

    # Expiry chart data
    expiry_chart_data = [
        {"range": "Expired", "count": expiry_buckets["Expired"], "fill": "#ef4444"},
        {"range": "0-7 Days", "count": expiry_buckets["0-7 Days"], "fill": "#f97316"},
        {"range": "8-15 Days", "count": expiry_buckets["8-15 Days"], "fill": "#fbbf24"},
        {"range": "16-30 Days", "count": expiry_buckets["16-30 Days"], "fill": "#38bdf8"},
        {"range": ">30 Days", "count": expiry_buckets[">30 Days"], "fill": "#10b981"}
    ]

    # Recent Scans
    recent_scans = db.query(Scan).order_by(desc(Scan.timestamp)).limit(6).all()
    recent_scans_data = []
    for s in recent_scans:
        ep = db.query(Endpoint).filter(Endpoint.id == s.endpoint_id).first()
        serialized = serialize_scan(s)
        serialized["hostname"] = ep.hostname if ep else "Unknown"
        serialized["environment"] = ep.environment if ep else "production"
        recent_scans_data.append(serialized)

    # Urgent Remediation Table: latest high/critical findings
    urgent_findings = db.query(Finding).join(Scan).filter(
        Finding.severity.in_(["CRITICAL", "HIGH"])
    ).order_by(desc(Finding.score), desc(Scan.timestamp)).limit(8).all()
    
    urgent_remediations = []
    seen_endpoints_rule = set()
    for f in urgent_findings:
        scan = db.query(Scan).filter(Scan.id == f.scan_id).first()
        ep = db.query(Endpoint).filter(Endpoint.id == scan.endpoint_id).first() if scan else None
        key = (ep.hostname if ep else "", f.rule_id)
        if key in seen_endpoints_rule:
            continue
        seen_endpoints_rule.add(key)
        
        priority = "P1 Immediate" if f.severity == "CRITICAL" else "P2 High"
        urgent_remediations.append({
            "id": f.id,
            "endpoint_id": ep.id if ep else None,
            "hostname": ep.hostname if ep else "Unknown",
            "rule_id": f.rule_id,
            "title": f.title,
            "severity": f.severity,
            "priority": priority,
            "recommendation": f.recommendation,
            "evidence": f.evidence
        })

    # Latest Alerts
    latest_alerts = db.query(Alert).filter(Alert.status == "OPEN").order_by(desc(Alert.created_at)).limit(8).all()
    alerts_data = []
    for a in latest_alerts:
        ep = db.query(Endpoint).filter(Endpoint.id == a.endpoint_id).first()
        alerts_data.append({
            "id": a.id,
            "endpoint_id": a.endpoint_id,
            "hostname": ep.hostname if ep else "Unknown",
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at,
            "status": a.status
        })

    return {
        "stats": {
            "total_endpoints": total_endpoints,
            "critical_risks": critical_count,
            "high_risks": high_count,
            "medium_risks": medium_count,
            "low_risks": low_count,
            "expiring_soon_count": expiring_soon_count,
            "expired_count": expired_count,
            "weak_tls_count": weak_tls_count,
            "active_alerts_count": open_alerts_count
        },
        "risk_distribution": risk_distribution,
        "expiry_chart": expiry_chart_data,
        "recent_scans": recent_scans_data,
        "urgent_remediations": urgent_remediations,
        "latest_alerts": alerts_data
    }
