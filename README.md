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
├── assets/
│   └── images/
│       ├── aayam-portrait-1.jpg       # Hero portrait photograph
│       ├── aayam-portrait-2.jpg       # About page profile photograph
│       ├── project-haat-bazzar.jpg    # Visual mockup of Haat Bazzar marketplace
│       └── project-municipal.jpg      # Visual mockup of Municipal E-Governance Portal
└── README.md
```

---

## ⚡ Live Working Views Counter

The portfolio includes an accurate, live view counter displayed in the **Hero Section**, **Quick Strip (04)**, and **Footer**:

1. **Increments on Every Visit:**
   - Powered by a serverless REST counting API (`countapi.mileshilliard.com`).
   - Every visit or page reload triggers a real-time increment on the server.
2. **Rolling 48-Hour (Last 2 Days) Views:**
   - Accurately tracks today's views + yesterday's views using synchronized UTC date keys.
   - Automatically updates and rolls over daily without manual intervention.
3. **Smooth Odometer Count Animation:**
   - Numbers count up smoothly with cubic easing when the page loads.
4. **Instant Zero-Latency Paint & Offline Resilience:**
   - Previous counts are cached in `localStorage` for instantaneous rendering.
   - If offline or on slow network, it gracefully increments the local session cache so the counter never breaks.

### 🌐 Cloudflare Analytics & Custom Offset:
If you have prior view statistics from your Cloudflare dashboard (e.g., from the last 2 days or past weeks), you can configure a starting offset in `js/views.js`:
```javascript
const CLOUDFLARE_OFFSET = 0; // Set to your Cloudflare historical count if desired
```
You can also optionally enable Cloudflare Web Analytics by uncommenting the beacon tag in `<head>` of `index.html`.

---

## 🚀 Running Locally

No web server or build process is required. You can double-click `index.html` to open it in your browser.

To run with a local server:

```bash
# Using Python
python -m http.server 8000

# Or using Node
npx serve .
```

Then visit [http://localhost:8000](http://localhost:8000).

---

## 🌐 Deploying to Vercel or GitHub Pages

### Vercel:
1. Push this folder to your GitHub account (`https://github.com/aayampaudel200-sketch/Aayam-Paudel-Portfolio`).
2. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your repository.
4. Set Framework Preset to **Other**, leave Build Command blank, and keep Root Directory as `./`.
5. Click **Deploy**.

### GitHub Pages:
1. Go to repository settings on GitHub.
2. Under **Pages**, select **Deploy from a branch**.
3. Choose `main` branch and `/ (root)` folder, then save.
