const rateLimit = new Map();

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
  if (typeof req.body === "object" && req.body) return req.body;
  if (typeof req.body === "string" && req.body) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitize(value, maxLength = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parseNumber(value) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  return Number(cleaned || 0);
}

function targetValue(value) {
  const text = String(value || "");
  if (text.includes("100+")) return 100;
  const matches = text.match(/\d+/g);
  return matches?.length ? Number(matches[matches.length - 1]) : 0;
}

function spendValue(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("20k")) return 20000;
  if (text.includes("5k") && text.includes("20k")) return 5001;
  if (text.includes("1k") && text.includes("5k")) return 1000;
  return parseNumber(value);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^[+\d][\d\s().-]{7,24}$/.test(value);
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function checkRateLimit(req) {
  const key = clientIp(req);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const max = 5;
  const current = rateLimit.get(key) || [];
  const recent = current.filter((time) => now - time < windowMs);
  recent.push(now);
  rateLimit.set(key, recent);
  return recent.length <= max;
}

function requiredEnv() {
  return ["RESEND_API_KEY", "LEAD_NOTIFICATION_EMAIL", "CALENDLY_URL", "SANITY_WRITE_TOKEN"].filter(
    (name) => !process.env[name]
  );
}

function scoreLead(data) {
  const hasWebsite = Boolean(data.website);
  const spend = spendValue(data.monthlyAdSpend);
  const target = targetValue(data.monthlyLeadTarget);

  if (hasWebsite && spend > 5000 && target > 50) return "High";
  if (hasWebsite && spend >= 1000 && spend <= 5000) return "Medium";
  return "Low";
}

function growthReport(data, leadScore) {
  const spend = spendValue(data.monthlyAdSpend);
  const target = targetValue(data.monthlyLeadTarget);
  const industry = data.industry || "General";
  const channels = ["Landing Pages", "CRM Automation"];

  if (["Mortgage & Finance", "Legal", "Insurance"].includes(industry)) channels.unshift("Google Ads");
  if (["Solar", "Real Estate", "Trades", "Ecommerce"].includes(industry)) channels.unshift("Meta Ads");
  if (spend >= 5000) channels.push("Retargeting");
  if (target >= 50) channels.push("SEO");

  return {
    industry,
    recommendedMonthlyBudget: spend >= 5000 ? data.monthlyAdSpend : "$1k-$5k",
    estimatedMonthlyLeads: target || "25-50",
    recommendedChannels: Array.from(new Set(channels)),
    suggestedFunnelType: data.leadType === "Not Sure" ? "Pay Per Lead discovery funnel" : `${data.leadType} funnel`,
    leadScore,
    nextBestAction: leadScore === "High" ? "Book a strategy call and map campaign launch priorities." : "Book a strategy call to refine targeting, budget, and lead quality rules."
  };
}

async function sanityRequest(query, params = {}) {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}`
    },
    body: JSON.stringify({ query, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.description || "Sanity query failed.");
  return payload.result;
}

async function createLeadId() {
  const year = new Date().getFullYear();
  const latest = await sanityRequest(
    '*[_type == "lead" && leadId match $prefix] | order(leadId desc)[0].leadId',
    { prefix: `LH-${year}-*` }
  );
  const next = latest ? Number(String(latest).split("-").pop()) + 1 : 1;
  return `LH-${year}-${String(next).padStart(6, "0")}`;
}

async function createLeadDocument(doc) {
  const response = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}`
    },
    body: JSON.stringify({ mutations: [{ create: doc }] })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.description || "Sanity lead create failed.");
}

