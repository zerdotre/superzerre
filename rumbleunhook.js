// ═══════════════════════════════════
//  superlevels: Rumble Unhook
//  YouTube Unhook, but for rumble.com
// ═══════════════════════════════════
(() => {
  const STYLE_ID = "sl-rumbleunhook";
  const HOME_CLASS = "sl-rumble-home";

  const FEATURE_CSS = {
    homepage: `
      /* Homepage: hide feed entirely (featured banner + every category row) */
      html.${HOME_CLASS} .homepage-featured,
      html.${HOME_CLASS} .homepage-content > *,
      html.${HOME_CLASS} section.homepage-section {
        display: none !important;
      }
      /* Black homepage background with message */
      html.${HOME_CLASS} .homepage-content {
        display: flex !important;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
      }
      html.${HOME_CLASS} .homepage-content::before {
        content: 'Focus Mode — Use the search bar';
        font-size: 20px;
        color: #444;
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
      }
    `,
    sidebar: `
      /* Related videos on video pages (desktop rail, live floating rail, mobile list) */
      .media-page-related-media-desktop-sidebar,
      .media-page-related-media-desktop-floating,
      .media-page-related-media-mobile {
        display: none !important;
      }
    `,
    endscreen: `
      /* "Up next" overlay & autoplay countdown */
      .js-player-upcoming-button,
      .player-upcoming-overlay,
      [class*="upcoming-overlay"],
      [class*="autoplay-countdown"] {
        display: none !important;
      }
    `,
    shorts: `
      /* Shorts row on the homepage / subscriptions feed */
      section#section-shorts,
      .constrained:has(> section#section-shorts),
      rum-shorts-row {
        display: none !important;
      }
      /* Individual Shorts cards in feeds */
      rum-video-thumbnail:has(use[href="#shorts__label"]),
      rum-card-video:has(use[href="#shorts__label"]),
      .videostream:has(use[href="#shorts__label"]) {
        display: none !important;
      }
      /* Shorts link in the left nav */
      a[href="/shorts"],
      a[href="https://rumble.com/shorts"],
      [class*="rum-shorts-navigation__item"] {
        display: none !important;
      }
    `,
    wider: `
      /* Make video player column full width without the related sidebar */
      .main-and-sidebar:has(.media-page-related-media-desktop-sidebar) .main-content,
      .main-and-sidebar:has(.media-page-related-media-desktop-sidebar) .media-container {
        width: 100% !important;
        max-width: 100% !important;
      }
    `,
  };

  const DEFAULT_FEATURES = {
    homepage: true,
    sidebar: true,
    endscreen: true,
    shorts: true,
    wider: true,
  };

  function buildCSS(features) {
    const f = { ...DEFAULT_FEATURES, ...(features || {}) };
    return Object.keys(FEATURE_CSS)
      .filter((key) => f[key] !== false)
      // Widening only makes sense when the sidebar is actually hidden
      .filter((key) => key !== "wider" || f.sidebar !== false)
      .map((key) => FEATURE_CSS[key])
      .join("\n");
  }

  // Homepage-only rules are scoped by a class on <html>, since Rumble's
  // homepage sections share class names with other feed pages.
  function markPage() {
    document.documentElement.classList.toggle(HOME_CLASS, location.pathname === "/");
  }

  function apply(enabled, features) {
    const existing = document.getElementById(STYLE_ID);
    if (!enabled) {
      if (existing) existing.remove();
      document.documentElement.classList.remove(HOME_CLASS);
      return;
    }
    markPage();
    const css = buildCSS(features);
    if (existing) {
      existing.textContent = css;
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  let lastPath = location.pathname;
  function checkNavigation() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    if (document.getElementById(STYLE_ID)) markPage();
  }
  window.addEventListener("popstate", checkNavigation);
  document.addEventListener("htmx:afterSettle", checkNavigation);
  setInterval(checkNavigation, 1000);

  chrome.storage.local.get(["rumbleunhook_enabled", "rumbleunhook_features"], (data) => {
    apply(data.rumbleunhook_enabled !== false, data.rumbleunhook_features);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "rumbleunhook_toggle") {
      apply(msg.enabled, msg.features);
    }
  });
})();
