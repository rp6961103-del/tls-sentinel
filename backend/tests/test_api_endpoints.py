import pytest
from fastapi.testclient import TestClient
from backend.main import app, seed_initial_demo_data

# Ensure data is seeded for test client
seed_initial_demo_data()
client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_endpoints_inventory_and_security_boundary():
    # Listing endpoints
    res = client.get("/api/endpoints")
    assert res.status_code == 200
    endpoints = res.json()
    assert len(endpoints) >= 1

    # Unauthorized domain creation should be rejected with 403
    unauthorized_payload = {
        "hostname": "attacker-scan-target.com",
        "port": 443,
        "environment": "production",
        "owner": "External",
        "business_criticality": "HIGH"
    }
    block_res = client.post("/api/endpoints", json=unauthorized_payload)
    assert block_res.status_code == 403
    assert "not in the authorized endpoint allowlist" in block_res.json()["detail"]

def test_dashboard_endpoint():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    assert "risk_distribution" in data
    assert "expiry_chart" in data
    assert "recent_scans" in data
    assert "urgent_remediations" in data

def test_demo_scenario_flow():
    # 1. Reset demo state
    reset_res = client.post("/api/demo/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["scan"]["severity"] == "LOW"
    assert reset_data["scan"]["risk_score"] == 0

    # 2. Simulate Expiring Certificate (5 days)
    exp_res = client.post("/api/demo/expiring?days=5")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["scan"]["risk_score"] >= 40
    # Check that factors explain the score
    factor_rules = [f["rule"] for f in exp_data["scan"]["factors"]]
    assert "CERT_EXPIRY_7D" in factor_rules

    # 3. Simulate Legacy TLS (TLS 1.0)
    tls_res = client.post("/api/demo/legacy-tls?tls_version=TLS 1.0")
    assert tls_res.status_code == 200
    tls_data = tls_res.json()
    # Risk should have increased from 40 to 65
    assert tls_data["scan"]["risk_score"] >= 65
    factor_rules_tls = [f["rule"] for f in tls_data["scan"]["factors"]]
    assert "LEGACY_TLS_10" in factor_rules_tls

    # 4. Simulate Weak Cipher (3DES)
    cipher_res = client.post("/api/demo/weak-cipher?cipher=DES-CBC3-SHA")
    assert cipher_res.status_code == 200
    cipher_data = cipher_res.json()
    # Risk should have increased to 85 (CRITICAL)
    assert cipher_data["scan"]["risk_score"] >= 85
    assert cipher_data["scan"]["severity"] == "CRITICAL"
    factor_rules_cipher = [f["rule"] for f in cipher_data["scan"]["factors"]]
    assert "CIPHER_3DES" in factor_rules_cipher

    # 5. Reset demo back to clean baseline
    clean_res = client.post("/api/demo/reset")
    assert clean_res.status_code == 200
    assert clean_res.json()["scan"]["risk_score"] == 0

def test_reports_endpoints():
    summary_res = client.get("/api/reports/summary")
    assert summary_res.status_code == 200
    assert "total_endpoints" in summary_res.json()

    csv_res = client.get("/api/reports/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]

    json_res = client.get("/api/reports/export/json")
    assert json_res.status_code == 200
    assert "endpoints" in json_res.json()
