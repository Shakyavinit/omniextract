# ⚡ OmniExtract — Universal Web Media & Video Harvester

<p align="center">
  <img src="https://placehold.co/1200x400/070B12/0EA5E9?text=OMNIEXTRACT+%E2%80%94+Universal+Web+Media+Harvester&font=source-sans-pro" alt="OmniExtract Banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/Shakyavinit/omniextract/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://shakyavinit.github.io/omniextract/"><img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0EA5E9?style=for-the-badge&logo=github" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Version-2.0.0%20PRO-emerald.svg?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Zero%20CORS%20Blocks-Multi--Proxy-purple.svg?style=for-the-badge" alt="CORS Free">
</p>

---

## 🌟 Overview

**OmniExtract** is a high-speed, universal web media harvester and video downloader. It extracts, previews, and batch-downloads high-resolution photos, 4K/1080p videos, HLS streams, audio tracks, and SVG vector graphics from **any website** on the internet — with zero rate-limiting or CORS blocks.

Originally developed as the specialized media extraction engine behind [SENTRAX](https://shakyavinit.github.io/sentrax/), **OmniExtract** is now available as a standalone universal application designed for creators, developers, researchers, and OSINT forensic analysts.

---

## 🚀 Key Features

| Capability | Technical Details |
| :--- | :--- |
| **🏎️ Multi-Proxy Auto-Racing** | Concurrently races 4 distinct high-speed CORS proxies (`AllOrigins`, `CodeTabs`, `CorsProxy.io`, Direct Fetch) to bypass browser cross-origin blocks in under 1 second. |
| **📥 3 Ingestion Modes** | **Live URL Scan**, **Raw HTML / Source Paste** (bypasses Cloudflare & login walls via `Ctrl+U`), and **Drag & Drop `.html` Files**. |
| **🎯 Deep Media Extraction** | Scrapes `<img>` (including responsive `srcset` at highest resolution), `<picture>`, CSS `background-image`, OpenGraph/Twitter social cards, `<video>`, and `<audio>`. |
| **🎬 Video & Embed Harvester** | Grabs direct MP4, WebM, MOV, and HLS `.m3u8` streams. Automatically resolves 1080p Full HD thumbnail frames and player links for **YouTube**, **Vimeo**, and social video embeds. |
| **📐 Automatic Resolution Detection** | Detects real natural dimensions ($W \times H$) in parallel, tagging media as **4K UHD**, **1080p FHD**, **720p HD**, or **Vector SVG**. |
| **📦 1-Click Batch ZIP Packer** | Bundles selected assets directly in the browser via JSZip and FileSaver into clean folders (`images/`, `videos/`, `audio/`, `vectors/`) with a `manifest.json` report. |
| **🔍 Interactive Lightbox Viewer** | Full-screen preview modal with zoom in/out, 90° rotation, and a custom video player with speed controls (`0.5x`, `1x`, `1.5x`, `2x`). |
| **🔖 1-Click Browser Bookmarklet** | Draggable bookmarklet `📸 OmniExtract Media` that runs directly in your browser context on any active tab (Instagram, Twitter, Pinterest, TikTok, Netflix, etc.) with 0 CORS limitations. |
| **💻 CLI & Local Server Included** | Comes with a standalone Python CLI tool (`omniextract_cli.py`) and an optional Node.js Express server (`server.js`). |

---

## 📸 User Interface Preview

```
┌────────────────────────────────────────────────────────────────────────┐
│  OMNIEXTRACT PRO  v2.0           [Media: 48]  [Videos: 8]  [Time: 420ms] │
├────────────────────────────────────────────────────────────────────────┤
│  [ LIVE URL SCAN ]  [ RAW HTML PASTE ]  [ FILE DROP (.HTML) ]          │
│                                                                        │
│  🔍 [ https://example.com/gallery                     ] [EXTRACT MEDIA]│
│  Presets: [NASA APOD] [Wikipedia] [Unsplash] [GitHub] [BBC News]       │
├────────────────────────────────────────────────────────────────────────┤
│  Tabs: [ALL MEDIA 48] [PHOTOS 36] [VIDEOS 8] [AUDIO 2] [VECTORS 2]    │
│  Filter: [1080p FHD]  Sort: [Highest Res]  [SELECT HD] [DOWNLOAD .ZIP] │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ 🖼️ 3840×2160 │  │ 🎬 1080p FHD │  │ 🖼️ 1920×1080 │  │ 📐 SVG      │ │
│  │  4K Ultra HD │  │  MP4 Stream  │  │  Photo Frame │  │  Vector Logo│ │
│  │ [SAVE] [URL] │  │ [SAVE] [URL] │  │ [SAVE] [URL] │  │ [SAVE] [URL]│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔖 1-Click Browser Bookmarklet (Zero CORS)

To extract media directly from any website without using proxies:

1. Open **OmniExtract** in your browser.
2. Click **1-CLICK BOOKMARKLET** in the top navigation.
3. Drag the **`📸 OmniExtract Media`** button directly into your browser's Bookmarks bar (<kbd>Ctrl+Shift+B</kbd> or <kbd>Cmd+Shift+B</kbd>).
4. Visit **any** website (Instagram profile, Pinterest board, Twitter feed, YouTube page, Behance, Dribbble, etc.).
5. Click **📸 OmniExtract Media** in your bookmarks — all photos and video streams will be parsed directly from the active DOM and opened in OmniExtract!

---

## 💻 Terminal CLI Usage

OmniExtract includes a standalone Python CLI script for terminal power users:

```bash
# Scan a webpage and view media breakdown
python3 omniextract_cli.py https://apod.nasa.gov/apod/

# Download all media files to downloads/ folder
python3 omniextract_cli.py https://example.com --download

# Download only videos and package directly into a ZIP archive
python3 omniextract_cli.py https://example.com --type video --zip website_videos.zip

# Output full JSON telemetry
python3 omniextract_cli.py https://example.com --json
```

---

## 🛠️ Local Development & Self-Hosting

### Option 1: Static Hosting (GitHub Pages / Vercel / Netlify)
OmniExtract is 100% static-ready with bundled vendor libraries:
```bash
# Simply open index.html or serve locally
npx serve .
# or
python3 -m http.server 8080
```

### Option 2: Node.js Express Server
Includes a local backend proxy server:
```bash
# Install dependencies
npm install

# Start the server
npm start
# Server will run on http://localhost:3000
```

---

## 🌐 Deploy to GitHub Pages

OmniExtract comes pre-configured with a GitHub Actions workflow in `.github/workflows/deploy.yml`:

1. Push this repository to GitHub.
2. Go to your repository **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Your website will be live at:
   ```
   https://<your-username>.github.io/omniextract/
   ```

---

## 🔒 Privacy & Security

- **100% Client-Side**: All image/video parsing, resolution detection, and ZIP generation happens directly inside your web browser.
- **Zero Logging**: No user browsing data or extracted media is stored on remote servers.
- **Court & Forensic Ready**: Outputs full manifest reports with original source URLs, media hashes, and timestamp verification.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built with ❤️ by [Shakya Vinit](https://github.com/Shakyavinit).
