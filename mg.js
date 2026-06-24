/* =============================================================================
   Mermaid's Glance — LightFunnels external module
   -----------------------------------------------------------------------------
   Loaded by the tiny loader stub inside the LF funnel's header_scripts on EVERY
   page. This file self-gates by route so the homepage / PDP pay nothing extra.

   Why this exists: header_scripts is hard-capped at ~64KB and silently truncates
   above it. The global/critical code (nav, cart drawer, sticky) stays INLINE in
   header_scripts. The heavy page rebuilds (contact, about) + the footer rebuild +
   all images live HERE, with no size cap.

   Hosting: this repo is served via jsDelivr.
     https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@vN/mg.js
   Deploy: git push + bump the tag (vN) AND the loader's @vN to bust the CDN cache.

   See SPEC.md for the full per-module specification.
   ============================================================================= */
(function () {
  if (window.__mgExt) return;
  window.__mgExt = true;

  var CDN = "https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@v1";
  var IMG = CDN + "/images";
  var path = location.pathname;

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  /* ---- FOOTER (global — appears on every page) ----------------------------
     SPEC.md §3. Rebuild the LF footer into the brand structure:
       THE COMPANY · LEGAL column · INFORMATION column · MERMAID'S GLANCE logo. */
  ready(function mgFooter() {
    /* TODO (Sonnet, live): inspect real LF footer DOM, rebuild per SPEC §3. */
  });

  /* ---- CONTACT (route-gated) ---------------------------------------------
     SPEC.md §2. Currently broken; rebuild GET IN TOUCH form + contact block. */
  if (/^\/contact\/?$/.test(path))
    ready(function mgContact() {
      /* TODO (Sonnet, live): diagnose why the form fails, rebuild per SPEC §2. */
    });

  /* ---- ABOUT (route-gated) ------------------------------------------------
     SPEC.md §4. Replace generic content with the MANIFESTO; brand images only. */
  if (/^\/about\/?$/.test(path))
    ready(function mgAbout() {
      /* TODO (Sonnet, live): rebuild per SPEC §4 using IMG + manifesto copy. */
    });
})();
