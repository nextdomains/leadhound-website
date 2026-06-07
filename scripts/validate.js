const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "admin.html",
  "admin.css",
  "admin.js",
  "content.json",
  "sanity-config.js",
  "privacy.html",
  "terms.html",
  "assets/leadhound-logo-navbar.png",
  "assets/favicon.png",
  "assets/leadhound-social-preview.jpg"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);
}

JSON.parse(read("content.json"));

for (const file of ["script.js", "admin.js", "sanity-config.js"]) {
  new vm.Script(read(file), { filename: file });
}

const html = read("index.html");
const css = read("styles.css");

assert(html.includes('src="assets/leadhound-logo-navbar.png"'), "Header logo is not using the navbar logo asset.");
assert(html.includes('href="#home"'), "Logo/home links are missing.");
assert(css.includes("--brand-black: #05070b;"), "Missing --brand-black CSS variable.");
assert(css.includes("--brand-charcoal: #0b111a;"), "Missing --brand-charcoal CSS variable.");
assert(css.includes("--brand-blue: #006cff;"), "Missing --brand-blue CSS variable.");
assert(css.includes("--brand-silver: #d7dce2;"), "Missing --brand-silver CSS variable.");
assert(css.includes("--brand-white: #ffffff;"), "Missing --brand-white CSS variable.");
assert(css.includes(".site-header.is-scrolled"), "Sticky scroll header state is missing.");
assert(!css.includes("left: min(calc(100vw - 62px), 330px);"), "Mobile menu button still uses risky left positioning.");
assert(css.includes("right: 18px;"), "Mobile menu button is missing right alignment.");
assert(html.includes('data-netlify="true"'), "Lead form is missing Netlify Forms support.");
assert(html.includes('name="leadhound-enquiry"'), "Lead form is missing a production form name.");
assert(html.includes('href="privacy.html"'), "Privacy Policy footer link is missing.");
assert(html.includes('href="terms.html"'), "Terms footer link is missing.");
assert(html.includes('property="og:image" content="assets/leadhound-social-preview.jpg"'), "Open Graph image is missing.");
assert(html.includes('name="twitter:card" content="summary_large_image"'), "Twitter card meta is missing.");
assert(read("sanity-config.js").includes('apiVersion: "2026-06-07"'), "Sanity API version is not updated.");
assert(read("sanity-config.js").includes('projectId: "nvlfyhr7"'), "Sanity project ID is not configured.");
assert(read("script.js").includes('document.querySelectorAll(".footer .contact-line")'), "Footer contact renderer is not targeting contact lines directly.");

console.log("Validation passed.");
