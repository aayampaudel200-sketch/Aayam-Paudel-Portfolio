"""Find broken local page links, fragments, and referenced static assets."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

if __package__:
    from .site_utils import html_pages, local_target, parse_page
else:
    from site_utils import html_pages, local_target, parse_page

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)", re.IGNORECASE)
CSS_IMPORT = re.compile(r"@import\s+['\"]([^'\"]+)", re.IGNORECASE)


def find_broken_references(root: Path) -> list[str]:
    """Return missing local paths or fragments referenced by HTML and CSS."""
    broken: list[str] = []
    for page_path in html_pages(root):
        page = parse_page(page_path)
        for reference, _ in page.links:
            target, fragment = local_target(root, page_path, reference)
            if target is None:
                continue
            if not target.exists():
                broken.append(f"{page_path.relative_to(root)} -> {reference}")
            elif fragment and target.suffix.lower() in {".html", ".htm"}:
                if fragment not in parse_page(target).ids:
                    broken.append(f"{page_path.relative_to(root)} -> {reference} (missing fragment)")
    for css_path in root.rglob("*.css"):
        if any(part.startswith(".") for part in css_path.relative_to(root).parts):
            continue
        contents = css_path.read_text(encoding="utf-8")
        references = CSS_URL.findall(contents) + CSS_IMPORT.findall(contents)
        for reference in references:
            if reference.strip().startswith("%23"):
                continue
            target, _ = local_target(root, css_path, reference.strip())
            if target is not None and not target.exists():
                broken.append(f"{css_path.relative_to(root)} -> {reference}")
    return broken


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT, help="site source directory")
    args = parser.parse_args()
    root = args.root.resolve()
    broken = find_broken_references(root)
    if broken:
        for item in broken:
            print(f"BROKEN: {item}")
        print(f"\n{len(broken)} broken local reference(s).")
        return 1
    print(f"Internal-link check passed across {len(html_pages(root))} HTML page(s) and local CSS references.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
