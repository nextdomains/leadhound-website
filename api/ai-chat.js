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

  if (text.includes("price") || text.includes("cost") || text.includes("budget")) {
    return "Pricing depends on your industry, lead volume, and campaign type. The fastest way to get accurate numbers is a free Lead Strategy Call.";
  }
  if (text.includes("service") || text.includes("offer") || text.includes("what do you do")) {
    return "LeadHound helps Australian businesses with pay per lead campaigns, appointment booking, CRM setup and routing, lead lists, lead funnels, ROI planning, and website audits.";
  }
  if (text.includes("mortgage")) return "For mortgage and finance, LeadHound usually recommends Google Ads, SEO, retargeting, landing pages, and CRM automation. The goal is cleaner enquiries, not cold traffic.";
  if (text.includes("solar")) return "For solar, LeadHound can support appointment-focused funnels using Google Ads, Meta Ads, landing pages, and fast routing. The next step is to model budget and appointment volume.";
  if (text.includes("roi")) return "Use the ROI calculator to estimate monthly leads, customers, revenue, profit, ROI, and cost per acquisition in AUD.";
  if (text.includes("book") || text.includes("call") || text.includes("start")) return "Yes. The best next step is a free Lead Strategy Call where LeadHound can map your goals, lead volume, funnel type, and budget.";
  if (text.includes("guarantee")) return "LeadHound does not promise guaranteed results. Results vary by offer, industry, competition, budget, conversion rate, and follow-up speed.";

  return "LeadHound helps Australian businesses generate, qualify, and route higher-quality leads using conversion funnels, appointment booking, CRM setup, lead lists, ROI planning, and strategy reports. What industry are you in?";
}

function localIntentAnswer(message, kb) {
  const text = message.toLowerCase();
  if (/price|pricing|cost|how much|budget|cpl/.test(text)) return fallbackAnswer(message, kb);
  if (/service|offer|what do you do|pay per lead|appointment|crm|lead list|lead funnel/.test(text)) return fallbackAnswer(message, kb);
  if (/book|strategy call|calendly|meeting|call|start/.test(text)) return fallbackAnswer(message, kb);
  if (/roi|calculator|return|profit|revenue/.test(text)) return fallbackAnswer(message, kb);
  if (/contact|sales|phone|email|speak/.test(text)) {
    return "You can speak to LeadHound sales by email at sales@leadhound.net or phone on 0404 243 378. For the fastest next step, book a free Lead Strategy Call.";
  }
  if (/industry|mortgage|finance|solar|legal|insurance|real estate|tradie|trades|ecommerce/.test(text)) {
    return "LeadHound supports mortgage and finance, solar, legal, insurance, real estate, trades, ecommerce, and B2B service businesses with industry-specific lead funnels.";
  }
  if (/how.*work|process|what happens|next step|lead process/.test(text)) {
    return "The process is simple: map the offer, build the funnel, capture and qualify enquiries, route leads into your workflow, then optimise around lead quality and ROI.";
  }
  if (text.includes("guarantee")) return fallbackAnswer(message, kb);
  return null;
}

function actionsFor(message, answer) {
  const text = `${message} ${answer}`.toLowerCase();
  const book = { label: "Book Free Strategy Call", type: "calendly" };
  const roi = { label: "Calculate ROI", href: "/roi-calculator" };
  const start = { label: "Get Started", href: "/get-started" };
  const services = { label: "View Services", href: "/#services" };
  const sales = { label: "Speak To Sales", href: "mailto:sales@leadhound.net" };

  if (/price|pricing|cost|budget|cpl/.test(text)) return [book, roi];
  if (/book|call|calendly|strategy/.test(text)) return [book, start];
  if (/roi|calculator|profit|revenue/.test(text)) return [roi, book];
  if (/contact|sales|phone|email/.test(text)) return [sales, book];
  if (/service|offer|industry|mortgage|solar|legal|insurance|real estate|tradie|trade|ecommerce/.test(text)) return [services, start, book];
  return [start, book];
}

function cleanAnswer(answer) {
  return String(answer || "")
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+\./g, ".")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
          content: `You are the LeadHound AI Assistant. Use only this knowledge base: ${JSON.stringify(kb)}. Keep answers under 90 words, professional, sales-helpful, and honest. Do not invent guarantees, fake clients, fake case studies, legal advice, financial advice, or fixed prices. There is no published LeadHound price list or CPL guarantee in the knowledge base. If asked about cost, say pricing depends on industry, lead type, target volume, market competition, budget, and follow-up capacity, then recommend the ROI calculator and free strategy call. Do not mention specific dollar amounts unless the user supplied them or they are clearly calculator estimates. Do not output raw URLs or Markdown links. Mention the next action in plain words only.`
        },
        ...history.slice(-6),
        { role: "user", content: message }
      ]
    })
  }).finally(() => clearTimeout(timeout));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "AI unavailable");
  const answer = cleanAnswer(payload.choices?.[0]?.message?.content || fallbackAnswer(message, kb));
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
    const localAnswer = localIntentAnswer(message, kb);
    const answer = cleanAnswer(localAnswer || (process.env.OPENROUTER_API_KEY
      ? await openRouterAnswer(message, history, kb)
      : fallbackAnswer(message, kb)));
    return send(res, 200, { ok: true, answer, actions: actionsFor(message, answer), fallback: !process.env.OPENROUTER_API_KEY });
  } catch (error) {
    const answer = cleanAnswer(fallbackAnswer(message, kb));
    return send(res, 200, { ok: true, answer, actions: actionsFor(message, answer), fallback: true });
  }
};
