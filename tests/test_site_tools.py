"""Unit tests for local static-site auditing and sitemap generation."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image
from scripts.analyze_assets import large_assets, potentially_unreferenced_images
from scripts.check_internal_links import find_broken_references
from scripts.generate_sitemap import sitemap_urls, write_sitemap
from scripts.optimize_images import optimize_images
from scripts.security_headers_audit import audit_url
from scripts.seo_audit import audit_site
from scripts.site_utils import local_target, parse_page


class SiteToolTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_page(self, name: str, body: str) -> Path:
        path = self.root / name
        path.write_text(body, encoding="utf-8")
        return path

    def test_parser_collects_metadata_and_jsonld(self) -> None:
        page = self.write_page(
            "index.html",
            '<title>Home</title><meta name="description" content="Intro">'
            '<link rel="canonical" href="https://example.test/">'
            '<meta property="og:title" content="Home"><h1 id="top">Hi</h1>'
            '<img src="photo.jpg" alt="Portrait"><script type="application/ld+json">{"@type":"Person"}</script>',
        )
        info = parse_page(page)
        self.assertEqual(info.title, "Home")
        self.assertEqual(info.description, "Intro")
        self.assertEqual(info.canonical, "https://example.test/")
        self.assertEqual(info.headings, [1])
        self.assertIn("top", info.ids)
        self.assertEqual(info.structured_data, ['{"@type":"Person"}'])
        self.assertEqual(info.image_without_alt, 0)

    def test_audit_reports_missing_metadata_and_bad_fragments(self) -> None:
        page = self.write_page(
            "index.html",
            '<title>Home</title><h1>Home</h1><a href="#missing">Jump</a>'
            '<img src="photo.jpg">',
        )
        issues = audit_site(self.root)
        messages = [message for _, message in issues]
        self.assertTrue(any("missing meta description" in message for message in messages))
        self.assertTrue(any("missing canonical URL" in message for message in messages))
        self.assertTrue(any("missing fragment #missing" in message for message in messages))
        self.assertTrue(any("missing an alt attribute" in message for message in messages))
        self.assertTrue(page.exists())

    def test_sitemap_includes_unique_https_public_routes_only(self) -> None:
        self.write_page("index.html", '<link rel="canonical" href="https://www.example.test/">')
        self.write_page("about.html", '<link rel="canonical" href="https://www.example.test/about.html">')
        self.write_page("private.html", '<meta name="robots" content="noindex"><link rel="canonical" href="https://www.example.test/private.html">')
        urls = sitemap_urls(self.root, "https://www.example.test")
        self.assertEqual(urls, ["https://www.example.test/", "https://www.example.test/about.html"])
        output = self.root / "sitemap.xml"
        self.assertEqual(write_sitemap(self.root, output, "https://www.example.test"), 2)
        self.assertNotIn("lastmod", output.read_text(encoding="utf-8"))

    def test_sitemap_rejects_non_https_base(self) -> None:
        with self.assertRaises(ValueError):
            sitemap_urls(self.root, "http://example.test")

    def test_local_target_rejects_root_escape(self) -> None:
        source = self.write_page("index.html", "")
        target, _ = local_target(self.root, source, "../outside.txt")
        self.assertIsNone(target)

    def test_internal_link_checker_finds_missing_assets(self) -> None:
        self.write_page("index.html", '<h1>Home</h1><img src="missing.png" alt="Missing">')
        self.assertEqual(len(find_broken_references(self.root)), 1)

    def test_asset_analysis_respects_size_thresholds(self) -> None:
        image = self.root / "large.png"
        image.write_bytes(b"x" * 11)
        matches = large_assets(self.root, {".png": 10})
        self.assertEqual(matches, [(image, 11, "image")])

    def test_asset_analysis_flags_unreferenced_images_for_review(self) -> None:
        image = self.root / "old-photo.jpg"
        image.write_bytes(b"image")
        self.write_page("index.html", '<img src="portrait.jpg" alt="Portrait">')
        self.assertEqual(potentially_unreferenced_images(self.root), [image])

    def test_security_header_audit_checks_headers_without_network(self) -> None:
        class FakeResponse:
            status = 200
            headers = {
                "Strict-Transport-Security": "max-age=63072000",
                "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Permissions-Policy": "camera=()",
            }

            def __enter__(self) -> "FakeResponse":
                return self

            def __exit__(self, *_: object) -> None:
                return None

            def geturl(self) -> str:
                return "https://example.test/"

            def read(self, _size: int) -> bytes:
                return b""

        with patch("scripts.security_headers_audit.urllib.request.urlopen", return_value=FakeResponse()):
            checks, findings = audit_url("http://example.test/")
        self.assertTrue(any("reached HTTPS" in check for check in checks))
        self.assertEqual(findings, [])

    def test_image_optimizer_rejects_invalid_quality_before_loading_pillow(self) -> None:
        with self.assertRaises(ValueError):
            optimize_images(self.root, self.root / "optimized", quality=0)

    def test_image_optimizer_writes_copy_without_changing_source(self) -> None:
        source = self.root / "portrait.jpg"
        Image.new("RGB", (64, 64), color=(20, 40, 60)).save(source)
        original = source.read_bytes()
        results = optimize_images(source, self.root / "optimized")
        self.assertIn("OK portrait.jpg:", results[0])
        self.assertTrue((self.root / "optimized" / "portrait.webp").is_file())
        self.assertEqual(source.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
