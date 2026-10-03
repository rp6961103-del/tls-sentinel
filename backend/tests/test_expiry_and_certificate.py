from datetime import datetime, timezone, timedelta
from backend.services.certificate_analyzer import analyze_certificate, match_hostname

def test_match_hostname():
    assert match_hostname("payment.demo.local", ["payment.demo.local", "api.payment.demo.local"], "payment.demo.local") is True
    assert match_hostname("sub.example.com", ["*.example.com"], None) is True
    assert match_hostname("evil.com", ["payment.demo.local"], "payment.demo.local") is False

def test_certificate_expired_finding():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now - timedelta(days=5),
        "valid_from": now - timedelta(days=100),
        "days_remaining": -5,
        "subject": "CN=expired.demo.local",
        "san_names": ["expired.demo.local"]
    }
    result = analyze_certificate(cert_data, "expired.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CERT_EXPIRED" in rule_ids
    expired_f = next(f for f in result["findings"] if f["rule_id"] == "CERT_EXPIRED")
    assert expired_f["severity"] == "CRITICAL"
    assert expired_f["score"] == 50

def test_certificate_critical_7d_finding():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now + timedelta(days=5),
        "valid_from": now - timedelta(days=85),
        "days_remaining": 5,
        "subject": "CN=payment.demo.local",
        "san_names": ["payment.demo.local"]
    }
    result = analyze_certificate(cert_data, "payment.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CERT_EXPIRY_7D" in rule_ids
    f = next(f for f in result["findings"] if f["rule_id"] == "CERT_EXPIRY_7D")
    assert f["severity"] == "CRITICAL"
    assert f["score"] == 40

def test_certificate_high_15d_finding():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now + timedelta(days=12),
        "valid_from": now - timedelta(days=78),
        "days_remaining": 12,
        "subject": "CN=login.demo.local",
        "san_names": ["login.demo.local"]
    }
    result = analyze_certificate(cert_data, "login.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CERT_EXPIRY_15D" in rule_ids
    f = next(f for f in result["findings"] if f["rule_id"] == "CERT_EXPIRY_15D")
    assert f["severity"] == "HIGH"
    assert f["score"] == 30

def test_certificate_medium_30d_finding():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now + timedelta(days=20),
        "valid_from": now - timedelta(days=70),
        "days_remaining": 20,
        "subject": "CN=api.demo.local",
        "san_names": ["api.demo.local"]
    }
    result = analyze_certificate(cert_data, "api.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CERT_EXPIRY_30D" in rule_ids
    f = next(f for f in result["findings"] if f["rule_id"] == "CERT_EXPIRY_30D")
    assert f["severity"] == "MEDIUM"
    assert f["score"] == 15

def test_certificate_healthy_90d_no_expiry_finding():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now + timedelta(days=90),
        "valid_from": now - timedelta(days=90),
        "days_remaining": 90,
        "subject": "CN=payment.demo.local",
        "san_names": ["payment.demo.local"]
    }
    result = analyze_certificate(cert_data, "payment.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert not any("EXPIRY" in r or "EXPIRED" in r for r in rule_ids)

def test_hostname_mismatch_finding():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now + timedelta(days=60),
        "days_remaining": 60,
        "subject": "CN=other.demo.local",
        "san_names": ["other.demo.local"]
    }
    result = analyze_certificate(cert_data, "payment.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CERT_HOSTNAME_MISMATCH" in rule_ids
    f = next(f for f in result["findings"] if f["rule_id"] == "CERT_HOSTNAME_MISMATCH")
    assert f["score"] == 35

def test_weak_sha1_and_short_key():
    now = datetime.now(timezone.utc)
    cert_data = {
        "valid_until": now + timedelta(days=60),
        "days_remaining": 60,
        "subject": "CN=internal.demo.local",
        "san_names": ["internal.demo.local"],
        "signature_algorithm": "sha1WithRSAEncryption",
        "public_key_algorithm": "RSA",
        "public_key_size": 1024
    }
    result = analyze_certificate(cert_data, "internal.demo.local")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CERT_WEAK_SIGNATURE" in rule_ids
    assert "CERT_SHORT_KEY" in rule_ids
