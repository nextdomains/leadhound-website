const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");

const updateHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a, .header-actions a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
};

const setHref = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) element.setAttribute("href", value);
};

const trackEvent = (eventName, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
  if (typeof window.gtag === "function") window.gtag("event", eventName, params);
  if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, params);
};

const mergeContent = (base, update) => {
  if (!update || typeof update !== "object") return base;
  const output = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(update).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      output[key] = value.length ? value : output[key];
      return;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      output[key] = mergeContent(output[key] || {}, value);
      return;
    }
    output[key] = value;
  });
  return output;
};

function mapSanityContent(data) {
  if (!data) return null;
  const mapped = {};

  if (data.site) {
    mapped.site = {
      brand: data.site.brand,
      title: data.site.title,
      description: data.site.description,
      email: data.site.email,
      phone: data.site.phone
    };
  }

  if (data.homepage) {
    mapped.hero = data.homepage.hero;
    mapped.stats = data.homepage.stats;
    mapped.leadFunnels = data.homepage.leadFunnels;
    mapped.roi = data.homepage.roi;
  }

  if (data.services) {
    mapped.services = {
      eyebrow: data.services.eyebrow,
      headline: data.services.headline,
      items: data.services.items
    };
  }

  if (data.testimonials) {
    mapped.reviews = {
      eyebrow: data.testimonials.eyebrow,
      headline: data.testimonials.headline,
      body: data.testimonials.body,
      items: data.testimonials.items
    };
  }

  if (data.leadForm) {
    mapped.cta = {
      eyebrow: data.leadForm.eyebrow,
      headline: data.leadForm.headline,
      body: data.leadForm.body,
      button: data.leadForm.button
    };
  }

  return mapped;
}

async function loadSanityContent() {
  const config = window.LEADHOUND_SANITY || {};
  if (!config.projectId || !config.dataset) return null;

  const apiVersion = config.apiVersion || "2026-06-07";
  const host = config.useCdn === false ? "api" : "apicdn";
  const query = `{
    "site": *[_type == "siteSettings"][0],
    "homepage": *[_type == "homepage"][0],
    "services": *[_type == "servicesPage"][0],
    "testimonials": *[_type == "testimonials"][0],
    "leadForm": *[_type == "leadFormSettings"][0]
  }`;
  const url = `https://${config.projectId}.${host}.sanity.io/v${apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Sanity request failed: ${response.status}`);
  const payload = await response.json();
  return mapSanityContent(payload.result);
}

