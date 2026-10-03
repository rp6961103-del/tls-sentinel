from typing import Dict, Any, List

def analyze_protocol(tls_version: str) -> List[Dict[str, Any]]:
    """
    Analyzes the TLS protocol version.
    Returns findings for deprecated or insecure protocols.
    """
    findings: List[Dict[str, Any]] = []
    v = (tls_version or "").upper().strip()
    
    if "SSLV2" in v or "SSL 2" in v:
        findings.append({
            "rule_id": "LEGACY_SSL_20",
            "category": "PROTOCOL",
            "title": "Insecure SSLv2 Protocol Supported",
            "severity": "CRITICAL",
            "evidence": f"Negotiated or supported protocol: {tls_version}",
            "explanation": "SSLv2 is fundamentally broken with known cryptanalytic attacks (DROWN, replay attacks).",
            "recommendation": "Immediately disable SSLv2 in the web server and load balancer configurations.",
            "score": 40
        })
    elif "SSLV3" in v or "SSL 3" in v:
        findings.append({
            "rule_id": "LEGACY_SSL_30",
            "category": "PROTOCOL",
            "title": "Insecure SSLv3 Protocol Supported",
            "severity": "CRITICAL",
            "evidence": f"Negotiated or supported protocol: {tls_version}",
            "explanation": "SSLv3 is vulnerable to the POODLE attack (Padding Oracle On Downgraded Legacy Encryption).",
            "recommendation": "Disable SSLv3 across all ingress routers and enforce modern TLS 1.2/1.3.",
            "score": 40
        })
    elif "TLS 1.0" in v or "TLSV1.0" in v or v == "TLSV1":
        findings.append({
            "rule_id": "LEGACY_TLS_10",
            "category": "PROTOCOL",
            "title": "Deprecated TLS 1.0 Protocol Enabled",
            "severity": "HIGH",
            "evidence": f"Endpoint supports deprecated {tls_version}",
            "explanation": "TLS 1.0 lacks modern cryptographic primitives, is deprecated by RFC 8996, and violates PCI-DSS compliance.",
            "recommendation": "Disable TLS 1.0 and require TLS 1.2/1.3 where client compatibility permits.",
            "score": 25
        })
    elif "TLS 1.1" in v or "TLSV1.1" in v:
        findings.append({
            "rule_id": "LEGACY_TLS_11",
            "category": "PROTOCOL",
            "title": "Deprecated TLS 1.1 Protocol Enabled",
            "severity": "HIGH",
            "evidence": f"Endpoint supports deprecated {tls_version}",
            "explanation": "TLS 1.1 was formally deprecated by RFC 8996 due to reliance on weak SHA-1 and MD5 hashes in handshakes.",
            "recommendation": "Upgrade client fleet and disable TLS 1.1 in favor of TLS 1.2 and TLS 1.3.",
            "score": 20
        })
    # Modern TLS 1.2 and TLS 1.3 produce no findings.
    
    return findings

def analyze_cipher(cipher_name: str) -> List[Dict[str, Any]]:
    """
    Analyzes the negotiated/supported cipher suite.
    Identifies RC4, DES, 3DES, NULL, EXPORT, Anonymous authentication, and MD5 suites.
    Strong modern configurations receive no finding.
    """
    findings: List[Dict[str, Any]] = []
    c = (cipher_name or "").upper().strip()
    
    if not c or c in ["NONE", "UNKNOWN"]:
        return findings

    # 1. NULL Encryption (No privacy protection)
    if "NULL" in c:
        findings.append({
            "rule_id": "CIPHER_NULL",
            "category": "CIPHER",
            "title": "NULL Encryption Cipher Suite Allowed",
            "severity": "CRITICAL",
            "evidence": f"Negotiated cipher: {cipher_name} contains no payload encryption.",
            "explanation": "NULL ciphers transmit all network traffic in plaintext without confidentiality guarantees.",
            "recommendation": "Remove all NULL ciphers from the server cipher suite list immediately.",
            "score": 30
        })

    # 2. EXPORT Ciphers (Intentionally weakened legacy suites)
    elif "EXP" in c or "EXPORT" in c:
        findings.append({
            "rule_id": "CIPHER_EXPORT",
            "category": "CIPHER",
            "title": "Weak EXPORT-Grade Cipher Suite Allowed",
            "severity": "CRITICAL",
            "evidence": f"Negotiated cipher: {cipher_name} uses obsolete 40/56-bit key constraints (FREAK attack).",
            "explanation": "Export ciphers were intentionally weakened in the 1990s and can be factored in hours with modern hardware.",
            "recommendation": "Disable all EXPORT-grade ciphers and configure secure high-grade suites.",
            "score": 30
        })

    # 3. Anonymous Authentication (Man-in-the-Middle)
    elif "ANON" in c or "ADH" in c or "AECDH" in c:
        findings.append({
            "rule_id": "CIPHER_ANON",
            "category": "CIPHER",
            "title": "Anonymous Cipher Suite Allowed",
            "severity": "CRITICAL",
            "evidence": f"Negotiated cipher: {cipher_name} has no server authentication.",
            "explanation": "Anonymous cipher suites provide no authentication, leaving connections susceptible to active interception.",
            "recommendation": "Enforce authenticated cipher suites with valid X.509 certificate chains.",
            "score": 30
        })

    # 4. RC4 Stream Cipher (Broken by Bar Mitzvah & Royal Holloway attacks)
    elif "RC4" in c:
        findings.append({
            "rule_id": "CIPHER_RC4",
            "category": "CIPHER",
            "title": "Vulnerable RC4 Stream Cipher Suite Negotiated",
            "severity": "CRITICAL",
            "evidence": f"Negotiated cipher: {cipher_name} utilizes the broken RC4 algorithm.",
            "explanation": "RC4 contains statistical biases in keystream generation that allow practical plaintext recovery attacks.",
            "recommendation": "Remove RC4 from the server configuration and prefer authenticated AEAD cipher suites (AES-GCM, ChaCha20-Poly1305).",
            "score": 30
        })

    # 5. DES / 3DES (Triple-DES / Sweet32 attack)
    elif "3DES" in c or "DES-CBC3" in c or ((" DES" in c or c.startswith("DES")) and "3DES" not in c):
        findings.append({
            "rule_id": "CIPHER_3DES",
            "category": "CIPHER",
            "title": "Legacy 64-bit Block Cipher (3DES/DES) Negotiated",
            "severity": "HIGH",
            "evidence": f"Negotiated cipher: {cipher_name} utilizes a 64-bit block size (Sweet32 vulnerability).",
            "explanation": "64-bit block ciphers are susceptible to birthday collision attacks (Sweet32, CVE-2016-2183) after ~32GB of data transfer.",
            "recommendation": "Remove 3DES from the server configuration and prefer AES-128/256-GCM or ChaCha20-Poly1305.",
            "score": 20
        })

    # 6. MD5-based Ciphers
    elif "MD5" in c:
        findings.append({
            "rule_id": "CIPHER_MD5",
            "category": "CIPHER",
            "title": "Deprecated MD5 MAC Cipher Suite Negotiated",
            "severity": "HIGH",
            "evidence": f"Negotiated cipher: {cipher_name} uses MD5 message authentication.",
            "explanation": "MD5 suffers from well-documented collision vulnerabilities and should not be used for cryptographic MAC.",
            "recommendation": "Replace MD5 suites with SHA-256 or SHA-384 authenticated ciphers.",
            "score": 20
        })

    # Strong configurations (e.g. TLS_AES_128_GCM_SHA256, ECDHE-RSA-AES256-GCM-SHA384) receive NO findings!
    return findings
