from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.models import Endpoint, Finding, Alert, Scan
from backend.services.recommendation_engine import prioritize_recommendation, generate_remediation_plan
from backend.services.alert_service import sync_alerts_for_scan

def test_recommendation_prioritization():
    # P1 Immediate for expired cert
    p1_item = prioritize_recommendation({"rule_id": "CERT_EXPIRED", "severity": "CRITICAL", "recommendation": "Renew cert"}, "HIGH")
    assert p1_item["priority"] == "P1"
    assert "Immediate" in p1_item["priority_label"]

    # P2 High for TLS 1.0
    p2_item = prioritize_recommendation({"rule_id": "LEGACY_TLS_10", "severity": "HIGH", "recommendation": "Disable TLS 1.0"}, "HIGH")
    assert p2_item["priority"] == "P2"

    # P3 Planned for 30-day expiry
    p3_item = prioritize_recommendation({"rule_id": "CERT_EXPIRY_30D", "severity": "MEDIUM", "recommendation": "Verify automation"}, "MEDIUM")
    assert p3_item["priority"] == "P3"

def test_generate_remediation_plan_sorting():
    findings = [
        {"rule_id": "CERT_EXPIRY_30D", "severity": "MEDIUM", "recommendation": "Rec 3"},
        {"rule_id": "CERT_EXPIRED", "severity": "CRITICAL", "recommendation": "Rec 1"},
        {"rule_id": "LEGACY_TLS_10", "severity": "HIGH", "recommendation": "Rec 2"},
    ]
    plan = generate_remediation_plan(findings, "HIGH")
    assert len(plan) == 3
    assert plan[0]["priority"] == "P1"
    assert plan[1]["priority"] == "P2"
    assert plan[2]["priority"] == "P3"

def test_alert_generation_and_deduplication():
    # Use SQLite in-memory for testing DB operations
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Create dummy endpoint
    ep = Endpoint(hostname="payment.demo.local", port=443, environment="production", owner="Ops", business_criticality="HIGH")
    db.add(ep)
    db.commit()

    scan = Scan(endpoint_id=ep.id, status="COMPLETED", risk_score=85, severity="CRITICAL")
    db.add(scan)
    db.commit()

    f1 = Finding(scan_id=scan.id, rule_id="CERT_EXPIRY_7D", category="EXPIRY", title="Expiring soon", severity="CRITICAL", evidence="5d", explanation="Exp", recommendation="Renew", score=40)
    f2 = Finding(scan_id=scan.id, rule_id="LEGACY_TLS_10", category="PROTOCOL", title="TLS 1.0", severity="HIGH", evidence="TLS 1.0", explanation="Exp", recommendation="Disable", score=25)
    db.add_all([f1, f2])
    db.commit()

    # First sync: should create 2 alerts
    sync_alerts_for_scan(db, ep.id, [f1, f2])
    alerts = db.query(Alert).filter(Alert.endpoint_id == ep.id).all()
    assert len(alerts) == 2
    assert all(a.status == "OPEN" for a in alerts)

    # Second sync with same findings: should NOT duplicate open alerts
    sync_alerts_for_scan(db, ep.id, [f1, f2])
    alerts_after = db.query(Alert).filter(Alert.endpoint_id == ep.id).all()
    assert len(alerts_after) == 2

    # Mark one alert as resolved
    alerts[0].status = "RESOLVED"
    db.commit()

    # Third sync: now that one is resolved, re-scanning creates fresh alert for active finding
    sync_alerts_for_scan(db, ep.id, [f1])
    alerts_reopened = db.query(Alert).filter(Alert.endpoint_id == ep.id).all()
    assert len(alerts_reopened) == 3
