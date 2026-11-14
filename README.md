# Aayam Paudel — Developer Portfolio

A modern, accessible, ready-to-deploy developer portfolio built with **semantic HTML5, CSS3, and vanilla JavaScript**, with a small Vercel Function for the email-verified contact form. The frontend has no build step or runtime dependency. Open `index.html` in a browser to preview the static pages.

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
│   ├── projects.js            # Single data source (PROJECTS), card renderer, filter engine & modal dialog
│   └── contact.js             # Homepage contact form submission and status messages
├── scripts/
│   └── build-site-knowledge.js # Generates public site knowledge for the AI at deploy time
├── api/
│   ├── contact.js             # Vercel Function for sender verification and email delivery
│   └── contact.test.js        # Contact API tests using Node's built-in test runner
├── python/
│   ├── portfolio_audit.py     # Standard-library audit for crawler rules and sitemap pages
│   └── test_portfolio_audit.py # Unit tests for the Python audit
├── assets/
│   ├── Aayam_Paudel_Resume.pdf # Downloadable CV linked from the homepage
│   └── images/
│       ├── aayam-paudel-web-developer-nepal.jpg             # Hero portrait photograph
│       ├── aayam-paudel-working-on-laptop.jpeg              # Shared laptop photograph
│       ├── aayam-paudel-haat-bazzar-marketplace.jpg         # Haat Bazzar marketplace mockup
│       └── aayam-paudel-citizenship-recommendation-portal.jpg # Municipal portal mockup
└── README.md
```

## AI assistant knowledge

The Gemini assistant uses a generated, public-content knowledge file. Vercel runs
`node scripts/build-site-knowledge.js` on every deployment, so published changes
to the main pages are added to the assistant's context automatically. Run the same
command locally after changing page content if you want the local knowledge file to
match before deployment. The generator intentionally reads only public page content;
it does not expose environment variables, source code, or backend details to the AI.

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

## Contact form email setup

The homepage contact form uses the Vercel Function in `api/contact.js` and the
[Resend email API](https://resend.com/docs/api-reference/emails/send-email).
Resend's [free transactional tier](https://resend.com/pricing) currently
includes 3,000 emails per month, with a 100-email daily limit. Sending requires
a Resend account, a verified sender domain, and these **server-side** Vercel
environment variables:

- `RESEND_API_KEY` — a Resend API key with permission to send email.
- `RESEND_FROM_EMAIL` — a sender address on the domain verified in Resend, for
  example `Aayam Paudel <contact@your-verified-domain.com>`.
- `CONTACT_TOKEN_SECRET` — a random secret of at least 32 bytes, used to encrypt
  short-lived confirmation links. Generate one with
  `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.

Add the variables in the Vercel project settings for Production and redeploy.
Do not put the Resend API key or token secret in frontend JavaScript or commit
them to the repository. `CONTACT_ALLOWED_ORIGINS` can optionally be set to a
comma-separated list of exact origins; by default only the canonical site and
its apex domain are accepted. `CONTACT_SITE_URL` can override the canonical
base URL used in confirmation links.

The visitor first receives a confirmation email. Opening its link proves the
address can receive mail, then sends the submitted message to
`aayampaudel200@gmail.com`; the visitor's verified address is set as Reply-To.
The confirmation token is encrypted, expires after 30 minutes, and confirmation
is idempotent for Resend's supported retry window. Form submission and email
confirmation are reported separately. A successful provider response means
Resend accepted the message, not that it has reached the Gmail inbox; delivery
can still be delayed, bounced, or filtered.

The form also applies same-origin checks, input limits, a hidden honeypot, and
best-effort per-instance request throttling. The throttle is not shared across
serverless instances. No mailbox-checking API can guarantee that an address is
deliverable; the confirmation link is the check that the sender controls a
working inbox.

---

## ⚡ Live Working Views Counter

The portfolio includes an accurate, live view counter displayed in the **Hero Section**, **Quick Strip (04)**, and **Footer**:
Website: https://aayampaudel.com.np/