function renderContent(content) {
  if (!content || !content.site) return;

  document.title = content.site.title || document.title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && content.site.description) {
    metaDescription.setAttribute("content", content.site.description);
  }

  document.querySelectorAll(".brand-logo").forEach((logo) => {
    logo.alt = content.site.brand || "LeadHound";
  });

  setText(".hero .eyebrow", content.hero?.eyebrow);
  setText(".hero h1", content.hero?.headline);
  setText(".hero-text", content.hero?.body);
  setText(".hero-actions .btn-primary", content.hero?.primaryCta);
  setText(".hero-actions .btn-secondary", content.hero?.secondaryCta);

  const badges = document.querySelector(".hero-badges");
  if (badges && Array.isArray(content.hero?.badges)) {
    badges.innerHTML = content.hero.badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("");
  }

  const proof = document.querySelector(".proof-band");
  if (proof && Array.isArray(content.stats)) {
    proof.innerHTML = content.stats
      .map((stat) => `
        <div class="stat">
          <strong>${escapeHtml(stat.value)}</strong>
          <span>${escapeHtml(stat.label)}</span>
        </div>
      `)
      .join("");
  }

  setText(".intro-section .eyebrow", content.intro?.eyebrow);
  setText(".intro-section h2", content.intro?.headline);
  setText(".intro-section .section-heading p:not(.eyebrow)", content.intro?.body);

  const featureGrid = document.querySelector(".intro-section .feature-grid");
  if (featureGrid && Array.isArray(content.intro?.features)) {
    featureGrid.innerHTML = content.intro.features
      .map((feature, index) => `
        <article class="feature-card">
          <span class="icon ${index === 1 ? "blue" : index === 2 ? "amber" : ""}">${escapeHtml(feature.number)}</span>
          <h3>${escapeHtml(feature.title)}</h3>
          <p>${escapeHtml(feature.body)}</p>
        </article>
      `)
      .join("");
  }

  setText(".platform .eyebrow", content.platform?.eyebrow);
  setText(".platform h2", content.platform?.headline);
  setText(".platform .copy-block > p:not(.eyebrow)", content.platform?.body);
  setText(".platform .btn-dark", content.platform?.cta);

  const bullets = document.querySelector(".platform .check-list");
  if (bullets && Array.isArray(content.platform?.bullets)) {
    bullets.innerHTML = content.platform.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  setText(".services .eyebrow", content.services?.eyebrow);
  setText(".services h2", content.services?.headline);

  const serviceGrid = document.querySelector(".service-grid");
  if (serviceGrid && Array.isArray(content.services?.items)) {
    serviceGrid.innerHTML = content.services.items
      .map((item) => `
        <article>
          <span>${escapeHtml(item.tag)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.body)}</p>
        </article>
      `)
      .join("");
  }

  setText(".funnel-section .eyebrow", content.leadFunnels?.eyebrow);
  setText(".funnel-section h2", content.leadFunnels?.headline);
  setText(".funnel-section .section-heading p:not(.eyebrow)", content.leadFunnels?.body);

  const funnelGrid = document.querySelector(".funnel-grid");
  if (funnelGrid && Array.isArray(content.leadFunnels?.steps)) {
    funnelGrid.innerHTML = content.leadFunnels.steps
      .map((step) => `
        <article>
          <span>${escapeHtml(step.number)}</span>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.body)}</p>
        </article>
      `)
      .join("");
  }

  setText(".roi-section .eyebrow", content.roi?.eyebrow);
  setText(".roi-section h2", content.roi?.headline);
  setText(".roi-section .section-heading p:not(.eyebrow)", content.roi?.subtext);
  setText(".roi-cta h3", content.roi?.ctaText);
  setText(".roi-disclaimer", content.roi?.disclaimer);

  const logoRow = document.querySelector(".partners-section .logo-row");
  if (logoRow && Array.isArray(content.partners)) {
    logoRow.innerHTML = content.partners.map((partner) => `<span>${escapeHtml(partner)}</span>`).join("");
  }

  setText(".pricing .eyebrow", content.pricing?.eyebrow);
  setText(".pricing h2", content.pricing?.headline);
  setText(".pricing .section-heading p:not(.eyebrow)", content.pricing?.body);

  const pricingGrid = document.querySelector(".pricing-grid");
  if (pricingGrid && Array.isArray(content.pricing?.plans)) {
    pricingGrid.innerHTML = content.pricing.plans
      .map((plan) => `
        <article class="price-card ${plan.featured ? "featured" : ""}">
          ${plan.featured ? '<span class="badge">Most popular</span>' : ""}
          <h3>${escapeHtml(plan.name)}</h3>
          <p>${escapeHtml(plan.description)}</p>
          <strong>${escapeHtml(plan.price)}</strong>
          <ul>${(plan.features || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <a class="btn ${plan.featured ? "btn-light" : "btn-secondary"}" href="#contact">${escapeHtml(plan.cta)}</a>
        </article>
      `)
      .join("");
  }

  setText(".reviews .eyebrow", content.reviews?.eyebrow);
  setText(".reviews h2", content.reviews?.headline);
  setText(".review-intro p:not(.eyebrow)", content.reviews?.body);

  const reviewStack = document.querySelector(".review-stack");
  if (reviewStack && Array.isArray(content.reviews?.items)) {
    reviewStack.innerHTML = content.reviews.items
      .map((review) => `
        <article class="testimonial">
          <img src="${escapeHtml(review.image)}" alt="${escapeHtml(review.name)}">
          <div>
            <h3>${escapeHtml(review.name)}</h3>
            <p class="role">${escapeHtml(review.role)}</p>
            <blockquote>${escapeHtml(review.quote)}</blockquote>
          </div>
        </article>
      `)
      .join("");
  }

  setText(".insight-section .eyebrow", content.insights?.eyebrow);
  setText(".insight-section h2", content.insights?.headline);

  const blogGrid = document.querySelector(".blog-grid");
  if (blogGrid && Array.isArray(content.insights?.items)) {
    blogGrid.innerHTML = content.insights.items
      .map((item) => `
        <article class="blog-card" style="--image:url('${escapeHtml(item.image)}')">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.tag)}</p>
          </div>
        </article>
      `)
      .join("");
  }

  setText(".faq .eyebrow", content.faq?.eyebrow);
  setText(".faq h2", content.faq?.headline);

  const faqList = document.querySelector(".faq-list");
  if (faqList && Array.isArray(content.faq?.items)) {
    faqList.innerHTML = content.faq.items
      .map((item) => `
        <details>
          <summary>${escapeHtml(item.question)}</summary>
          <p>${escapeHtml(item.answer)}</p>
        </details>
      `)
      .join("");
  }

  setText(".cta-card .eyebrow", content.cta?.eyebrow);
  setText(".cta-card h2", content.cta?.headline);
  setText(".cta-card > div:first-child > p:not(.eyebrow)", content.cta?.body);
  setText(".cta-card .btn-light", content.cta?.button);

  setText(".footer p", content.footer?.body);
  const contactLines = document.querySelectorAll(".footer .contact-line");
  if (contactLines[0] && content.site.email) contactLines[0].textContent = content.site.email;
  if (contactLines[1] && content.site.phone) contactLines[1].textContent = content.site.phone;
  setText(".footer-bottom span", `(c) ${content.footer?.copyright || "LeadHound 2026. All Rights Reserved."}`);
}

