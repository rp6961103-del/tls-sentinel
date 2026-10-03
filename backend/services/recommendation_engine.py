from typing import Dict, Any, List

def prioritize_recommendation(finding: Dict[str, Any], business_criticality: str = "HIGH") -> Dict[str, Any]:
    """
    Assigns prioritized remediation based on finding severity and business criticality:
      P1 Immediate: Cert expired, <=7d, SSLv2/v3, NULL/RC4 ciphers, validation failures
      P2 High: Cert <=15d, TLS 1.0, 3DES, Hostname mismatch
      P3 Planned: Cert <=30d, TLS 1.1, MD5 ciphers
      P4 Informational: Best-practice advisories
    """
    rule_id = finding.get("rule_id", "")
    severity = finding.get("severity", "LOW")
    
    # Critical findings are elevated to P1 Immediate
    if rule_id in ["CERT_EXPIRED", "CERT_EXPIRY_7D", "LEGACY_SSL_20", "LEGACY_SSL_30", "CIPHER_NULL", "CIPHER_EXPORT", "CIPHER_ANON", "CIPHER_RC4", "CERT_VALIDATION_FAILURE"]:
        priority = "P1"
        priority_label = "P1 Immediate"
        action_sla = "Resolve within 24 hours"
    elif rule_id in ["CERT_EXPIRY_15D", "LEGACY_TLS_10", "CIPHER_3DES", "CERT_HOSTNAME_MISMATCH", "CERT_WEAK_SIGNATURE", "CERT_SHORT_KEY"]:
        # If business criticality is CRITICAL, bump to P1
        if business_criticality == "CRITICAL":
            priority = "P1"
            priority_label = "P1 Immediate"
            action_sla = "Resolve within 24 hours (Critical Asset)"
        else:
            priority = "P2"
            priority_label = "P2 High"
            action_sla = "Resolve within 3-5 days"
    elif rule_id in ["CERT_EXPIRY_30D", "LEGACY_TLS_11", "CIPHER_MD5"]:
        priority = "P3"
        priority_label = "P3 Planned"
        action_sla = "Resolve within 14 days"
    else:
        priority = "P4"
        priority_label = "P4 Informational"
        action_sla = "Routine Maintenance"

    return {
        "rule_id": rule_id,
        "title": finding.get("title", ""),
        "priority": priority,
        "priority_label": priority_label,
        "action_sla": action_sla,
        "recommendation": finding.get("recommendation", ""),
        "evidence": finding.get("evidence", ""),
        "explanation": finding.get("explanation", "")
    }

def generate_remediation_plan(findings: List[Dict[str, Any]], business_criticality: str = "HIGH") -> List[Dict[str, Any]]:
    """
    Generates a sorted remediation checklist ordered from P1 to P4.
    """
    items = [prioritize_recommendation(f, business_criticality) for f in findings]
    order_map = {"P1": 1, "P2": 2, "P3": 3, "P4": 4}
    items.sort(key=lambda x: order_map.get(x["priority"], 99))
    return items
