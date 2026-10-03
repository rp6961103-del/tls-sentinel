import socket
import ssl
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa

from .authorization import assert_authorized
from .certificate_analyzer import analyze_certificate
from .cipher_analyzer import analyze_protocol, analyze_cipher
from .risk_engine import calculate_risk
from .recommendation_engine import generate_remediation_plan
from .demo_state import get_demo_state
from ..config import settings

def extract_x509_details(cert: x509.Certificate) -> Dict[str, Any]:
    """Extracts rich certificate attributes from a cryptography X509 certificate."""
    san_names = []
    try:
        san_ext = cert.extensions.get_extension_for_oid(x509.OID_SUBJECT_ALTERNATIVE_NAME)
        san_names = [str(name.value) for name in san_ext.value]
    except Exception:
        pass
        
    pubkey = cert.public_key()
    if isinstance(pubkey, rsa.RSAPublicKey):
        pubkey_algo = "RSA"
        pubkey_size = pubkey.key_size
    elif isinstance(pubkey, ec.EllipticCurvePublicKey):
        pubkey_algo = f"ECDSA ({pubkey.curve.name})"
        pubkey_size = pubkey.key_size
    elif isinstance(pubkey, dsa.DSAPublicKey):
        pubkey_algo = "DSA"
        pubkey_size = pubkey.key_size
    else:
        pubkey_algo = "Unknown"
        pubkey_size = 2048

    subject_cn = None
    for attr in cert.subject:
        if attr.oid == x509.OID_COMMON_NAME:
            subject_cn = str(attr.value)
            break

    # Extract dates with timezone awareness
    try:
        valid_from = cert.not_valid_before_utc
        valid_until = cert.not_valid_after_utc
    except AttributeError:
        valid_from = cert.not_valid_before.replace(tzinfo=timezone.utc)
        valid_until = cert.not_valid_after.replace(tzinfo=timezone.utc)

    return {
        "subject": cert.subject.rfc4514_string(),
        "subject_cn": subject_cn,
        "issuer": cert.issuer.rfc4514_string(),
        "serial_number": format(cert.serial_number, "X"),
        "valid_from": valid_from,
        "valid_until": valid_until,
        "signature_algorithm": cert.signature_algorithm_oid._name if hasattr(cert.signature_algorithm_oid, "_name") else str(cert.signature_algorithm_oid),
        "public_key_algorithm": pubkey_algo,
        "public_key_size": pubkey_size,
        "san_names": san_names
    }

def scan_live_socket(hostname: str, port: int) -> Dict[str, Any]:
    """
    Connects to an authorized live target using Python ssl/socket.
    Handles certificate validation errors gracefully to inspect untrusted or expired certificates.
    """
    validation_error: Optional[str] = None
    der_cert = None
    tls_version = "Unknown"
    cipher_name = "Unknown"
    
    # 1. First attempt standard verified handshake
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=settings.DEFAULT_TIMEOUT_SECONDS) as raw_sock:
            with ctx.wrap_socket(raw_sock, server_hostname=hostname) as ssock:
                tls_version = ssock.version() or "TLS 1.2"
                cipher_tuple = ssock.cipher()
                cipher_name = cipher_tuple[0] if cipher_tuple else "Unknown"
                der_cert = ssock.getpeercert(binary_form=True)
    except ssl.SSLCertVerificationError as e:
        validation_error = f"Certificate verification failed: {e.verify_message}"
        # Fallback to unverified handshake to inspect certificate payload
        try:
            unverified_ctx = ssl._create_unverified_context()
            with socket.create_connection((hostname, port), timeout=settings.DEFAULT_TIMEOUT_SECONDS) as raw_sock:
                with unverified_ctx.wrap_socket(raw_sock, server_hostname=hostname) as ssock:
                    tls_version = ssock.version() or "TLS 1.2"
                    cipher_tuple = ssock.cipher()
                    cipher_name = cipher_tuple[0] if cipher_tuple else "Unknown"
                    der_cert = ssock.getpeercert(binary_form=True)
        except Exception as fallback_err:
            raise ConnectionError(f"TLS Handshake failed: {str(fallback_err)}")
    except socket.timeout:
        raise TimeoutError(f"Connection timed out after {settings.DEFAULT_TIMEOUT_SECONDS}s while contacting {hostname}:{port}")
    except (ConnectionRefusedError, socket.gaierror, OSError) as e:
        raise ConnectionError(f"Could not reach {hostname}:{port} - {str(e)}")

    if not der_cert:
        raise ValueError("No X.509 certificate presented by server.")

    cert_obj = x509.load_der_x509_certificate(der_cert)
    cert_data = extract_x509_details(cert_obj)
    if validation_error:
        cert_data["validation_error"] = validation_error

    return {
        "status": "COMPLETED",
        "tls_version": tls_version,
        "negotiated_cipher": cipher_name,
        "cert_data": cert_data
    }

def run_tls_scan(hostname: str, port: int = 443, business_criticality: str = "HIGH") -> Dict[str, Any]:
    """
    Orchestrates the complete defensive inspection workflow:
    1. Enforce strict allowlist boundary
    2. Retrieve certificate & TLS metadata (sandbox or live socket)
    3. Analyze certificate expiry & validity
    4. Analyze TLS protocol
    5. Analyze cipher suite
    6. Calculate explainable risk score
    7. Generate prioritized recommendations
    """
    # Boundary enforcement
    assert_authorized(hostname, port)
    
    clean_host = hostname.strip().lower()
    scan_status = "COMPLETED"
    
    # If endpoint is a demo/sandbox endpoint, use controlled sandbox state
    if clean_host.endswith(".demo.local") or clean_host.endswith(".local") or "demo" in clean_host:
        demo_data = get_demo_state(clean_host)
        tls_version = demo_data.get("tls_version", "TLS 1.3")
        negotiated_cipher = demo_data.get("negotiated_cipher", "TLS_AES_256_GCM_SHA384")
        cert_data = demo_data
    else:
        # Live socket inspection
        try:
            live_result = scan_live_socket(clean_host, port)
            tls_version = live_result["tls_version"]
            negotiated_cipher = live_result["negotiated_cipher"]
            cert_data = live_result["cert_data"]
        except Exception as e:
            # If localhost socket is not running, provide informative failure
            return {
                "status": "UNREACHABLE",
                "tls_version": None,
                "negotiated_cipher": None,
                "risk_score": 0,
                "severity": "LOW",
                "certificate": None,
                "findings": [],
                "factors": [],
                "recommendations": [],
                "error_message": str(e)
            }

    # 1. Certificate Analysis
    cert_analysis = analyze_certificate(cert_data, clean_host)
    cert_record = cert_analysis["certificate"]
    all_findings = list(cert_analysis["findings"])

    # 2. Protocol Analysis
    proto_findings = analyze_protocol(tls_version)
    all_findings.extend(proto_findings)

    # 3. Cipher Analysis
    cipher_findings = analyze_cipher(negotiated_cipher)
    all_findings.extend(cipher_findings)

    # 4. Risk Engine
    risk_bundle = calculate_risk(all_findings, business_criticality)

    # 5. Recommendation Engine
    remediation_plan = generate_remediation_plan(all_findings, business_criticality)

    return {
        "status": scan_status,
        "tls_version": tls_version,
        "negotiated_cipher": negotiated_cipher,
        "risk_score": risk_bundle["risk_score"],
        "severity": risk_bundle["severity"],
        "factors": risk_bundle["factors"],
        "certificate": cert_record,
        "findings": all_findings,
        "recommendations": remediation_plan
    }