async function loadCmsContent() {
  try {
    let fallbackContent = null;
    const apiResponse = await fetch("/api/content", { cache: "no-store" }).catch(() => null);
    if (apiResponse?.ok) {
      fallbackContent = await apiResponse.json();
    } else {
      const staticResponse = await fetch("content.json", { cache: "no-store" }).catch(() => null);
      fallbackContent = staticResponse?.ok ? await staticResponse.json() : null;
    }
    const sanityContent = await loadSanityContent().catch(() => null);
    renderContent(mergeContent(fallbackContent || {}, sanityContent));
  } catch (error) {
    // The static fallback remains usable when opened directly from the file system.
  }
}

loadCmsContent();

const roiSection = document.querySelector("[data-roi-section]");
const roiInputs = Array.from(document.querySelectorAll("[data-roi-field]"));
const roiOutputs = {
  monthlyLeads: document.querySelector('[data-roi-output="monthlyLeads"]'),
  monthlyCustomers: document.querySelector('[data-roi-output="monthlyCustomers"]'),
  monthlyRevenue: document.querySelector('[data-roi-output="monthlyRevenue"]'),
  monthlyProfit: document.querySelector('[data-roi-output="monthlyProfit"]'),
  roiPercent: document.querySelector('[data-roi-output="roiPercent"]'),
  costPerAcquisition: document.querySelector('[data-roi-output="costPerAcquisition"]')
};

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 1
});

const formatAud = (value) => `A$${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)}`;
const formatNumber = (value) => numberFormatter.format(Number.isFinite(value) ? value : 0);

function readRoiValue(field) {
  const input = roiInputs.find((element) => element.dataset.roiField === field && element.type === "number");
  return Number(input?.value || 0);
}

function syncRoiField(field, value) {
  roiInputs
    .filter((element) => element.dataset.roiField === field)
    .forEach((element) => {
      element.value = value;
    });
}

function pulseRoiCards() {
  document.querySelectorAll(".roi-result-card").forEach((card) => {
    card.classList.remove("is-updated");
    window.requestAnimationFrame(() => {
      card.classList.add("is-updated");
      window.setTimeout(() => card.classList.remove("is-updated"), 260);
    });
  });
}

