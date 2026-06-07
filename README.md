# LeadHound Website

LeadHound is a static marketing website for a lead generation business. The site is built with plain HTML, CSS, and JavaScript, with optional Sanity CMS content loading and a lightweight local preview server.

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Local preview API: Node `server.js` or Python `server.py`
- CMS: Sanity Studio scaffold in `sanity/`
- Deployment target: Vercel or Netlify as a static site

Sanity is used as the CMS/backend for content. It is not the website host. The website should still deploy separately to Vercel, Netlify, or another static hosting platform.

## Project Structure

```text
.
├── assets/                  # Logo and image assets
├── sanity/                  # Sanity Studio config and schemas
├── scripts/                 # Build and validation scripts
├── index.html               # Public website
├── styles.css               # Public website styles
├── script.js                # Public website behavior and Sanity loader
├── content.json             # Fallback content
├── sanity-config.js         # Public Sanity browser config
├── admin.html               # Local JSON CMS editor
├── server.js                # Node local server
├── server.py                # Python local server fallback
├── netlify.toml             # Netlify deploy config
└── vercel.json              # Vercel deploy config
```

## Local Development

Use the Node server:

```powershell
node server.js
```

If Node is not available, use Python:

```powershell
python server.py
```

Then open:

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/admin
```

## Scripts

```powershell
node scripts/validate.js
node scripts/build.js
```

Package scripts:

```powershell
npm run lint
npm run test
npm run build
```

This project currently has no required frontend dependencies. If `npm` is unavailable, the direct `node scripts/...` commands work.

## Sanity CMS Setup

1. Create a Sanity project at `https://www.sanity.io/manage`.
2. Copy `.env.example` to `.env` and fill in:

```text
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_VERSION=2025-01-01
PUBLIC_SITE_URL=https://your-domain.com
```

3. Copy `sanity/.env.example` to `sanity/.env`:

```text
SANITY_STUDIO_PROJECT_ID=your_project_id
SANITY_STUDIO_DATASET=production
```

4. Update `sanity-config.js`:

```js
window.LEADHOUND_SANITY = {
  projectId: "your_project_id",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: true
};
```

The website will load Sanity content when configured. If Sanity is empty or unavailable, it falls back to `content.json` and the hardcoded HTML.

## Sanity Schemas

The Studio includes schemas for:

- Site settings
- Homepage
- Services
- Testimonials
- Lead form settings

Schema files live in `sanity/schemas/`.

## Sanity CORS

In Sanity Manage, add these CORS origins:

```text
http://localhost:4173
http://127.0.0.1:4173
https://your-production-domain.com
```

Enable credentials only if you later add authenticated Sanity requests. For public read-only content, credentials are not needed.

## Deploy Sanity Studio

From the `sanity/` folder:

```powershell
npm install
npm run dev
npm run deploy
```

Sanity Studio deploys separately from the public website.

## Deploy Website to Vercel

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Use these settings:

```text
Build command: node scripts/build.js
Output directory: dist
```

Or with Vercel CLI:

```powershell
npm install -g vercel
vercel
vercel --prod
```

## Deploy Website to Netlify

Netlify will read `netlify.toml`.

Settings:

```text
Build command: node scripts/build.js
Publish directory: dist
```

Or with Netlify CLI:

```powershell
npm install -g netlify-cli
netlify deploy
netlify deploy --prod
```

## GitHub Push Steps

Install Git if needed:

```powershell
winget install --id Git.Git -e
```

Then from this folder:

```powershell
git init
git add .
git commit -m "Prepare LeadHound website for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Download as ZIP

Option 1: In File Explorer, right-click the `leadify-clone` folder and choose:

```text
Compress to ZIP file
```

Option 2: PowerShell:

```powershell
Compress-Archive -Path .\* -DestinationPath ..\leadhound-website.zip -Force
```

Run that command from inside this project folder.

## Share With ChatGPT for Review

You can share any of these:

- GitHub repo URL after pushing
- ZIP file containing the project
- Live preview URL from Vercel or Netlify
- Local screenshots of the site

Best review prompt:

```text
Please review this LeadHound website for design, copy, responsiveness, SEO, accessibility, deployment readiness, and Sanity CMS setup.
```
