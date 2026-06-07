const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const output = path.join(root, ".vercel", "output");
const outputStatic = path.join(output, "static");

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

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(outputStatic, { recursive: true });
copyRecursive(dist, outputStatic);

fs.writeFileSync(
  path.join(output, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" }
      ]
    },
    null,
    2
  )
);

console.log(`Built Vercel static output to ${output}`);
