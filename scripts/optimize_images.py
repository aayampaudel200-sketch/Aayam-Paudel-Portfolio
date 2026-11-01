"""Create WebP copies of raster images while leaving every source untouched."""

from __future__ import annotations

import argparse
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}


def optimize_images(source: Path, output: Path, quality: int = 82, force: bool = False) -> list[str]:
    """Write WebP versions of supported images and report per-image outcomes."""
    if not 1 <= quality <= 100:
        raise ValueError("quality must be between 1 and 100")
    try:
        from PIL import Image, ImageOps
    except ImportError as error:
        raise RuntimeError("Pillow is required; install the development dependencies with pip install -r requirements-dev.txt") from error
    source = source.resolve()
    output = output.resolve()
    if source.is_file():
        if source.suffix.lower() not in IMAGE_TYPES:
            raise ValueError(f"unsupported image type: {source.suffix}")
        source_root = source.parent
        paths = [source]
    elif source.is_dir():
        source_root = source
        paths = sorted(source.rglob("*"))
    else:
        raise ValueError(f"image source does not exist: {source}")
    results: list[str] = []
    for path in paths:
        if not path.is_file() or path.suffix.lower() not in IMAGE_TYPES:
            continue
        if output == path.parent or output in path.parents:
            continue
        try:
            relative = path.relative_to(source_root)
            target = (output / relative).with_suffix(".webp")
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists() and not force:
                results.append(f"SKIP {relative}: output exists (use --force to replace)")
                continue
            with Image.open(path) as image:
                prepared = ImageOps.exif_transpose(image)
                prepared.save(target, "WEBP", quality=quality, method=6)
            source_size = path.stat().st_size
            target_size = target.stat().st_size
            change = (1 - target_size / source_size) * 100 if source_size else 0
            results.append(f"OK {relative}: {source_size} -> {target_size} bytes ({change:+.1f}%)")
        except OSError as error:
            results.append(f"ERROR {path.relative_to(source)}: {error}")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_ROOT / "assets" / "images", help="source image directory")
    parser.add_argument("--output", type=Path, default=DEFAULT_ROOT / "optimized-images", help="destination for copies")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality from 1 to 100")
    parser.add_argument("--force", action="store_true", help="replace existing optimized copies")
    args = parser.parse_args()
    if not args.source.exists():
        parser.error(f"image source does not exist: {args.source}")
    try:
        results = optimize_images(args.source, args.output, args.quality, args.force)
    except (OSError, RuntimeError, ValueError) as error:
        parser.error(str(error))
    for result in results:
        print(result)
    print(f"\nProcessed {len(results)} image(s). Original files are unchanged.")
    return 1 if any(result.startswith("ERROR ") for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
