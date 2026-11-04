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
[official Resend Node.js SDK](https://resend.com/docs/send-with-nodejs).
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

Copy `.env.example` to `.env.local` and fill in the values for local development.
Both `.env` and `.env.local` are Git-ignored. Do not put an API key in
`package.json`, frontend JavaScript, or a committed file. If an API key has
been exposed, revoke it in Resend and create a replacement before use.

For Vercel Production, run `vercel env add RESEND_API_KEY production` and enter
the replacement key only when the CLI prompts for its value. Repeat for
`RESEND_FROM_EMAIL` and `CONTACT_TOKEN_SECRET`; use the same verified sender
address that you set locally. Do not append secret values to the command.
Then run `vercel env pull .env.local` for local testing and redeploy Production
so the function receives the new variables. Run this pull separately on each
computer where you want local development; the deployed site works from any
device once its Production variables are configured.

Run `npm install`, `npm test`, then `npm run dev` to test locally with Vercel's
local function runtime. Submit the homepage contact form using an inbox you
control, open the verification email, then check `aayampaudel200@gmail.com`
for the forwarded test message. The email API only accepts a sender on a
domain verified in Resend. `CONTACT_ALLOWED_ORIGINS` can optionally be set to a
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
website : https://www.aayampaudel.com.np/
