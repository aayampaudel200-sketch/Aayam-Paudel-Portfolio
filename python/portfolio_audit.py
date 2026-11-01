"""Validate the portfolio's crawler policy and sitemap using only the stdlib."""

from __future__ import annotations

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlparse

ALLOWED_AGENTS = (
    "Googlebot",
    "Googlebot-Image",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "PerplexityBot",
)
BLOCKED_AGENTS = (
    "GPTBot",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended",
    "CCBot",
    "Bytespider",
    "Amazonbot",
    "FacebookBot",
)
SITEMAP_URL = "https://aayampaudel.com.np/sitemap.xml"
SITE_HOST = "aayampaudel.com.np"
SITEMAP_NAMESPACE = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def parse_robots(text: str) -> dict[str, list[str]]:
    """Return directives grouped by case-insensitive user-agent name."""
    groups: dict[str, list[str]] = {}
    current_agent: str | None = None

    for raw_line in text.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue

        key, value = (part.strip() for part in line.split(":", 1))
        if key.casefold() == "user-agent":
            current_agent = value.casefold()
            groups.setdefault(current_agent, [])
        elif current_agent and key.casefold() in {"allow", "disallow"}:
            groups[current_agent].append(f"{key.casefold()}:{value}")

    return groups


def validate_robots(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"Cannot read {path}: {exc}"]

    groups = parse_robots(text)
    for agent in ALLOWED_AGENTS:
        if "allow:/" not in groups.get(agent.casefold(), []):
            errors.append(f"{agent} must explicitly be allowed to crawl the site.")
    for agent in BLOCKED_AGENTS:
        if "disallow:/" not in groups.get(agent.casefold(), []):
            errors.append(f"{agent} must explicitly be disallowed from the site.")
    if "disallow:/" not in groups.get("*", []):
        errors.append("Unlisted crawlers must be denied by the wildcard policy.")

    sitemap_lines = [
        line.strip().split(":", 1)[1].strip()
        for line in text.splitlines()
        if line.strip().casefold().startswith("sitemap:")
    ]
    if SITEMAP_URL not in sitemap_lines:
        errors.append(f"robots.txt must declare {SITEMAP_URL}.")

    return errors


def validate_sitemap(path: Path, site_root: Path) -> list[str]:
    try:
        sitemap = ET.parse(path)
    except (OSError, ET.ParseError) as exc:
        return [f"Cannot read a valid sitemap at {path}: {exc}"]

    errors: list[str] = []
    locations = sitemap.findall(".//s:loc", SITEMAP_NAMESPACE)
    if not locations:
        return ["The sitemap must contain at least one URL."]

    for location in locations:
        address = (location.text or "").strip()
        parsed = urlparse(address)
        if parsed.scheme != "https" or parsed.hostname != SITE_HOST:
            errors.append(f"Sitemap URL must use https://{SITE_HOST}: {address or '(empty)'}")
            continue
        if parsed.query or parsed.fragment:
            errors.append(f"Sitemap URL must not include a query or fragment: {address}")
            continue

        decoded_path = unquote(parsed.path).replace("\\", "/")
        parts = [part for part in decoded_path.split("/") if part]
        if any(part in {".", ".."} for part in parts):
            errors.append(f"Sitemap URL must stay within the site root: {address}")
            continue
        if not parts or parsed.path.endswith("/"):
            parts.append("index.html")

        root = site_root.resolve()
        page = root.joinpath(*parts).resolve()
        if not page.is_relative_to(root):
            errors.append(f"Sitemap URL must stay within the site root: {address}")
            continue
        if not page.is_file():
            errors.append(f"Sitemap URL has no matching site file: {address}")

    return errors


def audit(site_root: Path) -> list[str]:
    root = site_root.resolve()
    errors = validate_robots(root / "robots.txt")
    errors.extend(validate_sitemap(root / "sitemap.xml", root))
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "site_root",
        nargs="?",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="portfolio directory (defaults to the repository root)",
    )
    args = parser.parse_args()

    errors = audit(args.site_root)
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1

    print("Portfolio crawler policy and sitemap checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
