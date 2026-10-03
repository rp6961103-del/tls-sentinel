import fnmatch
import ipaddress
import re
from typing import Tuple
from ..config import settings

# Disallow IP ranges, CIDRs, and invalid host formats
CIDR_PATTERN = re.compile(r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$")
PORT_RANGE_PATTERN = re.compile(r"^\d+-\d+$")

def validate_input_safety(hostname: str, port: int) -> Tuple[bool, str]:
    """
    Defensive security check:
    Ensures input is not a CIDR subnet, port range, or mass-scan pattern.
    """
    if not hostname or not isinstance(hostname, str):
        return False, "Hostname cannot be empty."
    
    hostname = hostname.strip().lower()
    
    # Check for CIDR notation
    if CIDR_PATTERN.match(hostname) or "/" in hostname:
        return False, "Subnet/CIDR scanning is strictly prohibited by security policy."
    
    # Check for wildcards in input hostname from user
    if "*" in hostname or "?" in hostname:
        return False, "Wildcard hostnames are not permitted as target endpoints."
    
    # Check port bounds
    if not (1 <= port <= 65535):
        return False, f"Invalid port: {port}. Port must be between 1 and 65535."
    
    return True, ""

def is_hostname_authorized(hostname: str) -> bool:
    """
    Validates that the target hostname is present in the defensive allowlist.
    Only localhost, local sandboxes, demo domains, and explicitly permitted hosts are allowed.
    """
    if not hostname:
        return False
        
    hostname = hostname.strip().lower()
    
    # Combine default allowlist and any extra allowlist configured
    allowed_patterns = [p.lower() for p in settings.DEFAULT_ALLOWLIST + settings.EXTRA_ALLOWLIST]
    
    for pattern in allowed_patterns:
        if pattern == hostname:
            return True
        # Check wildcard matching, e.g. *.demo.local matches payment.demo.local
        if "*" in pattern and fnmatch.fnmatch(hostname, pattern):
            return True
            
    return False

def assert_authorized(hostname: str, port: int):
    """
    Raises PermissionError or ValueError if hostname or port fails security boundary checks.
    """
    is_safe, error_msg = validate_input_safety(hostname, port)
    if not is_safe:
        raise ValueError(error_msg)
        
    if not is_hostname_authorized(hostname):
        raise PermissionError(
            f"Access Denied: Host '{hostname}' is not in the authorized endpoint allowlist. "
            f"In accordance with security boundaries, scanning unauthorized targets is blocked."
        )
