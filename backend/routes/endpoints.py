from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Endpoint, Scan, Certificate, Finding, Alert
from ..schemas import EndpointCreate, EndpointUpdate, EndpointOut, ScanOut
from ..services.authorization import assert_authorized, is_hostname_authorized
from ..services.tls_scanner import run_tls_scan
from ..services.alert_service import sync_alerts_for_scan

router = APIRouter(prefix="/endpoints", tags=["Endpoints"])

def serialize_scan(scan: Scan) -> Optional[dict]:
    if not scan:
        return None
        
    cert_dict = None
    if scan.certificate:
        cert_dict = {
            "id": scan.certificate.id,
            "scan_id": scan.certificate.scan_id,
            "subject": scan.certificate.subject,
            "issuer": scan.certificate.issuer,
            "serial_number": scan.certificate.serial_number,
            "valid_from": scan.certificate.valid_from,
            "valid_until": scan.certificate.valid_until,
            "days_remaining": scan.certificate.days_remaining,
            "signature_algorithm": scan.certificate.signature_algorithm,
            "public_key_algorithm": scan.certificate.public_key_algorithm,
            "public_key_size": scan.certificate.public_key_size,
            "san_names": scan.certificate.san_names
        }
        
    findings_list = [
        {
            "id": f.id,
            "scan_id": f.scan_id,
            "rule_id": f.rule_id,
            "category": f.category,
            "title": f.title,
            "severity": f.severity,
            "evidence": f.evidence,
            "explanation": f.explanation,
            "recommendation": f.recommendation,
            "score": f.score
        }
        for f in scan.findings
    ]
    
    factors = [
        {
            "rule": f.rule_id,
            "title": f.title,
            "category": f.category,
            "score": f.score,
            "evidence": f.evidence,
            "recommendation": f.recommendation
        }
        for f in scan.findings
    ]
    
    return {
        "id": scan.id,
        "endpoint_id": scan.endpoint_id,
        "timestamp": scan.timestamp,
        "status": scan.status,
        "tls_version": scan.tls_version,
        "negotiated_cipher": scan.negotiated_cipher,
        "risk_score": scan.risk_score,
        "severity": scan.severity,
        "certificate": cert_dict,
        "findings": findings_list,
        "factors": factors
    }

@router.get("", response_model=List[EndpointOut])
def list_endpoints(
    search: Optional[str] = None,
    risk: Optional[str] = None,
    environment: Optional[str] = None,
    expiry_status: Optional[str] = None,
    tls_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Endpoint)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter((Endpoint.hostname.ilike(search_fmt)) | (Endpoint.owner.ilike(search_fmt)))
    if environment:
        query = query.filter(Endpoint.environment == environment)

    endpoints = query.order_by(Endpoint.hostname).all()
    results = []

    for ep in endpoints:
        latest_scan = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).first()
        open_alerts_count = db.query(Alert).filter(Alert.endpoint_id == ep.id, Alert.status == "OPEN").count()

        # Risk filter
        if risk and latest_scan and latest_scan.severity.upper() != risk.upper():
            continue

        # Expiry filter
        if expiry_status and latest_scan and latest_scan.certificate:
            days = latest_scan.certificate.days_remaining
            if days is not None:
                if expiry_status == "expired" and days >= 0:
                    continue
                elif expiry_status == "0-7d" and not (0 <= days <= 7):
                    continue
                elif expiry_status == "8-15d" and not (8 <= days <= 15):
                    continue
                elif expiry_status == "16-30d" and not (16 <= days <= 30):
                    continue
                elif expiry_status == ">30d" and days <= 30:
                    continue

        # TLS version filter
        if tls_status and latest_scan and latest_scan.tls_version:
            is_legacy = any(x in latest_scan.tls_version.upper() for x in ["TLS 1.0", "TLS 1.1", "SSL"])
            if tls_status == "legacy" and not is_legacy:
                continue
            elif tls_status == "modern" and is_legacy:
                continue

        serialized_scan = serialize_scan(latest_scan) if latest_scan else None

        results.append(
            EndpointOut(
                id=ep.id,
                hostname=ep.hostname,
                port=ep.port,
                environment=ep.environment,
                owner=ep.owner,
                business_criticality=ep.business_criticality,
                enabled=ep.enabled,
                created_at=ep.created_at,
                last_scan_at=ep.last_scan_at,
                latest_scan=serialized_scan,
                open_alerts_count=open_alerts_count
            )
        )

    return results

@router.post("", response_model=EndpointOut, status_code=status.HTTP_201_CREATED)
def create_endpoint(payload: EndpointCreate, db: Session = Depends(get_db)):
    # 1. Enforce Defensive Security Allowlist
    try:
        assert_authorized(payload.hostname, payload.port)
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe)
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    # Check if duplicate exists
    existing = db.query(Endpoint).filter(
        Endpoint.hostname == payload.hostname.lower(),
        Endpoint.port == payload.port
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Endpoint '{payload.hostname}:{payload.port}' already exists in inventory."
        )

    new_ep = Endpoint(
        hostname=payload.hostname.lower().strip(),
        port=payload.port,
        environment=payload.environment,
        owner=payload.owner,
        business_criticality=payload.business_criticality.upper(),
        enabled=payload.enabled,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_ep)
    db.commit()
    db.refresh(new_ep)

    # Automatically perform initial scan
    try:
        scan_data = run_tls_scan(new_ep.hostname, new_ep.port, new_ep.business_criticality)
        save_scan_result(db, new_ep, scan_data)
        db.refresh(new_ep)
    except Exception:
        pass

    latest_scan = db.query(Scan).filter(Scan.endpoint_id == new_ep.id).order_by(desc(Scan.timestamp)).first()
    return EndpointOut(
        id=new_ep.id,
        hostname=new_ep.hostname,
        port=new_ep.port,
        environment=new_ep.environment,
        owner=new_ep.owner,
        business_criticality=new_ep.business_criticality,
        enabled=new_ep.enabled,
        created_at=new_ep.created_at,
        last_scan_at=new_ep.last_scan_at,
        latest_scan=serialize_scan(latest_scan),
        open_alerts_count=0
    )

