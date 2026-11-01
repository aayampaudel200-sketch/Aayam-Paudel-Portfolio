# Aayam Paudel — Developer Portfolio

A modern, accessible, ready-to-deploy developer portfolio built with **semantic HTML5, CSS3, and vanilla JavaScript**. No frameworks, no external build steps, no heavy dependencies. Open `index.html` in any browser and it works immediately.

---

## 📁 Project Structure

```
aayam/
├── index.html                 # Homepage with Hero, Live Views, Quick Strip, Featured Work, Toolkit & Contact
├── about.html                 # About page with Profile, Academic Timeline, Namaste Suman Experience & Interests
├── projects.html              # Projects gallery with dynamic category filtering & accessible modal details
├── css/
│   └── style.css              # Unified design system, tokens, responsive layouts, modal & animations
├── js/
│   ├── main.js                # Core UI behaviors: scroll progress, reveals, mobile menu, toast & copy email
│   ├── views.js               # Real-time live page view counter & 48-hour rolling telemetry
│   ├── background.js          # Interactive ambient particle canvas with parallax & bfcache restoration
│   └── projects.js            # Single data source (PROJECTS), card renderer, filter engine & modal dialog
├── python/
│   ├── portfolio_audit.py     # Standard-library audit for crawler rules and sitemap pages
│   └── test_portfolio_audit.py # Unit tests for the Python audit
├── assets/
│   └── images/
│       ├── aayam-portrait-1.jpg       # Hero portrait photograph
│       ├── aayam-portrait-2.jpg       # About page profile photograph
│       ├── project-haat-bazzar.jpg    # Visual mockup of Haat Bazzar marketplace
│       └── project-municipal.jpg      # Visual mockup of Municipal E-Governance Portal
└── README.md
```

## Python site audit

Run the crawler-policy and sitemap checks from the repository root:

```sh
python python/portfolio_audit.py
```

Run its unit tests with:

```sh
python -m unittest discover -s python -p "test_*.py"
```

The audit uses only Python's standard library and does not add a runtime dependency
to the static website.

---

## ⚡ Live Working Views Counter

The portfolio includes an accurate, live view counter displayed in the **Hero Section**, **Quick Strip (04)**, and **Footer**:
website : https://www.aayampaudel.com.np/
