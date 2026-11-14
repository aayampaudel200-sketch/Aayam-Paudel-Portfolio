"""Tests for the portfolio crawler-policy and sitemap audit."""

import tempfile
import unittest
from pathlib import Path

from portfolio_audit import (
    ALLOWED_AGENTS,
    SITEMAP_URL,
    audit,
    parse_robots,
    validate_sitemap,
)


class PortfolioAuditTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        (self.root / "index.html").write_text("<html></html>", encoding="utf-8")
        (self.root / "about.html").write_text("<html></html>", encoding="utf-8")
        (self.root / "projects.html").write_text("<html></html>", encoding="utf-8")
        (self.root / "robots.txt").write_text(self.robots_text(), encoding="utf-8")
        (self.root / "sitemap.xml").write_text(self.sitemap_text(), encoding="utf-8")

    def tearDown(self):
        self.temporary_directory.cleanup()

    @staticmethod
    def robots_text():
        lines = []
        for agent in ALLOWED_AGENTS:
            lines.extend((f"User-agent: {agent}", "Allow: /", ""))
        lines.extend(
            (
                "User-agent: *",
                "Allow: /",
                "",
                f"Sitemap: {SITEMAP_URL}",
            )
        )
        return "\n".join(lines)

    @staticmethod
    def sitemap_text():
        return """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aayampaudel.com.np/</loc></url>
  <url><loc>https://aayampaudel.com.np/about.html</loc></url>
  <url><loc>https://aayampaudel.com.np/projects.html</loc></url>
</urlset>
"""

    def test_parser_matches_agents_case_insensitively(self):
        groups = parse_robots("User-agent: googlebot\nAllow: /\n")
        self.assertEqual(groups["googlebot"], ["allow:/"])

    def test_audit_accepts_valid_site(self):
        self.assertEqual(audit(self.root), [])

    def test_audit_reports_missing_allow_rules(self):
        robots = self.root / "robots.txt"
        robots.write_text("User-agent: *\nAllow: /\n", encoding="utf-8")

        errors = audit(self.root)

        self.assertTrue(any("Googlebot must explicitly" in error for error in errors))
        self.assertTrue(any(SITEMAP_URL in error for error in errors))

    def test_audit_rejects_wildcard_disallow(self):
        robots = self.root / "robots.txt"
        robots.write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")

        errors = audit(self.root)

        self.assertTrue(any("wildcard policy" in error for error in errors))

    def test_audit_rejects_disallowed_search_bot(self):
        robots = self.root / "robots.txt"
        robots.write_text(
            "User-agent: Googlebot\nAllow: /\nDisallow: /\n"
            "User-agent: *\nAllow: /\n"
            f"Sitemap: {SITEMAP_URL}\n",
            encoding="utf-8",
        )

        errors = audit(self.root)

        self.assertTrue(any("Googlebot must not be disallowed" in error for error in errors))

    def test_sitemap_reports_missing_local_page(self):
        (self.root / "sitemap.xml").write_text(
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            "<url><loc>https://aayampaudel.com.np/missing.html</loc></url>"
            "</urlset>",
            encoding="utf-8",
        )

        errors = validate_sitemap(self.root / "sitemap.xml", self.root)

        self.assertTrue(any("no matching site file" in error for error in errors))

    def test_sitemap_rejects_external_host(self):
        (self.root / "sitemap.xml").write_text(
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            "<url><loc>https://example.com/</loc></url>"
            "</urlset>",
            encoding="utf-8",
        )

        errors = validate_sitemap(self.root / "sitemap.xml", self.root)

        self.assertTrue(any("must use https://" in error for error in errors))

    def test_sitemap_rejects_paths_outside_site_root(self):
        (self.root / "sitemap.xml").write_text(
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            "<url><loc>https://aayampaudel.com.np/..%5CREADME.md</loc></url>"
            "</urlset>",
            encoding="utf-8",
        )

        errors = validate_sitemap(self.root / "sitemap.xml", self.root)

        self.assertTrue(any("stay within the site root" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
