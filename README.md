# Connect 4 Solver

[![Live Site](https://img.shields.io/badge/Live-connect4--solver.com-blue?style=for-the-badge)](https://www.connect4-solver.com)

A premium, high-performance **Connect 4 Solver** web application compiled as a static site (SSG) using **Nuxt 4** and **Vue 3**. It runs a perfect mathematical solver engine written in C++ locally in the browser via **WebAssembly (WASM)**.

## 🚀 Key Features

*   **Perfect Mathematical Solver**: Computes exact win/loss evaluation scores for every possible move instantly with zero server latency using a WebAssembly-compiled minimax engine.
*   **Static Site Generation (SSG)**: Built as a fully pre-rendered static website with optimized loading states, fast navigation, and clean layout hydration.
*   **Aesthetics & Customization**: Features a modern dark-themed dashboard. Users can toggle sections (header, footer, evaluation bar, autoplay controls, learn mode presets, steady-state diagrams, and move sequences) which persist instantly without any layout flashing.
*   **Multi-language Support (i18n)**: Fully localized in English, French, and German, complete with dynamic sitemaps and correct `hreflang` alternative link tags for optimal global SEO.
*   **Progressive Web App (PWA)**: Registerable service worker caches assets, icons, and WASM binaries for offline availability and quick reloading.
*   **Dynamic Social Previews (Open Graph)**: Dynamically generates custom, branded Open Graph share card graphics for all pages at build-time using `nuxt-og-image` and the Takumi engine.

---

## 🛠️ Technology Stack

*   **Framework**: Nuxt 4 (with Vite, LightningCSS)
*   **Core**: Vue 3 (Composition API) & Pinia (State Management)
*   **Engine**: C++ Solver compiled to WebAssembly (WASM) via Emscripten
*   **SEO & Sitemap**: `@nuxtjs/sitemap`, `@nuxtjs/robots`, `@nuxtjs/i18n`
*   **Social Previews**: `nuxt-og-image` (Takumi/Satori engines)
*   **CI/CD**: GitHub Actions deploying automatically to GitHub Pages (`gh-pages`)

---

## 💻 Developer Guide

### Prerequisites
*   Node.js (v18+)
*   [Emscripten SDK](https://emscripten.org/) (only if compiling the C++ WebAssembly engine from source)

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Compile WebAssembly (WASM)
If you modify the C++ solver code under `app/solver/cpp/`, recompile the WASM
bundle. This needs the Emscripten SDK active in your shell (`emcc` on PATH):

```powershell
# Windows (PowerShell): activate emsdk for this session
& C:\path\to\emsdk\emsdk_env.ps1
```
```bash
# macOS / Linux: source the env script in this shell
source /path/to/emsdk/emsdk_env.sh
```

Then run the cross-platform build (uses `build-wasm.ps1` on Windows,
`build-wasm.sh` elsewhere):
```bash
npm run build:wasm
```

This emits **two** artifacts from the same C++ into `public/wasm/`:
*   `c4solver.js` — the browser build (UMD global, loaded via `<script>`).
*   `c4solver.node.mjs` — a node ES-module build used by the Learn-mode oracle
    (below). A separate artifact is required because the package is
    `"type": "module"`, so the browser's UMD `.js` cannot be imported under Node.

### Hot-Reload for Development
Start the local development server at `http://localhost:3000`:
```bash
npm run dev
```

### Static Build & Pre-render
Compile and minify all routes (including locale pages `/fr`, `/de`, `/settings`, etc.) and pre-render social sharing cards:
```bash
npm run generate
```

To preview the generated production build locally:
```bash
npm run preview
```

### Testing
Verify the solver's classification invariants and learn-mode logic. This is
pure board geometry — no solver, no compiler needed, and it runs instantly:
```bash
npm run test:learn
```

For the deeper **oracle** check, the Learn-mode classifier is cross-validated
against the *real* solver over hundreds of random positions (every `win`/`block`
it names must match the solver's verdict, and its best move must be
solver-optimal). This requires the node WASM build from above
(`npm run build:wasm`):
```bash
npm run test:learn:oracle
```
A green run is the readiness gate for extending the classifier with new
strategic rules (Allis threat theory). Tune with `C4_ORACLE_N` (positions),
`C4_ORACLE_MAXPLIES`, and `C4_ORACLE_SEED`.

### Linting & Formatting
Ensure code styling and ES rules are clean:
```bash
# Run ESLint + Oxlint
npm run lint

# Format code with Prettier
npm run format
```

---

## 📦 Automated Deployment

This repository includes a GitHub Actions CI/CD workflow defined in `.github/workflows/deploy.yml`. 
On every push or pull-request merged to the `main` branch, the workflow will automatically:
1. Initialize the node environment.
2. Build and generate the static files.
3. Deploy the pre-rendered output (`.output/public`) to the `gh-pages` branch for hosting.
