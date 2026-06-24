/* =============================================================================
   Mermaid's Glance — LightFunnels external module v2
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
   ============================================================================= */
(function () {
  if (window.__mgExt) return;
  window.__mgExt = true;

  var CDN = "https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@v2";
  var path = location.pathname;

  /* Wait for a selector to appear in the SPA-rendered DOM. */
  function waitFor(sel, fn, maxMs) {
    var el = document.querySelector(sel);
    if (el) { fn(el); return; }
    var tid = setTimeout(function () { mo.disconnect(); }, maxMs || 8000);
    var mo = new MutationObserver(function () {
      var el = document.querySelector(sel);
      if (el) { mo.disconnect(); clearTimeout(tid); fn(el); }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function css(txt) {
    var s = document.createElement("style");
    s.textContent = txt;
    document.head.appendChild(s);
  }

  /* =========================================================================
     §3 — FOOTER REBUILD (global — every page)
     Replace the LF builder footer with 4-column brand structure.
     ========================================================================= */
  waitFor(".mg-foot", function () { setTimeout(function () {
    var foot = document.querySelector(".mg-foot");
    if (!foot || document.querySelector(".mgf-wrap")) return;
    foot.innerHTML =
      '<div class="mgf-wrap">' +
        '<div class="mgf-cols">' +
          '<div class="mgf-col">' +
            '<div class="mgf-head">THE COMPANY</div>' +
            '<a href="mailto:info@mermaidsglance.com" class="mgf-lnk">INFO@MERMAIDSGLANCE.COM</a>' +
            '<a href="tel:+13025202387" class="mgf-lnk">+1 302 520 2387</a>' +
          '</div>' +
          '<div class="mgf-col mgf-mid">' +
            '<div class="mgf-wm">MERMAID\'S GLANCE</div>' +
            '<div class="mgf-tag">Ultra-luxury lingerie.<br>Crafted for women who choose to feel extraordinary.</div>' +
            '<div class="mgf-soc">' +
              '<a href="https://www.instagram.com/mermaidsglance" target="_blank" rel="noopener" class="mgf-si">Instagram</a>' +
              '<a href="https://www.tiktok.com/@mermaidsglance" target="_blank" rel="noopener" class="mgf-si">TikTok</a>' +
            '</div>' +
          '</div>' +
          '<div class="mgf-col">' +
            '<div class="mgf-head">LEGAL</div>' +
            '<a href="/privacypolicy" class="mgf-lnk">Privacy Policy</a>' +
            '<a href="/refundpolicy" class="mgf-lnk">Refund Policy</a>' +
            '<a href="/termsofservice" class="mgf-lnk">Terms of Service</a>' +
          '</div>' +
          '<div class="mgf-col">' +
            '<div class="mgf-head">INFORMATION</div>' +
            '<a href="/about-us" class="mgf-lnk">About Us</a>' +
            '<a href="https://www.instagram.com/mermaidsglance" target="_blank" rel="noopener" class="mgf-lnk">Instagram</a>' +
            '<a href="/contactus" class="mgf-lnk">FAQ</a>' +
          '</div>' +
        '</div>' +
        '<div class="mgf-bot">' +
          '<span>© 2025 MERMAID\'S GLANCE</span>' +
        '</div>' +
      '</div>';

    css(
      ".mg-foot{background:#0d0d0d!important;color:#fff!important;padding:0!important;}" +
      ".mgf-wrap{max-width:1200px;margin:0 auto;padding:64px 40px 32px;}" +
      ".mgf-cols{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:48px;align-items:start;}" +
      ".mgf-col{display:flex;flex-direction:column;gap:10px;}" +
      ".mgf-head{font-size:9px;font-weight:600;letter-spacing:.18em;color:#555;text-transform:uppercase;margin-bottom:6px;}" +
      ".mgf-lnk{font-size:13px;color:#aaa;text-decoration:none;letter-spacing:.02em;transition:color .2s;}" +
      ".mgf-lnk:hover{color:#fff;}" +
      ".mgf-mid{align-items:center;text-align:center;}" +
      ".mgf-wm{font-size:16px;font-weight:300;letter-spacing:.28em;color:#fff;text-transform:uppercase;margin-bottom:14px;}" +
      ".mgf-tag{font-size:12px;color:#666;letter-spacing:.02em;line-height:1.75;}" +
      ".mgf-soc{display:flex;gap:20px;margin-top:18px;justify-content:center;}" +
      ".mgf-si{font-size:11px;color:#555;text-decoration:none;letter-spacing:.1em;transition:color .2s;}" +
      ".mgf-si:hover{color:#fff;}" +
      ".mgf-bot{border-top:1px solid #1e1e1e;margin-top:48px;padding-top:24px;text-align:center;}" +
      ".mgf-bot span{font-size:11px;color:#444;letter-spacing:.08em;}" +
      "@media(max-width:768px){" +
        ".mgf-cols{grid-template-columns:1fr 1fr;}" +
        ".mgf-mid{grid-column:1/-1;order:-1;}" +
        ".mgf-wrap{padding:48px 24px 28px;}" +
      "}"
    );
  }, 500); });

  /* =========================================================================
     §2 — CONTACT REBUILD (route-gated: /contactus)
     Keep native LF form inputs (backend works); overlay brand design.
     DOM (live-inspected 2026-06-24):
       h1._11._10.pSyxI  — "Contact us" title
       section._5.Rgl6R  — wraps the form section
       div._14.pSyxI     — form fields area (h≈461)
       button._47.pSyxI.HLZ5F — SEND button
     ========================================================================= */
  if (/^\/contactus\/?$/.test(path)) {
    waitFor("input[name='first_name']", function () { setTimeout(function () {

      css(
        /* Replace LF title with brand heading */
        "h1._11{display:none!important;}" +

        /* Brand page layout: form left, info card right */
        ".mgc-wrap{max-width:1100px;margin:0 auto;padding:80px 40px;display:grid;" +
          "grid-template-columns:3fr 2fr;gap:72px;align-items:start;}" +
        /* Override LF section centering — lock form to left column */
        ".mgc-form-col,section._5{max-width:none!important;margin:0!important;width:100%!important;}" +
        "section._5>[class*='pSyxI']{max-width:none!important;margin:0!important;padding:0!important;}" +
        ".mgc-form-col{}" +
        ".mgc-heading{font-size:9px;font-weight:600;letter-spacing:.2em;color:#0d0d0d;" +
          "text-transform:uppercase;margin-bottom:40px;}" +

        /* LF subtitle hide */
        "[class*='_13'][class*='pSyxI']{display:none!important;}" +

        /* Restyle LF inputs — border-bottom only */
        "input[name='first_name'],input[name='last_name'],input[name='email']," +
        "input[name='subject'],textarea[name='message']{" +
          "border:none!important;border-bottom:1px solid #e6e4e0!important;" +
          "border-radius:0!important;padding:14px 0!important;font-size:13px!important;" +
          "letter-spacing:.04em!important;font-family:'Montserrat',sans-serif!important;" +
          "background:transparent!important;outline:none!important;color:#0d0d0d!important;" +
        "}" +
        "textarea[name='message']{min-height:120px!important;resize:vertical!important;}" +
        /* Hide field icons */
        "[class*='Qsx7X'] svg,[class*='Qsx7X'] path{display:none!important;}" +

        /* SEND button */
        "button._47{background:#0d0d0d!important;color:#fff!important;border:none!important;" +
          "width:100%!important;padding:16px!important;font-size:11px!important;" +
          "letter-spacing:.18em!important;font-family:'Montserrat',sans-serif!important;" +
          "cursor:pointer!important;border-radius:0!important;}" +
        "button._47:hover{opacity:.75!important;}" +

        /* Contact info card */
        ".mgc-card{background:#0d0d0d;padding:48px 40px;margin-top:49px;}" +
        ".mgc-card-h{font-size:9px;font-weight:600;letter-spacing:.2em;color:#555;" +
          "text-transform:uppercase;margin-bottom:28px;}" +
        ".mgc-info{font-size:13px;color:#aaa;margin-bottom:14px;letter-spacing:.02em;}" +
        ".mgc-info a{color:#aaa;text-decoration:none;}" +
        ".mgc-info a:hover{color:#fff;}" +
        ".mgc-hrs{font-size:12px;color:#555;margin-top:24px;letter-spacing:.04em;}" +

        "@media(max-width:768px){.mgc-wrap{grid-template-columns:1fr;gap:48px;padding:48px 24px;}}"
      );

      if (document.querySelector(".mgc-wrap")) return; /* idempotent */

      /* The section wrapping form (._5.Rgl6R) */
      var formSection = document.querySelector("section._5");
      if (!formSection) {
        /* fallback: the section containing first_name */
        var inp = document.querySelector("input[name='first_name']");
        formSection = inp ? inp.closest("section") : null;
      }
      if (!formSection) return;

      /* Insert CONTACT heading at top of form section */
      var heading = document.createElement("div");
      heading.className = "mgc-heading";
      heading.textContent = "CONTACT";
      formSection.insertBefore(heading, formSection.firstChild);

      /* Build GET IN TOUCH card */
      var card = document.createElement("div");
      card.className = "mgc-card";
      card.innerHTML =
        '<div class="mgc-card-h">GET IN TOUCH</div>' +
        '<div class="mgc-info"><a href="mailto:info@mermaidsglance.com">INFO@MERMAIDSGLANCE.COM</a></div>' +
        '<div class="mgc-info"><a href="tel:+13025202387">+1 302 520 2387</a></div>' +
        '<div class="mgc-hrs">MON–FRI, 10AM–9PM</div>';

      /* Wrap in 2-col grid */
      var wrap = document.createElement("div");
      wrap.className = "mgc-wrap";
      var formCol = document.createElement("div");
      formCol.className = "mgc-form-col";
      var infoCol = document.createElement("div");
      infoCol.appendChild(card);

      formSection.parentNode.insertBefore(wrap, formSection);
      formCol.appendChild(formSection);
      wrap.appendChild(formCol);
      wrap.appendChild(infoCol);
    }, 500); });
  }

  /* =========================================================================
     §4 — ABOUT REBUILD (route-gated: /about-us)
     Hide generic LF sections; inject MANIFESTO.
     ========================================================================= */
  if (/^\/about-us\/?$/.test(path)) {
    waitFor(".mg-foot", function () { setTimeout(function () {
      var main = document.getElementById("root");
      if (!main) return;
      var wrap = main.children[0];
      if (!wrap) return;

      /* Hide generic sections (indices 2-6 from live inspection;
         0-1 are tiny spacing divs, 7 is footer). */
      Array.from(wrap.children).forEach(function (el, i) {
        if (i >= 2 && !el.classList.contains("mg-foot")) {
          el.style.display = "none";
        }
      });

      css(
        ".mga{max-width:800px;margin:0 auto;padding:100px 40px 120px;}" +
        ".mga-kicker{font-size:9px;font-weight:600;letter-spacing:.25em;color:#7a7a7a;text-transform:uppercase;margin-bottom:56px;}" +
        ".mga-title{font-size:36px;font-weight:300;letter-spacing:.04em;color:#0d0d0d;margin-bottom:72px;line-height:1.25;}" +
        ".mga-body{font-size:15px;font-weight:300;color:#0d0d0d;line-height:2;letter-spacing:.01em;}" +
        ".mga-body p{margin-bottom:32px;}" +
        ".mga-divider{width:36px;height:1px;background:#0d0d0d;opacity:.25;margin:64px 0;}" +
        "@media(max-width:768px){.mga{padding:64px 24px 80px;}.mga-title{font-size:26px;}}"
      );

      if (!document.querySelector(".mga")) {
        var el = document.createElement("div");
        el.className = "mga";
        el.innerHTML =
          '<div class="mga-kicker">MERMAID\'S GLANCE</div>' +
          '<div class="mga-title">The Power of Grace: That Moment</div>' +
          '<div class="mga-body">' +
            "<p>You know that day. It’s not just a date on the calendar. Not a coincidence. This is the moment you decided.</p>" +
            "<p>You wake up. Your mind is clear. Your body is ready. You look in the mirror and a single word echoes inside you: ‘Ready.’ You don’t rush. Styling your hair isn’t a task — it’s a gesture to yourself. Touching your skin isn’t about shining for others. It’s about respecting yourself.</p>" +
            "<p>Then you put on the most intimate layer. The first touch against your skin… Unseen by anyone else. Known only by you. No restriction. No discomfort. Only the feeling of something that holds you — perfectly, completely.</p>" +
            "<p>You step outside. Your shoulders settle naturally. Your chin lifts. Your steps are unhurried. You don’t need to speak. You don’t need to make noise. Your presence fills the room. People look at you — not at what you’re wearing, but at the energy you radiate. Because you carry a distinct line: Clear. Composed. Unshakeable.</p>" +
            "<p>Even your “no” is graceful. You offer no explanation. You don’t dissolve. Chaos meets you and retreats, because you are the center.</p>" +
            '<div class="mga-divider"></div>' +
            "<p>Mermaid’s Glance doesn’t promise you a new self. We simply remind you of that moment of wholeness.</p>" +
            "<p>You already know the rest.</p>" +
          "</div>";

        /* Insert before footer */
        var foot = wrap.querySelector(".mg-foot");
        if (foot) wrap.insertBefore(el, foot);
        else wrap.appendChild(el);
      }
    }, 500); });
  }

})();
