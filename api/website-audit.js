const SANITY_PROJECT_ID = "nvlfyhr7";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2026-06-07";

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitize(value, maxLength = 300) {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function scoreHtml(url, html, status) {
  const lower = html.toLowerCase();
  const https = url.startsWith("https://");
  const hasTitle = /<title>[^<]{8,}<\/title>/i.test(html);
  const hasMeta = /<meta[^>]+name=["']description["']/i.test(html);
  const hasCta = /(book|call|quote|get started|contact|enquire|strategy)/i.test(html);
  const hasForm = /<form|type=["']email["']|name=["']email["']/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(html);
  const contentLength = html.replace(/<[^>]+>/g, " ").trim().length;
  return {
    leadCaptureScore: Math.min(100, (hasCta ? 35 : 10) + (hasForm ? 35 : 10) + (contentLength > 1200 ? 30 : 15)),
    conversionScore: Math.min(100, (hasCta ? 45 : 20) + (hasForm ? 25 : 10) + (hasTitle ? 15 : 5) + (hasMeta ? 15 : 5)),
    seoBasicsScore: Math.min(100, (hasTitle ? 30 : 5) + (hasMeta ? 30 : 5) + (https ? 20 : 5) + (contentLength > 1000 ? 20 : 10)),
    speedUxScore: Math.min(100, (status >= 200 && status < 400 ? 35 : 10) + (hasViewport ? 35 : 10) + (html.length < 250000 ? 30 : 15)),
    trustScore: Math.min(100, (lower.includes("privacy") ? 25 : 10) + (lower.includes("contact") ? 25 : 10) + (https ? 25 : 5) + (hasForm ? 25 : 10))
  };
}

async function saveAudit(doc) {
  if (!process.env.SANITY_WRITE_TOKEN) return false;
  const response = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}` },
    body: JSON.stringify({ mutations: [{ create: doc }] })
  });
  return response.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed." });
  let body = {};
  try { body = await readJsonBody(req); } catch (error) { return send(res, 400, { ok: false, error: "Invalid JSON payload." }); }
  const websiteUrl = sanitize(body.websiteUrl, 240);
  const email = sanitize(body.email, 180).toLowerCase();
  const businessName = sanitize(body.businessName, 140);
  if (!websiteUrl || !isValidEmail(email) || !businessName) return send(res, 400, { ok: false, error: "Website, email, and business name are required." });

  let target = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  let html = "";
  let status = 0;
  try {
    const response = await fetch(target, { redirect: "follow" });
    status = response.status;
    html = await response.text();
  } catch (error) {
    html = "";
  }
  const scores = html ? scoreHtml(target, html, status) : { leadCaptureScore: 45, conversionScore: 42, seoBasicsScore: 40, speedUxScore: 40, trustScore: 38 };
  const result = {
    _type: "websiteAudit",
    websiteUrl: target,
    email,
    businessName,
    submissionDate: new Date().toISOString(),
    ...scores,
    summary: html ? "Automated heuristic audit completed. Scores are directional only." : "Fallback checklist audit created because the site could not be fetched reliably."
  };
  await saveAudit(result).catch(() => false);
  return send(res, 200, { ok: true, audit: result, calendlyUrl: process.env.CALENDLY_URL || "https://calendly.com/leadhound26" });
};