function emailHtml(title, rows, calendlyUrl) {
  const body = rows
    .map(([label, value]) => `<tr><td style="padding:8px 12px;color:#5b6672">${label}</td><td style="padding:8px 12px;color:#111820;font-weight:700">${value || "-"}</td></tr>`)
    .join("");
  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#111820">
      <h1 style="color:#05070b">${title}</h1>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde3eb">${body}</table>
      ${calendlyUrl ? `<p style="margin-top:24px"><a href="${calendlyUrl}" style="background:#006cff;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Book a strategy call</a></p>` : ""}
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
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
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Resend email failed.");
  return payload;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed." });

  const missing = requiredEnv();
  if (missing.length) return send(res, 500, { ok: false, error: `Missing required environment variables: ${missing.join(", ")}` });
  if (!checkRateLimit(req)) return send(res, 429, { ok: false, error: "Too many submissions. Please try again later." });

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return send(res, 400, { ok: false, error: "Invalid JSON payload." });
  }

  if (sanitize(body.company, 100)) {
    return send(res, 200, { ok: true, spam: true });
  }

  const data = {
    firstName: sanitize(body.firstName, 80),
    lastName: sanitize(body.lastName, 80),
    businessName: sanitize(body.businessName, 140),
    website: sanitize(body.website, 220),
    industry: sanitize(body.industry, 120),
    leadType: sanitize(body.leadType, 120),
    monthlyLeadTarget: sanitize(body.monthlyLeadTarget, 80),
    monthlyAdSpend: sanitize(body.monthlyAdSpend, 80),
    email: sanitize(body.email, 180).toLowerCase(),
    phone: sanitize(body.phone, 40),
    preferredContactMethod: sanitize(body.preferredContactMethod, 80),
    bestTimeToContact: sanitize(body.bestTimeToContact, 120),
    message: sanitize(body.message, 1500),
    consent: Boolean(body.consent),
    sourcePage: sanitize(body.sourcePage, 240),
    referrer: sanitize(body.referrer, 240),
    utmSource: sanitize(body.utm_source, 120),
    utmMedium: sanitize(body.utm_medium, 120),
    utmCampaign: sanitize(body.utm_campaign, 120),
    utmContent: sanitize(body.utm_content, 120),
    utmTerm: sanitize(body.utm_term, 120),
    userAgent: sanitize(req.headers["user-agent"], 300)
  };

  const errors = [];
  ["firstName", "lastName", "businessName", "industry", "leadType", "monthlyLeadTarget", "monthlyAdSpend", "email", "phone", "preferredContactMethod", "bestTimeToContact"].forEach((field) => {
    if (!data[field]) errors.push(field);
  });
  if (!data.consent) errors.push("consent");
  if (!isValidEmail(data.email)) errors.push("email");
  if (!isValidPhone(data.phone)) errors.push("phone");
  if (errors.length) return send(res, 400, { ok: false, error: "Please check the required fields.", fields: errors });

  try {
    const leadId = await createLeadId();
    const submissionDate = new Date().toISOString();
    const leadScore = scoreLead(data);
    const strategyReport = growthReport(data, leadScore);
    const leadDoc = {
      _type: "lead",
      leadId,
      ...data,
      monthlyTarget: data.monthlyLeadTarget,
      submissionDate,
      leadStatus: "New",
      leadScore,
      strategyReport
    };
    delete leadDoc.monthlyLeadTarget;

    await createLeadDocument(leadDoc);

    const rows = [
      ["Lead ID", leadId],
      ["Lead Score", leadScore],
      ["Name", `${data.firstName} ${data.lastName}`],
      ["Business Name", data.businessName],
      ["Website", data.website],
      ["Industry", data.industry],
      ["Lead Type", data.leadType],
      ["Monthly Target", data.monthlyLeadTarget],
      ["Monthly Ad Spend", data.monthlyAdSpend],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Preferred Contact", data.preferredContactMethod],
      ["Best Time", data.bestTimeToContact],
      ["Message", data.message],
      ["Source Page", data.sourcePage],
      ["Referrer", data.referrer],
      ["UTM", [data.utmSource, data.utmMedium, data.utmCampaign, data.utmContent, data.utmTerm].filter(Boolean).join(" / ")],
      ["Submission Date", submissionDate]
    ];

    const emailStatus = { internal: false, autoReply: false };
    const emailErrors = [];

    try {
      await sendEmail({
        to: process.env.LEAD_NOTIFICATION_EMAIL,
        subject: `New LeadHound Lead - ${data.businessName}`,
        html: emailHtml("New LeadHound Lead", rows, process.env.CALENDLY_URL)
      });
      emailStatus.internal = true;
    } catch (error) {
      emailErrors.push(`Internal email: ${error.message || "failed"}`);
      console.error("LeadHound internal email failed", error);
    }

    try {
      await sendEmail({
        to: data.email,
        subject: "Thanks for contacting LeadHound",
        html: emailHtml(
          "Thanks for contacting LeadHound",
          [
            ["Hi", data.firstName],
            ["Status", "Your enquiry was received."],
            ["Next Step", "A LeadHound team member will contact you shortly."],
            ["Booking Link", process.env.CALENDLY_URL]
          ],
          process.env.CALENDLY_URL
        )
      });
      emailStatus.autoReply = true;
    } catch (error) {
      emailErrors.push(`Auto-reply email: ${error.message || "failed"}`);
      console.error("LeadHound auto-reply email failed", error);
    }

    return send(res, 200, {
      ok: true,
      leadId,
      leadScore,
      strategyReport,
      calendlyUrl: process.env.CALENDLY_URL,
      emailStatus,
      emailWarning: emailErrors.join("; ")
    });
  } catch (error) {
    console.error("LeadHound lead submission failed", error);
    return send(res, 502, { ok: false, error: error.message || "Lead submission failed." });
  }
};
