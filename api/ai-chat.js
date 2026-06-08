const fs = require("fs");
const path = require("path");

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

function sanitize(value, maxLength = 1200) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function knowledge() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "data", "leadhound-knowledge.json"), "utf8"));
  } catch (error) {
    return {
      brand: "LeadHound",
      contact: { calendly: process.env.CALENDLY_URL || "https://calendly.com/leadhound26" },
      services: ["Pay Per Lead", "Appointment Bookings", "CRM Setup", "Lead Lists"],
      industries: ["Mortgage & Finance", "Solar", "Legal", "Insurance", "Real Estate", "Trades", "Ecommerce"]
    };
  }
}

function fallbackAnswer(message, kb) {
  const text = message.toLowerCase();
  const calendly = process.env.CALENDLY_URL || kb.contact?.calendly || "https://calendly.com/leadhound26";

  if (text.includes("price") || text.includes("cost") || text.includes("budget")) {
    return "Pricing depends on industry, target volume, lead type, and sales capacity. A practical next step is to calculate ROI first, then book a free Lead Strategy Call so LeadHound can map budget and expected CPL. " + calendly;
  }
  if (text.includes("mortgage")) return "For mortgage and finance, LeadHound usually recommends Google Ads, SEO, retargeting, landing pages, and CRM automation. The goal is cleaner enquiries, not cold traffic. Want to book a free strategy call? " + calendly;
  if (text.includes("solar")) return "For solar, LeadHound can support appointment-focused funnels using Google Ads, Meta Ads, landing pages, and fast routing. The next step is to model budget and appointment volume. " + calendly;
  if (text.includes("roi")) return "Use the ROI calculator to estimate monthly leads, customers, revenue, profit, ROI, and cost per acquisition in AUD: https://www.leadhound.net/roi-calculator";
  if (text.includes("book") || text.includes("call") || text.includes("start")) return "Yes. The best next step is a free Lead Strategy Call here: " + calendly;
  if (text.includes("guarantee")) return "LeadHound does not promise guaranteed results. Results vary by offer, industry, competition, budget, conversion rate, and follow-up speed.";

  return "LeadHound helps Australian businesses generate, qualify, and route higher-quality leads using conversion funnels, appointment booking, CRM setup, lead lists, ROI planning, and strategy reports. What industry are you in?";
}

function asksForPricing(message) {
  return /price|pricing|cost|budget|cpl|lead cost|how much/i.test(message);
}

function containsUnverifiedPricing(answer) {
  return /(?:A\$|AUD|\$)\s?\d|\d+\s?(?:dollars|aud|per lead|cpl)/i.test(answer);
}

function isLowQualityAnswer(answer) {
  return !answer || answer.trim().length < 80 || /^user safety\s*:/i.test(answer.trim());
}

async function openRouterAnswer(message, history, kb) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://www.leadhound.net",
      "X-Title": process.env.OPENROUTER_SITE_NAME || "LeadHound"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        {
          role: "system",
          content: `You are the LeadHound AI Assistant. Use only this knowledge base: ${JSON.stringify(kb)}. Keep answers short, professional, sales-helpful, and honest. Do not invent guarantees, fake clients, fake case studies, legal advice, financial advice, or fixed prices. There is no published LeadHound price list or CPL guarantee in the knowledge base. If asked about cost, say pricing depends on industry, lead type, target volume, market competition, budget, and follow-up capacity, then recommend the ROI calculator and free strategy call. Do not mention specific dollar amounts unless the user supplied them or they are clearly calculator estimates. Offer the Calendly booking link when useful.`
        },
        ...history.slice(-6),
        { role: "user", content: message }
      ]
    })
  }).finally(() => clearTimeout(timeout));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "AI unavailable");
  const answer = payload.choices?.[0]?.message?.content || fallbackAnswer(message, kb);
  if (isLowQualityAnswer(answer)) return fallbackAnswer(message, kb);
  if (asksForPricing(message) && containsUnverifiedPricing(answer)) return fallbackAnswer(message, kb);
  return answer;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed." });

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return send(res, 400, { ok: false, error: "Invalid JSON payload." });
  }

  const kb = knowledge();
  const message = sanitize(body.message, 900);
  const history = Array.isArray(body.history)
    ? body.history.map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: sanitize(item.content, 900) }))
    : [];

  if (!message) return send(res, 400, { ok: false, error: "Message is required." });

  try {
    const answer = process.env.OPENROUTER_API_KEY
      ? await openRouterAnswer(message, history, kb)
      : fallbackAnswer(message, kb);
    return send(res, 200, { ok: true, answer, fallback: !process.env.OPENROUTER_API_KEY });
  } catch (error) {
    return send(res, 200, { ok: true, answer: fallbackAnswer(message, kb), fallback: true });
  }
};
