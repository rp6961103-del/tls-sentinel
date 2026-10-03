import requests

def test_live():
    print("=== TLS SENTINEL LIVE ACCEPTANCE TEST ===")

    # 1. Backend health
    r = requests.get('http://127.0.0.1:8000/api/health')
    print('1. Health Check:', r.status_code, r.json())
    assert r.status_code == 200

    # 2. Frontend root HTML
    r_front = requests.get('http://127.0.0.1:5173/')
    print('2. Frontend HTML:', r_front.status_code, len(r_front.text), 'bytes')
    assert r_front.status_code == 200
    assert 'TLS Sentinel' in r_front.text

    # 3. Frontend Proxy to API
    r_proxy = requests.get('http://127.0.0.1:5173/api/dashboard')
    print('3. Vite Proxy /api/dashboard:', r_proxy.status_code, r_proxy.json()['stats'])
    assert r_proxy.status_code == 200

    # 4. List Endpoints
    r_eps = requests.get('http://127.0.0.1:8000/api/endpoints')
    eps = r_eps.json()
    print('4. Endpoints in DB:', len(eps))
    for ep in eps:
        scan = ep.get('latest_scan')
        sev = scan['severity'] if scan else 'None'
        score = scan['risk_score'] if scan else 0
        print(f"   - {ep['hostname']}: {ep['environment']} | Risk: {sev} ({score})")

    # 5. Live Acceptance Test Step: Reset Demo
    r_reset = requests.post('http://127.0.0.1:8000/api/demo/reset')
    reset_data = r_reset.json()
    print('5. Demo Reset:', r_reset.status_code, 'Score:', reset_data['scan']['risk_score'], 'Severity:', reset_data['scan']['severity'])
    assert reset_data['scan']['risk_score'] == 0
    assert reset_data['scan']['severity'] == 'LOW'

    # 6. Live Acceptance Test Step: Expiring
    r_exp = requests.post('http://127.0.0.1:8000/api/demo/expiring?days=5')
    exp_data = r_exp.json()
    print('6. Demo Expiring (5d):', r_exp.status_code, 'Score:', exp_data['scan']['risk_score'], 'Severity:', exp_data['scan']['severity'])
    assert exp_data['scan']['risk_score'] >= 40
    assert any(f['rule'] == 'CERT_EXPIRY_7D' for f in exp_data['scan']['factors'])

    # 7. Live Acceptance Test Step: Legacy TLS
    r_tls = requests.post('http://127.0.0.1:8000/api/demo/legacy-tls?tls_version=TLS 1.0')
    tls_data = r_tls.json()
    print('7. Demo Legacy TLS (TLS 1.0):', r_tls.status_code, 'Score:', tls_data['scan']['risk_score'], 'Severity:', tls_data['scan']['severity'])
    assert tls_data['scan']['risk_score'] >= 65
    assert any(f['rule'] == 'LEGACY_TLS_10' for f in tls_data['scan']['factors'])

    # 8. Live Acceptance Test Step: Weak Cipher
    r_cipher = requests.post('http://127.0.0.1:8000/api/demo/weak-cipher?cipher=DES-CBC3-SHA')
    cipher_data = r_cipher.json()
    print('8. Demo Weak Cipher (3DES):', r_cipher.status_code, 'Score:', cipher_data['scan']['risk_score'], 'Severity:', cipher_data['scan']['severity'])
    assert cipher_data['scan']['risk_score'] >= 85
    assert cipher_data['scan']['severity'] == 'CRITICAL'
    assert any(f['rule'] == 'CIPHER_3DES' for f in cipher_data['scan']['factors'])

    # 9. Verify Alerts generated
    r_alerts = requests.get('http://127.0.0.1:8000/api/alerts?status=OPEN')
    alerts = r_alerts.json()
    print('9. Open Alerts Count:', len(alerts))
    assert len(alerts) >= 3

    # Resolve an alert
    first_alert_id = alerts[0]['id']
    r_resolve = requests.patch(f'http://127.0.0.1:8000/api/alerts/{first_alert_id}/resolve')
    print(f'   Resolved alert {first_alert_id}:', r_resolve.status_code, r_resolve.json()['status'])
    assert r_resolve.json()['status'] == 'RESOLVED'

    # 10. Verify Reports summary & exports
    r_reports = requests.get('http://127.0.0.1:8000/api/reports/summary')
    rep = r_reports.json()
    print('10. Reports Summary:', 'Total:', rep['total_endpoints'], 'Critical:', rep['critical_endpoints'], 'Expiring 7d:', rep['certificates_expiring_within']['7_days'])

    r_csv = requests.get('http://127.0.0.1:8000/api/reports/export/csv')
    print('    CSV Export Status:', r_csv.status_code, len(r_csv.content), 'bytes')
    assert r_csv.status_code == 200

    r_json = requests.get('http://127.0.0.1:8000/api/reports/export/json')
    print('    JSON Export Status:', r_json.status_code, len(r_json.json()['endpoints']), 'records')
    assert r_json.status_code == 200

    # 11. Reset Demo back to clean baseline
    r_reset_final = requests.post('http://127.0.0.1:8000/api/demo/reset')
    print('11. Final Demo Reset:', r_reset_final.json()['scan']['risk_score'], r_reset_final.json()['scan']['severity'])
    assert r_reset_final.json()['scan']['risk_score'] == 0
    assert r_reset_final.json()['scan']['severity'] == 'LOW'

    print('\n>>> ALL 11 LIVE ACCEPTANCE TEST VERIFICATIONS PASSED 100%! <<<')

if __name__ == '__main__':
    test_live()
