import urllib.request
import urllib.error
import urllib.parse
import json
import ssl
import sys

BASE_BARE = 'https://aayampaudel.com.np'
BASE_WWW = 'https://www.aayampaudel.com.np'

pages = [
    '',
    '/about.html',
    '/projects.html',
    '/experience.html',
    '/playground.html',
    '/namaste-suman.html'
]

scripts = [
    '/css/style.css',
    '/js/main.js',
    '/js/background.js',
    '/js/views.js',
    '/js/projects.js',
    '/js/contact.js',
    '/js/chatbot.js',
    '/js/arcade-hub.js',
    '/js/playground.js',
    '/js/namaste-suman.js'
]

media = [
    '/logo.png',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/assets/images/aayam-paudel-web-developer-nepal.jpg',
    '/assets/images/aayam-paudel-working-on-laptop.jpeg',
    '/assets/images/aayam-paudel-haat-bazzar-marketplace.jpg',
    '/assets/images/aayam-paudel-citizenship-recommendation-portal.jpg',
    '/assets/images/aayam-paudel-social-preview.jpg',
    '/assets/images/aayam-paudel-ai-car-drift.jpg',
    '/assets/images/anju-gyawali.jpg',
    '/assets/images/namaste-suman-storefront-gaindakot.jpg',
    '/assets/images/namaste-suman-service-counter.jpg',
    '/assets/images/namaste-suman-visa-documentation.jpg',
    '/assets/images/namaste-suman-flex-banner-design.jpg',
    '/assets/images/namaste-suman-visiting-card-design.jpg',
    '/assets/images/namaste-suman-graphic-promotions.jpg',
    '/assets/images/aayam-portrait-1.jpg',
    '/assets/images/aayam-portrait-2.jpg',
    '/assets/images/project-haat-bazzar.jpg',
    '/assets/images/project-municipal.jpg',
    '/assets/videos/aayam-in-car.mp4'
]

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

no_redir_opener = urllib.request.build_opener(NoRedirect)
redir_opener = urllib.request.build_opener()

print("=" * 60)
print("1. TESTING BARE DOMAIN PAGES (Expected: HTTP 200)")
print("=" * 60)
bare_ok = True
for p in pages:
    url = f"{BASE_BARE}{p}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = no_redir_opener.open(req, timeout=10)
        ct = resp.headers.get('Content-Type')
        print(f"  [OK 200] {url} -> Content-Type: {ct}")
    except Exception as e:
        print(f"  [FAIL] {url} -> {e}")
        bare_ok = False

print("\n" + "=" * 60)
print("2. TESTING WWW REDIRECTS (Expected: HTTP 308 -> Bare Domain)")
print("=" * 60)
www_ok = True
for p in pages:
    url = f"{BASE_WWW}{p}"
    expected_loc = f"{BASE_BARE}{p}" if p else f"{BASE_BARE}/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = no_redir_opener.open(req, timeout=10)
        print(f"  [UNEXPECTED 200] {url} did not redirect!")
        www_ok = False
    except urllib.error.HTTPError as e:
        loc = e.headers.get('Location')
        if e.code in (301, 308) and loc == expected_loc:
            print(f"  [OK {e.code}] {url} -> {loc}")
        else:
            print(f"  [WARN {e.code}] {url} -> Location: {loc} (expected {expected_loc})")
            www_ok = False
    except Exception as e:
        print(f"  [FAIL] {url} -> {e}")
        www_ok = False

print("\n" + "=" * 60)
print("3. TESTING ASSETS: CSS & JAVASCRIPT (Expected: HTTP 200)")
print("=" * 60)
assets_ok = True
for s in scripts:
    url = f"{BASE_BARE}{s}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = redir_opener.open(req, timeout=10)
        ct = resp.headers.get('Content-Type')
        print(f"  [OK 200] {s} ({ct})")
    except Exception as e:
        print(f"  [FAIL] {s} -> {e}")
        assets_ok = False

print("\n" + "=" * 60)
print("4. TESTING ASSETS: MEDIA & IMAGES (Expected: HTTP 200)")
print("=" * 60)
media_ok = True
for m in media:
    url = f"{BASE_BARE}{m}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = redir_opener.open(req, timeout=10)
        ct = resp.headers.get('Content-Type')
        sz = resp.headers.get('Content-Length')
        print(f"  [OK 200] {m} ({ct}, {sz} bytes)")
    except Exception as e:
        print(f"  [FAIL] {m} -> {e}")
        media_ok = False

print("\n" + "=" * 60)
print("5. TESTING HEADERS & SECURITY")
print("=" * 60)
req = urllib.request.Request(f"{BASE_BARE}/", headers={'User-Agent': 'Mozilla/5.0'})
resp = redir_opener.open(req, timeout=10)
headers = resp.headers
for h in ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy']:
    val = headers.get(h)
    print(f"  {h}: {val[:80]}..." if val and len(val) > 80 else f"  {h}: {val}")

print("\n" + "=" * 60)
overall = bare_ok and www_ok and assets_ok and media_ok
print(f"OVERALL PRODUCTION STATUS: {'ALL CHECKS PASSED (100% OPERATIONAL)' if overall else 'SOME CHECKS FAILED'}")
print("=" * 60)
sys.exit(0 if overall else 1)
