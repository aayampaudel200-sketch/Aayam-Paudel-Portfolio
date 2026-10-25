# Aayam Paudel — Developer Portfolio

A modern, accessible, ready-to-deploy developer portfolio built with **semantic HTML5, CSS3, and vanilla JavaScript**. No frameworks, no external build steps, no heavy dependencies. Open `index.html` in any browser and it works immediately.

---

## 📁 Project Structure

```
aayam/
├── index.html                 # Homepage with Hero, Particles, Quick Strip, Featured Work, Toolkit & Contact
├── about.html                 # About page with Profile, Academic Timeline, Namaste Suman Experience & Interests
├── projects.html              # Projects gallery with dynamic category filtering & accessible modal details
├── css/
│   └── style.css              # Unified design system, tokens, responsive layouts, modal & animations
├── js/
│   ├── main.js                # Core UI behaviors: scroll progress, reveals, mobile menu, toast & copy email
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

## 🛠️ Work Completed & Bugs Fixed

1. **Project Card Status Badge & Media Fallback Bug Fixed:**
   - Previously, when an image failed to load, `onerror` overwrote `parentElement.innerHTML`, which wiped out the `<span class="project-status">` ("Live" or "Prototype") badge.
   - Fixed by keeping the status badge persistent and having the image smoothly reveal an overlay placeholder without mutating outer markup.

2. **Generated High-Definition Project Previews:**
   - Created crisp, tailored 1200x750 dark-tech mockups for **Haat Bazzar** (farm-to-consumer marketplace with product catalog and Gaindakot pricing) and the **Municipal Recommendation Portal** (4-step civic workflow and document review).

3. **Modal Focus & Event Listener Leaks Fixed:**
   - Unified modal event listeners into a single lifecycle (`initModal()`), preventing duplicate `{ once: true }` listeners from stacking on each open/close cycle.
   - Enhanced focus trapping and document-level `Escape` key close.

4. **Script Execution Order & Reveal Race Condition Resolved:**
   - In `projects.html` and `index.html`, `main.js` now loads prior to `projects.js` and exposes `window.__observeReveals` immediately, eliminating the race condition on initial render.
   - Dynamic filtering now transitions cards cleanly without getting stuck at `opacity: 0`.

5. **bfcache (Back/Forward Cache) Animation Restored:**
   - Added `pageshow` listener to `background.js` so returning via browser Back/Forward immediately restarts the particle simulation.

6. **Mobile Navigation Enhancements:**
   - Added support for closing the mobile navigation drawer via `Escape` key or clicking outside.
   - Maintained full screen reader ARIA synchronization (`aria-expanded`, `aria-controls`).

7. **Email One-Click Copy & Toast Added:**
   - Added a "Copy Email" button with an animated toast notification, giving visitors without desktop mail clients an effortless way to copy `aayampaudel200@gmail.com`.

8. **Disabled Button Styling & Accessible Empty States:**
   - Added disabled styling for prototype cards with `[aria-disabled="true"]`.
   - Polished empty-state messaging when switching between categories.

---

## 🚀 Running Locally

No web server or build process is required. You can double-click `index.html` to open it in your default browser.

To run with a lightweight local web server:

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
1. Push this folder to your GitHub account (`https://github.com/aayampaudel200-sketch/portfolio` or similar).
2. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your repository.
4. Set Framework Preset to **Other**, leave the Build Command blank, and keep Root Directory as `./`.
5. Click **Deploy**.

### GitHub Pages:
1. Go to your repository settings on GitHub.
2. Under **Pages**, select **Deploy from a branch**.
3. Choose `main` branch and `/ (root)` folder, then save.

---

## 📝 Configuration & Customization

| Item | File | Location |
|---|---|---|
| Projects list | `js/projects.js` | `PROJECTS` array |
| LinkedIn URL | `js/main.js` | `const LINKEDIN_URL = '...'` |
| Contact details | `index.html` | `#contact` section |
| Color scheme & typography | `css/style.css` | `:root` CSS variables |
| Canvas particle density | `js/background.js` | `particleCount()` & `maxDist` |