@router.get("/{endpoint_id}", response_model=dict)
def get_endpoint(endpoint_id: int, db: Session = Depends(get_db)):
    ep = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    latest_scan = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).first()
    all_scans = db.query(Scan).filter(Scan.endpoint_id == ep.id).order_by(desc(Scan.timestamp)).limit(10).all()
    open_alerts = db.query(Alert).filter(Alert.endpoint_id == ep.id, Alert.status == "OPEN").all()

    return {
        "endpoint": {
            "id": ep.id,
            "hostname": ep.hostname,
            "port": ep.port,
            "environment": ep.environment,
            "owner": ep.owner,
            "business_criticality": ep.business_criticality,
            "enabled": ep.enabled,
            "created_at": ep.created_at,
            "last_scan_at": ep.last_scan_at
        },
        "latest_scan": serialize_scan(latest_scan),
        "recent_scans": [serialize_scan(s) for s in all_scans],
        "open_alerts": [
            {
                "id": a.id,
                "severity": a.severity,
                "message": a.message,
                "created_at": a.created_at,
                "status": a.status
            }
            for a in open_alerts
        ]
    }

@router.put("/{endpoint_id}", response_model=dict)
def update_endpoint(endpoint_id: int, payload: EndpointUpdate, db: Session = Depends(get_db)):
    ep = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    if payload.hostname:
        assert_authorized(payload.hostname, payload.port or ep.port)
        ep.hostname = payload.hostname.lower().strip()
    if payload.port:
        ep.port = payload.port
    if payload.environment:
        ep.environment = payload.environment
    if payload.owner:
        ep.owner = payload.owner
    if payload.business_criticality:
        ep.business_criticality = payload.business_criticality.upper()
    if payload.enabled is not None:
        ep.enabled = payload.enabled

    db.commit()
    db.refresh(ep)
    return {"message": "Endpoint updated successfully", "id": ep.id}

@router.delete("/{endpoint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_endpoint(endpoint_id: int, db: Session = Depends(get_db)):
    ep = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    db.delete(ep)
    db.commit()
    return None

@router.post("/{endpoint_id}/scan", response_model=dict)
def scan_endpoint(endpoint_id: int, db: Session = Depends(get_db)):
    ep = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    try:
        scan_data = run_tls_scan(ep.hostname, ep.port, ep.business_criticality)
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan error: {str(e)}")

    scan_obj = save_scan_result(db, ep, scan_data)
    return serialize_scan(scan_obj)

def save_scan_result(db: Session, ep: Endpoint, scan_data: dict) -> Scan:
    now = datetime.now(timezone.utc)
    scan_obj = Scan(
        endpoint_id=ep.id,
        timestamp=now,
        status=scan_data.get("status", "COMPLETED"),
        tls_version=scan_data.get("tls_version"),
        negotiated_cipher=scan_data.get("negotiated_cipher"),
        risk_score=scan_data.get("risk_score", 0),
        severity=scan_data.get("severity", "LOW")
    )
    db.add(scan_obj)
    db.commit()
    db.refresh(scan_obj)

    # Save certificate if present
    cert_data = scan_data.get("certificate")
    if cert_data:
        cert_obj = Certificate(
            scan_id=scan_obj.id,
            subject=cert_data.get("subject"),
            issuer=cert_data.get("issuer"),
            serial_number=cert_data.get("serial_number"),
            valid_from=cert_data.get("valid_from"),
            valid_until=cert_data.get("valid_until"),
            days_remaining=cert_data.get("days_remaining"),
            signature_algorithm=cert_data.get("signature_algorithm"),
            public_key_algorithm=cert_data.get("public_key_algorithm"),
            public_key_size=cert_data.get("public_key_size"),
            san_names=cert_data.get("san_names")
        )
        db.add(cert_obj)

    # Save findings
    created_findings = []
    for f in scan_data.get("findings", []):
        finding_obj = Finding(
            scan_id=scan_obj.id,
            rule_id=f.get("rule_id", "UNKNOWN"),
            category=f.get("category", "GENERAL"),
            title=f.get("title", "Security Finding"),
            severity=f.get("severity", "LOW"),
            evidence=f.get("evidence", ""),
            explanation=f.get("explanation", ""),
            recommendation=f.get("recommendation", ""),
            score=f.get("score", 0)
        )
        db.add(finding_obj)
        created_findings.append(finding_obj)

    db.commit()
    db.refresh(scan_obj)

    # Update endpoint last scanned at
    ep.last_scan_at = now
    db.commit()

    # Generate alerts for findings
    sync_alerts_for_scan(db, ep.id, created_findings)

    return scan_obj
