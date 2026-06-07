const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const contentFile = path.join(root, "content.json");
const submissionsFile = path.join(root, "submissions.json");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data, null, 2), "application/json; charset=utf-8");
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function staticFilePath(urlPath) {
  if (urlPath === "/") {
    return path.join(root, "index.html");
  }

  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const requested = safePath;
  const filePath = path.join(root, requested);
  return filePath.startsWith(root) ? filePath : null;
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filePath = staticFilePath(url.pathname);

  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/content" && req.method === "GET") {
    sendJson(res, 200, readJson(contentFile, {}));
    return;
  }

  if (url.pathname === "/api/content" && req.method === "PUT") {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body);
      writeJson(contentFile, data);
      sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/submissions" && req.method === "GET") {
    sendJson(res, 200, readJson(submissionsFile, []));
    return;
  }

  if (url.pathname === "/api/submissions" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);
      const submissions = readJson(submissionsFile, []);
      submissions.unshift({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...payload
      });
      writeJson(submissionsFile, submissions);
      sendJson(res, 201, { ok: true });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: "API route not found." });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/admin") {
    req.url = "/admin.html";
    serveStatic(req, res);
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`LeadHound CMS running at http://localhost:${port}`);
  console.log(`Admin editor: http://localhost:${port}/admin`);
});
