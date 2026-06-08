document.querySelectorAll("[data-track]").forEach((element) => {
  element.addEventListener("click", () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: element.dataset.track, label: element.textContent.trim() });
  });
});

document.querySelectorAll("[data-magnet-form]").forEach((form) => {
  const status = form.querySelector("[data-status]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    status.textContent = "Sending...";
    try {
      const response = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Submission failed.");
      form.reset();
      status.textContent = "Thanks. Your request has been received. We will follow up with next steps.";
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "lead_magnet_form_submit", magnet: data.magnet });
    } catch (error) {
      status.textContent = error.message || "Could not submit. Please email sales@leadhound.net.";
    }
  });
});

document.querySelector("[data-assistant-toggle]")?.addEventListener("click", () => {
  document.querySelector("[data-assistant]")?.classList.toggle("is-open");
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "chatbot_opened" });
});

const assistantMessages = document.querySelector("[data-assistant-messages]");
const assistantForm = document.querySelector("[data-assistant-form]");
const assistantKey = "leadhound_assistant_messages";
let assistantHistory = [];

function renderAssistant() {
  if (!assistantMessages) return;
  assistantMessages.innerHTML = assistantHistory
    .map((item) => `<div class="assistant-message ${item.role === "user" ? "user" : "assistant"}">${String(item.content).replace(/[<>]/g, "")}</div>`)
    .join("");
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
  localStorage.setItem(assistantKey, JSON.stringify(assistantHistory.slice(-12)));
}

try {
  assistantHistory = JSON.parse(localStorage.getItem(assistantKey) || "[]");
} catch (error) {
  assistantHistory = [];
}
if (!assistantHistory.length) {
  assistantHistory = [{ role: "assistant", content: "Hi, I am the LeadHound AI Assistant. Ask me about lead generation, ROI, industry funnels, or booking a strategy call." }];
}
renderAssistant();

async function askAssistant(message) {
  assistantHistory.push({ role: "user", content: message });
  renderAssistant();
  try {
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: assistantHistory.slice(-8) })
    });
    const result = await response.json();
    assistantHistory.push({ role: "assistant", content: result.answer || "I can help with leads, ROI, and booking a strategy call." });
    if (/book|strategy call|start|get leads/i.test(message)) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "chatbot_lead_intent_detected" });
    }
  } catch (error) {
    assistantHistory.push({ role: "assistant", content: "I can help with LeadHound services, ROI, and booking. The best next step is https://calendly.com/leadhound26." });
  }
  renderAssistant();
}

assistantForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = assistantForm.elements.message;
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  askAssistant(message);
});

document.querySelectorAll("[data-assistant-prompt]").forEach((button) => {
  button.addEventListener("click", () => askAssistant(button.dataset.assistantPrompt));
});

const costRanges = {
  Mortgage: ["A$120 - A$350", "A$6,000 - A$20,000", "Search landing page plus CRM automation"],
  Solar: ["A$70 - A$240", "A$5,000 - A$18,000", "Appointment funnel with Meta and Google Ads"],
  Legal: ["A$90 - A$420", "A$5,000 - A$25,000", "High-intent search funnel"],
  Insurance: ["A$80 - A$260", "A$4,000 - A$16,000", "Comparison-style funnel with follow-up"],
  "Real Estate": ["A$60 - A$220", "A$3,000 - A$14,000", "Seller enquiry funnel with CRM nurturing"],
  Trades: ["A$45 - A$180", "A$2,500 - A$12,000", "Local service landing page and call tracking"],
  Ecommerce: ["A$20 - A$120", "A$2,500 - A$20,000", "Paid social, shopping, and email capture"]
};

function updateCostCalculator() {
  const industry = document.querySelector("[data-cost-industry]")?.value;
  if (!industry || !costRanges[industry]) return;
  const [cpl, budget, funnel] = costRanges[industry];
  const type = document.querySelector("[data-cost-type]")?.value || "Pay Per Lead";
  const state = document.querySelector("[data-cost-state]")?.value || "NSW";
  document.querySelector("[data-cost-cpl]").textContent = `${cpl} per lead`;
  document.querySelector("[data-cost-budget]").textContent = `Suggested monthly budget in ${state}: ${budget}`;
  document.querySelector("[data-cost-funnel]").textContent = `Suggested funnel for ${type}: ${funnel}.`;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "lead_cost_calculator_used", industry, state, type });
}

document.querySelectorAll("[data-cost-industry], [data-cost-state], [data-cost-type]").forEach((input) => {
  input.addEventListener("input", updateCostCalculator);
});
updateCostCalculator();

document.querySelector("[data-audit-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-status]");
  const resultBox = document.querySelector("[data-audit-result]");
  status.textContent = "Running audit...";
  try {
    const response = await fetch("/api/website-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Audit failed.");
    const audit = result.audit;
    resultBox.innerHTML = `<span>Audit result</span><h3>${audit.businessName}</h3><p>${audit.summary}</p><ul><li>Lead Capture: ${audit.leadCaptureScore}/100</li><li>Conversion: ${audit.conversionScore}/100</li><li>SEO Basics: ${audit.seoBasicsScore}/100</li><li>Speed/UX: ${audit.speedUxScore}/100</li><li>Trust: ${audit.trustScore}/100</li></ul><a class="btn btn-primary" href="${result.calendlyUrl}" target="_blank" rel="noopener">Book Free Strategy Call</a>`;
    status.textContent = "Audit complete.";
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "website_audit_submitted" });
  } catch (error) {
    status.textContent = error.message || "Could not run audit.";
  }
});
