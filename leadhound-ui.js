(function () {
  const calendlyFallback = "https://calendly.com/leadhound26";
  const sessionKey = "leadhound_chat_session";
  const cacheKey = "leadhound_chat_cache";
  const quickDelay = 140;
  let calendlyUrl = calendlyFallback;
  let history = [];
  let responseCache = {};
  let isSending = false;
  let lastSubmitAt = 0;
  const renderedActions = new Set();

  const actionLibrary = {
    book: { label: "Book Free Strategy Call", type: "calendly" },
    roi: { label: "Calculate ROI", href: "/roi-calculator" },
    getStarted: { label: "Get Started", href: "/get-started" },
    services: { label: "View Services", href: "/#services" },
    sales: { label: "Speak To Sales", href: "mailto:sales@leadhound.net" }
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const createMessage = (role, content, actions = []) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    actions
  });

  const cloneActions = (...keys) => keys.map((key) => ({ ...actionLibrary[key] })).filter(Boolean);

  const track = (eventName, params = {}) => {
    window.leadhoundEvents = window.leadhoundEvents || [];
    window.leadhoundEvents.push({ event: eventName, ...params });
    window.LeadHoundAnalytics?.track?.(eventName, params);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  };

  function stripRawUrls(value) {
    return String(value || "")
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+\./g, ".")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function loadConfig() {
    try {
      const response = await fetch("/api/public-config", { cache: "no-store" });
      const config = response.ok ? await response.json() : {};
      calendlyUrl = config.calendlyUrl || calendlyFallback;
    } catch (error) {
      calendlyUrl = calendlyFallback;
    }
  }

  function ensureCalendlyModal() {
    if (document.querySelector("[data-calendly-modal]")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="calendly-modal" data-calendly-modal hidden>
        <div class="calendly-dialog" role="dialog" aria-modal="true" aria-label="Book a free LeadHound strategy call">
          <div class="calendly-head">
            <h2>Book Free Strategy Call</h2>
            <button type="button" aria-label="Close Calendly booking" data-calendly-close>&times;</button>
          </div>
          <div class="calendly-loading" data-calendly-loading>Loading booking calendar...</div>
          <iframe title="LeadHound Calendly booking" data-calendly-frame loading="lazy"></iframe>
          <p class="calendly-fallback">If the calendar does not load, <a href="${calendlyFallback}" target="_blank" rel="noopener" data-calendly-fallback>open Calendly in a new tab</a>.</p>
        </div>
      </div>`
    );
  }

  function openCalendly(event) {
    if (event) event.preventDefault();
    ensureCalendlyModal();
    const modal = document.querySelector("[data-calendly-modal]");
    const frame = document.querySelector("[data-calendly-frame]");
    const fallback = document.querySelector("[data-calendly-fallback]");
    const loading = document.querySelector("[data-calendly-loading]");
    if (!modal || !frame) {
      window.open(calendlyUrl, "_blank", "noopener");
      return;
    }
    if (fallback) fallback.href = calendlyUrl;
    if (loading) {
      loading.hidden = false;
      loading.textContent = "Loading booking calendar...";
    }
    frame.onload = () => {
      if (loading) loading.hidden = true;
    };
    frame.onerror = () => {
      if (loading) loading.textContent = "Opening Calendly in a new tab...";
      window.open(calendlyUrl, "_blank", "noopener");
    };
    frame.src = calendlyUrl;
    modal.hidden = false;
    document.body.classList.add("has-modal");
    document.querySelector("[data-calendly-close]")?.focus();
    track("calendly_popup_opened");
  }

  function closeCalendly() {
    const modal = document.querySelector("[data-calendly-modal]");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("has-modal");
    const frame = document.querySelector("[data-calendly-frame]");
    if (frame) frame.src = "about:blank";
    track("calendly_popup_closed");
  }

  function shouldCalendlyIntercept(link) {
    const text = normalize(link.textContent);
    const href = link.getAttribute("href") || "";
    return (
      link.hasAttribute("data-calendly-link") ||
      link.hasAttribute("data-roi-cta") ||
      href.includes("calendly.com") ||
      text.includes("book free strategy call") ||
      text.includes("book your strategy call") ||
      text.includes("book a strategy call")
    );
  }

  function wireCalendly() {
    document.addEventListener("click", (event) => {
      const close = event.target.closest("[data-calendly-close]");
      if (close || event.target.matches("[data-calendly-modal]")) {
        closeCalendly();
        return;
      }
      const fallback = event.target.closest("[data-calendly-fallback]");
      if (fallback) {
        track("calendly_booking_clicked");
        return;
      }
      const link = event.target.closest("a");
      if (!link || !shouldCalendlyIntercept(link)) return;
      track("calendly_booking_clicked", { label: link.textContent.trim() });
      openCalendly(event);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCalendly();
    });
  }

  function assistantMarkup() {
    return `<div class="assistant-header">
        <div><strong>LeadHound AI Assistant</strong><span>Ask about leads, ROI, pricing, or booking.</span></div>
        <button type="button" aria-label="Minimize assistant" data-assistant-close>&minus;</button>
      </div>
      <div class="assistant-messages" data-assistant-messages aria-live="polite"></div>
      <div class="assistant-typing" data-assistant-typing hidden><span></span><span></span><span></span> LeadHound is typing...</div>
      <form class="assistant-form" data-assistant-form>
        <label class="sr-only" for="assistant-message">Message LeadHound AI Assistant</label>
        <textarea id="assistant-message" name="message" rows="2" placeholder="Ask a question..."></textarea>
        <button class="btn btn-primary" type="submit">Send</button>
      </form>
      <div class="assistant-shortcuts" aria-label="Suggested LeadHound questions">
        <button type="button" data-assistant-prompt="What services do you offer?">What services do you offer?</button>
        <button type="button" data-assistant-prompt="How much do leads cost?">How much do leads cost?</button>
        <button type="button" data-assistant-prompt="Calculate ROI">Calculate ROI</button>
        <button type="button" data-assistant-prompt="Book a strategy call">Book a strategy call</button>
        <button type="button" data-assistant-prompt="Speak to sales">Speak to sales</button>
      </div>`;
  }

  function ensureAssistant() {
    if (document.querySelector("[data-assistant]")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="assistant-widget" data-assistant>
        <button class="assistant-toggle" type="button" aria-expanded="false" aria-controls="leadhound-assistant-panel" data-assistant-toggle>LeadHound AI</button>
        <section class="assistant-panel" id="leadhound-assistant-panel" aria-label="LeadHound AI Assistant">
          ${assistantMarkup()}
        </section>
      </div>`
    );
  }

  function normalizeExistingAssistant() {
    const widget = document.querySelector("[data-assistant]");
    if (!widget) return;
    const panel = widget.querySelector(".assistant-panel");
    if (!panel || widget.querySelector(".assistant-header")) return;
    panel.innerHTML = assistantMarkup();
  }

  function actionsHtml(item) {
    const actions = Array.isArray(item.actions) ? item.actions : [];
    if (!actions.length) return "";
    return `<div class="assistant-actions">${actions
      .map((action) => {
        if (action.type === "calendly") {
          const key = `${item.id}-${action.label}`;
          if (!renderedActions.has(key)) {
            renderedActions.add(key);
            track("calendly_button_rendered", { source: "assistant" });
          }
          return `<button type="button" class="assistant-action" data-assistant-action="calendly">${escapeHtml(action.label)}</button>`;
        }
        return `<a class="assistant-action" href="${escapeHtml(action.href || "/get-started")}" data-assistant-action="link">${escapeHtml(action.label)}</a>`;
      })
      .join("")}</div>`;
  }

  function renderAssistant() {
    const messages = document.querySelector("[data-assistant-messages]");
    if (!messages) return;
    messages.innerHTML = history
      .map((item) => {
        const role = item.role === "user" ? "user" : "assistant";
        const content = stripRawUrls(item.content);
        return `<div class="assistant-message ${role}"><p>${escapeHtml(content).replace(/\n/g, "<br>")}</p>${role === "assistant" ? actionsHtml(item) : ""}</div>`;
      })
      .join("");
    messages.scrollTop = messages.scrollHeight;
    sessionStorage.setItem(sessionKey, JSON.stringify(history.slice(-18)));
  }

  function setSending(value) {
    isSending = value;
    const typing = document.querySelector("[data-assistant-typing]");
    const button = document.querySelector("[data-assistant-form] button[type='submit']");
    if (typing) typing.hidden = !value;
    if (button) button.disabled = value;
  }

  function localResponseFor(message) {
    const text = normalize(message);
    if (/price|pricing|cost|how much|budget|cpl/.test(text)) {
      return {
        answer: "Pricing depends on your industry, lead volume, and campaign type. The fastest way to get accurate numbers is a free Lead Strategy Call.",
        actions: cloneActions("book", "roi")
      };
    }
    if (/service|offer|what do you do|pay per lead|appointment|crm|lead list|lead funnel/.test(text)) {
      return {
        answer: "LeadHound helps Australian businesses with pay per lead campaigns, appointment booking, CRM setup and routing, lead lists, lead funnels, ROI planning, and website audits.",
        actions: cloneActions("services", "getStarted", "book")
      };
    }
    if (/book|strategy call|calendly|meeting|call/.test(text)) {
      return {
        answer: "You can book a free Lead Strategy Call and we will map your industry, target volume, budget, funnel type, and next best step.",
        actions: cloneActions("book", "getStarted")
      };
    }
    if (/contact|sales|phone|email|speak/.test(text)) {
      return {
        answer: "You can speak to LeadHound sales by email at sales@leadhound.net or phone on 0404 243 378. For the fastest next step, book a free Lead Strategy Call.",
        actions: cloneActions("book", "sales")
      };
    }
    if (/roi|calculator|return|profit|revenue/.test(text)) {
      return {
        answer: "Use the LeadHound ROI calculator to estimate monthly leads, customers, revenue, profit, ROI percentage, and cost per acquisition in Australian dollars.",
        actions: cloneActions("roi", "book")
      };
    }
    if (/industry|mortgage|finance|solar|legal|insurance|real estate|tradie|trades|ecommerce/.test(text)) {
      return {
        answer: "LeadHound supports mortgage and finance, solar, legal, insurance, real estate, trades, ecommerce, and B2B service businesses with industry-specific lead funnels.",
        actions: cloneActions("services", "getStarted", "book")
      };
    }
    if (/how.*work|process|what happens|next step|lead process/.test(text)) {
      return {
        answer: "The process is simple: map the offer, build the funnel, capture and qualify enquiries, route leads into your workflow, then optimise around lead quality and ROI.",
        actions: cloneActions("getStarted", "book")
      };
    }
    return null;
  }

  function inferActions(message, answer) {
    const text = normalize(`${message} ${answer}`);
    if (/price|pricing|cost|budget|call|book|calendly/.test(text)) return cloneActions("book", "roi");
    if (/roi|calculator|profit|revenue/.test(text)) return cloneActions("roi", "book");
    if (/service|offer|industry|mortgage|solar|legal|insurance|real estate|tradie|ecommerce/.test(text)) return cloneActions("services", "getStarted");
    if (/contact|sales|phone|email/.test(text)) return cloneActions("sales", "book");
    return cloneActions("getStarted", "book");
  }

  function loadCache() {
    try {
      responseCache = JSON.parse(sessionStorage.getItem(cacheKey) || "{}");
    } catch (error) {
      responseCache = {};
    }
  }

  function saveCache() {
    sessionStorage.setItem(cacheKey, JSON.stringify(responseCache));
  }

  async function remoteAssistant(message) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: history.slice(-8) })
      });
      const result = await response.json();
      const answer = stripRawUrls(result.answer || "I can help with services, ROI, lead costs, and booking a strategy call.");
      return { answer, actions: Array.isArray(result.actions) && result.actions.length ? result.actions : inferActions(message, answer) };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function askAssistant(message) {
    const normalized = normalize(message);
    const now = Date.now();
    if (!normalized || isSending || now - lastSubmitAt < 450) return;
    lastSubmitAt = now;
    history.push(createMessage("user", message));
    renderAssistant();
    setSending(true);
    try {
      let response = localResponseFor(message);
      if (response) {
        await wait(quickDelay);
      } else if (responseCache[normalized]) {
        response = responseCache[normalized];
        await wait(quickDelay);
      } else {
        response = await remoteAssistant(message);
        responseCache[normalized] = response;
        saveCache();
      }
      history.push(createMessage("assistant", response.answer, response.actions || inferActions(message, response.answer)));
      if (/book|call|speak|sales|start|get leads/i.test(message)) track("chatbot_lead_intent_detected");
    } catch (error) {
      history.push(
        createMessage(
          "assistant",
          "I can help with LeadHound services, ROI, lead costs, and booking. The fastest next step is a free Lead Strategy Call.",
          cloneActions("book", "services", "roi")
        )
      );
    } finally {
      setSending(false);
      renderAssistant();
    }
  }

  function wireAssistant() {
    ensureAssistant();
    normalizeExistingAssistant();
    loadCache();
    try {
      history = JSON.parse(sessionStorage.getItem(sessionKey) || "[]");
    } catch (error) {
      history = [];
    }
    if (!history.length) {
      history = [
        createMessage(
          "assistant",
          "Hi, I am the LeadHound AI Assistant. Ask me about lead generation, ROI, industry funnels, lead costs, or booking a strategy call.",
          cloneActions("services", "roi", "book")
        )
      ];
    }
    renderAssistant();

    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-assistant-toggle]");
      const close = event.target.closest("[data-assistant-close]");
      const prompt = event.target.closest("[data-assistant-prompt]");
      const action = event.target.closest("[data-assistant-action]");
      const widget = document.querySelector("[data-assistant]");
      if (toggle && widget) {
        const isOpen = widget.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
          document.querySelector("[data-assistant-form] textarea")?.focus();
          track("chatbot_opened");
        }
      }
      if (close && widget) {
        widget.classList.remove("is-open");
        document.querySelector("[data-assistant-toggle]")?.setAttribute("aria-expanded", "false");
      }
      if (prompt) askAssistant(prompt.dataset.assistantPrompt);
      if (action) {
        track("assistant_action_clicked", { label: action.textContent.trim() });
        if (action.dataset.assistantAction === "calendly") {
          track("calendly_booking_clicked", { source: "assistant" });
          openCalendly(event);
        }
      }
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-assistant-form]");
      if (!form) return;
      event.preventDefault();
      const input = form.elements.message;
      const message = input.value.trim();
      input.value = "";
      askAssistant(message);
    });

    document.addEventListener("keydown", (event) => {
      const textarea = event.target.closest("[data-assistant-form] textarea");
      if (!textarea || event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      textarea.closest("form")?.requestSubmit();
    });
  }

  loadConfig().then(() => {
    wireCalendly();
    wireAssistant();
  });
})();
