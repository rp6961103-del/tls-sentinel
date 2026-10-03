from backend.services.cipher_analyzer import analyze_protocol, analyze_cipher

def test_protocol_analysis_legacy_versions():
    # SSLv2
    findings_v2 = analyze_protocol("SSLv2")
    assert any(f["rule_id"] == "LEGACY_SSL_20" and f["score"] == 40 for f in findings_v2)

    # SSLv3
    findings_v3 = analyze_protocol("SSLv3")
    assert any(f["rule_id"] == "LEGACY_SSL_30" and f["score"] == 40 for f in findings_v3)

    # TLS 1.0
    findings_10 = analyze_protocol("TLS 1.0")
    assert any(f["rule_id"] == "LEGACY_TLS_10" and f["score"] == 25 for f in findings_10)

    # TLS 1.1
    findings_11 = analyze_protocol("TLS 1.1")
    assert any(f["rule_id"] == "LEGACY_TLS_11" and f["score"] == 20 for f in findings_11)

def test_protocol_analysis_modern_versions():
    # TLS 1.2
    assert len(analyze_protocol("TLS 1.2")) == 0
    # TLS 1.3
    assert len(analyze_protocol("TLS 1.3")) == 0

def test_cipher_analysis_weak_suites():
    # RC4
    rc4 = analyze_cipher("ECDHE-RSA-RC4-SHA")
    assert any(f["rule_id"] == "CIPHER_RC4" and f["score"] == 30 for f in rc4)

    # 3DES
    des3 = analyze_cipher("DES-CBC3-SHA")
    assert any(f["rule_id"] == "CIPHER_3DES" and f["score"] == 20 for f in des3)

    # NULL
    null_c = analyze_cipher("NULL-SHA256")
    assert any(f["rule_id"] == "CIPHER_NULL" and f["score"] == 30 for f in null_c)

    # EXPORT
    exp = analyze_cipher("EXP-EDH-RSA-DES-CBC-SHA")
    assert any(f["rule_id"] == "CIPHER_EXPORT" and f["score"] == 30 for f in exp)

    # MD5
    md5 = analyze_cipher("RC4-MD5")
    assert any(f["rule_id"] == "CIPHER_RC4" or f["rule_id"] == "CIPHER_MD5" for f in md5)

def test_cipher_analysis_strong_modern_suites():
    # Modern TLS 1.3 cipher
    assert len(analyze_cipher("TLS_AES_256_GCM_SHA384")) == 0
    assert len(analyze_cipher("TLS_CHACHA20_POLY1305_SHA256")) == 0
    assert len(analyze_cipher("ECDHE-ECDSA-AES128-GCM-SHA256")) == 0
