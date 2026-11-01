"""Report large image, JavaScript, and CSS files in the static site."""

from __future__ import annotations

import argparse
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
THRESHOLDS = {".jpg": 250_000, ".jpeg": 250_000, ".png": 250_000, ".webp": 250_000, ".js": 250_000, ".css": 100_000}
LABELS = {"image": "image", ".js": "JavaScript", ".css": "CSS"}
IMAGE_TYPES = {".avif", ".bmp", ".gif", ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}
SOURCE_TYPES = {".css", ".html", ".js", ".webmanifest"}


def large_assets(root: Path, thresholds: dict[str, int] | None = None) -> list[tuple[Path, int, str]]:
    """Find assets exceeding their configured byte thresholds."""
    limits = thresholds or THRESHOLDS
    matches: list[tuple[Path, int, str]] = []
    for path in root.rglob("*"):
        if not path.is_file() or any(part.startswith(".") for part in path.relative_to(root).parts):
            continue
        suffix = path.suffix.lower()
        limit = limits.get(suffix)
        kind = "image" if suffix in IMAGE_TYPES else LABELS.get(suffix, "")
        if limit is None and kind == "image":
            limit = limits.get(".jpg", 500_000)
        if limit is not None and kind and path.stat().st_size > limit:
            matches.append((path, path.stat().st_size, kind))
    return sorted(matches, key=lambda item: item[1], reverse=True)


def potentially_unreferenced_images(root: Path) -> list[Path]:
    """Find raster assets whose filename is absent from public source files."""
    sources = [
        path for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in SOURCE_TYPES
        and not any(part.startswith(".") for part in path.relative_to(root).parts)
    ]
    source_text = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in sources)
    candidates = [
        path for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_TYPES
        and not any(part.startswith(".") for part in path.relative_to(root).parts)
    ]
    return sorted(path for path in candidates if path.name not in source_text)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT, help="site source directory")
    args = parser.parse_args()
    root = args.root.resolve()
    matches = large_assets(root)
    unused = potentially_unreferenced_images(root)
    if not matches:
        print("No files exceed the configured size thresholds.")
    else:
        for path, size, kind in matches:
            print(f"{size / 1024:8.1f} KiB  {kind:12} {path.relative_to(root)}")
        print(f"\n{len(matches)} large asset(s); thresholds: images 250 KB, JS 250 KB, CSS 100 KB.")
    if unused:
        print("\nPotentially unreferenced images (review before removing):")
        for path in unused:
            print(f"  {path.relative_to(root)}")
    else:
        print("\nNo potentially unreferenced raster images detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