function updateRoiCalculator(changedField) {
  if (!roiInputs.length) return;

  const monthlySpend = readRoiValue("monthlySpend");
  const costPerLead = readRoiValue("costPerLead");
  const conversionRate = readRoiValue("conversionRate") / 100;
  const closeRate = readRoiValue("closeRate") / 100;
  const monthlyLeadTarget = readRoiValue("monthlyLeadTarget");
  const averageCustomerValue = readRoiValue("averageCustomerValue");

  const spendBasedLeads = costPerLead > 0 ? monthlySpend / costPerLead : 0;
  const monthlyLeads = monthlyLeadTarget > 0 ? Math.min(spendBasedLeads, monthlyLeadTarget) : spendBasedLeads;
  const monthlyCustomers = monthlyLeads * conversionRate * closeRate;
  const monthlyRevenue = monthlyCustomers * averageCustomerValue;
  const monthlyProfit = monthlyRevenue - monthlySpend;
  const roiPercent = monthlySpend > 0 ? (monthlyProfit / monthlySpend) * 100 : 0;
  const costPerAcquisition = monthlyCustomers > 0 ? monthlySpend / monthlyCustomers : 0;

  if (roiOutputs.monthlyLeads) roiOutputs.monthlyLeads.textContent = formatNumber(monthlyLeads);
  if (roiOutputs.monthlyCustomers) roiOutputs.monthlyCustomers.textContent = formatNumber(monthlyCustomers);
  if (roiOutputs.monthlyRevenue) roiOutputs.monthlyRevenue.textContent = formatAud(monthlyRevenue);
  if (roiOutputs.monthlyProfit) roiOutputs.monthlyProfit.textContent = formatAud(monthlyProfit);
  if (roiOutputs.roiPercent) roiOutputs.roiPercent.textContent = `${formatNumber(roiPercent)}%`;
  if (roiOutputs.costPerAcquisition) roiOutputs.costPerAcquisition.textContent = formatAud(costPerAcquisition);

  if (changedField) pulseRoiCards();
}

roiInputs.forEach((input) => {
  input.addEventListener("input", () => {
    syncRoiField(input.dataset.roiField, input.value);
    updateRoiCalculator(input.dataset.roiField);
    trackEvent("calculator_input_changed", { field: input.dataset.roiField });
  });
});

if (roiSection && "IntersectionObserver" in window) {
  let roiViewed = false;
  const roiObserver = new IntersectionObserver(
    (entries) => {
      if (!roiViewed && entries.some((entry) => entry.isIntersecting)) {
        roiViewed = true;
        trackEvent("roi_calculator_viewed");
        roiObserver.disconnect();
      }
    },
    { threshold: 0.35 }
  );
  roiObserver.observe(roiSection);
}

document.querySelector("[data-roi-cta]")?.addEventListener("click", () => {
  trackEvent("roi_cta_clicked", { label: "Book Free Strategy Call" });
});

updateRoiCalculator();

document.querySelectorAll("a[href*='calendly.com']").forEach((link) => {
  link.addEventListener("click", () => trackEvent("calendly_clicked"));
});

document.querySelectorAll(".btn").forEach((button) => {
  button.addEventListener("click", () => trackEvent("cta_click", { label: button.textContent.trim() }));
});

const feedItems = Array.from(document.querySelectorAll("[data-social-feed] span"));
if (feedItems.length) {
  let activeFeedIndex = 0;
  window.setInterval(() => {
    feedItems.forEach((item, index) => item.style.opacity = index === activeFeedIndex ? "1" : "0.72");
    activeFeedIndex = (activeFeedIndex + 1) % feedItems.length;
  }, 2600);
}

const leadForm = document.querySelector("[data-lead-form]");
const formStatus = document.querySelector(".form-status");

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leadForm);

  try {
    formStatus.textContent = "Sending...";
    const endpoint = leadForm.getAttribute("action") || "/";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
      mode: "cors"
    });
    if (!response.ok) throw new Error("Submission failed.");
    leadForm.reset();
    formStatus.textContent = "Thanks. Your enquiry has been sent.";
  } catch (error) {
    formStatus.textContent = "Could not submit here. Please email sales@leadhound.net.";
  }
});
