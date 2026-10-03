from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Endpoint, Scan, Certificate, Finding, Alert
from ..services.demo_state import (
    get_demo_state,
    reset_all_demo_states,
    set_demo_expiring,
    set_demo_legacy_tls,
    set_demo_weak_cipher,
    set_demo_expired
)
from ..services.tls_scanner import run_tls_scan
from .endpoints import save_scan_result, serialize_scan

router = APIRouter(prefix="/demo", tags=["Demo Scenario"])

DEMO_HOSTNAME = "payment.demo.local"

def _ensure_demo_endpoint(db: Session, hostname: str = DEMO_HOSTNAME) -> Endpoint:
    """Finds or seeds the demo endpoint in database."""
    ep = db.query(Endpoint).filter(Endpoint.hostname == hostname).first()
    if not ep:
        ep = Endpoint(
            hostname=hostname,
            port=443,
            environment="production",
            owner="Fintech Core Team",
            business_criticality="CRITICAL",
            enabled=True
        )
        db.add(ep)
        db.commit()
        db.refresh(ep)
    return ep

def _trigger_demo_rescan(db: Session, hostname: str = DEMO_HOSTNAME) -> dict:
    """Executes the standard analysis pipeline on the updated demo state."""
    ep = _ensure_demo_endpoint(db, hostname)
    scan_data = run_tls_scan(ep.hostname, ep.port, ep.business_criticality)
    scan_obj = save_scan_result(db, ep, scan_data)
    return serialize_scan(scan_obj)

@router.get("/state")
def get_current_demo_state(hostname: str = DEMO_HOSTNAME):
    return get_demo_state(hostname)

@router.post("/reset", response_model=dict)
def reset_demo(db: Session = Depends(get_db)):
    """Resets all demo configurations back to baseline (Healthy, 90 days, TLS 1.3, Low Risk)."""
    reset_all_demo_states()
    
    # Also resolve all previous demo alerts for a clean slate
    ep = _ensure_demo_endpoint(db, DEMO_HOSTNAME)
    db.query(Alert).filter(Alert.endpoint_id == ep.id).update({"status": "RESOLVED"})
    db.commit()
    
    updated_scan = _trigger_demo_rescan(db, DEMO_HOSTNAME)
    return {
        "status": "success",
        "action": "RESET_DEMO",
        "message": f"Demo state reset to baseline: 90 days remaining, TLS 1.3, strong cipher, LOW risk.",
        "scan": updated_scan
    }

@router.post("/expiring", response_model=dict)
def simulate_expiring(days: int = 5, db: Session = Depends(get_db)):
    """Simulates certificate expiring within 5 days. Triggers CRITICAL/HIGH expiry finding."""
    set_demo_expiring(DEMO_HOSTNAME, days=days)
    updated_scan = _trigger_demo_rescan(db, DEMO_HOSTNAME)
    return {
        "status": "success",
        "action": "SIMULATE_EXPIRING",
        "message": f"Simulated expiring certificate: validity dropped to {days} days remaining.",
        "scan": updated_scan
    }

@router.post("/legacy-tls", response_model=dict)
def simulate_legacy_tls(tls_version: str = "TLS 1.0", db: Session = Depends(get_db)):
    """Simulates endpoint downgrading/supporting legacy TLS 1.0 protocol."""
    set_demo_legacy_tls(DEMO_HOSTNAME, tls_version=tls_version)
    updated_scan = _trigger_demo_rescan(db, DEMO_HOSTNAME)
    return {
        "status": "success",
        "action": "ENABLE_LEGACY_TLS",
        "message": f"Simulated legacy TLS enabled ({tls_version}). Risk score elevated.",
        "scan": updated_scan
    }

@router.post("/weak-cipher", response_model=dict)
def simulate_weak_cipher(cipher: str = "DES-CBC3-SHA", db: Session = Depends(get_db)):
    """Simulates endpoint accepting weak 3DES or RC4 cipher suite."""
    set_demo_weak_cipher(DEMO_HOSTNAME, cipher=cipher)
    updated_scan = _trigger_demo_rescan(db, DEMO_HOSTNAME)
    return {
        "status": "success",
        "action": "ENABLE_WEAK_CIPHER",
        "message": f"Simulated weak cipher enabled ({cipher}). Risk elevated to CRITICAL.",
        "scan": updated_scan
    }

@router.post("/expired", response_model=dict)
def simulate_expired(days_ago: int = -5, db: Session = Depends(get_db)):
    """Simulates certificate that is past validity (expired)."""
    set_demo_expired(DEMO_HOSTNAME, days_ago=days_ago)
    updated_scan = _trigger_demo_rescan(db, DEMO_HOSTNAME)
    return {
        "status": "success",
        "action": "EXPIRE_CERTIFICATE",
        "message": f"Simulated expired certificate ({abs(days_ago)} days overdue). Severe alert generated.",
        "scan": updated_scan
    }
