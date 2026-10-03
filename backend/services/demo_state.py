import copy
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Initial baseline configurations for demo endpoints
BASELINE_DEMO_ENDPOINTS: Dict[str, Dict[str, Any]] = {
    "payment.demo.local": {
        "hostname": "payment.demo.local",
        "port": 443,
        "tls_version": "TLS 1.3",
        "negotiated_cipher": "TLS_AES_256_GCM_SHA384",
        "subject": "CN=payment.demo.local, O=Fintech Payments Corp, C=US",
        "subject_cn": "payment.demo.local",
        "issuer": "CN=DigiCert Global Root G2, O=DigiCert Inc, C=US",
        "serial_number": "04:3A:88:E1:99:A2:3B:7D",
        "days_remaining": 90,
        "signature_algorithm": "sha256WithRSAEncryption",
        "public_key_algorithm": "RSA",
        "public_key_size": 2048,
        "san_names": ["payment.demo.local", "api.payment.demo.local"]
    },
    "api.demo.local": {
        "hostname": "api.demo.local",
        "port": 443,
        "tls_version": "TLS 1.3",
        "negotiated_cipher": "TLS_AES_128_GCM_SHA256",
        "subject": "CN=api.demo.local, O=Cloud Services Inc, C=US",
        "subject_cn": "api.demo.local",
        "issuer": "CN=Let's Encrypt Authority X3, O=Let's Encrypt, C=US",
        "serial_number": "02:11:AB:5C:88:99:12:00",
        "days_remaining": 45,
        "signature_algorithm": "sha256WithRSAEncryption",
        "public_key_algorithm": "RSA",
        "public_key_size": 2048,
        "san_names": ["api.demo.local"]
    },
    "login.demo.local": {
        "hostname": "login.demo.local",
        "port": 443,
        "tls_version": "TLS 1.2",
        "negotiated_cipher": "ECDHE-RSA-AES256-GCM-SHA384",
        "subject": "CN=login.demo.local, O=Identity Access Inc, C=US",
        "subject_cn": "login.demo.local",
        "issuer": "CN=DigiCert TLS RSA SHA256 2020 CA1, O=DigiCert Inc, C=US",
        "serial_number": "09:F2:77:4A:11:00:EE:CC",
        "days_remaining": 14,
        "signature_algorithm": "sha256WithRSAEncryption",
        "public_key_algorithm": "RSA",
        "public_key_size": 2048,
        "san_names": ["login.demo.local", "auth.demo.local"]
    },
    "legacy.demo.local": {
        "hostname": "legacy.demo.local",
        "port": 443,
        "tls_version": "TLS 1.2",
        "negotiated_cipher": "ECDHE-RSA-AES128-GCM-SHA256",
        "subject": "CN=legacy.demo.local, O=Legacy Infrastructure Inc, C=US",
        "subject_cn": "legacy.demo.local",
        "issuer": "CN=Old Root CA 1, O=Old PKI, C=US",
        "serial_number": "11:22:33:44:55:66:77:88",
        "days_remaining": -12,  # EXPIRED
        "signature_algorithm": "sha256WithRSAEncryption",
        "public_key_algorithm": "RSA",
        "public_key_size": 2048,
        "san_names": ["legacy.demo.local"]
    },
    "internal.demo.local": {
        "hostname": "internal.demo.local",
        "port": 443,
        "tls_version": "TLS 1.0",  # LEGACY TLS
        "negotiated_cipher": "DES-CBC3-SHA",  # WEAK 3DES CIPHER
        "subject": "CN=internal.demo.local, O=Internal Ops, C=US",
        "subject_cn": "internal.demo.local",
        "issuer": "CN=Internal Intermediate CA, O=Internal Corp, C=US",
        "serial_number": "99:AA:BB:CC:DD:EE:FF:00",
        "days_remaining": 18,
        "signature_algorithm": "sha1WithRSAEncryption",  # WEAK SIG
        "public_key_algorithm": "RSA",
        "public_key_size": 1024,  # SHORT KEY
        "san_names": ["internal.demo.local"]
    }
}

# In-memory working copy that can be modified during live demo actions
_demo_state: Dict[str, Dict[str, Any]] = copy.deepcopy(BASELINE_DEMO_ENDPOINTS)

def get_demo_state(hostname: str) -> Dict[str, Any]:
    """Retrieves current demo configuration for a demo host, computing live datetimes."""
    clean_host = hostname.strip().lower()
    data = copy.deepcopy(_demo_state.get(clean_host, _demo_state.get("payment.demo.local")))
    now = datetime.now(timezone.utc)
    days = data.get("days_remaining", 90)
    data["valid_until"] = now + timedelta(days=days)
    data["valid_from"] = now - timedelta(days=max(1, 365 - days))
    return data

def reset_all_demo_states():
    """Resets all demo configurations back to baseline initial conditions."""
    global _demo_state
    _demo_state = copy.deepcopy(BASELINE_DEMO_ENDPOINTS)

def set_demo_expiring(hostname: str = "payment.demo.local", days: int = 5):
    """Simulates certificate expiring soon (e.g. 5 days remaining)."""
    clean_host = hostname.strip().lower()
    if clean_host not in _demo_state:
        _demo_state[clean_host] = copy.deepcopy(BASELINE_DEMO_ENDPOINTS["payment.demo.local"])
    _demo_state[clean_host]["days_remaining"] = days

def set_demo_legacy_tls(hostname: str = "payment.demo.local", tls_version: str = "TLS 1.0"):
    """Simulates deprecated TLS protocol version."""
    clean_host = hostname.strip().lower()
    if clean_host not in _demo_state:
        _demo_state[clean_host] = copy.deepcopy(BASELINE_DEMO_ENDPOINTS["payment.demo.local"])
    _demo_state[clean_host]["tls_version"] = tls_version

def set_demo_weak_cipher(hostname: str = "payment.demo.local", cipher: str = "DES-CBC3-SHA"):
    """Simulates vulnerable 3DES or RC4 cipher suite."""
    clean_host = hostname.strip().lower()
    if clean_host not in _demo_state:
        _demo_state[clean_host] = copy.deepcopy(BASELINE_DEMO_ENDPOINTS["payment.demo.local"])
    _demo_state[clean_host]["negotiated_cipher"] = cipher

def set_demo_expired(hostname: str = "payment.demo.local", days_ago: int = -5):
    """Simulates certificate that has already expired."""
    clean_host = hostname.strip().lower()
    if clean_host not in _demo_state:
        _demo_state[clean_host] = copy.deepcopy(BASELINE_DEMO_ENDPOINTS["payment.demo.local"])
    _demo_state[clean_host]["days_remaining"] = days_ago
