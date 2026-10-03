# TLS Sentinel — Automated Certificate Lifecycle & Expiry Monitor

[![Defensive Security Platform](https://img.shields.io/badge/Security-Defensive%20Platform-emerald.svg)](https://github.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-61DAFB.svg)](https://react.dev)
[![Test Suite](https://img.shields.io/badge/pytest-31%2F31%20Passed-brightgreen.svg)](https://pytest.org)
[![RFC Compliance](https://img.shields.io/badge/Compliance-RFC%208996%20%7C%20PCI--DSS-blue.svg)](https://datatracker.ietf.org/doc/html/rfc8996)

---

## 1. Problem Statement

Modern enterprise infrastructures suffer from unexpected service outages, security warnings, and compliance breaches caused by unmonitored TLS certificate expirations and lingering legacy cryptographic configurations. Outages from expired certificates disrupt payment gateways, internal authentication, and customer-facing APIs. Furthermore, legacy protocols (TLS 1.0, TLS 1.1) and deprecated 64-bit ciphers (3DES, RC4) expose services to downgrade and plaintext recovery attacks (POODLE, Sweet32, Bar Mitzvah).

**TLS Sentinel** is an end-to-end defensive cybersecurity platform designed to:
1. Maintain an inventory of **authorized** TLS/SSL endpoints.
2. Continuously inspect certificates, public key algorithms, and validity windows.
3. Classify certificate expiry risk and cryptographic protocol posture.
4. Calculate **deterministic, explainable risk scores** (0–100) attributed to individual technical factors.
5. Generate prioritized remediation plans (P1 Immediate through P4 Informational) and automated deduplicated incident alerts.
6. Provide an interactive **Live Hackathon Demo Mode** enabling evaluators to simulate certificate expiry, protocol downgrades, and cipher vulnerabilities without touching live public networks.

---

## 2. Strict Security Boundary

> **IMPORTANT DEFENSIVE SECURITY NOTICE**  
> TLS Sentinel is strictly a **defensive security and posture management tool**.
>
> In accordance with ethical defensive security principles:
> - **Prohibited:** Unrestricted Internet scanning, mass scanning, CIDR subnet sweeps, IP enumeration, port-range scanning, vulnerability exploitation, and authentication bypass.
> - **Enforced Allowlist:** The scanner engine will **only** inspect:
>   1. `localhost`, `127.0.0.1`, `::1`
>   2. Sandbox Docker services (`*.local`)
>   3. Controlled demo endpoints (`*.demo.local`, `payment.demo.local`, `api.demo.local`, etc.)
>   4. Hostnames explicitly authorized in configuration.
> - **Access Rejection:** Any attempt to register or scan a target outside the authorized allowlist triggers an immediate `403 Forbidden` rejection.

---

## 3. Architecture

```
                                  +---------------------------------------------------+
                                  |           React + Vite Frontend (SOC UI)          |
                                  |   Dashboard | Endpoints | Alerts | Reports | Demo |
                                  +---------------------------------------------------+
                                                           |
                                                      REST API (HTTP)
                                                           v
+-------------------------------------------------------------------------------------------------------------------------+
|                                                  FastAPI Backend Core                                                   |
|                                                                                                                         |
|  +--------------------+    +-----------------------+    +-----------------------+    +-------------------------------+  |
|  | Authorization Svc  | -> |   TLS Scanner Engine  | -> |  Analysis Engine      | -> | Explainable Risk Engine       |  |
|  | Strict Allowlist   |    |  Python ssl/socket/   |    |  - Cert Expiry (X509) |    | Rule-based point scoring      |  |
|  | Boundary Check     |    |  Cryptography / der   |    |  - Protocol (RFC8996) |    | Capped at 100 with Factor Log |  |
|  +--------------------+    +-----------------------+    |  - Cipher Suites      |    +-------------------------------+  |
|                                                         +-----------------------+                    |                  |
|                                                                                                      v                  |
|  +--------------------+    +-----------------------+                                     +-----------------------+      |
|  | Reports & Exports  | <- |  SQLite / SQLAlchemy  | <---------------------------------- | Remediation Engine &  |      |
|  | CSV & JSON streams |    |  Endpoints, Scans,    |                                     | Deduplicated Alerts   |      |
|  |                    |    |  Certs, Findings,     |                                     | P1-P4 Prioritization  |      |
|  +--------------------+    |  Alerts               |                                     +-----------------------+      |
|                            +-----------------------+                                                                    |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

## 4. Key Features

- **Authorized Endpoint Inventory**: CRUD operations with multi-dimensional filtering by Risk, Environment, Expiry Window, and TLS Version.
- **Deep Certificate Inspection**: Extracts Subject DN, Issuer Authority, Serial Number, Start/End Dates, Days Remaining, Signature Algorithms, RSA/ECDSA key size, and Subject Alternative Names (SANs).
- **Explainable Rule-Based Risk Engine**: Evaluates risk from 0 to 100 with clear severity classifications (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), accompanied by a transparent mathematical breakdown ledger.
- **Protocol & Cipher Suite Classification**: Flags RFC 8996 non-compliant protocols (SSLv2, SSLv3, TLS 1.0, TLS 1.1) and broken ciphers (NULL, EXPORT, RC4, 3DES, MD5).
- **Prioritized Remediation (P1 to P4)**: Generates actionable steps and target SLA resolution timeframes (e.g. 24h for expired certs, 3-5 days for legacy TLS).
- **Automated Deduplicated Alerting**: Prevents alert fatigue by tracking open alert states per rule and endpoint.
- **Interactive Live Demo Mode**: Real-time simulation of expiring certificates, protocol downgrades, and weak ciphers on `payment.demo.local` with immediate live chart and risk gauge adaptation.
- **Reporting & Compliance Export**: Download full endpoint audits in CSV and JSON formats.

---

## 5. Risk Scoring & Classification Model

### Technical Risk Factors

| Condition / Observation | Rule ID | Risk Points | Severity Category |
| :--- | :--- | :---: | :--- |
| **Certificate Expired** (< 0 days) | `CERT_EXPIRED` | **+50** | CRITICAL |
| **Certificate Expiring Within 7 Days** | `CERT_EXPIRY_7D` | **+40** | CRITICAL |
| **Certificate Expiring Within 15 Days** | `CERT_EXPIRY_15D` | **+30** | HIGH |
| **Certificate Expiring Within 30 Days** | `CERT_EXPIRY_30D` | **+15** | MEDIUM |
| **SSLv2 or SSLv3 Protocol** | `LEGACY_SSL_20` / `LEGACY_SSL_30` | **+40** | CRITICAL |
| **TLS 1.0 Protocol Enabled** | `LEGACY_TLS_10` | **+25** | HIGH |
| **TLS 1.1 Protocol Enabled** | `LEGACY_TLS_11` | **+20** | HIGH |
| **Very Weak Cipher (RC4 / NULL / EXPORT / ANON)** | `CIPHER_RC4`, `CIPHER_NULL`, `CIPHER_EXPORT` | **+30** | CRITICAL |
| **Weak Cipher (3DES / MD5 / 64-bit block)** | `CIPHER_3DES`, `CIPHER_MD5` | **+20** | HIGH |
| **Hostname Mismatch (SAN / CN mismatch)** | `CERT_HOSTNAME_MISMATCH` | **+35** | HIGH |
| **Certificate Validation / Untrusted Root** | `CERT_VALIDATION_FAILURE` | **+30** | HIGH |
| **Weak Signature (SHA-1 / MD5)** | `CERT_WEAK_SIGNATURE` | **+25** | HIGH |
| **Short Public Key (< 2048-bit RSA)** | `CERT_SHORT_KEY` | **+25** | HIGH |

### Severity Thresholds

- **0 – 24**: **LOW** (Compliant modern baseline)
- **25 – 49**: **MEDIUM** (Upcoming expiry or minor deprecation)
- **50 – 74**: **HIGH** (Imminent expiry or legacy TLS 1.0)
- **75 – 100**: **CRITICAL** (Expired certificate or active compounding vulnerabilities)

*Composite risk score is capped at 100. Factors are always returned as transparent line items.*

---

## 6. Technology Stack

- **Backend**:
  - Python 3.12+ / 3.14
  - FastAPI (High-performance asynchronous REST API)
  - SQLAlchemy 2.0 (ORM) & SQLite (Persistence)
  - Cryptography & Python standard `ssl` / `socket`
  - Pydantic v2 (Validation & Schemas)
  - Pytest (Comprehensive automated test suite)
- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS v4 (Modern dark SOC cybersecurity theme)
  - Recharts (Interactive SVG Donut & Bar Charts)
  - Axios (HTTP client with structured error interceptors)
  - React Router v7 (Client-side routing)
  - Lucide React (Clean security iconography)

---

## 7. Installation & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### Option A: Local Development (Recommended for Hackathon Evaluation)

#### 1. Start the Backend
```bash
# Navigate to backend directory
cd tls-sentinel/backend

# Install dependencies
python -m pip install -r requirements.txt

# Run the backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend API will be available at: `http://localhost:8000`*  
*Swagger API Docs: `http://localhost:8000/docs`*

#### 2. Start the Frontend
```bash
# Open a new terminal and navigate to frontend directory
cd tls-sentinel/frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```
*The application dashboard will be live at: `http://localhost:5173`*

---

### Option B: Docker Compose

```bash
cd tls-sentinel
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Sandbox TLS Service: `https://localhost:8443`

---

## 8. Step-by-Step Live Hackathon Demo Scenario

To reproduce the exact hackathon evaluation sequence:

1. **Open Dashboard (`/`)**:
   - Review initial inventory metrics across the 5 pre-seeded authorized demo endpoints:
     - `payment.demo.local` (Fintech Payments - Production)
     - `api.demo.local` (API Gateway - Production)
     - `login.demo.local` (IAM Identity - Staging)
     - `legacy.demo.local` (Legacy Systems - Development)
     - `internal.demo.local` (Corporate IT - Internal)
2. **Open `payment.demo.local`**:
   - Review initial baseline: 90 days validity, TLS 1.3, strong AES-256-GCM cipher.
   - Initial Risk Score: **0 / 100 (LOW)**.
3. **Navigate to "Demo Scenario" page (`/demo`)**:
   - Observe live posture gauge and telemetry.
4. **Click "Simulate Expiring Certificate"**:
   - Validity drops from 90 days to 5 days remaining.
   - Analysis engine triggers `CERT_EXPIRY_7D` (+40 points).
   - Risk score elevates to **40 / 100 (MEDIUM)**.
   - Deduplicated alert automatically generated.
5. **Click "Enable Legacy TLS"**:
   - Endpoint downgrades to TLS 1.0.
   - Analysis engine triggers `LEGACY_TLS_10` (+25 points).
   - Risk score elevates to **65 / 100 (HIGH)**.
6. **Click "Enable Weak Cipher"**:
   - Server negotiates 3DES `DES-CBC3-SHA`.
   - Analysis engine triggers `CIPHER_3DES` (+20 points).
   - Risk score elevates to **85 / 100 (CRITICAL)**.
7. **Inspect "Explain Risk"**:
   - View the mathematical ledger showing exact factor contributions:
     - `CERT_EXPIRY_7D`: +40
     - `LEGACY_TLS_10`: +25
     - `CIPHER_3DES`: +20
     - **Total Composite Score: 85**
8. **Inspect Prioritized Remediation**:
   - Review **P1 Immediate** action items with 24-hour target SLA.
9. **Return to Dashboard**:
   - Confirm charts and top critical cards have dynamically updated to reflect the new state.
10. **Export Report**:
    - Download CSV or JSON report via the Reports page.
11. **Click "Reset Demo"**:
    - Returns `payment.demo.local` to clean baseline (Score 0, LOW).

---

## 9. API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/endpoints` | List authorized endpoints with filters (`search`, `risk`, `environment`, `expiry_status`, `tls_status`) |
| `POST` | `/api/endpoints` | Add authorized endpoint (validates strict allowlist) |
| `GET` | `/api/endpoints/{id}` | Detailed endpoint view with certificate, scan history, and alerts |
| `PUT` | `/api/endpoints/{id}` | Update endpoint metadata |
| `DELETE`| `/api/endpoints/{id}` | Remove endpoint from inventory |
| `POST` | `/api/endpoints/{id}/scan` | Trigger immediate defensive TLS scan and recalculate risk |
| `GET` | `/api/scans` | Scan history log across all endpoints |
| `GET` | `/api/scans/{id}` | Detailed scan record with factor ledger |
| `GET` | `/api/dashboard` | Aggregated SOC dashboard metrics, chart series, and urgent remediations |
| `GET` | `/api/alerts` | Active and resolved alerts with status filter |
| `PATCH`| `/api/alerts/{id}/resolve` | Mark security alert resolved |
| `GET` | `/api/reports/summary` | Executive summary metrics and expiry windows |
| `GET` | `/api/reports/export/csv` | Download CSV compliance export |
| `GET` | `/api/reports/export/json` | Download JSON audit export |
| `POST` | `/api/demo/reset` | Reset demo endpoints to clean baseline |
| `POST` | `/api/demo/expiring` | Simulate certificate expiring within 5 days |
| `POST` | `/api/demo/legacy-tls` | Simulate TLS 1.0 protocol enablement |
| `POST` | `/api/demo/weak-cipher` | Simulate 3DES weak cipher suite |
| `POST` | `/api/demo/expired` | Simulate expired certificate (-5 days overdue) |

---

## 10. Test Suite Results

Run backend unit and integration tests:
```bash
cd tls-sentinel
python -m pytest -v
```

**Results: 31 passed in 3.66s**
- `test_health_check`: PASSED
- `test_endpoints_inventory_and_security_boundary`: PASSED
- `test_dashboard_endpoint`: PASSED
- `test_demo_scenario_flow`: PASSED
- `test_reports_endpoints`: PASSED
- `test_allowlist_permits_authorized_hosts`: PASSED
- `test_allowlist_rejects_unauthorized_external_targets`: PASSED
- `test_blocks_cidr_and_subnets`: PASSED
- `test_blocks_wildcard_inputs`: PASSED
- `test_invalid_ports`: PASSED
- `test_assert_authorized_raises_permission_error`: PASSED
- `test_assert_authorized_succeeds_for_demo`: PASSED
- `test_match_hostname`: PASSED
- `test_certificate_expired_finding`: PASSED
- `test_certificate_critical_7d_finding`: PASSED
- `test_certificate_high_15d_finding`: PASSED
- `test_certificate_medium_30d_finding`: PASSED
- `test_certificate_healthy_90d_no_expiry_finding`: PASSED
- `test_hostname_mismatch_finding`: PASSED
- `test_weak_sha1_and_short_key`: PASSED
- `test_protocol_analysis_legacy_versions`: PASSED
- `test_protocol_analysis_modern_versions`: PASSED
- `test_cipher_analysis_weak_suites`: PASSED
- `test_cipher_analysis_strong_modern_suites`: PASSED
- `test_recommendation_prioritization`: PASSED
- `test_generate_remediation_plan_sorting`: PASSED
- `test_alert_generation_and_deduplication`: PASSED
- `test_risk_scoring_healthy_baseline`: PASSED
- `test_risk_scoring_accumulative_and_explainable`: PASSED
- `test_risk_score_capped_at_100`: PASSED
- `test_risk_severity_thresholds`: PASSED

---

## 11. Known Limitations & Future Improvements

- **Post-Quantum Cryptography (PQC) Evaluation**: Future baselines can evaluate Kyber/ML-KEM hybrid key exchanges for post-quantum readiness.
- **Automated ACME Webhooks**: Integration with Let's Encrypt / Vault APIs to automate zero-touch certificate reissuance when P1 expiry alerts fire.
- **CRL / OCSP Stapling Live Validation**: Enhanced revocation checking with real-time OCSP response caching.
- **Enterprise SSO / RBAC**: Role-based access control integrating SAML / OIDC for multi-tenant enterprise SOC teams.
