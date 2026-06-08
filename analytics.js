(function () {
  function addScript(src) {
    var script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  window.LeadHoundAnalytics = {
    track: function (eventName, params) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
      if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
      if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, params || {});
    }
  };

  fetch("/api/public-config", { cache: "no-store" })
    .then(function (response) { return response.ok ? response.json() : {}; })
    .then(function (config) {
      if (config.gtmId) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
        addScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(config.gtmId));
      }
      if (config.gaId) {
        addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.gaId));
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", config.gaId);
      }
      if (config.metaPixelId) {
        window.fbq = function () {
          window.fbq.queue = window.fbq.queue || [];
          window.fbq.queue.push(arguments);
        };
        window.fbq("init", config.metaPixelId);
        window.fbq("track", "PageView");
        addScript("https://connect.facebook.net/en_US/fbevents.js");
      }
    })
    .catch(function () {});
})();
