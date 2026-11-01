"""Read-only HTTP security-header and HTTPS certificate audit."""

from __future__ import annotations

import argparse
import re
import ssl
import urllib.error
import urllib.request
from urllib.parse import urlsplit


def audit_url(url: str, timeout: float = 15.0) -> tuple[list[str], list[str]]:
    """Fetch a URL using the platform TLS verifier and return checks and findings."""
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("provide an absolute http:// or https:// URL")
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "PortfolioSecurityHeaderAudit/1.0"},
        method="GET",
    )
    findings: list[str] = []
    checks: list[str] = []
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            final_url = response.geturl()
            headers = response.headers
            checks.append(f"HTTP status: {response.status}")
            checks.append(f"Final URL: {final_url}")
            checks.append("TLS certificate: accepted by the system trust store")
            response.read(4096)
    except ssl.SSLCertVerificationError as error:
        return checks, [f"TLS certificate verification failed: {error}"]
    except urllib.error.URLError as error:
        reason = getattr(error, "reason", error)
        return checks, [f"Request failed: {reason}"]

    if urlsplit(final_url).scheme != "https":
        findings.append("Final URL is not HTTPS; HTTPS redirect is missing.")
    elif parsed.scheme == "http":
        checks.append("HTTP request reached HTTPS.")

    hsts = headers.get("Strict-Transport-Security", "")
    if not hsts:
        findings.append("Missing Strict-Transport-Security.")
    else:
        checks.append(f"Strict-Transport-Security: {hsts}")
        match = re.search(r"max-age=(\d+)", hsts, re.IGNORECASE)
        if not match or int(match.group(1)) < 15_768_000:
            findings.append("HSTS max-age is missing or shorter than six months.")

    for name, recommended in (
        ("Content-Security-Policy", "Define a restrictive policy after validating all page resources."),
        ("X-Content-Type-Options", "Set to nosniff."),
        ("Referrer-Policy", "Consider strict-origin-when-cross-origin or a stricter policy."),
        ("Permissions-Policy", "Explicitly disable browser features the site does not use."),
    ):
        value = headers.get(name, "")
        if not value:
            findings.append(f"Missing {name}. {recommended}")
        else:
            checks.append(f"{name}: {value}")
            if name == "X-Content-Type-Options" and value.lower() != "nosniff":
                findings.append("X-Content-Type-Options is present but is not nosniff.")

    csp = headers.get("Content-Security-Policy", "")
    frame_options = headers.get("X-Frame-Options", "")
    if "frame-ancestors" not in csp.lower() and frame_options.lower() not in {"deny", "sameorigin"}:
        findings.append("Missing frame protection through CSP frame-ancestors or X-Frame-Options.")
    elif frame_options:
        checks.append(f"X-Frame-Options: {frame_options}")
    return checks, findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="site URL to inspect (no active or invasive scanning is performed)")
    parser.add_argument("--timeout", type=float, default=15.0, help="request timeout in seconds")
    args = parser.parse_args()
    try:
        checks, findings = audit_url(args.url, args.timeout)
    except ValueError as error:
        parser.error(str(error))
    print("Security header audit")
    for check in checks:
        print(f"  PASS/INFO: {check}")
    for finding in findings:
        print(f"  FINDING: {finding}")
    print(f"\n{len(findings)} finding(s). This read-only check is not a full security assessment.")
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
