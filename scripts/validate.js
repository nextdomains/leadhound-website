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
  "assets/leadhound-logo-navbar.png"
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

console.log("Validation passed.");
