# Architecture and baseline

## Baseline discovered

The repository is a small, static site with no framework, package manifest, server, build pipeline, database, or existing automated test suite. Before this update, it contained three public HTML pages (`index.html`, `about.html`, and `projects.html`), a shared stylesheet, and four browser scripts. The profile, education, contact details, social links, business section, two portfolio project records, local images, remote view counter, and crawler allow/deny rules were part of the baseline.

The live site was fetched on 2026-11-01. The page source is served from `https://www.aayampaudel.com.np/`; requests to HTTP and the non-`www` host resolved to this `www` host. The source now uses that host consistently for canonical URLs, Open Graph, structured data, robots sitemap reference, and XML sitemap locations. The static projects are rendered in HTML and enhanced by JavaScript, improving no-JavaScript visibility and crawlability.

## Current structure

- Four public pages are served as static files: home, about, projects, and engineering notes.
- `css/style.css` holds shared tokens, responsive layouts, and motion. Reduced-motion preferences are respected, and reveal effects are enabled only when JavaScript is active so no-script users still see the content.
- `js/main.js` handles the menu, focus-friendly navigation behavior, scroll indicators, reveals, and copy-email action.
- `js/background.js` is a small canvas effect that pauses while hidden or when reduced motion is requested.
- `js/projects.js` is the single source of project metadata for filtering and the details dialog. The two existing projects are also represented in page HTML for progressive enhancement.
- `js/views.js` retains the existing third-party counter keys and cache; an API failure no longer fabricates counts.
- `scripts/` contains standard-library static audits and a Pillow-backed optional image-copy optimizer. `tests/` contains unit tests for metadata parsing and sitemap safety.
- WebP copies in `assets/images/optimized-images/` are used through `<picture>` sources, with each original image retained as its fallback.

## Project facts and content boundaries

The existing portfolio names Haat Bazzar and the Municipal Citizenship Recommendation Portal. The public Haat Bazzar repository describes a static, responsive, multi-page prototype with browser `localStorage`; its current demo/repository links are retained. The municipal portal's existing record identifies it as a 48-hour hackathon prototype with no live demo or repository link. The GitHub account currently lists the portfolio and Haat Bazzar repositories; no SewaSathi repository or source was found in that public list, so no additional project record was invented.

No technical articles were present in the repository. `notes.html` is an honest empty state rather than a fabricated blog, and the static publishing flow is documented in [ARTICLE_WORKFLOW.md](ARTICLE_WORKFLOW.md).

## Extending the site

Keep the static architecture unless a real requirement justifies a backend. Preserve existing routes and source assets. For new public HTML, provide a unique title, description, canonical URL on the verified `www` host, Open Graph/Twitter metadata, semantic heading structure, alt attributes, and accurate structured data. Add actual pages to internal navigation where useful, then regenerate `sitemap.xml`. Never commit credentials or personal visitor data.

## Validation and performance evidence (2026-11-01)

- The Python test suite passes 11 tests. The local SEO audit reports no findings across the four public HTML pages; the internal-link/CSS-asset audit passes; the generated XML sitemap parses and contains those four routes.
- The JavaScript files pass Node syntax checks. The local browser preview at 628×732 showed no horizontal overflow (`documentWidth` 613px), loaded all WebP image sources, and the project filter, details dialog, and mobile menu worked. This is not a full device matrix.
- The five optimized visual assets (four content images and the logo) total 895,426 bytes in their preserved originals and 335,500 bytes as WebP copies, a measured reduction of about 62.5%. Individual originals remain unchanged and are used as image fallbacks.
- `analyze_assets.py` still flags `logo.png` and `android-chrome-512x512.png` at about 385.5 KiB each; both are retained as originals/fallback or install assets. It also suggests the old `photo/1.jpeg` and `photo/2.jpeg` copies may be unused. None were removed; review before cleanup.
- Lighthouse, LCP/INP/CLS, desktop/mobile browser matrices, deployed-page console/network diagnostics, and Google indexing/rankings were not measured in this environment. No performance score or production behavior is claimed.
