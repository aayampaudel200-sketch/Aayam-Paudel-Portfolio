# Security

## Scope and architecture

This repository is a static portfolio: HTML, CSS, and browser-side JavaScript, with no server-side application, authentication, sessions, contact form, or private API. The contact actions use `mailto:`, `tel:`, WhatsApp, and a local clipboard helper. Browser-side behavior is not a security boundary; `robots.txt` is a crawler preference, not access control.

The site loads Google Fonts and the existing visitor-counter API (`countapi.mileshilliard.com`) from the browser. The counter uses a remote counter key and localStorage cache; this repository does not own or back up that third-party service's data. The existing counter identifiers and baseline offset are preserved. The counter runs only on the portfolio domain, so local previews do not update live traffic. When the remote API fails, the page now keeps any cached value and reports its unavailable state instead of manufacturing new counts.

## Verified live response (2026-11-01)

A read-only request to the public `www` host completed successfully over TLS using the local platform trust store. HTTP and the non-`www` HTTPS host resolved to the preferred `https://www.aayampaudel.com.np/` host. The observed response included `Strict-Transport-Security: max-age=63072000`. No `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or frame-protection header was present in that response.

This is a point-in-time check, not a penetration test or a complete TLS/configuration audit. The repository has no hosting configuration, and the active edge/origin account and its deployment settings are outside this source tree. No response-header configuration was changed.

## Applied protections in source

- External links opened in a new tab use `rel="noopener noreferrer"`.
- Project actions are generated from developer-maintained local data; there is no user-submitted content or server-side rendering endpoint.
- Static project content is present in HTML for crawler and no-JavaScript access; the existing JavaScript only enhances the gallery and dialog.
- Copy-to-clipboard uses the browser API with a legacy fallback and reports failures.
- Motion honors `prefers-reduced-motion`; the animated canvas pauses when the page is hidden.
- The crawler policy explicitly allows Googlebot and other named search crawlers while denying unlisted crawlers by default. It is intentionally preserved; robots rules do not protect private resources.
- No credentials, environment variables, or production secrets are required by the static site.

## Headers and hosting actions

The static source cannot set HTTP response headers. Configure these at the actual hosting/CDN layer only after verifying ownership and testing the deployed resource set:

- Keep HTTPS redirects and the observed HSTS policy under the domain operator's control. Do not add `includeSubDomains` or preload without checking every affected hostname and service.
- Start CSP in report-only mode, inventory the inline JSON-LD, inline event handlers, Google Fonts, counter API, images, and project links, then refine and test before enforcement. A restrictive policy can break this existing site if guessed.
- Add `X-Content-Type-Options: nosniff`, an appropriate `Referrer-Policy`, a minimal `Permissions-Policy`, and frame protection (`frame-ancestors` in CSP or `X-Frame-Options`) at the edge.
- Keep operational logs and any secrets in the hosting provider's protected configuration, not in this public repository.

These are recommendations requiring hosting-account access; they have not been applied here.

## Dependencies and reporting

The deployed site has no third-party production package dependencies. `requirements-dev.txt` contains Pillow only for optional local image conversion. Review and update this development dependency before use; no automated vulnerability database or package audit was available in this repository. Do not put credentials in issues or public reports.

To report a suspected vulnerability, contact Aayam Paudel at <aayampaudel200@gmail.com> with a concise description, affected URL/file, impact, and safe reproduction details. Avoid accessing other people's data or running disruptive tests.

## Known limitations

- No application-level security headers can be verified or set from these static files.
- The portfolio loads third-party fonts and visitor-counter requests; the provider's logging and retention are governed by those services.
- The project-details modal interpolates only hand-authored project data into HTML. Keep that data trusted, or change rendering to safe DOM/text APIs before adding any user-controlled content. The current two portrait fallback handlers are inline HTML event handlers, which must be considered when designing a future CSP.
- There is no independent security monitoring, server backup plan, incident response system, or dependency automation defined in this repository.

No claim of complete security is made.
