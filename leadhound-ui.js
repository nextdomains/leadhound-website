(function () {
  const calendlyFallback = "https://calendly.com/leadhound26";
  const sessionKey = "leadhound_chat_session";
  let calendlyUrl = calendlyFallback;
  let history = [];
  let isSending = false;

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const track = (eventName, params = {}) => {
    window.leadhoundEvents = window.leadhoundEvents || [];
    window.leadhoundEvents.push({ event: eventName, ...params });
    window.LeadHoundAnalytics?.track?.(eventName, params);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  };

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
    if (!modal || !frame) {
      window.open(calendlyUrl, "_blank", "noopener");
      return;
    }
    frame.src = calendlyUrl;
    if (fallback) fallback.href = calendlyUrl;
    modal.hidden = false;
    document.body.classList.add("has-modal");
    document.querySelector("[data-calendly-close]")?.focus();
    track("calendly_popup_opened");
  }

  function closeCalendly() {
    const modal = document.querySelector("[data-calendly-modal]");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("has-modal");
    const frame = document.querySelector("[data-calendly-frame]");
    if (frame) frame.src = "about:blank";
  }

  function shouldCalendlyIntercept(link) {
    const text = link.textContent.toLowerCase();
    const href = link.getAttribute("href") || "";
    return (
      link.hasAttribute("data-calendly-link") ||
      link.hasAttribute("data-roi-cta") ||
      href.includes("calendly.com") ||
      text.includes("book free strategy call") ||
      text.includes("book your strategy call")
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

  function ensureAssistant() {
    if (document.querySelector("[data-assistant]")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="assistant-widget" data-assistant>
        <button class="assistant-toggle" type="button" aria-expanded="false" aria-controls="leadhound-assistant-panel" data-assistant-toggle>LeadHound AI</button>
        <section class="assistant-panel" id="leadhound-assistant-panel" aria-label="LeadHound AI Assistant">
          <div class="assistant-header">
            <div><strong>LeadHound AI Assistant</strong><span>Ask about leads, ROI, pricing, or booking.</span></div>
            <button type="button" aria-label="Minimize assistant" data-assistant-close>&minus;</button>
          </div>
          <div class="assistant-messages" data-assistant-messages aria-live="polite"></div>
          <div class="assistant-typing" data-assistant-typing hidden>LeadHound is typing...</div>
          <form class="assistant-form" data-assistant-form>
            <label class="sr-only" for="assistant-message">Message LeadHound AI Assistant</label>
            <textarea id="assistant-message" name="message" rows="2" placeholder="Ask a question..."></textarea>
            <button class="btn btn-primary" type="submit">Send</button>
          </form>
          <div class="assistant-shortcuts">
            <button type="button" data-assistant-prompt="What services do you offer?">What services do you offer?</button>
            <button type="button" data-assistant-prompt="How much do leads cost?">How much do leads cost?</button>
            <button type="button" data-assistant-prompt="Calculate ROI">Calculate ROI</button>
            <button type="button" data-assistant-prompt="Book a strategy call">Book a strategy call</button>
            <button type="button" data-assistant-prompt="Speak to sales">Speak to sales</button>
          </div>
        </section>
      </div>`
    );
  }

  function normalizeExistingAssistant() {
    const widget = document.querySelector("[data-assistant]");
    if (!widget) return;
    const panel = widget.querySelector(".assistant-panel");
    if (!panel || widget.querySelector(".assistant-header")) return;
    panel.innerHTML = `<div class="assistant-header">
        <div><strong>LeadHound AI Assistant</strong><span>Ask about leads, ROI, pricing, or booking.</span></div>
        <button type="button" aria-label="Minimize assistant" data-assistant-close>&minus;</button>
      </div>
      <div class="assistant-messages" data-assistant-messages aria-live="polite"></div>
      <div class="assistant-typing" data-assistant-typing hidden>LeadHound is typing...</div>
      <form class="assistant-form" data-assistant-form>
        <label class="sr-only" for="assistant-message">Message LeadHound AI Assistant</label>
        <textarea id="assistant-message" name="message" rows="2" placeholder="Ask a question..."></textarea>
        <button class="btn btn-primary" type="submit">Send</button>
      </form>
      <div class="assistant-shortcuts">
        <button type="button" data-assistant-prompt="What services do you offer?">What services do you offer?</button>
        <button type="button" data-assistant-prompt="How much do leads cost?">How much do leads cost?</button>
        <button type="button" data-assistant-prompt="Calculate ROI">Calculate ROI</button>
        <button type="button" data-assistant-prompt="Book a strategy call">Book a strategy call</button>
        <button type="button" data-assistant-prompt="Speak to sales">Speak to sales</button>
      </div>`;
  }

  function renderAssistant() {
    const messages = document.querySelector("[data-assistant-messages]");
    if (!messages) return;
    messages.innerHTML = history
      .map((item) => `<div class="assistant-message ${item.role === "user" ? "user" : "assistant"}"><p>${escapeHtml(item.content).replace(/\n/g, "<br>")}</p></div>`)
      .join("");
    messages.scrollTop = messages.scrollHeight;
    sessionStorage.setItem(sessionKey, JSON.stringify(history.slice(-18)));
  }

  function setTyping(value) {
    const typing = document.querySelector("[data-assistant-typing]");
    if (typing) typing.hidden = !value;
  }

  async function askAssistant(message) {
    if (!message || isSending) return;
    isSending = true;
    history.push({ role: "user", content: message });
    renderAssistant();
    setTyping(true);
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: history.slice(-8) })
      });
      const result = await response.json();
      history.push({ role: "assistant", content: result.answer || "I can help with services, ROI, lead costs, and booking a strategy call." });
      if (/book|call|speak|sales|start|get leads/i.test(message)) track("chatbot_lead_intent_detected");
    } catch (error) {
      history.push({ role: "assistant", content: "I can help with LeadHound services, ROI, lead costs, and booking. The best next step is a free strategy call: " + calendlyUrl });
    } finally {
      isSending = false;
      setTyping(false);
      renderAssistant();
    }
  }

  function wireAssistant() {
    ensureAssistant();
    normalizeExistingAssistant();
    try {
      history = JSON.parse(sessionStorage.getItem(sessionKey) || "[]");
    } catch (error) {
      history = [];
    }
    if (!history.length) {
      history = [{ role: "assistant", content: "Hi, I am the LeadHound AI Assistant. Ask me about lead generation, ROI, industry funnels, lead costs, or booking a strategy call." }];
    }
    renderAssistant();

    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-assistant-toggle]");
      const close = event.target.closest("[data-assistant-close]");
      const prompt = event.target.closest("[data-assistant-prompt]");
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
      const form = textarea.closest("form");
      form?.requestSubmit();
    });
  }

  loadConfig().then(() => {
    wireCalendly();
    wireAssistant();
  });
})();
