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
});
