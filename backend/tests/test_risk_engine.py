from backend.services.risk_engine import calculate_risk

def test_risk_scoring_healthy_baseline():
    findings = []
    result = calculate_risk(findings, business_criticality="HIGH")
    assert result["risk_score"] == 0
    assert result["severity"] == "LOW"
    assert len(result["factors"]) == 0

def test_risk_scoring_accumulative_and_explainable():
    # Certificate expires in 5 days (+40), TLS 1.0 (+25), 3DES cipher (+20) = 85 (CRITICAL)
    findings = [
        {"rule_id": "CERT_EXPIRY_7D", "score": 40, "evidence": "Certificate expires in 5 days", "category": "EXPIRY"},
        {"rule_id": "LEGACY_TLS_10", "score": 25, "evidence": "TLS 1.0 supported", "category": "PROTOCOL"},
        {"rule_id": "CIPHER_3DES", "score": 20, "evidence": "3DES cipher supported", "category": "CIPHER"}
    ]
    result = calculate_risk(findings, business_criticality="CRITICAL")
    assert result["risk_score"] == 85
    assert result["severity"] == "CRITICAL"
    assert len(result["factors"]) == 3
    
    # Check explainability factors
    rules = [f["rule"] for f in result["factors"]]
    assert "CERT_EXPIRY_7D" in rules
    assert "LEGACY_TLS_10" in rules
    assert "CIPHER_3DES" in rules

def test_risk_score_capped_at_100():
    findings = [
        {"rule_id": "CERT_EXPIRED", "score": 50, "evidence": "Expired 10 days ago"},
        {"rule_id": "LEGACY_SSL_30", "score": 40, "evidence": "SSLv3 enabled"},
        {"rule_id": "CIPHER_RC4", "score": 30, "evidence": "RC4 enabled"},
        {"rule_id": "CERT_HOSTNAME_MISMATCH", "score": 35, "evidence": "Mismatch"}
    ]
    # Sum is 155 -> capped at 100
    result = calculate_risk(findings, business_criticality="HIGH")
    assert result["risk_score"] == 100
    assert result["severity"] == "CRITICAL"
    assert result["raw_score"] == 155

def test_risk_severity_thresholds():
    # 15 score -> LOW (0-24)
    low_res = calculate_risk([{"rule_id": "CERT_EXPIRY_30D", "score": 15, "evidence": "25d remaining"}])
    assert low_res["risk_score"] == 15
    assert low_res["severity"] == "LOW"

    # 30 score -> MEDIUM (25-49)
    med_res = calculate_risk([{"rule_id": "CERT_EXPIRY_15D", "score": 30, "evidence": "12d remaining"}])
    assert med_res["risk_score"] == 30
    assert med_res["severity"] == "MEDIUM"

    # 65 score -> HIGH (50-74)
    high_res = calculate_risk([
        {"rule_id": "CERT_EXPIRY_7D", "score": 40, "evidence": "5d remaining"},
        {"rule_id": "LEGACY_TLS_10", "score": 25, "evidence": "TLS 1.0"}
    ])
    assert high_res["risk_score"] == 65
    assert high_res["severity"] == "HIGH"
