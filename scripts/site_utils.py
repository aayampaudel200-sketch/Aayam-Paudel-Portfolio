"""Shared HTML inspection helpers for the portfolio audit scripts."""

from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


@dataclass
class PageInfo:
    """SEO-relevant facts extracted from one local HTML page."""

    path: Path
    title: str = ""
    description: str = ""
    canonical: str = ""
    robots: str = ""
    open_graph: dict[str, str] = field(default_factory=dict)
    headings: list[int] = field(default_factory=list)
    image_without_alt: int = 0
    links: list[tuple[str, str]] = field(default_factory=list)
    ids: set[str] = field(default_factory=set)
    structured_data: list[str] = field(default_factory=list)


class _PageParser(HTMLParser):
    """Collect page metadata, headings, images, links, and JSON-LD blocks."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.info = PageInfo(path=Path())
        self._title_depth = 0
        self._title_parts: list[str] = []
        self._jsonld_depth = 0
        self._jsonld_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if tag == "title":
            self._title_depth += 1
        elif tag == "meta":
            name = values.get("name", "").lower()
            prop = values.get("property", "").lower()
            content = values.get("content", "").strip()
            if name == "description":
                self.info.description = content
            elif name == "robots":
                self.info.robots = content.lower()
            elif prop.startswith("og:"):
                self.info.open_graph[prop[3:]] = content
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.info.canonical = values.get("href", "").strip()
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.info.headings.append(int(tag[1]))
        elif tag == "img" and "alt" not in values:
            self.info.image_without_alt += 1
        elif tag in {"a", "area"} and values.get("href"):
            self.info.links.append((values["href"], values.get("id", "")))
        elif tag in {"img", "script", "iframe", "source", "video", "audio"} and values.get("src"):
            self.info.links.append((values["src"], values.get("id", "")))
        if tag in {"img", "source"} and values.get("srcset"):
            for candidate in values["srcset"].split(","):
                image_url = candidate.strip().split()
                if image_url:
                    self.info.links.append((image_url[0], values.get("id", "")))
        if values.get("id"):
            self.info.ids.add(values["id"])
        if tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._jsonld_depth += 1
            self._jsonld_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._title_depth:
            self._title_depth -= 1
        if tag == "script" and self._jsonld_depth:
            self.info.structured_data.append("".join(self._jsonld_parts).strip())
            self._jsonld_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._title_depth:
            self._title_parts.append(data)
        if self._jsonld_depth:
            self._jsonld_parts.append(data)


def parse_page(path: Path) -> PageInfo:
    """Parse a local HTML file into a compact metadata record."""
    parser = _PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    parser.info.path = path
    parser.info.title = " ".join("".join(parser._title_parts).split())
    return parser.info


def html_pages(root: Path) -> list[Path]:
    """Return public HTML routes, excluding hidden and tool-only directories."""
    excluded = {".git", "admin", "build", "coverage", "dist", "docs", "draft", "drafts", "internal", "node_modules", "private", "scripts", "tests", "vendor"}
    return sorted(
        path for path in root.rglob("*.html")
        if path.is_file()
        and not any(part.startswith(".") or part.casefold() in excluded for part in path.relative_to(root).parts)
        and path.stem.casefold() not in excluded
        and not path.stem.startswith("_")
    )


def local_target(root: Path, source: Path, reference: str) -> tuple[Path | None, str]:
    """Resolve a local URL to a safe path under root and return its fragment."""
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or reference.startswith("//"):
        return None, ""
    raw_path = unquote(parsed.path)
    if not raw_path:
        target = source
    elif raw_path.startswith("/"):
        target = root / raw_path.lstrip("/")
    else:
        target = source.parent / raw_path
    try:
        resolved = target.resolve()
        resolved.relative_to(root.resolve())
    except (OSError, ValueError):
        return None, parsed.fragment
    if resolved.is_dir():
        resolved = resolved / "index.html"
    return resolved, parsed.fragment
