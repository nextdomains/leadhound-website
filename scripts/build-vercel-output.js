const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const output = path.join(root, ".vercel", "output");
const outputStatic = path.join(output, "static");
const outputFunctions = path.join(output, "functions");
const api = path.join(root, "api");

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

if (fs.existsSync(api)) {
  for (const file of fs.readdirSync(api)) {
    if (!file.endsWith(".js")) continue;
    const name = file.replace(/\.js$/, "");
    const functionDir = path.join(outputFunctions, "api", `${name}.func`);
    fs.mkdirSync(functionDir, { recursive: true });
    fs.copyFileSync(path.join(api, file), path.join(functionDir, "index.js"));
    fs.writeFileSync(
      path.join(functionDir, ".vc-config.json"),
      JSON.stringify({ runtime: "nodejs20.x", handler: "index.js", launcherType: "Nodejs" }, null, 2)
    );
  }
}

fs.writeFileSync(
  path.join(output, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: "/api/(.*)",
          dest: "/api/$1"
        },
        {
          src: "/(.*)",
          headers: {
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; connect-src 'self' https://*.sanity.io https://api.resend.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net; frame-src https://calendly.com;"
          },
          continue: true
        },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" }
      ]
    },
    null,
    2
  )
);

console.log(`Built Vercel static output to ${output}`);
