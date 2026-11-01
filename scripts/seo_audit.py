"""Audit local portfolio HTML for common technical SEO omissions."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

if __package__:
    from .site_utils import html_pages, local_target, parse_page
else:
    from site_utils import html_pages, local_target, parse_page

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
REQUIRED_OPEN_GRAPH = ("title", "description", "url", "image")


def audit_site(root: Path) -> list[tuple[str, str]]:
    """Return (severity, message) pairs for the public HTML pages in root."""
    issues: list[tuple[str, str]] = []
    pages = [parse_page(path) for path in html_pages(root)]
    titles: dict[str, list[str]] = {}
    canonical_urls: set[str] = set()

    for page in pages:
        name = page.path.relative_to(root).as_posix()
        if not page.title:
            issues.append(("ERROR", f"{name}: missing title"))
        else:
            titles.setdefault(page.title.casefold(), []).append(name)
        if not page.description:
            issues.append(("ERROR", f"{name}: missing meta description"))
        if not page.canonical:
            issues.append(("ERROR", f"{name}: missing canonical URL"))
        else:
            canonical = urlsplit(page.canonical)
            if canonical.scheme != "https" or not canonical.netloc:
                issues.append(("ERROR", f"{name}: canonical URL is not absolute HTTPS"))
            if page.canonical in canonical_urls:
                issues.append(("ERROR", f"{name}: duplicate canonical URL {page.canonical}"))
            canonical_urls.add(page.canonical)
        if not page.headings or 1 not in page.headings:
            issues.append(("ERROR", f"{name}: missing H1"))
        elif page.headings.count(1) > 1:
            issues.append(("WARNING", f"{name}: multiple H1 headings"))
        for previous, current in zip(page.headings, page.headings[1:]):
            if current > previous + 1:
                issues.append(("WARNING", f"{name}: heading level jumps from H{previous} to H{current}"))
        if page.image_without_alt:
            issues.append(("WARNING", f"{name}: {page.image_without_alt} image(s) missing an alt attribute"))
        for key in REQUIRED_OPEN_GRAPH:
            if not page.open_graph.get(key):
                issues.append(("WARNING", f"{name}: missing Open Graph og:{key}"))
        if not page.structured_data:
            issues.append(("WARNING", f"{name}: no JSON-LD structured data"))
        else:
            for block in page.structured_data:
                try:
                    json.loads(block)
                except json.JSONDecodeError as error:
                    issues.append(("ERROR", f"{name}: invalid JSON-LD ({error.msg})"))
        if "noindex" in page.robots:
            issues.append(("WARNING", f"{name}: page is marked noindex"))

        for reference, _ in page.links:
            target, fragment = local_target(root, page.path, reference)
            if target is None:
                parsed = urlsplit(reference)
                if not parsed.scheme and parsed.netloc:
                    issues.append(("WARNING", f"{name}: local link escapes site root: {reference}"))
                continue
            if not target.exists():
                issues.append(("ERROR", f"{name}: broken local reference {reference}"))
            elif fragment and target.suffix.lower() in {".html", ".htm"}:
                target_page = parse_page(target)
                if fragment not in target_page.ids:
                    issues.append(("ERROR", f"{name}: missing fragment #{fragment} in {reference}"))

    for matching_pages in titles.values():
        if len(matching_pages) > 1:
            issues.append(("ERROR", f"duplicate title on {', '.join(matching_pages)}"))
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT, help="site source directory")
    args = parser.parse_args()
    root = args.root.resolve()
    issues = audit_site(root)
    if not issues:
        print(f"SEO audit passed: no findings across {len(html_pages(root))} HTML pages.")
        return 0
    for severity, message in issues:
        print(f"{severity}: {message}")
    errors = sum(severity == "ERROR" for severity, _ in issues)
    print(f"\n{len(issues)} finding(s); {errors} error(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
