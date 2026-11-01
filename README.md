# Aayam Paudel — Developer Portfolio

A static, multi-page portfolio built with semantic HTML, CSS, and vanilla JavaScript. It has no production backend, build system, or runtime package dependencies. Existing profile details, contact links, social profiles, business information, project records, and crawler policy are retained.

**Public site:** <https://www.aayampaudel.com.np/>

## Project structure

```text
.
├── index.html                 # Home, profile, skills, featured work, business, contact
├── about.html                 # Background, education, experience, skills, interests
├── projects.html              # Project gallery, filters, and details dialog
├── notes.html                 # Honest landing page; no articles published yet
├── css/style.css              # Shared design tokens, responsive styles, and motion
├── js/
│   ├── main.js                # Navigation, scroll reveals, clipboard helper
│   ├── views.js               # Existing remote visitor counter and cached display
│   ├── background.js          # Lightweight, visibility-aware hero canvas
│   └── projects.js            # Project data, cards, filters, accessible dialog
├── assets/images/             # Preserved originals and optimized WebP copies
├── scripts/                   # Python SEO, links, sitemap, security, and asset tools
├── tests/test_site_tools.py   # Unit tests for local site tooling
├── SECURITY.md                # Security model and verified limitations
└── docs/                       # Architecture, SEO, and publishing guidance
```

## Run locally

Open `index.html` directly, or serve the project over HTTP for realistic link and browser behavior:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/>. The site has no frontend install/build step.

## Python development tools

Python 3.10 or later is required. Create a virtual environment and install the optional image tool dependency:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

From the repository root, run:

```powershell
python -m unittest discover -s tests -v
python scripts/seo_audit.py
python scripts/generate_sitemap.py
python scripts/check_internal_links.py
python scripts/security_headers_audit.py https://www.aayampaudel.com.np/
python scripts/analyze_assets.py
python scripts/optimize_images.py --source assets/images --output optimized-images
```

`generate_sitemap.py` writes only local public HTML routes, skips known private/tool directories and pages marked `noindex`, and omits `lastmod` because the repository does not provide authoritative publication or update dates. Image optimization writes WebP copies to a separate directory and never overwrites source files. The deployed page markup prefers those generated copies while keeping the original JPEG/PNG as browser fallbacks.

## Content integrity

The public profile and business details are retained. The project gallery includes the existing Haat Bazzar and Municipal Citizenship Recommendation Portal records. Haat Bazzar is labelled **Prototype** to match its public repository README, which describes a static multi-page, localStorage-backed prototype. Its existing live demo and GitHub URLs are unchanged. The municipal portal remains a hackathon prototype; no demo or repository link is invented.

The notes page intentionally contains no fabricated articles. See [docs/ARTICLE_WORKFLOW.md](docs/ARTICLE_WORKFLOW.md) to publish a real, reviewed article from the reusable template.

## Documentation

- [Architecture and baseline](docs/ARCHITECTURE.md)
- [SEO and local search guide](docs/SEO_GUIDE.md)
- [Security model and limits](SECURITY.md)
- [Article publishing workflow](docs/ARTICLE_WORKFLOW.md)

## Deployment

This repository is source code only. No production deployment, DNS change, Cloudflare setting, secret, or hosting configuration is performed by these tools. Before publishing, use the hosting account's preview/staging workflow, confirm the `www` canonical host, review any platform-specific security-header configuration, and check the deployed pages, redirects, crawler policy, and sitemap. Search Console verification and sitemap submission require the site owner's Google account; steps are in the SEO guide.
