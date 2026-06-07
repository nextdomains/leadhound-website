const SANITY_PROJECT_ID = "nvlfyhr7";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2026-06-07";

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitize(value, maxLength = 300) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function createDownload(doc) {
  const response = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}`
    },
    body: JSON.stringify({ mutations: [{ create: doc }] })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.description || "Sanity lead magnet create failed.");
}

async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "LeadHound <onboarding@resend.dev>",
      to,
      subject,
      html
    })
  });
  return response.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed." });
  if (!process.env.SANITY_WRITE_TOKEN) return send(res, 500, { ok: false, error: "Missing required environment variable: SANITY_WRITE_TOKEN" });

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return send(res, 400, { ok: false, error: "Invalid JSON payload." });
  }

  if (sanitize(body.company, 80)) return send(res, 200, { ok: true, spam: true });

  const doc = {
    _type: "leadMagnetDownload",
    magnet: sanitize(body.magnet, 140),
    name: sanitize(body.name, 120),
    email: sanitize(body.email, 180).toLowerCase(),
    businessName: sanitize(body.businessName, 140),
    industry: sanitize(body.industry, 120),
    submissionDate: new Date().toISOString()
  };

  const missing = ["magnet", "name", "email", "businessName", "industry"].filter((field) => !doc[field]);
  if (!isValidEmail(doc.email)) missing.push("email");
  if (missing.length) return send(res, 400, { ok: false, error: "Please complete the required fields.", fields: missing });

  try {
    await createDownload(doc);
    await sendEmail(
      doc.email,
      `Your LeadHound ${doc.magnet}`,
      `<p>Thanks for requesting ${doc.magnet}. A LeadHound team member can help you apply the ideas to your business.</p><p><a href="${process.env.CALENDLY_URL || "https://calendly.com/leadhound26"}">Book a free strategy call</a></p>`
    ).catch(() => false);
    return send(res, 200, { ok: true });
  } catch (error) {
    console.error("LeadHound lead magnet submission failed", error);
    return send(res, 502, { ok: false, error: error.message || "Submission failed." });
  }
};
