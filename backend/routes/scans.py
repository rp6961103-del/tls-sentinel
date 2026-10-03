from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Scan, Finding, Certificate, Endpoint
from .endpoints import serialize_scan

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.get("", response_model=List[dict])
def list_scans(
    endpoint_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Scan)
    if endpoint_id:
        query = query.filter(Scan.endpoint_id == endpoint_id)
        
    scans = query.order_by(desc(Scan.timestamp)).limit(limit).all()
    results = []
    for s in scans:
        ep = db.query(Endpoint).filter(Endpoint.id == s.endpoint_id).first()
        serialized = serialize_scan(s)
        serialized["hostname"] = ep.hostname if ep else "Unknown"
        serialized["environment"] = ep.environment if ep else "production"
        results.append(serialized)
    return results

@router.get("/{scan_id}", response_model=dict)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
        
    ep = db.query(Endpoint).filter(Endpoint.id == scan.endpoint_id).first()
    serialized = serialize_scan(scan)
    serialized["hostname"] = ep.hostname if ep else "Unknown"
    serialized["environment"] = ep.environment if ep else "production"
    serialized["owner"] = ep.owner if ep else "Unknown"
    serialized["business_criticality"] = ep.business_criticality if ep else "HIGH"
    
    return serialized
