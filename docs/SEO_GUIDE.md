# SEO and local search guide

## Research findings and limitations

**Checked:** 2026-11-01. The available fetch tool did not provide a reliable, location-specific Google results page for the Gaindakot/Nawalpur queries: Google's response required JavaScript and returned no usable listings. A direct Bing query for “software developer Gaindakot” returned a Nepali-localized page of unrelated gaming results. Search location, device, personalization, and ranking context were not available. That output is not credible competitor research, so no local competitor names, authority scores, backlink signals, or ranking claims are reported.

The requested design references were directly inspected on the same date:

- [Brittany Chiang](https://brittanychiang.com/): experience and project storytelling, clear hierarchy, and an explicit accessibility focus.
- [Josh Comeau](https://www.joshwcomeau.com/): content-led technical tutorials and carefully explained implementation details.
- [Bruno Simon](https://bruno-simon.com/): memorable interactive 3D presentation with clear controls and behind-the-scenes technical context. Its high-complexity game is not a performance template for this static portfolio.

These are design references, not verified Nepal search competitors. The live search landscape and any backlink analysis still require a location-aware browser/search or a trusted SEO service.

## Implemented technical foundation

- The canonical host is `https://www.aayampaudel.com.np/`, verified by observing HTTP and non-`www` requests resolve to the live `www` host.
- Home, about, projects, and notes have distinct titles, descriptions, canonical URLs, Open Graph metadata, and social-card metadata.
- Home has `WebSite`, `ProfilePage`, and `Person` JSON-LD with the existing identity, contact, location, and profile links. The other pages provide page/collection and breadcrumb data. No Article schema is emitted until real articles exist.
- The project cards are present in HTML for crawlability, and images include descriptive alt text.
- `robots.txt` explicitly allows the named Googlebot and Googlebot-Image groups, retains the existing named bot restrictions, denies unlisted crawlers by default, and points to the `www` sitemap. This policy has not been broadened.
- `sitemap.xml` lists only the public static pages. It omits `lastmod`, because reliable content publication/modification dates are not available.
- The Python audit scripts validate local metadata, links, canonical HTTPS URLs, JSON-LD syntax, and the sitemap's public-route behavior.

The site's actual response headers, indexing, mobile usability, and search appearance are not controlled by these page files. An HTTP redirect is not proof of Google's selected canonical or successful indexing.

## Honest keyword plan

Use the following phrases naturally in page copy that is genuinely relevant; do not create city doorway pages or repeat location terms unnaturally:

- Identity: Aayam Paudel; B.Sc. CSIT student; web developer.
- Local: web developer in Gaindakot; software developer in Gaindakot; full-stack developer in Nawalpur; software developer in Nawalpur; Nawalparasi East.
- Broader: web developer in Nepal; web application development; full-stack web development; software development projects.

Home and About mention the verified Gaindakot location and current student/developer identity. Project pages describe actual work rather than keyword variants. Do not claim “best developer,” guaranteed ranking, or skills/work not evidenced by the portfolio.

## Repeatable local competitor research

For defensible local SERP research, use a browser/search provider with a known location and device; record exact date, query, location, language, device, and personalization state. Review the first relevant organic results for the requested Gaindakot, Nawalpur, Nawalparasi East, and Nepal phrases. Record only verifiable competitor domains, page type, evidence of local relevance, technical/project proof, and useful differentiation. Do not infer backlink authority from appearance alone; use a reputable backlink dataset and cite its date/source.

## Google Search Console: owner actions

1. In the site owner's Google account, add a Domain property for `aayampaudel.com.np` and complete the DNS TXT verification at the current DNS provider. Do not paste verification tokens into this repository.
2. In Search Console, submit `https://www.aayampaudel.com.np/sitemap.xml`.
3. Use URL Inspection on the home, about, projects, and notes pages. Check Google's crawled HTML, selected canonical, robots status, and last crawl. Request indexing only after the public deployment is confirmed.
4. Review Page indexing and Enhancements for excluded URLs, mobile usability, and structured-data errors.
5. After enough impressions accrue, compare Search results queries, impressions, clicks, CTR, and average position by page and date range. Annotate meaningful content updates and review again after several weeks; do not promise a ranking outcome.

These steps require external Google and DNS account access and were not performed.

## Publishing and validating

Run from the repository root:

```powershell
python scripts/seo_audit.py
python scripts/check_internal_links.py
python scripts/generate_sitemap.py
```

The sitemap generator excludes tool/private directories and `noindex` pages and does not invent date fields. See [ARTICLE_WORKFLOW.md](ARTICLE_WORKFLOW.md) before adding notes.

## Remaining SEO checks

The repository cannot prove real Search Console ownership/index status, mobile-browser rendering across devices, Lighthouse scores, actual search rankings, page-level CDN caching/compression, or backlink competition. Run those checks against the deployed preview and in the owner's external accounts before publishing or claiming results.

The local Python SEO and internal-link audits passed on 2026-11-01, and the generated sitemap contains four public routes. This verifies source files only, not Google indexing or deployment.
