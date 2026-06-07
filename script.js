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
  setText(".footer .contact-line:first-of-type", content.site.email);
  setText(".footer .contact-line:nth-of-type(2)", content.site.phone);
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

const leadForm = document.querySelector("[data-lead-form]");
const formStatus = document.querySelector(".form-status");

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leadForm);

  try {
    formStatus.textContent = "Sending...";
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    });
    if (!response.ok) throw new Error("Submission failed.");
    leadForm.reset();
    formStatus.textContent = "Thanks. Your enquiry has been sent.";
  } catch (error) {
    formStatus.textContent = "Could not submit here. Please email support@leadhound.com.au.";
  }
});
