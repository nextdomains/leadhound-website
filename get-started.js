const form = document.querySelector("[data-funnel-form]");
const steps = Array.from(document.querySelectorAll(".form-step"));
const nextButton = document.querySelector("[data-next]");
const backButton = document.querySelector("[data-back]");
const submitButton = document.querySelector("[data-submit]");
const errorBox = document.querySelector("[data-form-error]");
const progressBar = document.querySelector("[data-progress-bar]");
const stepLabel = document.querySelector("[data-step-label]");
const progressPercent = document.querySelector("[data-progress-percent]");
const reviewSummary = document.querySelector("[data-review-summary]");
const thankYou = document.querySelector("[data-thank-you]");
const calendlyLink = document.querySelector("[data-calendly-link]");
const strategyReport = document.querySelector("[data-strategy-report]");
let currentStep = 0;
let publicConfig = {};
let formStarted = false;

const fields = [
  "firstName",
  "lastName",
  "businessName",
  "website",
  "industry",
  "leadType",
  "monthlyLeadTarget",
  "monthlyAdSpend",
  "email",
  "phone",
  "preferredContactMethod",
  "bestTimeToContact",
  "message"
];

function track(eventName, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
  if (typeof window.gtag === "function") window.gtag("event", eventName, params);
  if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, params);
}

async function loadPublicConfig() {
  try {
    const response = await fetch("/api/public-config", { cache: "no-store" });
    publicConfig = response.ok ? await response.json() : {};
    if (publicConfig.calendlyUrl) calendlyLink.href = publicConfig.calendlyUrl;
    installAnalytics(publicConfig);
  } catch (error) {
    publicConfig = {};
  }
}

function addScript(src, attrs = {}) {
  const script = document.createElement("script");
  script.src = src;
  Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
  document.head.appendChild(script);
}

function installAnalytics(config) {
  if (config.gtmId) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`, { async: "" });
  }
  if (config.gaId) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.gaId)}`, { async: "" });
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", config.gaId);
  }
  if (config.metaPixelId) {
    window.fbq = function fbq() {
      window.fbq.queue = window.fbq.queue || [];
      window.fbq.queue.push(arguments);
    };
    window.fbq("init", config.metaPixelId);
    window.fbq("track", "PageView");
    addScript("https://connect.facebook.net/en_US/fbevents.js", { async: "" });
  }
}

function fieldValue(name) {
  return form.elements[name]?.value?.trim() || "";
}

function formDataObject() {
  const url = new URL(window.location.href);
  const data = {};
  fields.forEach((name) => {
    data[name] = fieldValue(name);
  });
  data.consent = Boolean(form.elements.consent?.checked);
  data.company = fieldValue("company");
  data.sourcePage = window.location.href;
  data.referrer = document.referrer;
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
    data[key] = url.searchParams.get(key) || "";
  });
  return data;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value) {
  return /^[+\d][\d\s().-]{7,24}$/.test(value);
}

function clearErrors() {
  errorBox.textContent = "";
  form.querySelectorAll(".field-error").forEach((field) => field.classList.remove("field-error"));
}

function markInvalid(name) {
  const field = form.elements[name];
  if (field) field.classList.add("field-error");
}

function validateCurrentStep() {
  clearErrors();
  const requiredByStep = [
    ["firstName", "lastName", "businessName", "industry"],
    ["leadType", "monthlyLeadTarget", "monthlyAdSpend"],
    ["email", "phone", "preferredContactMethod", "bestTimeToContact"],
    ["consent"]
  ];
  const missing = requiredByStep[currentStep].filter((name) => {
    const element = form.elements[name];
    return element?.type === "checkbox" ? !element.checked : !fieldValue(name);
  });
  if (currentStep === 2 && fieldValue("email") && !validateEmail(fieldValue("email"))) missing.push("email");
  if (currentStep === 2 && fieldValue("phone") && !validatePhone(fieldValue("phone"))) missing.push("phone");

  missing.forEach(markInvalid);
  if (missing.length) {
    errorBox.textContent = "Please complete the highlighted fields before continuing.";
    return false;
  }
  return true;
}

function renderReview() {
  const data = formDataObject();
  reviewSummary.innerHTML = [
    ["Name", `${data.firstName} ${data.lastName}`],
    ["Business", data.businessName],
    ["Website", data.website || "Not supplied"],
    ["Industry", data.industry],
    ["Lead Type", data.leadType],
    ["Monthly Target", data.monthlyLeadTarget],
    ["Ad Spend", data.monthlyAdSpend],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Contact", `${data.preferredContactMethod} - ${data.bestTimeToContact}`],
    ["Message", data.message || "Not supplied"]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderStep() {
  steps.forEach((step, index) => step.classList.toggle("is-active", index === currentStep));
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);
  progressBar.style.width = `${percent}%`;
  stepLabel.textContent = `Step ${currentStep + 1} of ${steps.length}`;
  progressPercent.textContent = `${percent}%`;
  backButton.style.display = currentStep === 0 ? "none" : "inline-flex";
  nextButton.style.display = currentStep === steps.length - 1 ? "none" : "inline-flex";
  submitButton.style.display = currentStep === steps.length - 1 ? "inline-flex" : "none";
  if (currentStep === steps.length - 1) renderReview();
}

nextButton.addEventListener("click", () => {
  if (!formStarted) {
    formStarted = true;
    track("form_start");
  }
  if (!validateCurrentStep()) return;
  track("step_completed", { step: currentStep + 1 });
  currentStep = Math.min(currentStep + 1, steps.length - 1);
  renderStep();
});

backButton.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 0);
  clearErrors();
  renderStep();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  try {
    const response = await fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDataObject())
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Submission failed.");
    track("form_submitted", { lead_id: result.leadId, lead_score: result.leadScore });
    form.hidden = true;
    thankYou.hidden = false;
    document.querySelector("[data-lead-result]").textContent = `Your Lead ID is ${result.leadId}. Lead score: ${result.leadScore}.`;
    if (strategyReport && result.strategyReport) {
      strategyReport.hidden = false;
      strategyReport.innerHTML = `
        <h3>Your LeadHound Growth Report</h3>
        <dl>
          <div><dt>Industry</dt><dd>${result.strategyReport.industry || "-"}</dd></div>
          <div><dt>Recommended budget</dt><dd>${result.strategyReport.recommendedMonthlyBudget || "-"}</dd></div>
          <div><dt>Estimated monthly leads</dt><dd>${result.strategyReport.estimatedMonthlyLeads || "-"}</dd></div>
          <div><dt>Recommended channels</dt><dd>${(result.strategyReport.recommendedChannels || []).join(", ")}</dd></div>
          <div><dt>Suggested funnel</dt><dd>${result.strategyReport.suggestedFunnelType || "-"}</dd></div>
          <div><dt>Next action</dt><dd>${result.strategyReport.nextBestAction || "-"}</dd></div>
        </dl>
      `;
      track("strategy_report_generated", { lead_id: result.leadId, lead_score: result.leadScore });
    }
    if (result.calendlyUrl) calendlyLink.href = result.calendlyUrl;
  } catch (error) {
    errorBox.textContent = error.message || "Could not submit the form. Please email sales@leadhound.net.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Book My Free Strategy Call";
  }
});

document.querySelectorAll("[data-track='cta_click']").forEach((link) => {
  link.addEventListener("click", () => track("cta_click", { label: link.textContent.trim() }));
});

calendlyLink.addEventListener("click", () => track("calendly_clicked"));

loadPublicConfig();
renderStep();
