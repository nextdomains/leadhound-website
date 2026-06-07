const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const include = [
  "index.html",
  "get-started.html",
  "get-started.css",
  "get-started.js",
  "netlify-form.html",
  "privacy.html",
  "terms.html",
  "robots.txt",
  "sitemap.xml",
  "styles.css",
  "script.js",
  "content.json",
  "sanity-config.js",
  "sanity-config.example.js",
  "assets"
];

function copyRecursive(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const item of include) {
  copyRecursive(path.join(root, item), path.join(dist, item));
}

const cleanHtmlPages = {
  "get-started": "get-started.html",
  privacy: "privacy.html",
  terms: "terms.html"
};

for (const [route, file] of Object.entries(cleanHtmlPages)) {
  copyRecursive(path.join(root, file), path.join(dist, route, "index.html"));
}

console.log(`Built static site to ${dist}`);
