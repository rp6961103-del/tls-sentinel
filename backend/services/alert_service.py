from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import Alert, Finding, Endpoint

def sync_alerts_for_scan(db: Session, endpoint_id: int, findings: list[Finding]):
    """
    Creates alerts for:
      - certificate <= 30 days, <= 15 days, <= 7 days
      - expired certificate
      - legacy TLS
      - weak cipher
      - hostname mismatch
      - certificate validation problem
    Avoids duplicate unresolved alerts for the exact same rule on this endpoint.
    """
    now = datetime.now(timezone.utc)
    
    # Fetch existing open alerts for this endpoint
    open_alerts = db.query(Alert).filter(
        Alert.endpoint_id == endpoint_id,
        Alert.status == "OPEN"
    ).all()
    
    existing_open_rules = set()
    for a in open_alerts:
        if a.finding and a.finding.rule_id:
            existing_open_rules.add(a.finding.rule_id)
        elif a.message:
            # fallback match
            for rule in ["CERT_EXPIRED", "CERT_EXPIRY_7D", "CERT_EXPIRY_15D", "CERT_EXPIRY_30D", "LEGACY_TLS_10", "LEGACY_TLS_11", "CIPHER_3DES", "CIPHER_RC4", "CIPHER_NULL", "CERT_HOSTNAME_MISMATCH", "CERT_VALIDATION_FAILURE"]:
                if rule in a.message:
                    existing_open_rules.add(rule)

    for finding in findings:
        rule_id = finding.rule_id
        # Alertable rules
        if rule_id in [
            "CERT_EXPIRED", "CERT_EXPIRY_7D", "CERT_EXPIRY_15D", "CERT_EXPIRY_30D",
            "LEGACY_SSL_20", "LEGACY_SSL_30", "LEGACY_TLS_10", "LEGACY_TLS_11",
            "CIPHER_NULL", "CIPHER_EXPORT", "CIPHER_ANON", "CIPHER_RC4", "CIPHER_3DES", "CIPHER_MD5",
            "CERT_HOSTNAME_MISMATCH", "CERT_VALIDATION_FAILURE"
        ]:
            if rule_id not in existing_open_rules:
                alert = Alert(
                    endpoint_id=endpoint_id,
                    finding_id=finding.id,
                    severity=finding.severity,
                    message=f"[{finding.rule_id}] {finding.title}: {finding.evidence}",
                    status="OPEN",
                    created_at=now
                )
                db.add(alert)
                existing_open_rules.add(rule_id)
                
    db.commit()
