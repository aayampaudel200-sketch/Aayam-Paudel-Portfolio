"""Generate a sitemap from public, indexable, top-level HTML routes."""

from __future__ import annotations

import argparse
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from xml.etree import ElementTree as ET

if __package__:
    from .site_utils import html_pages, parse_page
else:
    from site_utils import html_pages, parse_page

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NAMESPACE)


def sitemap_urls(root: Path, base_url: str) -> list[str]:
    """Build sorted HTTPS URLs for public HTML pages without inventing dates."""
    parsed_base = urlsplit(base_url.rstrip("/") + "/")
    if parsed_base.scheme != "https" or not parsed_base.netloc:
        raise ValueError("base URL must be an absolute HTTPS URL")
    urls: set[str] = set()
    for path in html_pages(root):
        page = parse_page(path)
        if "noindex" in page.robots:
            continue
        relative = path.relative_to(root).as_posix()
        if path.name.lower() == "index.html":
            route = "/" if path.parent == root else f"/{path.parent.relative_to(root).as_posix()}/"
        else:
            route = f"/{relative}"
        canonical_path = urlsplit(page.canonical).path
        if canonical_path:
            route = canonical_path
        urls.add(urlunsplit(("https", parsed_base.netloc, route, "", "")))
    return sorted(urls)


def write_sitemap(root: Path, output: Path, base_url: str) -> int:
    """Write an XML sitemap and return the number of included URLs."""
    urlset = ET.Element(f"{{{NAMESPACE}}}urlset")
    urls = sitemap_urls(root, base_url)
    for url in urls:
        entry = ET.SubElement(urlset, f"{{{NAMESPACE}}}url")
        ET.SubElement(entry, f"{{{NAMESPACE}}}loc").text = url
    output.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(urlset).write(output, encoding="utf-8", xml_declaration=True)
    return len(urls)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT, help="site source directory")
    parser.add_argument("--base-url", default="https://www.aayampaudel.com.np", help="preferred HTTPS host")
    parser.add_argument("--output", type=Path, help="output path (defaults to ROOT/sitemap.xml)")
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.output.resolve() if args.output else root / "sitemap.xml"
    try:
        count = write_sitemap(root, output, args.base_url)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    print(f"Wrote {count} URL(s) to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
