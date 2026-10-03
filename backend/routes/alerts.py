from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Alert, Endpoint

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[dict])
def list_alerts(
    status: Optional[str] = Query(None, description="OPEN or RESOLVED"),
    severity: Optional[str] = None,
    endpoint_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())
    if endpoint_id:
        query = query.filter(Alert.endpoint_id == endpoint_id)

    alerts = query.order_by(desc(Alert.created_at)).all()
    results = []
    for a in alerts:
        ep = db.query(Endpoint).filter(Endpoint.id == a.endpoint_id).first()
        results.append({
            "id": a.id,
            "endpoint_id": a.endpoint_id,
            "hostname": ep.hostname if ep else "Unknown",
            "environment": ep.environment if ep else "production",
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "created_at": a.created_at,
            "resolved_at": a.resolved_at
        })
    return results

@router.patch("/{alert_id}/resolve", response_model=dict)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return {
        "message": f"Alert {alert_id} resolved successfully",
        "id": alert.id,
        "status": alert.status,
        "resolved_at": alert.resolved_at
    }
