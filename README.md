# LeadHound Website

LeadHound is a static marketing website for a lead generation business. The site is built with plain HTML, CSS, and JavaScript, with optional Sanity CMS content loading and a lightweight local preview server.

Sanity is used as the CMS/backend for content. It is not the website host. The website deploys separately to Netlify, Vercel, or another static hosting platform.

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Local preview API: Node `server.js` or Python `server.py`
- CMS: Sanity Studio in `sanity/`
- Deployment target: Netlify or Vercel as a static site

## Project Structure

```text
.
|-- assets/                  # Logo and image assets
|-- sanity/                  # Sanity Studio config and schemas
|-- scripts/                 # Build and validation scripts
|-- index.html               # Public website
|-- privacy.html             # Privacy page
|-- terms.html               # Terms page
|-- styles.css               # Public website styles
|-- script.js                # Public website behavior and Sanity loader
|-- content.json             # Fallback content
|-- sanity-config.js         # Public Sanity browser config
|-- admin.html               # Local JSON CMS editor
|-- server.js                # Node local server
|-- server.py                # Python local server fallback
|-- netlify.toml             # Netlify deploy config
`-- vercel.json              # Vercel deploy config
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
npm run lint
npm run test
npm run build
```

Direct commands:

```powershell
node scripts/validate.js
node scripts/build.js
```

## Sanity CMS Setup

Project details:

```text
Project ID: nvlfyhr7
Dataset: production
API version: 2026-06-07
```

The public website Sanity config is set in `sanity-config.js`:

```js
window.LEADHOUND_SANITY = {
  projectId: "nvlfyhr7",
  dataset: "production",
  apiVersion: "2026-06-07",
  useCdn: true
};
```

For deploy platform reference, `.env.example` contains:

```text
SANITY_PROJECT_ID=nvlfyhr7
SANITY_DATASET=production
SANITY_API_VERSION=2026-06-07
PUBLIC_SITE_URL=https://your-domain.com
```

The Studio environment is set in `sanity/.env` and documented in `sanity/.env.example`:

```text
SANITY_STUDIO_PROJECT_ID=nvlfyhr7
SANITY_STUDIO_DATASET=production
```

Run the Studio locally:

```powershell
cd sanity
npm install
npm run dev
```

The website will load Sanity content when documents exist and CORS is configured. If Sanity is empty or unavailable, it falls back to `content.json` and the hardcoded HTML.

## Sanity Studio Content To Add

Inside Sanity Studio, create one document for each of these schemas.

Site Settings:
- Brand: `LeadHound`
- SEO Title: `LeadHound | Verified Lead Generation`
- SEO Description: a short lead generation description for search results
- Email: `sales@leadhound.net`
- Phone: `0404 243 378`
- Logo: optional

Homepage:
- Hero eyebrow, headline, body, primary CTA, secondary CTA, and badges
- Stats with softer, verifiable wording
- Lead Funnels eyebrow, headline, body, and four funnel steps

Services:
- Eyebrow and headline
- Service items with tag, title, and body

Testimonials:
- Eyebrow, headline, and body
- Testimonial items with name, role, quote, and image URL

Lead Form Settings:
- Eyebrow, headline, body, button label, success message, and fallback email

Schema files live in `sanity/schemas/` and are loaded through `sanity/schemas/index.ts`.

## Sanity CORS

In Sanity Manage -> API -> CORS, add these exact origins with no trailing slash:

```text
http://localhost:3333
http://localhost:3000
http://localhost:5173
https://your-live-domain.com
https://your-deployed-studio-url.sanity.studio
```

Credentials settings:

- `http://localhost:3333` with credentials
- `http://localhost:3000` without credentials
- `http://localhost:5173` without credentials
- Your live website domain without credentials
- Your deployed Studio URL with credentials

## Deploy Website

Deploy the public website to Netlify or Vercel.

Netlify reads `netlify.toml`:

```text
Build command: node scripts/build.js
Publish directory: dist
```

Vercel settings:

```text
Build command: node scripts/build.js
Output directory: dist
```

## Deploy Sanity Studio

Sanity Studio deploys separately from the public website.

```powershell
cd sanity
npm install
npx sanity deploy
```

## GitHub Push Steps

From this folder:

```powershell
git add .
git commit -m "Update Sanity setup"
git push
```

## Download as ZIP

PowerShell:

```powershell
Compress-Archive -Path .\* -DestinationPath ..\leadhound-website.zip -Force
```

Run that command from inside this project folder.

## Share With ChatGPT for Review

You can share any of these:

- GitHub repo URL
- ZIP file containing the project
- Live preview URL from Vercel or Netlify
- Local screenshots of the site

Best review prompt:

```text
Please review this LeadHound website for design, copy, responsiveness, SEO, accessibility, deployment readiness, and Sanity CMS setup.
```
