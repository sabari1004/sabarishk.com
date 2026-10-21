# sabarishk.com

The personal portfolio, systems architecture catalog, and technical writing website for **Sabarish K**, built with **Astro 5**, **Tailwind CSS**, **TypeScript**, and **Lucide Icons**, configured for zero-friction continuous deployment to **GitHub Pages**.

---

## 🛠️ Technology Stack & Design System

- **Framework**: [Astro 5](https://astro.build/) with `ClientRouter` view transitions.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `@tailwindcss/typography` and bespoke engineered dark mode palettes (`#09090b` zinc shades, radial glows, glassmorphism panels).
- **Icons**: [Lucide Astro](https://lucide.dev/).
- **Content Collections**: Type-safe schema validation via Zod and Astro glob loader.
- **Syntax Highlighting**: Shiki (`github-dark` theme) with client-side copy-to-clipboard and toast feedback.
- **Feeds & SEO**: Automated RSS 2.0 feed (`/rss.xml`), `@astrojs/sitemap`, OpenGraph cards, Twitter preview cards, and canonical tagging.
- **Hosting**: GitHub Pages via automated GitHub Actions CI/CD with static custom domain (`CNAME`: `sabarishk.com`).

---

## 📂 Architecture & Directory Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD pipeline
├── public/
│   ├── CNAME                   # sabarishk.com domain mapping
│   ├── favicon.svg             # Monogram SVG favicon
│   └── og-image.svg            # OpenGraph social card
├── src/
│   ├── components/
│   │   ├── BackToTop.astro     # Scroll-triggered floating back-to-top button
│   │   ├── CapabilitiesGrid.astro # Core domain capability cards
│   │   ├── ExperienceMilestones.astro # Timeline of platform upgrades
│   │   ├── Footer.astro        # Minimalist footer with feeds and networks
│   │   └── Header.astro        # Sticky navigation with mobile drawer
│   ├── content/
│   │   └── blog/               # Technical and non-technical articles (.md)
│   ├── layouts/
│   │   └── BaseLayout.astro    # Global SEO, ClientRouter, and dark tokens
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── index.astro     # Listing with pill tabs & live search
│   │   │   └── [...slug].astro # Article template with sticky TOC & code copy
│   │   ├── capabilities.astro  # In-depth architectural case breakdown
│   │   ├── contact.astro       # Accessible asynchronous inquiry form
│   │   ├── index.astro         # Hero, terminal, and milestones landing
│   │   └── rss.xml.ts          # Automated RSS 2.0 endpoint
│   ├── styles/
│   │   └── global.css          # Dark mode variables & custom scrollbar
│   └── content.config.ts       # Astro Content Collections schema
├── astro.config.mjs
├── tailwind.config.mjs
└── tsconfig.json
```

---

## ⚡ Quickstart & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### 3. Check Types & Build Production Output
```bash
npm run build
```

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## 🚀 GitHub Pages Deployment

The automated deployment pipeline (`.github/workflows/deploy.yml`) triggers on every push to the `main` branch:
1. Checks out repository.
2. Installs dependencies via `npm ci`.
3. Runs `npm run build` (type-checking + static site generation to `./dist`).
4. Uploads and deploys the artifact to GitHub Pages with the `sabarishk.com` custom domain.
