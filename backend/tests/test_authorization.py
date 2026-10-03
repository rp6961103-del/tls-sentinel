import pytest
from backend.services.authorization import is_hostname_authorized, validate_input_safety, assert_authorized

def test_allowlist_permits_authorized_hosts():
    assert is_hostname_authorized("localhost") is True
    assert is_hostname_authorized("127.0.0.1") is True
    assert is_hostname_authorized("payment.demo.local") is True
    assert is_hostname_authorized("api.demo.local") is True
    assert is_hostname_authorized("internal.demo.local") is True
    assert is_hostname_authorized("custom.demo.local") is True

def test_allowlist_rejects_unauthorized_external_targets():
    assert is_hostname_authorized("google.com") is False
    assert is_hostname_authorized("badactor.org") is False
    assert is_hostname_authorized("192.168.1.100") is False

def test_blocks_cidr_and_subnets():
    safe, msg = validate_input_safety("192.168.1.0/24", 443)
    assert safe is False
    assert "Subnet/CIDR" in msg

def test_blocks_wildcard_inputs():
    safe, msg = validate_input_safety("*.internal.company", 443)
    assert safe is False
    assert "Wildcard" in msg

def test_invalid_ports():
    safe, msg = validate_input_safety("localhost", 0)
    assert safe is False
    safe2, msg2 = validate_input_safety("localhost", 70000)
    assert safe2 is False

def test_assert_authorized_raises_permission_error():
    with pytest.raises(PermissionError):
        assert_authorized("unauthorized.external.com", 443)

def test_assert_authorized_succeeds_for_demo():
    # Should not raise exception
    assert_authorized("payment.demo.local", 443)
