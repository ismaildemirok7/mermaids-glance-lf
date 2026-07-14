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
     https://cdn.jsdelivr.net/gh/ismaildemirok7/mermaids-glance-lf@<commit-sha>/mg.js
   Deploy: push to the CDN repo, update the pinned SHA in the loader stub inside
   header-scripts.html, then `node apply-hs.mjs` (the new pin busts the CDN cache).
   ============================================================================= */
(function () {
  if (window.__mgExt) return;
  window.__mgExt = true;

  /* Self-derive the CDN base from this module's own <script src> so it tracks the
     loader's @vN automatically — a hardcoded version goes stale on every bump. */
  var CDN = (function () {
    var t = Array.prototype.slice.call(document.scripts).filter(function (x) { return /mermaids-glance-lf@/.test(x.src); }).pop();
    return t ? t.src.replace(/\/(mg|i18n)\.js.*$/, "") : "https://cdn.jsdelivr.net/gh/ismaildemirok7/mermaids-glance-lf@v18";
  })();
  var path = location.pathname;
  function L(en, tr) { return window.MG_LANG === "tr" ? tr : en; }

  /* Order-tracking Worker endpoint (§9). Set this to the URL printed by
     `wrangler deploy` (e.g. https://mg-tracking.<sub>.workers.dev). While it is
     empty the tracking page runs in DEMO mode so the UI can be verified before
     the Worker is live. */
  var TRACK_API = "https://mg-tracking.mermaidsglance.workers.dev";

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

  /* Hide the cart-plus icon (Iconoir font span) that LF renders next to the ATC button. */
  css("[class*='iconoir-cart-plus'],[class*='iconoir-cart']{display:none!important;}");

  /* Checkout payment-method cards + payment-logo badges carry an 8px radius the
     global inline reset misses (LF hash classes, checkout step only). Square them. */
  css(".tebYR,.zsy6s,.NF7a4{border-radius:0!important;}");

  /* =========================================================================
     §7 — IMAGE PERFORMANCE (global; the win lands on the PDP gallery)
     The PDP gallery is a STACKED carousel: all ~12 product slides (img.pdZHw) are
     layered at the same in-viewport position, so the browser eagerly loads EVERY
     photo at full res on first paint (~825 KiB on mobile, ~2 MB on desktop) even
     though only the hero is shown. The 74px thumbnail rail (img.Jc2tx) free-rides
     those same URLs. None of the gallery imgs carry width/height → CLS ~0.116.
     None of this is reachable via header_scripts (SPA server markup), so we
     correct each <img> client-side (all live-verified 2026-06-29):

       1. CLS: stamp the uniform 712x1066 (2:3) intrinsic size so the box is
          reserved before decode. CSS still controls the rendered size.
       2. THUMBS: once slides are deferred the rail can no longer share a slide's
          fetch, so give it its own small image — rewrite cdn-cgi width->256 in
          src+srcset and shrink sizes (256 is a valid resizer width — verified).
       3. SLIDES: defer every non-hero slide — stash its srcset/src and swap in an
          inert data: placeholder, which cancels the eager full-res fetch. Restore
          ALL on the first real gallery interaction (capture phase, so it beats the
          carousel's own handler) → switching still works. The hero (fetchpriority
          =high) is never touched, so LCP is unaffected.

     Idempotent (per-node guards); a persistent observer catches SPA re-renders. */
  (function () {
    var GAL = /assets\.lightfunnels\.com|images_library/;
    var PH = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='712' height='1066'%3E%3C/svg%3E";
    var EVT = ["pointerdown", "touchstart", "keydown", "wheel", "mousemove"];
    var stashed = [], armed = false;

    function restoreAll() {
      for (var i = 0; i < stashed.length; i++) {
        var im = stashed[i], ss = im.getAttribute("data-mgss"), sr = im.getAttribute("data-mgsrc");
        if (ss) im.setAttribute("srcset", ss);
        if (sr) im.setAttribute("src", sr);
        im.removeAttribute("data-mgss"); im.removeAttribute("data-mgsrc");
      }
      stashed = [];
      EVT.forEach(function (e) { document.removeEventListener(e, restoreAll, true); });
    }
    function arm() { if (armed) return; armed = true; EVT.forEach(function (e) { document.addEventListener(e, restoreAll, true); }); }

    function fixImg(im) {
      if (im.__mgi) return; im.__mgi = 1;
      /* CLS only: reserve the gallery's 2:3 box so late images don't shift layout.
         The defer-to-placeholder experiment (v23/v24) was REMOVED — measured net
         negative on LCP: the SSR preload scanner fetches the slides before this JS
         runs, so swapping placeholders cannot prevent the eager fetch and the
         cancelled/contending streams pushed LCP to 8-9s. User also wants every
         gallery image visible. Keep only the harmless width/height reservation. */
      if (!im.hasAttribute("width")) { im.setAttribute("width", "712"); im.setAttribute("height", "1066"); }
    }
    function scan(root) {
      var q = (root || document).getElementsByTagName("img"), n = q.length;
      while (n--) { var im = q[n]; if (GAL.test(im.src + im.srcset) || im.classList.contains("bvOhf")) fixImg(im); }
    }
    scan();
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var a = recs[i].addedNodes, k = a.length;
        while (k--) {
          var nd = a[k]; if (nd.nodeType !== 1) continue;
          if (nd.tagName === "IMG") { if (GAL.test(nd.src + nd.srcset) || nd.classList.contains("bvOhf")) fixImg(nd); }
          else if (nd.getElementsByTagName) scan(nd);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();

  /* =========================================================================
     §3 — FOOTER REBUILD (global — every page)
     White editorial footer — left-aligned, brand wordmark first.

     CSS is injected ONCE up front. The rebuild is idempotent and driven by a
     PERSISTENT MutationObserver: the LF SPA re-renders the footer section on
     navigation (and sometimes right after first paint), wiping our markup — a
     one-shot waitFor loses that race on home/PDP. The observer re-runs the
     rebuild whenever it finds a `.mg-foot` that lacks `.mgf-wrap`.
     ========================================================================= */
  css(
    ".mg-foot{background:#ffffff!important;color:#0d0d0d!important;padding:0!important;border-top:1px solid #e8e6e3!important;}" +
    ".mgf-wrap{max-width:1200px;margin:0 auto;padding:64px 40px 32px;}" +
    ".mgf-cols{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;align-items:start;}" +
    ".mgf-col{display:flex;flex-direction:column;gap:10px;align-items:flex-start;text-align:left;}" +
    ".mgf-head{font-size:9px;font-weight:600;letter-spacing:.18em;color:#9a9a9a;text-transform:uppercase;margin-bottom:6px;}" +
    ".mgf-lnk{font-size:13px;color:#555;text-decoration:none;letter-spacing:.02em;transition:color .2s;}" +
    ".mgf-lnk:hover{color:#0d0d0d;}" +
    ".mgf-wm{font-size:22px;font-weight:300;letter-spacing:.28em;color:#0d0d0d;text-transform:uppercase;margin-bottom:14px;}" +
    ".mgf-tag{font-size:12px;color:#9a9a9a;letter-spacing:.02em;line-height:1.75;}" +
    ".mgf-soc{display:flex;gap:20px;margin-top:18px;justify-content:flex-start;}" +
    ".mgf-si{font-size:11px;color:#9a9a9a;text-decoration:none;letter-spacing:.1em;transition:color .2s;}" +
    ".mgf-si:hover{color:#0d0d0d;}" +
    ".mgf-bot{border-top:1px solid #e8e6e3;margin-top:48px;padding-top:24px;text-align:left;}" +
    ".mgf-bot span{font-size:11px;color:#bbb;letter-spacing:.08em;}" +
    "@media(max-width:768px){" +
      ".mgf-cols{grid-template-columns:1fr 1fr;}" +
      ".mgf-brand{grid-column:1/-1;}" +
      ".mgf-wrap{padding:48px 24px 28px;}" +
    "}"
  );

  var FOOT_HTML =
    '<div class="mgf-wrap">' +
      '<div class="mgf-cols">' +
        '<div class="mgf-col mgf-brand">' +
          '<div class="mgf-wm">MERMAID\'S GLANCE</div>' +
          '<div class="mgf-tag">Ultra-luxury lingerie.<br>Curated for women who choose to feel extraordinary.</div>' +
          '<div class="mgf-soc">' +
            '<a href="https://www.instagram.com/mermaidsglanceofficial/" target="_blank" rel="noopener" class="mgf-si">Instagram</a>' +
          '</div>' +
        '</div>' +
        '<div class="mgf-col">' +
          '<div class="mgf-head">THE COMPANY</div>' +
          '<a href="mailto:info@mermaidsglance.com" class="mgf-lnk">info@mermaidsglance.com</a>' +
          '<a href="tel:+13025202387" class="mgf-lnk">+1 302 520 2387</a>' +
        '</div>' +
        '<div class="mgf-col">' +
          '<div class="mgf-head">LEGAL</div>' +
          '<a href="/privacypolicy" class="mgf-lnk">Privacy Policy</a>' +
          '<a href="/refundpolicy" class="mgf-lnk">Returns &amp; Delivery</a>' +
          '<a href="/termsofservice" class="mgf-lnk">Terms of Service</a>' +
        '</div>' +
        '<div class="mgf-col">' +
          '<div class="mgf-head">INFORMATION</div>' +
          '<a href="/siparis-takibi" class="mgf-lnk">Sipariş Takibi</a>' +
          '<a href="/about-us" class="mgf-lnk">About Us</a>' +
          '<a href="/contactus" class="mgf-lnk">FAQ</a>' +
          '<a href="https://www.instagram.com/mermaidsglanceofficial/" target="_blank" rel="noopener" class="mgf-lnk">Instagram</a>' +
        '</div>' +
      '</div>' +
      '<div class="mgf-bot">' +
        '<span>© ' + new Date().getFullYear() + ' MERMAID\'S GLANCE</span>' +
      '</div>' +
    '</div>';

  /* Find the footer WITHOUT depending on the inline `.mg-foot` class — that class
     is added by the inline brandColors() pass which races the SPA and is unreliable
     on home/PDP. We self-detect: the last child of the root wrapper whose text reads
     like a footer (legal/nav links). Once rebuilt, FOOT_HTML still matches, so this
     stays idempotent. */
  function findFoot() {
    var existing = document.querySelector(".mgf-wrap");
    if (existing) return existing.closest(".mg-foot") || existing.parentElement;
    var root = document.getElementById("root");
    var wrap = root && root.firstElementChild;
    if (!wrap) return null;
    var kids = wrap.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      var k = kids[i];
      if (/about us|policies|privacy|©|contact us|terms of service/i.test(k.innerText || "")) return k;
    }
    return null;
  }
  function buildFooter() {
    var foot = findFoot();
    if (!foot || foot.querySelector(".mgf-wrap")) return;
    foot.classList.add("mg-foot");
    foot.innerHTML = FOOT_HTML;
  }
  /* =========================================================================
     §5 — POLICY PAGES  (route: /privacypolicy /refundpolicy /termsofservice)
     These are empty LF generic_page steps — their bodies aren't writable via the
     app token, so the pages render blank. We inject brand-voice content here, the
     same way §2/§4 do. Driven by the footer observer below (not a new observer),
     so it also fires on client-side SPA navigation, reading the LIVE pathname.
     TR only for now (storefront default); EN/DE/FR packs can be layered later.
     ========================================================================= */
  var POL = {
    "/privacypolicy": {
      t: "GİZLİLİK POLİTİKASI",
      body:
        '<p class="mgpol-lead">Mahremiyetiniz bizim için mutlaktır — hem parçalarımızda hem verilerinizde. Bu sayfa, bilgilerinizi nasıl topladığımızı ve koruduğumuzu açıklar.</p>' +
        '<h2>Topladığımız Bilgiler</h2><p>Siparişinizi işleme almak için adınız, iletişim bilgileriniz ve teslimat adresiniz gibi verileri toplarız. Ödeme bilgileriniz doğrudan güvenli ödeme sağlayıcımız tarafından işlenir; kart bilgileriniz tarafımızca saklanmaz.</p>' +
        '<h2>Bilgileri Nasıl Kullanırız</h2><p>Verilerinizi yalnızca siparişinizi hazırlamak, teslim etmek, sizinle iletişim kurmak ve hizmetimizi geliştirmek için kullanırız.</p>' +
        '<h2>Paylaşım</h2><p>Bilgilerinizi üçüncü taraflara satmayız. Yalnızca siparişinizi tamamlamak için gereken kargo ve ödeme sağlayıcılarıyla, gerekli ölçüde paylaşırız.</p>' +
        '<h2>Çerezler</h2><p>Deneyiminizi iyileştirmek ve sitemizin performansını ölçmek için çerezler kullanırız. Çerez tercihlerinizi tarayıcı ayarlarınızdan yönetebilirsiniz.</p>' +
        '<h2>Haklarınız</h2><p>Kişisel verilerinize erişme, bunları düzeltme veya silinmesini talep etme hakkına sahipsiniz. Bu haklarınızı kullanmak için <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresinden bize ulaşın.</p>'
    },
    "/refundpolicy": {
      t: L("RETURNS & DELIVERY", "İADE VE TESLİMAT"),
      body: L(
        '<p class="mgpol-lead">Preparation, delivery, withdrawal and hygiene terms are stated here so you can review them before deciding.</p>' +
        '<h2>Routing &amp; Delivery</h2><p>Order routing takes 1 business day. Delivery after dispatch is estimated at 7–15 business days, for a total estimate of 8–16 business days from the order. Weekends and public holidays are excluded.</p>' +
        '<h2>Customs &amp; Duties</h2><p>Shipping, customs procedures and duties are handled by us. No additional customs charge is collected from you at delivery.</p>' +
        '<h2>Order Changes &amp; Withdrawal</h2><p>You may notify us of withdrawal from contract formation through delivery, and within 14 days after delivery. Send your notice in a durable form to <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a>.</p>' +
        '<h2>Returns &amp; Hygiene</h2><p>For lingerie, the hygiene exception applies after protective packaging, tape, seals or wrapping have been opened after delivery. Review size and contents before opening a protective element. Statutory withdrawal and defective-goods rights remain intact.</p>' +
        '<h2>Defective Goods</h2><p>For defective goods, your statutory choices include withdrawal and refund, a proportional price reduction, free repair or replacement where possible. For a faster resolution, write to <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> with images within 48 hours after delivery; this request does not limit your legal rights.</p>' +
        '<h2>Return Process</h2><p>Write to <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> for return instructions. Return the piece within 10 days after your withdrawal notice. We reimburse all eligible payments within 14 days after receiving that notice, in one transaction to the original payment method and without additional cost to you. If no return carrier was named in the pre-contract information, no return-shipping charge is requested from you.</p>',
        '<p class="mgpol-lead">Hazırlık, teslimat, cayma ve hijyen koşullarını kararından önce inceleyebilmen için burada açıkça gösteriyoruz.</p>' +
        '<h2>Yönlendirme &amp; Teslimat</h2><p>Sipariş yönlendirmesi 1 iş günü sürer. Sevkiyat sonrası teslimat tahmini 7–15 iş günüdür; siparişten itibaren toplam tahmin 8–16 iş günüdür. Hafta sonları ve resmî tatiller hariçtir.</p>' +
        '<h2>Gümrük &amp; Vergiler</h2><p>Kargo, gümrük işlemleri ve yasal harçlar tarafımızca karşılanır. Teslimatta senden ek gümrük ücreti alınmaz.</p>' +
        '<h2>Sipariş Değişikliği &amp; Cayma</h2><p>Sözleşmenin kurulmasından teslimata kadar ve teslimden itibaren 14 gün içinde cayma bildirimi yapabilirsin. Bildirimini kalıcı bir kayıt oluşturacak şekilde <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresine ilet.</p>' +
        '<h2>İade &amp; Hijyen</h2><p>İç çamaşırında hijyen istisnası, ambalaj, bant, mühür veya paket gibi koruyucu unsur teslimden sonra açıldığında uygulanır. Koruyucu unsuru açmadan önce beden ve içerik bilgisini kontrol et. Yasal cayma ve ayıplı mal hakların saklıdır.</p>' +
        '<h2>Ayıplı Mal</h2><p>Ayıplı malda sözleşmeden dönme ve bedel iadesi, ayıp oranında indirim, ücretsiz onarım veya imkân varsa ayıpsız misliyle değişim seçimlik hakların saklıdır. Hızlı çözüm için teslimattan sonraki 48 saat içinde görselle <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresine yaz; bu talep yasal haklarını sınırlamaz.</p>' +
        '<h2>İade Süreci</h2><p>İade talimatı için <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresine yaz. Cayma bildiriminden itibaren 10 gün içinde parçayı iade et. Uygun ödemeleri bildirimin bize ulaştığı tarihten itibaren 14 gün içinde, ek masraf yaratmadan ve tek seferde orijinal ödeme yöntemine iade ederiz. Ön bilgilendirmede iade taşıyıcısı belirtilmemişse senden iade kargo bedeli talep edilmez.</p>'
      )
    },
    "/termsofservice": {
      t: "KULLANIM KOŞULLARI",
      body:
        '<p class="mgpol-lead">Mermaid’s Glance’i kullanarak aşağıdaki koşulları kabul etmiş olursunuz.</p>' +
        '<h2>Sitenin Kullanımı</h2><p>Bu site ve içeriği kişisel, ticari olmayan kullanımınız için sunulur. Siteyi yasalara aykırı hiçbir amaçla kullanamazsınız.</p>' +
        '<h2>Ürünler &amp; Fiyatlandırma</h2><p>Ürünleri ve fiyatları olabildiğince doğru sunmaya özen gösteririz. Fiyatları, ürün bilgilerini ve sunumu önceden bildirimde bulunmaksızın güncelleme hakkımız saklıdır.</p>' +
        '<h2>Sipariş Kabulü</h2><p>Her sipariş, tarafımızca onaylandığında bağlayıcı hâle gelir. Olağan dışı durumlarda bir siparişi reddetme veya iptal etme hakkımızı saklı tutarız.</p>' +
        '<h2>Fikrî Mülkiyet</h2><p>Bu sitedeki tüm içerik — metin, görsel ve tasarım — Mermaid’s Glance’e aittir ve izinsiz kullanılamaz.</p>' +
        '<h2>Sorumluluğun Sınırı</h2><p>Hizmetimizi mümkün olan en yüksek özenle sunarız; ancak yasaların izin verdiği ölçüde, kullanımdan doğan dolaylı zararlardan sorumlu tutulamayız.</p>' +
        '<h2>İletişim</h2><p>Koşullarla ilgili her soru için <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresinden bize ulaşabilirsiniz.</p>'
    }
  };
  css(
    ".mgpol{max-width:760px;margin:0 auto;padding:120px 40px 120px;}" +
    ".mgpol-kicker{font-size:9px;font-weight:600;letter-spacing:.25em;color:#7a7a7a;text-transform:uppercase;margin-bottom:32px;}" +
    ".mgpol-title{font-size:34px;font-weight:300;letter-spacing:.04em;color:#0d0d0d;margin:0 0 56px;line-height:1.25;}" +
    ".mgpol-lead{font-size:15px;font-weight:300;color:#0d0d0d;line-height:2;margin:0 0 48px;letter-spacing:.01em;}" +
    ".mgpol-body h2{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#0d0d0d;margin:40px 0 14px;}" +
    ".mgpol-body p{font-size:14px;font-weight:300;color:#444;line-height:1.95;margin:0 0 8px;letter-spacing:.01em;}" +
    ".mgpol-body a{color:#0d0d0d;text-decoration:underline;text-underline-offset:2px;}" +
    "@media(max-width:768px){.mgpol{padding:88px 24px 80px;}.mgpol-title{font-size:26px;}}"
  );
  function buildPolicy() {
    var def = POL[location.pathname.replace(/\/+$/, "")];
    if (!def) return;
    if (document.querySelector(".mgpol")) return; /* idempotent */
    var root = document.getElementById("root");
    var wrap = root && root.children[0];
    if (!wrap) return;
    /* Empty shell: hide every page section except the footer (header lives on body). */
    Array.from(wrap.children).forEach(function (el) {
      if (!el.classList.contains("mg-foot")) el.style.display = "none";
    });
    var el = document.createElement("div");
    el.className = "mgpol";
    el.innerHTML =
      '<div class="mgpol-kicker">MERMAID\'S GLANCE</div>' +
      '<h1 class="mgpol-title">' + def.t + '</h1>' +
      '<div class="mgpol-body">' + def.body + '</div>';
    var foot = wrap.querySelector(".mg-foot");
    if (foot) wrap.insertBefore(el, foot); else wrap.appendChild(el);
  }

  var _ftT;
  new MutationObserver(function () {
    clearTimeout(_ftT);
    _ftT = setTimeout(function () { buildFooter(); buildPolicy(); buildTracking(); ensureSearchBtn(); buildRecent(); }, 200);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { buildFooter(); buildPolicy(); buildTracking(); buildSearchOverlay(); ensureSearchBtn(); buildRecent(); }, 600);

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

        /* MOBILE FIX: LF renders the form's inner layout divs with FIXED px
           widths (…_8=800px, _16/_15=716px) and the inputs carry min-width:100%.
           As grid items default to min-width:auto, that fixed content blows the
           column past the viewport → the whole form spills off-screen on phones.
           Let every form element shrink (min-width:0) and cap it to its
           container (max-width:100%). Verified at 390px: zero overflow. */
        ".mgc-form-col{min-width:0!important;max-width:100%!important;}" +
        ".mgc-form-col *{max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}" +
        "input[name='first_name'],input[name='last_name'],input[name='email']," +
        "input[name='subject'],textarea[name='message']{width:100%!important;min-width:0!important;}" +

        "@media(max-width:768px){.mgc-wrap{grid-template-columns:1fr;gap:48px;padding:48px 24px;max-width:100%!important;}}"
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
        '<div class="mgc-info"><a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a></div>' +
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

      /* FAQ section below the form grid */
      if (!document.querySelector(".mgc-faq")) {
        var faqs = [
          [L("Can I cancel or change my order?", "Siparişimi iptal edebilir veya değiştirebilir miyim?"),
            L("You may notify us of withdrawal from contract formation through delivery, and within 14 days after delivery. For address or size changes, write to info@mermaidsglance.com before preparation is complete; your legal rights remain intact.", "Sözleşmenin kurulmasından teslimata kadar ve teslimden itibaren 14 gün içinde cayma bildirimi yapabilirsiniz. Adres veya beden değişikliği için hazırlık tamamlanmadan önce info@mermaidsglance.com adresine yazın; yasal haklarınız saklıdır.")],
          [L("When will my piece arrive?", "Parçam elime ne zaman ulaşır?"),
            L("Order routing takes 1 business day. Delivery after dispatch is estimated at 7–15 business days, for a total estimate of 8–16 business days. Weekends and public holidays are excluded.", "Sipariş yönlendirmesi 1 iş günü sürer. Sevkiyat sonrası teslimat tahmini 7–15 iş günüdür; toplam tahmin 8–16 iş günüdür. Hafta sonları ve resmî tatiller hariçtir.")],
          [L("Will I pay unexpected customs charges?", "Sürpriz gümrük vergisi veya ek ücret öder miyim?"),
            L("No. Shipping, customs procedures and duties are handled by us. No additional customs charge is collected from you at delivery.", "Hayır. Kargo, gümrük işlemleri ve yasal harçlar tarafımızca karşılanır. Teslimatta senden ek gümrük ücreti alınmaz.")],
          [L("What is your return protocol?", "İade protokolünüz nedir?"),
            L("You may notify us of withdrawal within 14 days after delivery. For lingerie, the hygiene exception applies after protective packaging, tape, seals or wrapping have been opened. Statutory withdrawal and defective-goods rights remain intact.", "Teslimden itibaren 14 gün içinde cayma bildirimi yapabilirsiniz. İç çamaşırında hijyen istisnası, ambalaj, bant, mühür veya paket gibi koruyucu unsur açıldığında uygulanır. Yasal cayma ve ayıplı mal haklarınız saklıdır.")],
          [L("What if a piece arrives defective?", "Parça kusurlu gelirse ne olur?"),
            L("For defective goods, your statutory choices include a refund, proportional price reduction, free repair or replacement where possible. For a faster resolution, write with images within 48 hours; this request does not limit your legal rights.", "Ayıplı malda bedel iadesi, ayıp oranında indirim, ücretsiz onarım veya imkân varsa değişim dahil yasal seçimlik haklarınız saklıdır. Hızlı çözüm için 48 saat içinde görselle yazın; bu talep yasal haklarınızı sınırlamaz.")],
          [L("How is the piece packaged?", "Parça nasıl paketlenir?"),
            L("The outer parcel is plain and unbranded. What it carries stays private.", "Dış kargo paketi sade ve markasızdır. Ne taşıdığı yalnızca sana kalır.")],
          [L("How do I choose the right size?", "Doğru bedenimi nasıl seçerim?"),
            L("Do not guess. Consult the size guide before choosing; if you are between sizes, follow the rule for that product type.", "Bedeninizi tahmin etmeyin. Seçimden önce Beden Rehberimize başvurun; iki beden arasındaysanız rehberdeki ürün tipi kuralını izleyin.")],
          [L("Is my payment secure?", "Ödemem güvende mi?"),
            L("Payment is processed through Stripe's encrypted infrastructure. We do not see or store your card details.", "Ödemeniz Stripe’ın şifreli altyapısıyla alınır. Kart bilgilerinizi biz görmez, saklamayız.")],
          [L("How can I reach you with a question?", "Bir sorum olursa nasıl ulaşırım?"),
            L("Write to info@mermaidsglance.com; we answer every question within 24 hours.", "info@mermaidsglance.com adresine yazın; her sorunuza 24 saat içinde yanıt veririz.")]
        ];
        var faqEl = document.createElement("div");
        faqEl.className = "mgc-faq";
        faqEl.innerHTML =
          '<div class="mgc-faq-h">FREQUENTLY ASKED QUESTIONS</div>' +
          faqs.map(function(f) {
            return '<details class="mgc-faq-item"><summary class="mgc-faq-q">' + f[0] + '</summary><p class="mgc-faq-a">' + f[1] + '</p></details>';
          }).join("");
        var root = document.getElementById("root");
        var rootWrap = root && root.children[0];
        var foot = rootWrap && rootWrap.querySelector(".mg-foot");
        if (foot) rootWrap.insertBefore(faqEl, foot);
        else if (rootWrap) rootWrap.appendChild(faqEl);

        css(
          ".mgc-faq{max-width:1100px;margin:0 auto;padding:80px 40px;border-top:1px solid #e6e4e0;}" +
          ".mgc-faq-h{font-size:9px;font-weight:600;letter-spacing:.2em;color:#9a9a9a;text-transform:uppercase;margin-bottom:40px;}" +
          ".mgc-faq-item{border-bottom:1px solid #e6e4e0;padding:0;}" +
          ".mgc-faq-item:first-of-type{border-top:1px solid #e6e4e0;}" +
          "summary.mgc-faq-q{list-style:none;cursor:pointer;padding:20px 0;font-size:13px;font-weight:500;letter-spacing:.04em;color:#0d0d0d;display:flex;justify-content:space-between;align-items:center;font-family:'Montserrat',sans-serif;}" +
          "summary.mgc-faq-q::-webkit-details-marker{display:none;}" +
          "summary.mgc-faq-q::after{content:'+';font-size:18px;font-weight:300;color:#9a9a9a;transition:transform .2s;}" +
          "details.mgc-faq-item[open] summary.mgc-faq-q::after{transform:rotate(45deg);}" +
          ".mgc-faq-a{font-size:13px;color:#555;line-height:1.8;letter-spacing:.02em;padding:0 0 20px;margin:0;font-family:'Montserrat',sans-serif;}" +
          "@media(max-width:768px){.mgc-faq{padding:48px 24px;}}"
        );
      }
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

  /* =========================================================================
     §6 — SEARCH  (global — magnifier in the header, next to the cart)
     The header is full inline (header_scripts is at the 64KB cap), so the search
     button + overlay live here. The product/collection index is a static JSON
     (search-index.json, built from the LF catalog) lazy-fetched on first open.
     Client-side filter; results are plain links → /products|collections/{slug}.
     ========================================================================= */
  var SEARCH_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var SX_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="5" x2="19" y2="19"/></svg>';

  css(
    ".mgh-search{background:none;border:none;padding:8px;cursor:pointer;color:#0d0d0d;display:flex;align-items:center;border-radius:0!important;transition:opacity .4s ease!important;}" +
    ".mgh-search:hover{opacity:.4!important;}" +
    "#mg-search{position:fixed;inset:0;z-index:100000;background:rgba(13,13,13,.42);opacity:0;visibility:hidden;transition:opacity .25s ease;}" +
    "#mg-search.open{opacity:1;visibility:visible;}" +
    ".mgs-panel{background:#fff;max-height:86vh;display:flex;flex-direction:column;transform:translateY(-14px);transition:transform .25s ease;}" +
    "#mg-search.open .mgs-panel{transform:translateY(0);}" +
    ".mgs-bar{display:flex;align-items:center;gap:16px;padding:26px 40px;border-bottom:1px solid #ece9e6;color:#0d0d0d;}" +
    ".mgs-input{flex:1;border:none;outline:none;font-size:20px;font-weight:300;letter-spacing:.02em;color:#0d0d0d;font-family:'Montserrat',sans-serif;background:transparent;}" +
    ".mgs-input::placeholder{color:#c4c0bb;}" +
    ".mgs-close{background:none;border:none;cursor:pointer;color:#0d0d0d;padding:6px;line-height:0;}" +
    ".mgs-close:hover{opacity:.5;}" +
    ".mgs-results{overflow-y:auto;padding:4px 40px 36px;}" +
    ".mgs-sec{font-size:9px;font-weight:600;letter-spacing:.2em;color:#9a9a9a;text-transform:uppercase;margin:26px 0 8px;}" +
    ".mgs-item{display:block;padding:11px 0;font-size:13px;letter-spacing:.02em;color:#333;text-decoration:none;border-bottom:1px solid #f2f0ed;transition:color .15s;}" +
    ".mgs-item:hover{color:#0d0d0d;}" +
    ".mgs-msg{padding:30px 0;color:#9a9a9a;font-size:13px;letter-spacing:.02em;}" +
    "@media(max-width:768px){.mgs-bar{padding:18px 24px;gap:12px;}.mgs-input{font-size:17px;}.mgs-results{padding:4px 24px 28px;}}"
  );

  var IDX = null, idxLoading = false;
  function loadIndex() {
    if (IDX || idxLoading) return;
    idxLoading = true;
    fetch(CDN + "/search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { IDX = j; runSearch(); })
      .catch(function () { idxLoading = false; });
  }
  /* Turkish-aware fold: lower-case (tr locale) then strip the diacritics that
     trip up substring matching ("İç" vs "ic", "Ş-" vs "s-"). */
  function norm(s) {
    return (s || "").toLocaleLowerCase("tr")
      .replace(/[ıİi̇]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
      .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c");
  }
  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function runSearch() {
    var box = document.getElementById("mg-search-results");
    var inp = document.getElementById("mg-search-input");
    if (!box || !inp) return;
    var q = norm(inp.value.trim());
    if (!q) { box.innerHTML = ""; return; }
    if (!IDX) { loadIndex(); box.innerHTML = '<div class="mgs-msg">Aranıyor…</div>'; return; }
    var toks = q.split(/\s+/);
    function match(name) { var n = norm(name); return toks.every(function (t) { return n.indexOf(t) !== -1; }); }
    var cols = IDX.c.filter(function (x) { return match(x[0]); }).slice(0, 6);
    var prods = IDX.p.filter(function (x) { return match(x[0]); }).slice(0, 24);
    var html = "";
    if (cols.length) html += '<div class="mgs-sec">KOLEKSİYONLAR</div>' + cols.map(function (x) { return '<a class="mgs-item" href="/collections/' + x[1] + '">' + esc(x[0]) + '</a>'; }).join("");
    if (prods.length) html += '<div class="mgs-sec">ÜRÜNLER</div>' + prods.map(function (x) { return '<a class="mgs-item" href="/products/' + x[1] + '">' + esc(x[0]) + '</a>'; }).join("");
    box.innerHTML = html || '<div class="mgs-msg">Sonuç bulunamadı.</div>';
  }
  function openSearch() {
    var o = document.getElementById("mg-search");
    if (!o) { buildSearchOverlay(); o = document.getElementById("mg-search"); }
    if (!o) return;
    o.classList.add("open");
    document.body.style.overflow = "hidden";
    var i = document.getElementById("mg-search-input");
    if (i) setTimeout(function () { i.focus(); }, 60);
    loadIndex();
  }
  function closeSearch() {
    var o = document.getElementById("mg-search");
    if (!o) return;
    o.classList.remove("open");
    document.body.style.overflow = "";
  }
  window.__mgSearch = openSearch;

  function buildSearchOverlay() {
    if (document.getElementById("mg-search")) return;
    var o = document.createElement("div");
    o.id = "mg-search";
    o.innerHTML =
      '<div class="mgs-panel">' +
        '<div class="mgs-bar">' + SEARCH_SVG +
          '<input id="mg-search-input" class="mgs-input" type="text" placeholder="Ürün veya koleksiyon ara…" autocomplete="off">' +
          '<button class="mgs-close" aria-label="Kapat">' + SX_SVG + '</button>' +
        '</div>' +
        '<div id="mg-search-results" class="mgs-results"></div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener("click", function (e) { if (e.target === o) closeSearch(); });
    o.querySelector(".mgs-close").addEventListener("click", closeSearch);
    o.querySelector("#mg-search-input").addEventListener("input", runSearch);
    o.querySelector("#mg-search-results").addEventListener("click", function (e) {
      if (e.target.closest(".mgs-item")) closeSearch(); /* SPA nav keeps the page; close the overlay */
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSearch(); });
  }

  function ensureSearchBtn() {
    var right = document.querySelector("#mg-header .mgh-right");
    if (!right || document.getElementById("mg-search-btn")) return;
    var b = document.createElement("button");
    b.id = "mg-search-btn";
    b.className = "mgh-search";
    b.setAttribute("aria-label", "Ara");
    b.innerHTML = SEARCH_SVG;
    b.addEventListener("click", openSearch);
    right.insertBefore(b, right.firstChild); /* left of the cart */
  }

  /* =========================================================================
     §8 — RECENTLY VIEWED  (PDP only — route /products/...)
     Remembers the last few products the visitor opened (localStorage, slug-keyed,
     newest-first, capped) and renders an editorial strip directly ABOVE the footer
     — i.e. below the cross-sell ("RİTÜELİNİ TAMAMLA"), which is the last content
     section on the PDP. Lives HERE (not header_scripts) because that file is at the
     64KB cap. TR heading, consistent with the other brand PDP sections (untranslated).
     ========================================================================= */
  var RV_KEY = "mg_recent", RV_MAX = 8, _rvTracked = "";
  function rvPDP() { return /\/products\//.test(location.pathname) && !!(window.data && window.data.product); }
  function rvRead() { try { return JSON.parse(localStorage.getItem(RV_KEY) || "[]") || []; } catch (e) { return []; } }
  function rvSave(a) { try { localStorage.setItem(RV_KEY, JSON.stringify(a)); } catch (e) {} }
  function rvHref() { return location.pathname.replace(/[?#].*$/, "").replace(/\/+$/, ""); }
  /* The strip renders 200px-wide cards (150px mobile) — never carry the hero's
     width=1920 resizer URL into it. 384 ≈ 2x retina for the 200px slot. */
  function rvSmall(u) { return u ? u.replace(/\/cdn-cgi\/image\/width=\d+/, "/cdn-cgi/image/width=384") : u; }
  function rvHero() {
    var im = document.querySelector('img[fetchpriority="high"]');
    if (im) { var s = im.getAttribute("data-mgsrc") || im.src; if (s && s.indexOf("data:") !== 0) return rvSmall(s); }
    var all = document.getElementsByTagName("img");
    for (var i = 0; i < all.length; i++) {
      var v = all[i].getAttribute("data-mgsrc") || all[i].src;
      if (v && v.indexOf("data:") !== 0 && /lightfunnels|images_library|\/cdn\//.test(v)) return rvSmall(v);
    }
    return "";
  }
  function rvName() {
    try { var t = window.data.product.title || window.data.product.name; if (t) return t; } catch (e) {}
    var h = document.querySelector("h1"); return h ? (h.innerText || "").trim() : "";
  }
  function rvPrice() {
    var el = document.querySelector(".mg-pdp-price"); /* the main product price (tagged by header_scripts build) */
    if (el && el.children.length === 0) { var t = (el.innerText || "").trim(); if (t) return t; }
    el = Array.prototype.slice.call(document.querySelectorAll("*")).find(function (e) {
      return e.children.length === 0 && /^[$₺€]\s?\d[\d.,]*$/.test((e.innerText || "").trim());
    });
    return el ? (el.innerText || "").trim() : "";
  }
  function rvTrack() {
    var href = rvHref(); if (!href) return;
    var name = rvName(); if (!name) return; /* wait until the PDP has actually rendered */
    var list = rvRead();
    if (_rvTracked === href && list[0] && list[0].h === href) {
      /* price/image often render a beat after the title — backfill once they exist */
      var ch = false;
      if (!list[0].p) { var p = rvPrice(); if (p) { list[0].p = p; ch = true; } }
      if (!list[0].i) { var im = rvHero(); if (im) { list[0].i = im; ch = true; } }
      if (ch) rvSave(list);
      return;
    }
    _rvTracked = href;
    list = list.filter(function (x) { return x.h !== href; });
    list.unshift({ h: href, n: name, p: rvPrice(), i: rvHero() });
    rvSave(list.slice(0, RV_MAX));
  }
  css(
    ".mgrv{max-width:1200px;margin:0 auto;padding:64px 40px 80px;border-top:1px solid #e8e6e3;}" +
    ".mgrv-h{font-size:11px;font-weight:600;letter-spacing:.2em;color:#0d0d0d;text-transform:uppercase;margin-bottom:30px;text-align:left;}" +
    ".mgrv-row{display:flex;gap:24px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-ms-overflow-style:none;}" +
    ".mgrv-row::-webkit-scrollbar{display:none;}" +
    ".mgrv-card{flex:0 0 auto;width:200px;text-decoration:none;color:#0d0d0d;}" +
    ".mgrv-imw{width:200px;height:300px;overflow:hidden;background:#f4f2ef;}" +
    ".mgrv-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .9s cubic-bezier(.19,1,.22,1);}" +
    ".mgrv-card:hover .mgrv-img{transform:scale(1.05);}" +
    ".mgrv-nm{font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;line-height:1.5;margin:14px 0 5px;}" +
    ".mgrv-pr{font-size:11px;color:#7a7a7a;letter-spacing:.04em;}" +
    "@media(max-width:768px){.mgrv{padding:48px 24px 64px;}.mgrv-card,.mgrv-imw{width:150px;}.mgrv-imw{height:225px;}}"
  );
  function buildRecent() {
    if (!rvPDP()) { var stale = document.querySelector(".mgrv"); if (stale) stale.remove(); return; }
    rvTrack();
    var cur = rvHref();
    var items = rvRead().filter(function (x) { return x.h !== cur && x.n; });
    var host = document.querySelector(".mgrv");
    if (items.length < 1) { if (host) host.remove(); return; }
    /* Anchor on the footer so we always sit directly ABOVE it (= below the cross-sell,
       the last PDP section). Wait until it exists — never append loose at the end, or
       a later footer build would land above us. */
    var foot = document.querySelector(".mg-foot");
    if (!foot || !foot.parentNode) return; /* observer will retry once the footer is built */
    /* idempotent + stale guard: rebuild only when the page or the item set changed */
    if (host && host.getAttribute("data-for") === cur && host.getAttribute("data-n") === String(items.length)) {
      if (host.nextElementSibling !== foot) foot.parentNode.insertBefore(host, foot); /* self-heal position */
      return;
    }
    if (host) host.remove();
    var sec = document.createElement("div");
    sec.className = "mgrv";
    sec.setAttribute("data-for", cur);
    sec.setAttribute("data-n", String(items.length));
    sec.innerHTML =
      '<div class="mgrv-h">SON BAKTIKLARIN</div>' +
      '<div class="mgrv-row">' +
      items.map(function (x) {
        return '<a class="mgrv-card" href="' + x.h + '">' +
          '<div class="mgrv-imw">' + (x.i ? '<img class="mgrv-img" src="' + rvSmall(x.i) + '" alt="" loading="lazy">' : "") + "</div>" +
          '<div class="mgrv-nm">' + esc(x.n) + "</div>" +
          (x.p ? '<div class="mgrv-pr">' + esc(x.p) + "</div>" : "") +
          "</a>";
      }).join("") +
      "</div>";
    foot.parentNode.insertBefore(sec, foot); /* directly above the footer = below the cross-sell */
  }

  /* =========================================================================
     §9 — ORDER TRACKING  (route-gated: /siparis-takibi)
     A post-purchase trust page. The customer pastes the tracking number from
     their shipping email; we fetch the masked timeline from the tracking Worker
     (TRACK_API) — which builds it from 17track's NORMALIZED stage enum only, so
     no origin / carrier / country text ever reaches the browser. Until TRACK_API
     is set, a DEMO payload renders so the UI can be verified.

     Driven by the shared footer observer (so it also fires on SPA navigation),
     same shell-hide approach as §5 policy pages. TR only (storefront default).
     ========================================================================= */
  css(
    ".mgtr{max-width:720px;margin:0 auto;padding:120px 40px 120px;}" +
    ".mgtr-kicker{font-size:9px;font-weight:600;letter-spacing:.25em;color:#7a7a7a;text-transform:uppercase;margin-bottom:32px;}" +
    ".mgtr-title{font-size:34px;font-weight:300;letter-spacing:.04em;color:#0d0d0d;margin:0 0 28px;line-height:1.25;}" +
    ".mgtr-lead{font-size:15px;font-weight:300;color:#444;line-height:2;margin:0 0 40px;letter-spacing:.01em;}" +
    ".mgtr-form{display:flex;gap:0;border-bottom:1px solid #0d0d0d;}" +
    ".mgtr-input{flex:1;border:none;outline:none;background:transparent;font-family:'Montserrat',sans-serif;" +
      "font-size:15px;font-weight:300;letter-spacing:.06em;color:#0d0d0d;padding:14px 0;}" +
    ".mgtr-input::placeholder{color:#c4c0bb;letter-spacing:.04em;}" +
    ".mgtr-btn{background:none;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;" +
      "font-size:11px;font-weight:600;letter-spacing:.18em;color:#0d0d0d;text-transform:uppercase;padding:0 0 0 20px;transition:opacity .2s;}" +
    ".mgtr-btn:hover{opacity:.5;}" +
    ".mgtr-btn[disabled]{opacity:.35;cursor:default;}" +
    ".mgtr-hint{font-size:12px;color:#9a9a9a;letter-spacing:.02em;margin-top:14px;line-height:1.7;}" +
    ".mgtr-result{margin-top:64px;}" +
    ".mgtr-msg{font-size:14px;font-weight:300;color:#555;line-height:1.9;letter-spacing:.01em;}" +
    ".mgtr-status-h{font-size:22px;font-weight:300;letter-spacing:.03em;color:#0d0d0d;margin:0 0 12px;}" +
    ".mgtr-status-s{font-size:14px;font-weight:300;color:#555;line-height:1.95;letter-spacing:.01em;margin:0 0 8px;}" +
    ".mgtr-est{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#0d0d0d;margin:28px 0 0;}" +
    ".mgtr-line{margin:48px 0 0;padding:0;list-style:none;}" +
    ".mgtr-step{position:relative;padding:0 0 34px 34px;}" +
    ".mgtr-step:before{content:'';position:absolute;left:5px;top:14px;bottom:-6px;width:1px;background:#e2dfdb;}" +
    ".mgtr-step:last-child:before{display:none;}" +
    ".mgtr-dot{position:absolute;left:0;top:4px;width:11px;height:11px;border:1px solid #cfcbc6;background:#fff;border-radius:0;}" +
    ".mgtr-step.done .mgtr-dot{background:#0d0d0d;border-color:#0d0d0d;}" +
    ".mgtr-step.done:before{background:#0d0d0d;}" +
    ".mgtr-step.active .mgtr-dot{border-color:#0d0d0d;box-shadow:0 0 0 4px rgba(13,13,13,.08);}" +
    ".mgtr-step-label{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#bdbab6;line-height:1.4;}" +
    ".mgtr-step.done .mgtr-step-label,.mgtr-step.active .mgtr-step-label{color:#0d0d0d;}" +
    ".mgtr-step-loc{font-size:12px;font-weight:300;color:#9a9a9a;letter-spacing:.02em;margin-top:5px;}" +
    ".mgtr-step-date{font-size:11px;color:#bdbab6;letter-spacing:.04em;margin-top:4px;}" +
    ".mgtr-support{margin-top:56px;padding-top:28px;border-top:1px solid #e8e6e3;font-size:13px;font-weight:300;color:#777;letter-spacing:.01em;line-height:1.9;}" +
    ".mgtr-support a{color:#0d0d0d;text-decoration:underline;text-underline-offset:2px;}" +
    "@media(max-width:768px){.mgtr{padding:88px 24px 80px;}.mgtr-title{font-size:26px;}.mgtr-status-h{font-size:19px;}}"
  );

  function isTrackRoute() { return /^\/siparis-takibi\/?$/.test(location.pathname); }

  function trFmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    try { return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  function trEstimate(est) {
    if (!est) return "";
    if (est.from && est.to) return "Tahmini teslimat · " + trFmtDate(est.from) + " – " + trFmtDate(est.to);
    if (est.on) return "Tahmini teslimat · " + trFmtDate(est.on);
    return "";
  }

  /* Demo payload — only used while TRACK_API is unset, so the page is reviewable
     before the Worker is deployed. Mirrors the Worker's output shape exactly. */
  function trDemo(number) {
    var today = Date.now();
    function ago(d) { return new Date(today - d * 864e5).toISOString(); }
    return {
      ok: true, number: number, stage: "transit", delivered: false,
      headline: "Parçanız yolda",
      sub: "Siparişiniz size doğru ilerliyor. Tahmini teslimat penceresi içindesiniz.",
      estimate: { from: new Date(today + 3 * 864e5).toISOString(), to: new Date(today + 7 * 864e5).toISOString() },
      updatedAt: ago(1),
      steps: [
        { key: "prep", label: "Hazırlanıyor", location: "Mermaid's Glance Lojistik Merkezi", date: ago(6), done: true, active: false },
        { key: "shipped", label: "Sevk Edildi", location: "Uluslararası Sevkiyat Birimi · Avrupa", date: ago(5), done: true, active: false },
        { key: "transit", label: "Yolda", location: "Dağıtım Hattı", date: ago(1), done: false, active: true },
        { key: "customs", label: "Yurda Giriş", location: "Türkiye Dağıtım Merkezi · İstanbul", date: null, done: false, active: false },
        { key: "delivery", label: "Dağıtımda", location: "Yerel Teslimat Şubesi", date: null, done: false, active: false },
        { key: "delivered", label: "Teslim Edildi", location: "Teslim Adresi", date: null, done: false, active: false }
      ]
    };
  }

  var SUPPORT_HTML =
    '<div class="mgtr-support">Beklediğinizden uzun mu sürdü, ya da bir sorunuz mu var? ' +
    'Kişisel olarak ilgileniriz — <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a></div>';

  function trRender(box, data) {
    if (!data || !data.ok) {
      box.innerHTML = '<p class="mgtr-msg">' + esc((data && data.message) || "Takip bilgisine ulaşılamadı.") + "</p>" + SUPPORT_HTML;
      return;
    }
    var est = trEstimate(data.estimate);
    var steps = (data.steps || []).map(function (s) {
      var cls = "mgtr-step" + (s.done ? " done" : "") + (s.active ? " active" : "");
      return '<li class="' + cls + '">' +
        '<span class="mgtr-dot"></span>' +
        '<div class="mgtr-step-label">' + esc(s.label) + "</div>" +
        '<div class="mgtr-step-loc">' + esc(s.location || "") + "</div>" +
        (s.date ? '<div class="mgtr-step-date">' + esc(trFmtDate(s.date)) + "</div>" : "") +
        "</li>";
    }).join("");
    box.innerHTML =
      '<div class="mgtr-status-h">' + esc(data.headline || "") + "</div>" +
      '<div class="mgtr-status-s">' + esc(data.sub || "") + "</div>" +
      (est ? '<div class="mgtr-est">' + esc(est) + "</div>" : "") +
      '<ul class="mgtr-line">' + steps + "</ul>" +
      SUPPORT_HTML;
  }

  function trSubmit() {
    var inp = document.getElementById("mgtr-input");
    var btn = document.getElementById("mgtr-btn");
    var box = document.getElementById("mgtr-result");
    if (!inp || !box) return;
    var num = (inp.value || "").trim();
    if (!num) { inp.focus(); return; }
    box.innerHTML = '<p class="mgtr-msg">Aranıyor…</p>';
    if (btn) btn.setAttribute("disabled", "disabled");
    function done() { if (btn) btn.removeAttribute("disabled"); }

    if (!TRACK_API) { setTimeout(function () { trRender(box, trDemo(num.toUpperCase())); done(); }, 450); return; }

    fetch(TRACK_API + "?number=" + encodeURIComponent(num), { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (j) { trRender(box, j); done(); })
      .catch(function () {
        trRender(box, { ok: false, message: "Takip bilgisine şu anda ulaşılamıyor. Lütfen birazdan tekrar deneyin." });
        done();
      });
  }

  function buildTracking() {
    if (!isTrackRoute()) return;
    if (document.querySelector(".mgtr")) return; /* idempotent */
    var root = document.getElementById("root");
    var wrap = root && root.children[0];
    if (!wrap) return;
    /* Empty shell: hide every page section except the footer (header is on body). */
    Array.from(wrap.children).forEach(function (el) {
      if (!el.classList.contains("mg-foot")) el.style.display = "none";
    });
    var el = document.createElement("div");
    el.className = "mgtr";
    el.innerHTML =
      '<div class="mgtr-kicker">MERMAID\'S GLANCE</div>' +
      '<h1 class="mgtr-title">SİPARİŞ TAKİBİ</h1>' +
      '<p class="mgtr-lead">Siparişinizin yolculuğunu izleyin. Takip numaranızı girin; parçanızın size ulaşana dek geçtiği aşamaları burada görürsünüz.</p>' +
      '<div class="mgtr-form">' +
        '<input id="mgtr-input" class="mgtr-input" type="text" placeholder="Takip numaranız" autocomplete="off" spellcheck="false">' +
        '<button id="mgtr-btn" class="mgtr-btn" type="button">Takip Et</button>' +
      '</div>' +
      '<div class="mgtr-hint">Takip numaranızı sipariş onay ve kargo bildirim e-postanızda bulabilirsiniz.</div>' +
      '<div id="mgtr-result" class="mgtr-result"></div>';
    var foot = wrap.querySelector(".mg-foot");
    if (!foot) {
      /* Blank generic LF page: no native footer section exists for §3 to dress,
         so build one here from FOOT_HTML (already styled + idempotent). */
      foot = document.createElement("footer");
      foot.className = "mg-foot";
      foot.innerHTML = FOOT_HTML;
      wrap.appendChild(foot);
    }
    wrap.insertBefore(el, foot);

    el.querySelector("#mgtr-btn").addEventListener("click", trSubmit);
    el.querySelector("#mgtr-input").addEventListener("keydown", function (e) { if (e.key === "Enter") trSubmit(); });

    /* Deep-link support: /siparis-takibi?number=XXXX auto-runs the lookup. */
    var pre = new URLSearchParams(location.search).get("number");
    if (pre) { el.querySelector("#mgtr-input").value = pre; trSubmit(); }
  }

  /* =========================================================================
     §10 — MATERIAL-ICONS LIGATURE FALLBACK (global)
     LF markup uses <span class="material-icons">question_mark</span> and relies
     on the Material Icons ligature font — which this funnel never loads (and
     the Montserrat reset would override anyway). The raw ligature NAME renders
     as visible junk text: "question_mark" inside the checkout phone field,
     "arrow_forward" next to "Tümünü Keşfet" on home. Map known names to plain
     unicode; hide unknown ones. Skipped entirely if the real font ever loads.
     ========================================================================= */
  (function () {
    var MAP = {
      question_mark: "?", help: "?", help_outline: "?",
      arrow_forward: "→", arrow_back: "←", arrow_right_alt: "→",
      chevron_right: "›", chevron_left: "‹",
      keyboard_arrow_down: "⌄", keyboard_arrow_up: "⌃",
      keyboard_arrow_right: "›", keyboard_arrow_left: "‹",
      expand_more: "⌄", expand_less: "⌃", east: "→", west: "←",
      close: "✕", check: "✓", done: "✓", add: "+", remove: "−"
    };
    function fontLive() {
      try { return document.fonts && document.fonts.check('16px "Material Icons"'); } catch (e) { return false; }
    }
    function fix() {
      if (fontLive()) return;
      var els = document.querySelectorAll(".material-icons,.material-icons-outlined,.material-symbols-outlined");
      for (var i = 0; i < els.length; i++) {
        var el = els[i]; if (el.__mgLig) continue;
        var t = (el.textContent || "").trim();
        if (!/^[a-z0-9_]+$/.test(t)) continue; /* already a real glyph/char */
        el.__mgLig = 1;
        if (MAP[t]) { el.textContent = MAP[t]; el.style.fontFamily = "inherit"; }
        else el.style.display = "none"; /* unknown name — hide the junk text */
      }
    }
    fix();
    var ligT; new MutationObserver(function () { clearTimeout(ligT); ligT = setTimeout(fix, 200); })
      .observe(document.documentElement, { childList: true, subtree: true });
  })();

  /* =========================================================================
     §11 — TEMPLATE-JUNK SECTION HIDER (global)
     The LF theme shipped with ARABIC placeholder sections ("كن أنيقا" /
     "احصل على مظهر جديد يليق بك") that still render above the home footer.
     Step content is not writable via the app-token API, so hide any SECTION
     whose visible text is Arabic-dominant — nothing brand-side is Arabic.
     ========================================================================= */
  (function () {
    function sweep() {
      var secs = document.querySelectorAll("section");
      for (var i = 0; i < secs.length; i++) {
        var s = secs[i]; if (s.__mgAr) continue;
        var t = (s.innerText || "").trim(); if (t.length < 2) continue;
        var ar = (t.match(/[؀-ۿ]/g) || []).length;
        if (ar >= 8 && ar > t.replace(/\s/g, "").length * 0.3) {
          s.style.cssText = "display:none!important"; s.__mgAr = 1;
        }
      }
    }
    sweep();
    var arT; new MutationObserver(function () { clearTimeout(arT); arT = setTimeout(sweep, 300); })
      .observe(document.documentElement, { childList: true, subtree: true });
  })();

  /* =========================================================================
     §12 — ENGLISH PRODUCT TITLES UNDER lang=tr (dotted-İ fix, global)
     The document is lang=tr (i18n sets it), so CSS text-transform:uppercase
     maps i→İ and English titles render "WHİTE / EMBROİDERY". Stamp lang="en"
     on leaf elements that look like English catalog titles (contain the brand
     "NAME – Description" en-dash and no Turkish letters) so the case mapping
     uses English rules. Turkish copy always contains ç/ğ/ş/ı/ö/ü → untouched.
     ========================================================================= */
  (function () {
    var TR = /[çğışöüÇĞİŞÖÜ]/;
    /* task-10 item 3: the en-dash heuristic missed FR/short titles (Culotte Alba)
       and stray EN strings → FİNE/CHEMİSE/NOİR/SEDUCTİON (task-01 finding 8).
       Fallback: no Turkish letters AND a known EN/FR catalog word → lang=en.
       Word list is closed (no bare heuristics) so Turkish copy that happens to
       lack ç/ğ/ş/ı/ö/ü ("iade", "beden") can never be stamped by accident. */
    var EN = /\b(fine|noir|chemise|seduction|piece|pieces|lace|mesh|silk|satin|sheer|strappy|cutout|nightie|kimono|gloves?|ring|fishnet|print|floral|embroidery|voile|linen|tulle|maxi|midi|mini|dress|robe|garter|harness|bandeau|culottes?|nuisette|harnais|string|graphic|velvet|crystal|bodysuits?|body|stockings?|corset|bustier|choker|cape|teddy|romper|babydoll|camisole|briefs?|selected|nothing)\b/i;
    function stamp() {
      var els = document.querySelectorAll("h1,h2,h3,a,p,div,span");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.__mgLang || el.children.length > 0) continue;
        var t = el.textContent || "";
        if (t.length < 4 || TR.test(t)) continue;
        /* wordlist path additionally requires a lowercase "i": without one the
           i→İ bug cannot occur, and this skips ambiguous all-caps Turkish
           ("SATIN AL" matches the EN word "satin" but carries no i to break). */
        if (t.indexOf("–") < 0 && !(EN.test(t) && /i/.test(t))) continue;
        el.__mgLang = 1; el.setAttribute("lang", "en");
      }
    }
    stamp();
    var lgT; new MutationObserver(function () { clearTimeout(lgT); lgT = setTimeout(stamp, 300); })
      .observe(document.documentElement, { childList: true, subtree: true });
    /* Live finding (2026-07-11 deploy check): on the LF PDP the observers set up
       from head scripts never fired (React hydration #423 fallback suspected),
       so late-rendered titles were never stamped. Interval safety pass — stamp
       is idempotent (__mgLang skip) and cheap on a settled DOM. */
    setInterval(stamp, 1500);
  })();

  /* =========================================================================
     §13 — KLAVIYO ONSITE TRACKING (global)
     Ships here instead of inline: header_scripts headroom is ~4 bytes and this
     is not render-critical. Sends the client-side events that drive the
     abandonment flows (see klaviyo/README.md):
       • Active on Site   — automatic once klaviyo.js loads
       • Viewed Product   — on PDP, from window.data.product
       • Added to Cart    — chained on the inline /lfevents add_to_cart intercept
       • Started Checkout — on checkout route, once a valid email is present
     Placed Order / Fulfilled stay server-side (events-worker) — a browser
     event can be blocked/closed and must not be the source of truth.
     Only the public 6-char company_id lives here; NEVER the pk_ key.
     ========================================================================= */
  (function () {
    var COMPANY_ID = "WwEqh4"; /* public Klaviyo site id */
    if (!COMPANY_ID || COMPANY_ID === "COMPANY_ID" || window.__mgKlv) return;
    window.__mgKlv = 1;

    /* Load Klaviyo onsite JS async (handles Active on Site by itself). */
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=" + COMPANY_ID;
    document.head.appendChild(s);

    /* Write to _learnq, NOT window.klaviyo: the live klaviyo.js build drains the
       legacy _learnq queue (and _klOnsite) but leaves window.klaviyo's native
       Array push untouched, so events pushed there never flush (verified
       2026-07-06, klaviyo/README.md §CANLI DURUM). The ["identify",…] /
       ["track",name,props] / ["trackViewedItem",…] formats below are the
       _learnq API verbatim — do not change the call shapes. */
    var k = (window._learnq = window._learnq || []);
    var money = function (v) { var n = parseFloat(v); return isNaN(n) ? undefined : n; };

    /* ---- Viewed Product (PDP) --------------------------------------------
       window.data.product is LF's product model on a product route (verified). */
    var lastViewedId = null;
    function trackViewedProduct() {
      var p = window.data && window.data.product;
      if (!p || !p.id || String(p.id) === lastViewedId) return;
      lastViewedId = String(p.id);
      var item = {
        ProductName: p.title || p.name,
        ProductID:   String(p.id),
        URL:         location.href,
        ImageURL:    (p.image && (p.image.src || p.image.url)) ||
                     (p.images && p.images[0] && (p.images[0].src || p.images[0].url)),
        Price:       money(p.price)
      };
      k.push(["track", "Viewed Product", item]);
      k.push(["trackViewedItem", { Title: item.ProductName, ItemId: item.ProductID,
        Url: item.URL, ImageUrl: item.ImageURL, Metadata: { Price: item.Price } }]);
    }

    /* ---- Identify + Started Checkout --------------------------------------
       LF is a SPA with no purchase-intent hook we can trust, so we watch for a
       valid email in any checkout-context field and fire once per route entry. */
    var lastEmail = null, checkoutSent = false;
    var reMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function onCheckout() {
      /* LF checkout slugs are opaque hashes (/m2xI2CayP) and the DOM exposes no
         [name="payment"] hook — both old heuristics silently missed the live
         checkout (verified 2026-07-05: Started Checkout never fired). LF's own
         SPA state is the reliable signal. */
      return !!(window.data && window.data.step_type === "checkout_page") ||
             /checkout|payment|odeme|ödeme/i.test(location.pathname + location.search);
    }

    function cartItems() {
      /* Prefer LF's server cart if exposed; fall back to the drawer's localStorage mirror. */
      var c = (window.data && (window.data.cart || window.data.checkout)) || null;
      var items = (c && (c.items || c.line_items)) || null;
      if (!items) { try { items = JSON.parse(localStorage.getItem("mg_cart") || "null"); } catch (e) {} }
      return Array.isArray(items) ? items : [];
    }

    function sweep() {
      var inp = document.querySelector('input[type="email"],input[name*="mail" i]');
      var email = inp && inp.value && inp.value.trim();
      if (email && reMail.test(email) && email !== lastEmail) {
        lastEmail = email;
        k.push(["identify", { $email: email }]);
      }
      if (lastEmail && onCheckout() && !checkoutSent) {
        var items = cartItems();
        /* drawer-mirror items carry the numeric price as `pn`, not `price` */
        var total = items.reduce(function (t, i) {
          return t + (money(i.price != null ? i.price : i.pn) || 0) * (i.quantity || i.qty || 1); }, 0);
        k.push(["track", "Started Checkout", {
          $email: lastEmail,
          $value: total || undefined,
          CheckoutURL: location.href, /* terk-ödeme maili CTA'sı: {{ event.CheckoutURL }} */
          ItemNames: items.map(function (i) { return i.title || i.name; }),
          Items: items.map(function (i) {
            return { ProductName: i.title || i.name, Quantity: i.quantity || i.qty || 1,
                     ItemPrice: money(i.price != null ? i.price : i.pn), ProductID: String(i.id || i.product_id || "") }; })
        }]);
        checkoutSent = true;
      }
    }

    /* Fire on load + on SPA route/DOM changes (debounced — the LF SPA churns). */
    function boot() { trackViewedProduct(); sweep(); }
    if (document.readyState !== "loading") boot();
    else document.addEventListener("DOMContentLoaded", boot);

    var lastPath = location.pathname, kvT;
    new MutationObserver(function () {
      clearTimeout(kvT);
      kvT = setTimeout(function () {
        if (location.pathname !== lastPath) { lastPath = location.pathname; checkoutSent = false; lastViewedId = null; trackViewedProduct(); }
        sweep();
      }, 250);
    }).observe(document.documentElement, { childList: true, subtree: true });

    /* ---- Added to Cart ---------------------------------------------------
       The inline drawer (header-scripts.html) already intercepts LF's
       /lfevents add_to_cart calls and writes the freshly-added line into the
       mg_cart mirror (v26 single writer). mg.js loads AFTER that inline
       wrapper, so wrapping window.fetch here chains on top of it: by the time
       this runs, the inline handler has synchronously updated the mirror, so
       the item that was just added is the mirror's tail. We only READ and fire
       Klaviyo — never touch the cart. Prefer window.data.product for the added
       item's identity (ATC happens on the PDP where it is populated); fall back
       to the mirror tail. USD only: the mirror carries the numeric price as
       `pn`. Placed Order stays server-side (events-worker) — never here. */
    (function () {
      var of = window.fetch;
      if (typeof of !== "function") return;
      window.fetch = function (url, opts) {
        var pr = of.apply(this, arguments);
        try {
          var u = (typeof url === "string") ? url : (url && url.url);
          if (u && u.indexOf("/lfevents") > -1 && opts && opts.body) {
            var bd = JSON.parse(opts.body);
            var isAdd = bd && bd.events && bd.events.some(function (e) { return e && e.type === "add_to_cart"; });
            if (isAdd) {
              var items = []; try { items = JSON.parse(localStorage.getItem("mg_cart") || "[]") || []; } catch (e) {}
              var tail = items[items.length - 1] || {};
              var p = window.data && window.data.product;
              var addName  = (p && (p.title || p.name)) || tail.name;
              var addId    = (p && p.id != null) ? String(p.id) : String(tail.vid || tail.uid || "");
              var addPrice = money(p && p.price); if (addPrice == null) addPrice = money(tail.pn);
              var count = items.reduce(function (t, x) { return t + (x.qty || 1); }, 0);
              k.push(["track", "Added to Cart", {
                $value: addPrice,
                AddedItemProductName: addName,
                AddedItemProductID: addId,
                AddedItemPrice: addPrice,
                AddedItemQuantity: tail.qty || 1,
                ItemNames: items.map(function (x) { return x.name; }),
                CartItemCount: count
              }]);
            }
          }
        } catch (e) {}
        return pr;
      };
    })();
  })();

  /* =========================================================================
     §14 — CHECKOUT CART SYNC (route: checkout step)
     LF builds the server checkout from the cart cookie ONLY on a full page
     entry. The drawer's qty/remove steppers write that cookie (v26 single
     writer), so an edit made while ALREADY on the checkout never reaches the
     order — the customer pays the stale amount (reproduced live 2026-07-05:
     drawer 10→8, summary stayed at 10). Fix: when a drawer edit happens on the
     checkout step, force a reload as soon as the drawer closes.
     A reload wipes everything the customer already typed (verified live), so
     the typed contact/address fields are continuously snapshotted to
     sessionStorage and restored after any checkout (re)load. Card fields live
     in Stripe iframes — unreachable by design, never touched. */
  (function () {
    var SNAP_KEY = "mgCoFields";
    function onCo() { return !!(window.data && window.data.step_type === "checkout_page"); }

    /* ---- field snapshot / restore -------------------------------------- */
    function formEls() {
      return Array.prototype.slice.call(document.querySelectorAll("input,select,textarea")).filter(function (el) {
        if (el.closest("#mgcd-pn,#mg-header,#mg-sticky-atc")) return false;
        var t = (el.type || "").toLowerCase();
        return t !== "hidden" && t !== "submit" && t !== "button" && t !== "password" && t !== "file";
      });
    }
    function keyOf(el, i) {
      return (el.name || el.placeholder || el.getAttribute("aria-label") || el.type || "f") + "#" + i;
    }
    function snap() {
      if (!onCo()) return;
      var out = {};
      formEls().forEach(function (el, i) {
        if (el.type === "checkbox" || el.type === "radio") { out[keyOf(el, i)] = el.checked ? "1" : "0"; }
        else if (el.value) { out[keyOf(el, i)] = el.value; }
      });
      try { sessionStorage.setItem(SNAP_KEY, JSON.stringify(out)); } catch (e) {}
    }
    /* React-controlled inputs ignore plain .value writes — go through the
       native setter, then fire input/change so LF's state adopts the value. */
    function setVal(el, v) {
      var proto = el.tagName === "SELECT" ? window.HTMLSelectElement
                : el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement : window.HTMLInputElement;
      try {
        var d = Object.getOwnPropertyDescriptor(proto.prototype, "value");
        if (d && d.set) d.set.call(el, v); else el.value = v;
      } catch (e) { el.value = v; }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function restore() {
      if (!onCo()) return;
      var saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(SNAP_KEY) || "null"); } catch (e) {}
      if (!saved) return;
      formEls().forEach(function (el, i) {
        var v = saved[keyOf(el, i)];
        if (v == null) return;
        if (el.type === "checkbox" || el.type === "radio") return; /* leave LF defaults alone */
        if (!el.value && v) setVal(el, v); /* only fill EMPTY fields — never fight the user */
      });
    }
    /* LF hydrates late; retry a few times, filling only still-empty fields. */
    var rTries = 0;
    var rT = setInterval(function () {
      if (onCo()) restore();
      if (++rTries > 6) clearInterval(rT);
    }, 700);

    /* continuous snapshot while typing on checkout (any later reload restores) */
    var sT;
    document.addEventListener("input", function () { clearTimeout(sT); sT = setTimeout(snap, 300); }, true);
    document.addEventListener("change", function () { clearTimeout(sT); sT = setTimeout(snap, 300); }, true);

    /* ---- dirty tracking + reload on drawer close ------------------------ */
    var dirty = false;
    function wrap(name) {
      var orig = window[name];
      if (typeof orig !== "function" || orig.__mgW) return !!(orig && orig.__mgW);
      var w = function () { var r = orig.apply(this, arguments); if (onCo()) dirty = true; return r; };
      w.__mgW = 1; window[name] = w; return true;
    }
    var wTries = 0;
    var wT = setInterval(function () {
      var a = wrap("__mgQty"), b = wrap("__mgRm");
      if ((a && b) || ++wTries > 40) clearInterval(wT);
    }, 250);

    function veil() {
      var d = document.createElement("div");
      d.style.cssText = "position:fixed;inset:0;background:#fafafa;z-index:100005;display:flex;align-items:center;justify-content:center;font:600 9px Montserrat,sans-serif;letter-spacing:.24em;color:#0d0d0d";
      d.textContent = "ÇANTA GÜNCELLENİYOR";
      document.body.appendChild(d);
    }
    /* Once LF has a ?checkout=<token> session (created the moment an email is
       typed), a plain reload rebuilds the summary from that SERVER record and
       even re-stomps the cart cookie from it (observed live: cookie 7 → back
       to 8 on the token page). So: re-assert the cookie from the drawer mirror
       (the user's intent), then leave the token behind — a bare-path entry
       makes LF rebuild from the cookie and mint a fresh, correct session. */
    function writeCookieFromMirror() {
      try {
        var items = JSON.parse(localStorage.getItem("mg_cart") || "[]");
        var m = document.cookie.match(/(?:^|;\s*)(lf_\d+_cart)=/);
        if (!m) return;
        var body = items.filter(function (it) { return it.vid; }).map(function (it) {
          return { variants: [{ id: it.vid, quantity: it.qty || 1 }], price_bundle: null };
        });
        if (!body.length && items.length) return; /* no vids captured — don't wipe a non-empty cart */
        document.cookie = m[1] + "=" + encodeURIComponent(JSON.stringify({ body: body })) + "; path=/";
      } catch (e) {}
    }
    function resync() {
      dirty = false;
      try { snap(); } catch (e) {}
      writeCookieFromMirror();
      veil();
      location.replace(location.pathname);
    }
    /* drawer CTA pressed while already on checkout: it navigates to the bare
       checkout path itself — just make sure the cookie carries the mirror
       state (LF may have stomped it from a stale token session) */
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".mgc-btn");
      if (b && onCo()) { try { snap(); } catch (er) {} writeCookieFromMirror(); }
    }, true);

    /* the drawer panel is built lazily on first open — watch for it, then
       watch its open-class; closing with pending edits triggers the resync */
    function watchPanel() {
      var pn = document.getElementById("mgcd-pn");
      if (!pn || pn.__mgW14) return; pn.__mgW14 = 1;
      var was = pn.classList.contains("open");
      new MutationObserver(function () {
        var is = pn.classList.contains("open");
        if (was && !is && dirty && onCo()) resync();
        was = is;
      }).observe(pn, { attributes: true, attributeFilter: ["class"] });
    }
    setInterval(watchPanel, 800);
  })();

  /* Shared by §15/§16: LF prints a compare-at price even when it equals the
     real price — a struck duplicate right under every line item. text-
     decoration is NOT inherited (it paints through children), so the decorated
     node may be a wrapper, not the text leaf. */
  function hideDupStruck() {
    [].slice.call(document.querySelectorAll("del,s,strike,span,div,p")).forEach(function (d) {
      var tx = (d.innerText || "").trim();
      if (!tx || tx.length > 24 || !/[₺$€]/.test(tx)) return;
      var tag = d.tagName;
      var struck = tag === "DEL" || tag === "S" || tag === "STRIKE" ||
                   /line-through/.test(getComputedStyle(d).textDecoration || "");
      if (!struck) return;
      var scope = (d.parentElement && d.parentElement.parentElement) || d.parentElement;
      if (scope && (scope.innerText || "").split(tx).length > 2) d.style.display = "none";
    });
  }
  /* Shared by §15/§16: an all-zero Discount/İndirim row says nothing — hide it. */
  function hideZeroDiscount() {
    [].slice.call(document.querySelectorAll("div")).forEach(function (e) {
      if (/^(discount|indirim|İndirim)\s*[₺$€]?\s?0[.,]00$/i.test((e.innerText || "").replace(/\s+/g, " ").trim())) e.style.display = "none";
    });
  }

  /* =========================================================================
     §15 — THANK-YOU PAGE BRAND PASS (route: thank_you step /h6D5J2Q1Y)
     LF's native thank-you is generic and off-brand ("Siparişin için teşekkür
     ederiz!" — exclamation, gratitude formula). Eylül's spec: confirm, state
     ownership, hand the customer the next step. Also the ONLY reliable place
     to clear the drawer mirror after a purchase — the step slug is an opaque
     hash the inline /thank|.../ regex can never match.
     ========================================================================= */
  (function () {
    function onTy() {
      return !!(window.data && window.data.step_type === "thank_you_page") ||
             /^\/h6D5J2Q1Y(\/|$)/.test(location.pathname);
    }
    css(".mg-ty-eyebrow{font-size:9px!important;font-weight:600!important;letter-spacing:.24em!important;text-transform:uppercase!important;color:#7a7a7a!important;font-family:'Montserrat',sans-serif!important;}"
      + ".mg-ty-h1{font-size:22px!important;font-weight:600!important;letter-spacing:.06em!important;color:#0d0d0d!important;font-family:'Montserrat',sans-serif!important;text-transform:none!important;}"
      + ".mg-ty-sub{font-size:11px!important;font-weight:400!important;letter-spacing:.04em!important;line-height:1.8!important;color:#4a4a4a!important;font-family:'Montserrat',sans-serif!important;}"
      + ".mg-ty-cta{display:flex;gap:12px;justify-content:center;margin:26px auto 6px;flex-wrap:wrap;}"
      + ".mg-ty-btn{display:inline-block;padding:15px 26px;font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;text-decoration:none;border-radius:0!important;transition:opacity .3s ease;}"
      + ".mg-ty-btn:hover{opacity:.7;}"
      + ".mg-ty-btn.pri{background:#0d0d0d;color:#fff;border:1px solid #0d0d0d;}"
      + ".mg-ty-btn.sec{background:transparent;color:#0d0d0d;border:1px solid #0d0d0d;}"
      + "html.mg-ty svg circle,html.mg-ty svg path{stroke:#0d0d0d;}");

    var cleared = false;
    function pass() {
      var on = onTy();
      document.documentElement.classList.toggle("mg-ty", on);
      if (!on) { cleared = false; return; }

      /* order is done — kill the phantom bag (mirror + cookie + badge) and the
         checkout field snapshot; do it once per route entry */
      if (!cleared) {
        cleared = true;
        try { window.__mgClearServer && window.__mgClearServer(); } catch (e) {}
        try { sessionStorage.removeItem("mgCoFields"); } catch (e) {}
        try { window.__mgSyncCount && window.__mgSyncCount(); } catch (e) {}
      }

      /* cross-tenant SSR leak seen live 2026-07-04 (foreign-tenant Arabic title) */
      if (!/mermaid/i.test(document.title)) document.title = "Mermaid's Glance";

      /* copy swaps (idempotent — each replacement no longer matches its source) */
      var leafs = document.querySelectorAll("h1,h2,h3,p,span,div");
      for (var i = 0; i < leafs.length; i++) {
        var el = leafs[i];
        if (el.children.length || el.closest("#mg-header,#mgcd-pn,.mgf-wrap,.mg-foot")) continue;
        var t = (el.innerText || "").trim();
        if (!t) continue;
        if (/^siparişiniz onaylandı\.?$/i.test(t)) { el.textContent = "SİPARİŞ ONAYLANDI"; el.classList.add("mg-ty-eyebrow"); }
        else if (/^(siparişin için teşekkür ederiz|thank you for your (order|purchase))[.!]?$/i.test(t)) { el.textContent = "Artık senin."; el.classList.add("mg-ty-h1"); }
        else if (/^siparişin gönderildiğinde sana bir kargo onayı göndereceğiz\.?$/i.test(t) || /^when your order (is|has) shipped/i.test(t)) {
          el.textContent = "Silüetin özenle hazırlanıyor. Gönderildiği an kargo onayı sana ulaşır.";
          el.classList.add("mg-ty-sub");
        }
        else if (/^sipariş özeti$/i.test(t) || /^order summary$/i.test(t)) { el.classList.add("mg-ty-eyebrow"); }
      }

      hideDupStruck();
      hideZeroDiscount();

      /* CTA block under the sub line (once) */
      if (!document.getElementById("mg-ty-cta")) {
        var sub = document.querySelector(".mg-ty-sub") || document.querySelector(".mg-ty-h1");
        if (sub) {
          var box = document.createElement("div");
          box.id = "mg-ty-cta"; box.className = "mg-ty-cta";
          box.innerHTML = '<a class="mg-ty-btn pri" href="/siparis-takibi">SİPARİŞİNİ TAKİP ET</a>'
                        + '<a class="mg-ty-btn sec" href="/">KOLEKSİYONA DÖN</a>';
          (sub.parentElement || sub).appendChild(box);
        }
      }
    }
    var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(pass, 300); })
      .observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(pass, 400); pass();
  })();

  /* =========================================================================
     §16 — CHECKOUT BRAND PASS (route: checkout step)
     Moved here from header_scripts (2026-07-05). The inline version detected
     the checkout by ENGLISH button text ("pay now") — LF now renders the
     checkout natively in Turkish, so it never activated: nav/search were back
     on the payment page, junk labels unhidden. step_type is language-proof.
     Also frees ~2.5KB of inline headroom (was 4 bytes).
     ========================================================================= */
  (function () {
    if (window.__mgCheckout16) return; window.__mgCheckout16 = true;
    var HIDE_TEXT = /free\s*ship|ücretsiz\s*kargo|duties|customs|other\s*payment|diğer\s*ödeme|keyboard_arrow/i;
    /* JS /i never matches İ↔i (Turkish dotted capital) — fold both to plain i
       before testing button labels like "SİPARİŞİ TAMAMLA". */
    function trNorm(s) { return (s || "").replace(/İ/g, "i").replace(/I/g, "i").toLowerCase(); }
    var PAY_RE = /^\s*(pay now|place order|complete order|siparişi tamamla|şimdi öde)\s*$/;
    /* nav/search/burger leave the payment page; the BAG stays — customers must
       be able to fix quantities here (§14 makes those edits actually stick) */
    css(".mg-co #mg-header .mgh-center,.mg-co #mg-header .mgh-burger,.mg-co #mg-header .mgh-search{display:none!important;}"
      + ".mg-co-h{font-size:12px!important;font-weight:600!important;letter-spacing:.2em!important;text-transform:uppercase!important;color:#0d0d0d!important;font-family:'Montserrat',sans-serif!important;}"
      + ".mg-co-lbl{font-size:9px!important;font-weight:600!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#7a7a7a!important;font-family:'Montserrat',sans-serif!important;}"
      + ".mg-co-tot{font-size:11px!important;font-weight:600!important;letter-spacing:.2em!important;text-transform:uppercase!important;color:#0d0d0d!important;font-family:'Montserrat',sans-serif!important;}"
      + ".mg-co-secure{display:flex;align-items:center;justify-content:center;gap:7px;font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#9a9a9a;margin:14px 0 4px;font-family:'Montserrat',sans-serif;}"
      + ".mg-co-badges{display:flex;align-items:center;justify-content:center;gap:14px;margin:6px 0 2px;opacity:.75;}"
      + ".mg-co-badges svg{display:block;height:15px;width:auto;}");
    function isCheckout() { return !!(window.data && window.data.step_type === "checkout_page"); }
    function brandPass() {
      var on = isCheckout();
      document.documentElement.classList.toggle("mg-co", on);
      if (!on) return;
      document.title = document.title.replace(/aether/ig, "Mermaid's Glance");
      [].slice.call(document.querySelectorAll("p,span,div")).forEach(function (e) {
        if (e.children.length) return; var tx = (e.innerText || "").trim();
        if (/^or$/i.test(tx) || /^question_mark$/i.test(tx)) { e.style.display = "none"; return; }
        if (/^(Contact|Delivery Address|Payment Method|Billing Address|Shipping Method|Order Summary|Shipping|İletişim|Teslimat Adresi|Ödeme Yöntemi|Fatura Adresi|Gönderim Yöntemi|Sipariş Özeti)$/i.test(tx)) e.classList.add("mg-co-h");
        else if (/^(Coupon|Subtotal|Discount|Shipping fee|Shipping|Kupon|Ara Toplam|İndirim|Kargo)$/i.test(tx)) e.classList.add("mg-co-lbl");
        else if (/^(Total|Toplam)$/i.test(tx)) e.classList.add("mg-co-tot");
      });
      hideZeroDiscount();
      hideDupStruck();
      /* relabel any residual english/express CTA to the brand imperative */
      [].slice.call(document.querySelectorAll("button")).forEach(function (b) {
        if (/^\s*(pay now|şimdi öde)\s*$/.test(trNorm(b.innerText))) {
          var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, null, false), n;
          while ((n = w.nextNode())) { if (/pay now|şimdi öde/.test(trNorm(n.nodeValue))) { n.nodeValue = "SİPARİŞİ TAMAMLA"; break; } }
        }
      });
      /* trust line above the pay button — text only, no emoji (brand rule) */
      if (!document.querySelector(".mg-co-secure")) {
        var pay = null, bb = document.querySelectorAll("button");
        for (var k = 0; k < bb.length; k++) { if (PAY_RE.test(trNorm(bb[k].innerText))) { pay = bb[k]; break; } }
        if (pay && pay.parentNode) { var sec = document.createElement("div"); sec.className = "mg-co-secure"; sec.textContent = "GÜVENLİ VE ŞİFRELİ ÖDEME"; pay.parentNode.insertBefore(sec, pay.nextSibling); }
      }
      /* task-10 item 5: card badges under the trust line — monochrome inline SVG,
         Visa + Mastercard only (owner-confirmed via Stripe; Troy NOT confirmed → omitted).
         Grayscale keeps the brand's quiet checkout language (no color logos). */
      if (!document.querySelector(".mg-co-badges")) {
        var secEl = document.querySelector(".mg-co-secure");
        if (secEl && secEl.parentNode) {
          var bdg = document.createElement("div");
          bdg.className = "mg-co-badges";
          bdg.innerHTML =
            '<svg role="img" aria-label="Visa" viewBox="0 0 44 15"><text x="0" y="13" font-family="Arial,Helvetica,sans-serif" font-size="14.5" font-style="italic" font-weight="800" letter-spacing="1" fill="#9a9a9a">VISA</text></svg>' +
            '<svg role="img" aria-label="Mastercard" viewBox="0 0 34 21"><circle cx="12" cy="10.5" r="9.5" fill="#adadad"/><circle cx="22" cy="10.5" r="9.5" fill="#8a8a8a" fill-opacity=".85"/></svg>';
          secEl.parentNode.insertBefore(bdg, secEl.nextSibling);
        }
      }
      /* Mobile: LF renders the order summary twice (top mobile-native + bottom
         desktop column). Restore first (no tag build-up), then on narrow
         screens keep the topmost and hide the lower duplicate. */
      [].slice.call(document.querySelectorAll("[data-mgdup]")).forEach(function (c) { c.style.display = ""; c.removeAttribute("data-mgdup"); });
      if (window.innerWidth <= 760) {
        var subs = [].slice.call(document.querySelectorAll("*")).filter(function (e) { return e.children.length === 0 && /^(subtotal|ara toplam)$/i.test((e.innerText || "").trim()) && e.offsetParent !== null; });
        function sumCard(sub) { var e = sub; for (var i = 0; i < 8; i++) { if (!e.parentElement) break; e = e.parentElement; var t = (e.innerText || "").toLowerCase(); if (/subtotal|ara toplam/.test(t) && /total|toplam/.test(t) && e.getBoundingClientRect().height < 700) return e; } return sub; }
        var cards = subs.map(sumCard);
        cards = cards.filter(function (c, i) { return cards.indexOf(c) === i && !cards.some(function (o, j) { return j !== i && o !== c && o.contains(c); }); });
        if (cards.length >= 2) {
          cards.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
          for (var m = 1; m < cards.length; m++) { cards[m].setAttribute("data-mgdup", "1"); cards[m].style.display = "none"; }
        }
      }
    }
    function hideEl(el) {
      if (!el || el.closest("#mg-header") || el.closest("#mgcd-pn") || el.closest("#mg-sticky-atc")) return;
      el.style.cssText = "display:none!important";
    }
    function clean() {
      /* NOT checkout-gated: the inline original swept every page (free-shipping
         badges, duty labels, ligature junk appear outside checkout too). */
      document.querySelectorAll('header:not(#mg-header),[class*="checkout-header"],[class*="checkoutHeader"],[class*="order-header"],[class*="storeName"],[class*="store-name"],[class*="brand-logo"]:not(#mg-header *)').forEach(function (el) { hideEl(el); });
      document.querySelectorAll("button,a").forEach(function (el) {
        if (!el.closest("#mg-header") && !el.closest("#mgcd-pn") && /other\s*payment|diğer\s*ödeme/i.test(el.innerText || "")) hideEl(el.closest("div,section") || el);
      });
      document.querySelectorAll("div,section,p").forEach(function (el) {
        var t = el.children.length === 0 ? (el.innerText || "").trim() : "";
        if (!t) return;
        if (/^(express\s*checkout|hızlı\s*ödeme)$/i.test(t)) hideEl(el.parentElement || el);
      });
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      var node;
      while ((node = walker.nextNode())) {
        var txt = node.nodeValue || "";
        if (HIDE_TEXT.test(txt)) {
          var p = node.parentElement;
          if (p && !p.closest("#mg-header") && !p.closest("#mgcd-pn") && !p.closest("#mg-sticky-atc")) {
            var el = p;
            while (el && el.parentElement && getComputedStyle(el).display === "inline") el = el.parentElement;
            hideEl(el);
          }
        }
      }
    }
    function run() { clean(); brandPass(); }
    var t16; new MutationObserver(function () { clearTimeout(t16); t16 = setTimeout(run, 300); })
      .observe(document.documentElement, { childList: true, subtree: true });
    var rt16; window.addEventListener("resize", function () { clearTimeout(rt16); rt16 = setTimeout(brandPass, 200); });
    setTimeout(run, 600); brandPass();
  })();

  /* =========================================================================
     §17 — SOCIETY SIGN-UP FORM (global, brand-owned full-page overlay)
     A pixel-controlled Montserrat / 0px-corner overlay (NOT a Klaviyo form
     builder embed) that writes the email to list WFRJ95 via Klaviyo's client
     subscriptions API — which in turn fires the (live) Welcome flow, so the
     SOCIETY10 code lands in the subscriber's inbox as Welcome Mail 1.
     Only the public company_id (WwEqh4) + list id (WFRJ95) live here.
     Shows once (first of: 25s dwell / desktop exit-intent / 55% scroll),
     honours a 14-day cool-off on close and a permanent silence on join,
     and never opens on checkout / thank-you / order-tracking / the password gate.
     ========================================================================= */
  (function () {
    if (window.__mgSociety) return;
    window.__mgSociety = 1;

    var COMPANY_ID = "WwEqh4", LIST_ID = "WFRJ95";
    var HERO = "https://d3k81ch9hvuctc.cloudfront.net/company/WwEqh4/images/ad249a64-549c-4980-8892-d7ed606f00ec.jpeg";
    var reMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var SEEN_MS = 14 * 24 * 60 * 60 * 1000;

    function ls(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function lset(key, v) { try { localStorage.setItem(key, v); } catch (e) {} }

    /* Routes where a lifestyle overlay would be intrusive or brand-wrong. */
    function excludedRoute() {
      var st = window.data && window.data.step_type;
      if (st === "checkout_page" || st === "thank_you_page") return true;
      if (/\/siparis-takibi/.test(location.pathname)) return true;
      if (document.querySelector('input[type="password"]')) return true; /* storefront password gate */
      return false;
    }

    function canShow() {
      if (ls("mg_society_member")) return false;                 /* joined → forever silent */
      try { if (sessionStorage.getItem("mg_society_session")) return false; } catch (e) {} /* once per session */
      var seen = parseInt(ls("mg_society_seen") || "0", 10);
      if (seen && (Date.now() - seen) < SEEN_MS) return false;   /* 14-day cool-off after a close */
      if (excludedRoute()) return false;
      return true;
    }

    css(
      "#mg-society{position:fixed;inset:0;z-index:2147483000;background:#fafafa;display:none;font-family:'Montserrat',-apple-system,'Segoe UI',Arial,sans-serif;color:#0d0d0d;}" +
      "#mg-society.open{display:flex;}" +
      ".mgso-hero{width:55%;height:100%;object-fit:cover;object-position:center 30%;display:block;}" +
      ".mgso-panel{width:45%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 56px;overflow-y:auto;}" +
      ".mgso-inner{width:100%;max-width:400px;}" +
      ".mgso-close{position:absolute;top:0;right:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#0d0d0d;font-size:22px;line-height:1;z-index:3;font-family:'Montserrat',Arial,sans-serif;}" +
      ".mgso-close:hover{opacity:.5;}" +
      ".mgso-wm{font-size:16px;letter-spacing:6px;font-weight:500;text-align:center;}" +
      ".mgso-rule{height:1px;background:#e6e6e6;margin:22px 0 24px;}" +
      ".mgso-eb{font-size:11px;letter-spacing:4px;color:#8a8a8a;text-transform:uppercase;text-align:center;}" +
      ".mgso-h{font-size:24px;font-weight:500;margin:14px 0 0;text-align:center;}" +
      ".mgso-p{font-size:14px;line-height:1.9;margin:14px 0 26px;text-align:center;}" +
      ".mgso-in{width:100%;box-sizing:border-box;border:1px solid #0d0d0d;border-radius:0!important;padding:14px;background:#fff;font-family:inherit;font-size:14px;color:#0d0d0d;outline:none;}" +
      ".mgso-in::placeholder{color:#bdbdbd;}" +
      ".mgso-btn{width:100%;box-sizing:border-box;background:#0d0d0d;color:#fafafa;border:none;border-radius:0!important;letter-spacing:3px;padding:16px;font-family:inherit;font-size:12px;font-weight:500;text-transform:uppercase;cursor:pointer;margin-top:14px;}" +
      ".mgso-btn:hover{opacity:.85;}" +
      ".mgso-note{font-size:10.5px;line-height:1.7;color:#8a8a8a;margin-top:16px;text-align:center;}" +
      ".mgso-foot{font-size:11px;letter-spacing:2px;color:#8a8a8a;text-align:center;margin-top:30px;}" +
      ".mgso-chip{display:inline-block;border:1px solid #0d0d0d;letter-spacing:5px;padding:14px 30px;font-size:13px;margin:8px 0 22px;}" +
      "@media(max-width:767px){#mg-society.open{flex-direction:column;}.mgso-hero{width:100%;height:42%;object-position:center 28%;}.mgso-panel{width:100%;height:58%;padding:28px;justify-content:flex-start;padding-top:40px;}.mgso-close{color:#fff;}}"
    );

    var built = false, openState = false;

    function buildOverlay() {
      if (built) return;
      built = true;
      var o = document.createElement("div");
      o.id = "mg-society";
      o.setAttribute("role", "dialog");
      o.setAttribute("aria-label", "Society");
      o.setAttribute("aria-modal", "true");
      o.innerHTML =
        '<img class="mgso-hero" src="' + HERO + '" alt="">' +
        '<button class="mgso-close" type="button" aria-label="Kapat">×</button>' +
        '<div class="mgso-panel"><div class="mgso-inner" id="mgso-inner">' +
          '<div class="mgso-wm">MERMAID\'S GLANCE</div>' +
          '<div class="mgso-rule"></div>' +
          '<div class="mgso-eb">SOCIETY</div>' +
          '<h2 class="mgso-h">Önce sen görürsün.</h2>' +
          '<p class="mgso-p">Yeni silüetler, dönen parçalar — ilk sana.<br>İlk seçimin için ayrılmış bir incelik seni bekliyor.</p>' +
          '<input class="mgso-in" id="mgso-email" type="email" placeholder="e-posta" autocomplete="email" inputmode="email">' +
          '<button class="mgso-btn" id="mgso-submit" type="button">KATIL</button>' +
          '<p class="mgso-note" id="mgso-note">Katılarak Mermaid\'s Glance\'ten e-posta almayı kabul edersin. Dilediğinde ayrılırsın.</p>' +
          '<div class="mgso-foot">Zarafetin Gücü.</div>' +
        '</div></div>';
      document.body.appendChild(o);
      o.querySelector(".mgso-close").addEventListener("click", close);
      o.querySelector("#mgso-submit").addEventListener("click", submit);
      o.querySelector("#mgso-email").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
      o.querySelector("#mgso-email").addEventListener("input", function () {
        var n = document.getElementById("mgso-note"); var i = document.getElementById("mgso-email");
        if (i) i.style.borderColor = "#0d0d0d";
        if (n) { n.style.color = "#8a8a8a"; n.textContent = "Katılarak Mermaid's Glance'ten e-posta almayı kabul edersin. Dilediğinde ayrılırsın."; }
      });
    }

    function open() {
      if (openState || excludedRoute()) return;
      buildOverlay();
      var o = document.getElementById("mg-society");
      if (!o) return;
      o.classList.add("open");
      openState = true;
      document.body.style.overflow = "hidden";
      try { sessionStorage.setItem("mg_society_session", "1"); } catch (e) {}
      var i = document.getElementById("mgso-email");
      if (i) setTimeout(function () { i.focus(); }, 80);
    }
    window.__mgSocietyOpen = open; /* §18 PDP köprüsü manuel tetik — beyin onaylı export */

    function hide() {
      var o = document.getElementById("mg-society");
      if (o) o.classList.remove("open");
      openState = false;
      document.body.style.overflow = "";
    }

    function close() {
      lset("mg_society_seen", String(Date.now())); /* 14-day cool-off */
      hide();
    }

    function submit() {
      var i = document.getElementById("mgso-email");
      var n = document.getElementById("mgso-note");
      var b = document.getElementById("mgso-submit");
      var email = i && i.value && i.value.trim();
      if (!email || !reMail.test(email)) { if (i) i.style.borderColor = "#900"; return; }
      if (b) { b.disabled = true; b.textContent = "…"; }
      fetch("https://a.klaviyo.com/client/subscriptions/?company_id=" + COMPANY_ID, {
        method: "POST",
        headers: { "Content-Type": "application/json", revision: "2024-10-15" },
        body: JSON.stringify({ data: { type: "subscription", attributes: {
          profile: { data: { type: "profile", attributes: { email: email } } },
          custom_source: "Society Signup"
        }, relationships: { list: { data: { type: "list", id: LIST_ID } } } } })
      }).then(function (r) {
        if (r.status >= 200 && r.status < 300) {
          lset("mg_society_member", "1"); /* forever silent */
          /* Merge the identity into the onsite queue (§13 uses _learnq). */
          try { (window._learnq = window._learnq || []).push(["identify", { $email: email }]); } catch (e) {}
          success();
        } else { fail(); }
      }).catch(fail);
      function fail() {
        if (b) { b.disabled = false; b.textContent = "KATIL"; }
        if (i) i.style.borderColor = "#900";
        if (n) { n.style.color = "#900"; n.textContent = "Bağlantı kurulamadı. Tekrar dene."; }
      }
    }

    function success() {
      var inner = document.getElementById("mgso-inner");
      if (!inner) return;
      inner.innerHTML =
        '<div class="mgso-wm">MERMAID\'S GLANCE</div>' +
        '<div class="mgso-rule"></div>' +
        '<h2 class="mgso-h">Yerin hazır.</h2>' +
        '<p class="mgso-p">İlk seçimin için ayırdık. Ayrıcalığın e-postanda.</p>' +
        '<div style="text-align:center"><span class="mgso-chip">SOCIETY10</span></div>' +
        '<button class="mgso-btn" id="mgso-explore" type="button">KEŞFET</button>' +
        '<p class="mgso-note">Zarafetle, Destina — Mermaid\'s Glance</p>';
      var e = document.getElementById("mgso-explore");
      if (e) e.addEventListener("click", hide); /* joined: just close, no cool-off write needed (member flag set) */
    }

    /* ---- Triggers: first of 25s dwell / desktop exit-intent / 55% scroll ---- */
    var armed = true;
    function fire() {
      if (!armed) return;
      if (!canShow()) { armed = false; teardown(); return; }
      armed = false;
      teardown();
      open();
    }
    function onScroll() {
      var h = document.documentElement;
      var reachable = (h.scrollHeight - h.clientHeight);
      if (reachable <= 0) return;
      if ((h.scrollTop || window.pageYOffset) / reachable >= 0.55) fire();
    }
    function onExit(e) { if (e.clientY <= 0 && !e.relatedTarget && !e.toElement) fire(); }
    var dwellT;
    function teardown() {
      clearTimeout(dwellT);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onExit);
    }

    if (canShow()) {
      dwellT = setTimeout(fire, 25000);
      window.addEventListener("scroll", onScroll, { passive: true });
      var mq = window.matchMedia && window.matchMedia("(min-width:768px) and (pointer:fine)");
      if (!mq || mq.matches) document.addEventListener("mouseout", onExit);
    }

    /* ESC closes; SPA route change into an excluded step auto-closes the overlay. */
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openState) close(); });
    var lastP = location.pathname, soT;
    new MutationObserver(function () {
      clearTimeout(soT);
      soT = setTimeout(function () {
        if (openState && excludedRoute()) hide();
        if (location.pathname !== lastP) { lastP = location.pathname; if (openState && excludedRoute()) hide(); }
      }, 250);
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();

  /* =========================================================================
     §18 — PDP TRUST LAYER (route: /products/..., task-10 / Cephe A)
     Three visibility-critical pieces that must NOT hide in an accordion:
       A single, short delivery-confidence line remains below the ATC block.
     Column gate reuses the inline export __mgPDPCol (no selector duplication).
     CLS: text-only nodes; live measurement is beyin's deploy-gate (card item 6).
     ========================================================================= */
  (function () {
    if (window.__mgPDPTrust) return; window.__mgPDPTrust = true;
    css(
      ".mg-pt-strip{margin:14px 0 0;padding:12px 2px;border-top:1px solid #e6e4e0;border-bottom:1px solid #e6e4e0;}" +
      ".mg-pt-strip span{font-size:11px;font-weight:400;letter-spacing:.02em;line-height:1.75;color:#666;font-family:'Montserrat',sans-serif;}" +
      ".mg-pdp-value{font-size:11px;line-height:1.7;letter-spacing:.02em;color:#555;margin:8px 0 2px;font-family:'Montserrat',sans-serif;}" +
      "@media(max-width:480px){.mg-pdp-edd{align-items:flex-start;}.mg-pdp-facts{gap:3px 9px;}.mg-pdp-facts span+span:before{margin-right:9px;}}"
    );
    /* Owner wave-3.2 2026-07-14: the telegraphic "Sade paket · takip bilgisi
       sevkiyatta" read as shipping metadata. Rewritten as brand prose that
       leads with the PRIVACY benefit (plain unbranded parcel) and keeps the
       tracking promise concrete ("takip kodu" — matches the trust voice card
       and /siparis-takibi reality). Both claims remain true on this store. */
    var STRIP_A = L("Only you know what is inside — a plain, unbranded parcel. Your tracking code arrives at dispatch.", "İçindekini yalnız sen bilirsin — sade, markasız paket. Takip kodu sevkiyatla birlikte sende.");
    function onPDP() { return /\/products\//.test(location.pathname) && !!(window.data && window.data.product); }
    function build() {
      if (!onPDP()) return;
      var col = window.__mgPDPCol && window.__mgPDPCol();
      if (!col) return;
      var p = window.data.product, pid = String(p.id || p.title || location.pathname), atcChild = null, kids = [].slice.call(col.children);
      for (var j = 0; j < kids.length; j++) {
        if (/add to (bag|cart)|sepete ekle|çantaya ekle|in die tasche|ajouter au panier/i.test(kids[j].innerText || "")) { atcChild = kids[j]; break; }
      }
      /* 1 — trust strip under the ATC child block (first screen) */
      var st = col.querySelector(".mg-pt-strip");
      if (!st && atcChild) {
        st = document.createElement("div"); st.className = "mg-pt-strip";
        atcChild.parentNode.insertBefore(st, atcChild.nextSibling);
      }
      if (st && atcChild && atcChild.parentNode && (st.parentNode !== atcChild.parentNode || st.previousElementSibling !== atcChild)) {
        atcChild.parentNode.insertBefore(st, atcChild.nextSibling);
      }
      if (st && (st.getAttribute("data-for") !== pid || st.textContent !== STRIP_A)) {
        st.innerHTML = "<span>" + STRIP_A + "</span>"; st.setAttribute("data-for", pid);
      }
    }
    var t18; new MutationObserver(function () { clearTimeout(t18); t18 = setTimeout(build, 250); })
      .observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(build, 600);
    /* Live finding (2026-07-11 deploy check): head-script observers never fired
       on the LF PDP, so blocks whose anchors (.mg-pdp-price / .mgpx) render
       after the 600ms pass were skipped forever. Interval safety pass — build
       is guarded-idempotent (three querySelector checks) and near-free. */
    setInterval(build, 1200);
  })();

  /* =========================================================================
     §20 — PDP ACCORDION CONTENT PASS (route: /products/...)
     Owner directive 2026-07-13: the accordions carry the full, explicit truth.
     (a) CARE RITUAL appended as icon rows — no per-product composition or
         bullet claims (none are verified; karar paketi P0-3).
     (b) The thin inline SIZE/RETURNS & HYGIENE and DELIVERY & TRACKING bodies
         are replaced with complete, numbered, claim-verified copy (every
         sentence maps to §5 policy / anayasa v1.3 / owner 24h SLA).
     Idempotent; interval-driven (LF head-script observers are unreliable).
     ========================================================================= */
  (function () {
    if (window.__mgPDPCare) return; window.__mgPDPCare = true;
    css(
      ".mg-care-lead{margin:0 0 12px;}" +
      ".mg-care-row{display:flex;align-items:center;gap:14px;padding:9px 0;}" +
      ".mg-care-row+.mg-care-row{border-top:1px solid #f0eeeb;}" +
      ".mg-care-ic{flex:none;width:34px;height:34px;border:1px solid #e6e4e0;display:flex;align-items:center;justify-content:center;color:#0d0d0d;}" +
      ".mg-care-ic svg{width:19px;height:19px;display:block;}" +
      ".mg-care-tx{font-size:12px;line-height:1.6;color:#555;}" +
      ".mg-care-close{margin:14px 0 0;}"
    );
    function onPDP() { return /\/products\//.test(location.pathname) && !!(window.data && window.data.product); }
    var IC = {
      wash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3.5 9h17l-2.1 9.5H5.6L3.5 9z"/><path d="M6.5 5.6c1.2-1.1 2.4-1.1 3.6 0 1.2 1.1 2.4 1.1 3.6 0 1.2-1.1 2.4-1.1 3.6 0"/></svg>',
      blc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 4.5 21 19.5H3L12 4.5z"/><path d="M4.5 5.5l15 14"/></svg>',
      tmb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="4" y="4" width="16" height="16"/><circle cx="12" cy="12" r="5"/><path d="M5 5l14 14"/></svg>',
      dry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="4" y="4" width="16" height="16"/><path d="M9 8.5v7M12 8.5v7M15 8.5v7"/></svg>',
      irn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 16.5h16.3l-1.3-5.2a2.7 2.7 0 0 0-2.6-2H10.2c-3.7 0-6.2 3-6.2 7.2z"/><path d="M4 5.5l16.5 13.5"/></svg>',
      dcl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="12" r="7.6"/><path d="M6.6 6.6l10.8 10.8"/></svg>'
    };
    function crow(ic, tx) { return '<div class="mg-care-row"><span class="mg-care-ic">' + ic + '</span><span class="mg-care-tx">' + tx + '</span></div>'; }
    var CARE_BODY =
      '<p class="mg-care-lead">' + L("The garment's label speaks first; if it says otherwise, follow the label.", "Önce parçanın etiketi konuşur; etiket farklı söylüyorsa o geçerlidir.") + '</p>' +
      crow(IC.wash, L("Wash gently by hand in cold water.", "Soğuk suda, elde, nazikçe yıka.")) +
      crow(IC.blc, L("Do not bleach.", "Çamaşır suyu kullanma.")) +
      crow(IC.tmb, L("Do not tumble dry; do not wring.", "Kurutucuya verme; sıkma.")) +
      crow(IC.dry, L("Dry flat or hung, in the shade.", "Gölgede, düz zeminde ya da askıda kurut.")) +
      crow(IC.irn, L("Do not iron.", "Ütüleme.")) +
      crow(IC.dcl, L("Do not dry-clean.", "Kuru temizleme yaptırma.")) +
      '<p class="mg-care-close">' + L("Store with straps and hooks closed, away from friction.", "Askı ve kopçaları kapatarak, sürtünmeden uzak sakla.") + '</p>';
    var OPEN_SG = '<a href="#" onclick="event.preventDefault();window.__mgOpenSG&&window.__mgOpenSG()">';
    var SRH_BODY = L(
      "<p><strong>Size.</strong> Do not guess. The " + OPEN_SG + "Size Finder</a> compares your measurements with this silhouette's table and gives you one answer; on the border of two sizes we suggest the larger so it sits at ease.</p>" +
      "<p><strong>Returns.</strong> If you change your mind, you may declare withdrawal within 14 days of delivery. Write to <a href=\"mailto:info@mermaidsglance.com\">info@mermaidsglance.com</a> and the return instructions are sent to you. The refund is made in one payment to your original payment method within 14 days of your notice reaching us.</p>" +
      "<p><strong>Hygiene.</strong> For intimates, the hygiene exception applies once the protective element — wrapping, tape or seal — is opened. Check the size and contents before opening it. Your statutory rights for defective items remain in every case.</p>" +
      "<p>The <a href=\"/refundpolicy\">Return Policy</a> page shows every condition in one place.</p>",
      "<p><strong>Beden.</strong> Tahmin etme. " + OPEN_SG + "Beden Bulucu</a> ölçülerini bu silüetin tablosuyla karşılaştırır ve sana tek bir cevap verir; iki bedenin sınırındaysan rahat oturması için büyüğü öneririz.</p>" +
      "<p><strong>İade.</strong> Fikrin değişirse teslimden itibaren 14 gün içinde cayma bildirimi yapabilirsin. <a href=\"mailto:info@mermaidsglance.com\">info@mermaidsglance.com</a> adresine yaz; iade talimatı sana iletilir. Geri ödeme, bildirimin bize ulaşmasından itibaren 14 gün içinde, orijinal ödeme yöntemine tek seferde yapılır.</p>" +
      "<p><strong>Hijyen.</strong> İç giyimde ambalaj, bant ya da mühür gibi koruyucu unsur açıldıktan sonra hijyen istisnası uygulanır. Bedenini ve içeriği, koruyucu unsuru açmadan kontrol et. Ayıplı mal hakların her durumda saklıdır.</p>" +
      "<p><a href=\"/refundpolicy\">İade Politikası</a> sayfası tüm koşulları tek yerde gösterir.</p>"
    );
    var DEL_BODY = L(
      "<p><strong>1 —</strong> Your order enters preparation and is routed within 1 business day.</p>" +
      "<p><strong>2 —</strong> When dispatch begins, your tracking code is created and shared with you; follow the journey step by step on <a href=\"/siparis-takibi\">your tracking page</a>.</p>" +
      "<p><strong>3 —</strong> Delivery after dispatch is estimated at 7–15 business days; the total estimate from order to delivery is 8–16 business days. Weekends and public holidays do not count.</p>" +
      "<p><strong>4 —</strong> Shipping, customs and all duties are ours. Nothing extra is collected at your door.</p>" +
      "<p><strong>5 —</strong> The outer parcel is plain and unbranded; what it carries stays unseen.</p>" +
      "<p>Questions: <a href=\"mailto:info@mermaidsglance.com\">info@mermaidsglance.com</a> — we answer every question within 24 hours.</p>",
      "<p><strong>1 —</strong> Siparişin 1 iş günü içinde hazırlığa alınır ve yönlendirilir.</p>" +
      "<p><strong>2 —</strong> Sevkiyat başladığında takip kodun oluşur ve seninle paylaşılır; yolculuğu <a href=\"/siparis-takibi\">takip sayfandan</a> adım adım izlersin.</p>" +
      "<p><strong>3 —</strong> Sevkiyattan sonra teslimat tahmini 7–15 iş günüdür; siparişten teslimata toplam tahmin 8–16 iş günüdür. Hafta sonları ve resmî tatiller bu sayıma girmez.</p>" +
      "<p><strong>4 —</strong> Kargo, gümrük ve tüm harçlar bize aittir. Kapıda senden ek ücret istenmez.</p>" +
      "<p><strong>5 —</strong> Dış paket sade ve markasızdır; üzerinde ne taşıdığı görünmez.</p>" +
      "<p>Soruların için <a href=\"mailto:info@mermaidsglance.com\">info@mermaidsglance.com</a> — her soruya 24 saat içinde yanıt veririz.</p>"
    );
    function mkAcc(t, bHTML) {
      var w = document.createElement("div"); w.className = "mgpx-acc";
      w.innerHTML = '<div class="mgpx-hd" onclick="this.parentElement.classList.toggle(\'open\')">' + t + '<span class="mgpx-pl">+</span></div><div class="mgpx-bd"><div class="mgpx-in">' + bHTML + '</div></div>';
      return w;
    }
    function build() {
      if (!onPDP()) return;
      var col = window.__mgPDPCol && window.__mgPDPCol();
      if (!col) return;
      var stale = col.querySelectorAll(".mg-s8,.mg-s2-id");
      for (var i = 0; i < stale.length; i++) stale[i].remove();
      var mgpx = col.querySelector(".mgpx");
      if (!mgpx) return;
      /* (b) upgrade the two inline bodies once per injected .mgpx (data-mgup guard) */
      var accs = mgpx.querySelectorAll(".mgpx-acc");
      for (var k = 0; k < accs.length; k++) {
        if (accs[k].getAttribute("data-mgup")) continue;
        var hd = accs[k].querySelector(".mgpx-hd"), bd = accs[k].querySelector(".mgpx-in");
        if (!hd || !bd) continue;
        var ht = (hd.textContent || "").toLocaleUpperCase("tr");
        if (/RETURNS|HYGIENE|İADE|HİJYEN/.test(ht)) { bd.innerHTML = SRH_BODY; accs[k].setAttribute("data-mgup", "1"); }
        else if (/DELIVERY|TESLİMAT/.test(ht)) { bd.innerHTML = DEL_BODY; accs[k].setAttribute("data-mgup", "1"); }
      }
      /* (a) care accordion, icon rows */
      if (!mgpx.querySelector(".mg-bakim")) {
        var ba = mkAcc(L("CARE RITUAL", "BAKIM RİTÜELİ"), CARE_BODY);
        ba.classList.add("mg-bakim"); mgpx.appendChild(ba);
      }
    }
    var t20; new MutationObserver(function () { clearTimeout(t20); t20 = setTimeout(build, 300); })
      .observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(build, 700); setInterval(build, 1300);
  })();

  /* =========================================================================
     §21 — BEDEN BULUCU (task-21, Model A wizard inside the size drawer)
     Owner layout directive 2026-07-13: static chart LEFT, finder RIGHT on
     desktop; stacked finder-first on mobile (column-reverse).
     Rules: supplier category size guides (owner screenshots 2026-07-13 —
     supersede the old single SG table; beden-kural-seti.json is historical);
     copy: task-09 accepted set + clamp lines (owner feedback wave).
     Deterministic — tie-break picks the LARGER size; out-of-range NEVER
     recommends a size; the result is CLAMPED to the sizes this product
     actually sells (never names an unsold size); the LEFT chart is rendered
     from the same data as the wizard, per selected panel (single source).
     ========================================================================= */
  (function () {
    if (window.__mgBF) return; window.__mgBF = true;
    css(
      "#mgbf-row{display:flex;flex-direction:column-reverse;gap:36px;max-width:1200px;margin:0 auto;font-family:'Montserrat',sans-serif;}" +
      "@media(min-width:920px){#mgbf-row{flex-direction:row;align-items:flex-start;gap:48px;}#mgbf-chart{flex:1 1 56%;min-width:0;}#mgbf{flex:1 1 44%;min-width:0;}}" +
      "#mgbf-row .sg{max-width:none;margin:0;}" +
      ".mgbf-k{display:block;font-size:9px;font-weight:600;letter-spacing:.24em;color:#0d0d0d;margin:0 0 10px;}" +
      ".mgbf-need{font-size:12px;color:#888;margin:0 0 16px;line-height:1.6;}" +
      ".mgbf-pills{display:flex;flex-wrap:wrap;border:1px solid #e6e4e0;margin:0 0 20px;}" +
      ".mgbf-pill{flex:1 1 auto;font-size:9px;letter-spacing:.08em;text-transform:none;padding:10px 8px;background:none;border:none;border-right:1px solid #e6e4e0;color:#888;cursor:pointer;font-family:'Montserrat',sans-serif;font-weight:600;white-space:nowrap;}" +
      ".mgbf-pill:last-child{border-right:none;}.mgbf-pill.on{background:#f5f5f5;color:#0d0d0d;}" +
      ".mgbf-f{margin:0 0 16px;}" +
      ".mgbf-f label{display:block;font-size:11px;font-weight:600;color:#0d0d0d;margin:0 0 7px;letter-spacing:.04em;}" +
      ".mgbf-f label span{color:#888;font-weight:400;}" +
      ".mgbf-f input{width:100%;box-sizing:border-box;border:1px solid #e6e4e0;background:#fff;padding:12px 14px;font-size:14px;font-family:'Montserrat',sans-serif;color:#0d0d0d;outline:none;border-radius:0;-moz-appearance:textfield;}" +
      ".mgbf-f input:focus{border-color:#0d0d0d;}" +
      ".mgbf-f input::-webkit-outer-spin-button,.mgbf-f input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}" +
      ".mgbf-h{font-size:10.5px;color:#999;margin:6px 0 0;line-height:1.6;}" +
      ".mgbf-cups{display:flex;gap:8px;}" +
      ".mgbf-cup{width:42px;height:42px;border:1px solid #e6e4e0;background:#fff;font-size:12px;font-weight:600;color:#555;cursor:pointer;font-family:'Montserrat',sans-serif;}" +
      ".mgbf-cup.on{background:#0d0d0d;color:#fafafa;border-color:#0d0d0d;}" +
      "#mgbf-go{width:100%;background:#0d0d0d;color:#fafafa;border:none;padding:15px;font-size:10px;letter-spacing:.22em;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;margin-top:4px;}" +
      ".mgbf-card{margin-top:22px;border:1px solid #e6e4e0;background:#fff;padding:22px;}" +
      ".mgbf-rk{display:block;font-size:14px;font-weight:600;letter-spacing:.06em;color:#0d0d0d;}" +
      ".mgbf-card p{font-size:12px;color:#555;line-height:1.9;margin:10px 0 0;}" +
      ".mgbf-note{font-style:italic;color:#8a8a8a;}" +
      ".mgbf-own{display:block;width:100%;background:#0d0d0d;color:#fafafa;border:none;padding:14px;font-size:10px;letter-spacing:.2em;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;margin-top:18px;}" +
      ".mgbf-back{display:inline-block;background:none;border:none;color:#888;font-size:10px;letter-spacing:.06em;text-decoration:underline;text-underline-offset:3px;cursor:pointer;font-family:'Montserrat',sans-serif;margin-top:12px;padding:0;}" +
      ".mgbf-err{font-size:11.5px;color:#0d0d0d;font-style:italic;margin:12px 0 0;line-height:1.7;}"
    );
    /* Data source: supplier category size guides, owner screenshots 2026-07-13.
       sets = Thong & Garter / Panties chart (XS–XXL) · body = Bodysuit chart
       (S–XXL, stretch windows, single hip values → smallest-fit + nearest-hip)
       · night = Nightwear chart (S–XXL) · bra = EU worn-size grid (S–XL). */
    var SZA = ["XS", "S", "M", "L", "XL", "XXL"];
    var RB = {
      sets: {
        lab: L("Sets & Bottoms", "Takımlar & Altlar"), sz: SZA,
        inputs: [
          { id: "bel", lb: L("Waist", "Bel"), hint: L("Measure the narrowest point; keep the tape easy, not tight.", "En ince noktandan ölç; mezurayı gergin değil rahat tut."), rng: [[56, 61], [61, 66], [66, 74], [74, 79], [79, 84], [84, 92]] },
          { id: "kalca", lb: L("Hip", "Kalça"), hint: L("Measure the fullest point, tape parallel to the floor.", "En geniş noktandan, mezura yere paralel kalsın."), rng: [[76, 84], [81, 89], [86, 94], [91, 99], [96, 104], [102, 109]] }
        ]
      },
      bra: { lab: L("Bras & Bustiers", "Sütyen & Büstiyer"), bra: true, sz: ["S", "M", "L", "XL"] },
      body: {
        lab: "Bodysuit", sz: ["S", "M", "L", "XL", "XXL"], fit: "small",
        inputs: [
          { id: "altgogus", lb: L("Under bust", "Alt göğüs"), hint: L("Directly beneath the bust, on the exhale.", "Göğsünün hemen altından, nefes verirken."), rng: [[64, 88], [67, 91], [71, 95], [76, 99], [81, 104]] },
          { id: "bel", lb: L("Waist", "Bel"), hint: L("At your natural waistline, without holding your breath.", "Doğal bel çizginden, nefesini tutmadan."), rng: [[60, 86], [64, 90], [67, 94], [71, 98], [76, 103]] },
          { id: "kalca", lb: L("Hip", "Kalça"), hint: L("Measure the fullest point, tape parallel to the floor.", "En geniş noktandan, mezura yere paralel kalsın."), one: [94, 97, 102, 104, 109] }
        ]
      },
      night: {
        lab: L("Nightwear", "Gecelik"), sz: ["S", "M", "L", "XL", "XXL"],
        inputs: [
          { id: "gogus", lb: L("Bust", "Göğüs"), hint: L("Measure the fullest point; keep the tape flat across your back.", "En dolgun noktandan; mezura sırtında düz dursun."), rng: [[88, 93], [93, 98], [98, 103], [103, 108], [108, 113]] },
          { id: "bel", lb: L("Waist", "Bel"), hint: L("At your natural waistline, without holding your breath.", "Doğal bel çizginden, nefesini tutmadan."), rng: [[68, 73], [73, 78], [78, 83], [83, 88], [88, 93]] },
          { id: "kalca", lb: L("Hip", "Kalça"), hint: L("Measure the fullest point, tape parallel to the floor.", "En geniş noktandan, mezura yere paralel kalsın."), rng: [[95, 100], [100, 105], [105, 110], [110, 115], [115, 120]] }
        ]
      }
    };
    /* Bra grid keyed on the EU size she already wears (supplier lists per size).
       70A/70B are not made → honest nocell message. */
    var BRA_MAP = { 70: { A: null, B: null, C: "S", D: "S" }, 75: { A: "S", B: "S", C: "M", D: "M" }, 80: { A: "M", B: "M", C: "L", D: "L" }, 85: { A: "L", B: "L", C: "XL", D: "XL" }, 90: { A: "XL", B: "XL", C: "XL", D: "XL" } };
    var BRA_EU = { S: "70C · 70D · 75A · 75B", M: "75C · 75D · 80A · 80B", L: "80C · 80D · 85A · 85B", XL: "85C · 85D · 90A–90D" };
    var BRA_UB = { S: "82–92", M: "87–97", L: "92–102", XL: "97–107" };
    var ORDER = ["sets", "bra", "body", "night"], cur = "sets";
    var TXT = {
      need: L("This silhouette needs just {N} measurements.", "Bu silüet için {N} ölçü yeter."),
      needBra: L("Tell us the size you always wear.", "Her zaman giydiğin bedeni söylemen yeter."),
      go: L("SEE YOUR SIZE", "BEDENİNİ GÖR"),
      rk: L("Your Size", "Senin Bedenin"),
      rkc: L("Our suggestion in this silhouette", "Bu silüette önerimiz"),
      rbody: L("This silhouette sits at {B} on you. Your measurements said the rest.", "Bu silüet sende {B} oturur. Ölçülerin gerisini söyledi."),
      clamp: L("This silhouette is offered from {MIN} to {MAX}; the size closest to your measurements is {B}.", "Bu silüet {MIN}–{MAX} aralığında sunulur; ölçülerine en yakın beden {B}."),
      far: L("Write to us if you want to be sure: info@mermaidsglance.com — we answer within 24 hours.", "Emin olmak istersen yaz: info@mermaidsglance.com — 24 saat içinde yanıt veririz."),
      own: L("OWN IT IN {B}", "{B} BEDENİYLE SAHİP OL"),
      back: L("Change my measures", "Ölçülerimi değiştir"),
      tie: L("You are between two sizes — we chose {B} so the silhouette wraps you.", "İki bedenin sınırındasın — silüet seni sarsın diye {B} önerdik."),
      div: L("Your measurements point to different sizes; we suggest {B} for coverage. Write to us if you want to be sure: info@mermaidsglance.com", "Ölçülerin farklı bedenlere işaret ediyor; kapsaması için {B} öneriyoruz. Emin olmak istersen yaz: info@mermaidsglance.com"),
      out: L("This silhouette is not made in your measurements right now. We will not name a size that is not yours.", "Bu silüet şu an senin ölçünde üretilmiyor. Yanlış beden önermeyi doğru bulmuyoruz."),
      nocell: L("This band and cup are not made.", "Bu band ve kup birleşimi üretilmiyor."),
      err: L("Check your measurements once more.", "Ölçülerini bir daha kontrol et."),
      band: L("Band (EU)", "Band (EU)"),
      bandh: L("The band of the bra you always wear; if unsure, check the label of your favourite bra.", "Her zaman giydiğin sütyenin bandı; emin değilsen en sevdiğin sütyenin etiketine bak."),
      cup: L("Cup", "Kup"),
      cuph: L("The cup letter of the bra you always wear (A–D).", "Her zaman giydiğin sütyenin kup harfi (A–D)."),
      pick: L("Mark {B} on the size selector.", "Beden seçicide {B} işaretle."),
      link: L("Skip the chart, find your fit", "Bedenini bul, tabloyu bırak"),
      chartFoot: L("Between two sizes — choose the larger. The silhouette should hold without compromise.", "İki bedenin arasındaysan büyüğü seç. Silüet ödün vermeden sarmalı.")
    };
    function guessPanel() {
      var t = ((window.data && window.data.product && window.data.product.title) || "").toLowerCase();
      if (/bodysuit|teddy|\bbody\b/.test(t)) return "body";
      if (/night|gown|chemise|robe|babydoll|kimono|sleep|pyjama|pajama|negligee/.test(t)) return "night";
      if (/\bbra\b|bustier|bralette|corset|\btop\b/.test(t)) return "bra";
      return "sets";
    }
    function fieldHTML(inp) {
      return '<div class="mgbf-f"><label>' + inp.lb + ' <span>cm</span></label><input id="mgbf-' + inp.id + '" type="number" inputmode="decimal" min="30" max="200"><p class="mgbf-h">' + inp.hint + '</p></div>';
    }
    function chartHTML(p) {
      var d = RB[p], h = '<table class="sg-tbl"><thead><tr><th style="width:20%">' + L("Size", "Beden") + "</th>", i, k;
      if (d.bra) {
        h += "<th>EU</th><th>" + L("Under bust (cm)", "Alt göğüs (cm)") + "</th></tr></thead><tbody>";
        for (i = 0; i < d.sz.length; i++) h += '<tr><td><span class="sg-sz">' + d.sz[i] + "</span></td><td>" + BRA_EU[d.sz[i]] + "</td><td>" + BRA_UB[d.sz[i]] + "</td></tr>";
      } else {
        for (k = 0; k < d.inputs.length; k++) h += "<th>" + d.inputs[k].lb + " (cm)</th>";
        h += "</tr></thead><tbody>";
        for (i = 0; i < d.sz.length; i++) {
          h += '<tr><td><span class="sg-sz">' + d.sz[i] + "</span></td>";
          for (k = 0; k < d.inputs.length; k++) {
            var inp = d.inputs[k];
            h += "<td>" + (inp.one ? inp.one[i] : inp.rng[i][0] + "–" + inp.rng[i][1]) + "</td>";
          }
          h += "</tr>";
        }
      }
      return h + "</tbody></table>";
    }
    function drawChart(p) {
      var c = document.querySelector("#mgbf-chart .sg"); if (!c) return;
      c.innerHTML = '<span class="sg-eyebrow">' + L("SIZE PROTOCOL", "BEDEN PROTOKOLÜ") + " — " + RB[p].lab + '</span><div class="sg-body">' + chartHTML(p) + '</div><span class="sg-foot">' + TXT.chartFoot + "</span>";
    }
    function renderPanel(p) {
      cur = p;
      var box = document.getElementById("mgbf"); if (!box) return;
      var pills = box.querySelector("#mgbf-pills"), fl = box.querySelector("#mgbf-fields"), need = box.querySelector("#mgbf-need"), res = box.querySelector("#mgbf-res");
      var ph = ""; for (var i = 0; i < ORDER.length; i++) ph += '<button type="button" class="mgbf-pill' + (ORDER[i] === p ? " on" : "") + '" data-p="' + ORDER[i] + '">' + RB[ORDER[i]].lab + "</button>";
      pills.innerHTML = ph;
      if (RB[p].bra) {
        need.textContent = TXT.needBra;
        var bb = "", bands = [70, 75, 80, 85, 90];
        for (var b = 0; b < bands.length; b++) bb += '<button type="button" class="mgbf-cup" data-b="' + bands[b] + '">' + bands[b] + "</button>";
        fl.innerHTML =
          '<div class="mgbf-f"><label>' + TXT.band + '</label><div class="mgbf-cups" id="mgbf-bands">' + bb + '</div><p class="mgbf-h">' + TXT.bandh + '</p></div>' +
          '<div class="mgbf-f"><label>' + TXT.cup + '</label><div class="mgbf-cups" id="mgbf-cups"><button type="button" class="mgbf-cup" data-c="A">A</button><button type="button" class="mgbf-cup" data-c="B">B</button><button type="button" class="mgbf-cup" data-c="C">C</button><button type="button" class="mgbf-cup" data-c="D">D</button></div><p class="mgbf-h">' + TXT.cuph + '</p></div>';
      } else {
        need.textContent = TXT.need.replace("{N}", RB[p].inputs.length);
        var h = ""; for (var j = 0; j < RB[p].inputs.length; j++) h += fieldHTML(RB[p].inputs[j]);
        fl.innerHTML = h;
      }
      fl.style.display = ""; pills.style.display = ""; need.style.display = "";
      var go = box.querySelector("#mgbf-go"); if (go) go.style.display = "";
      res.innerHTML = "";
      drawChart(p);
    }
    function fitIdx(v, rng) { var hits = []; for (var i = 0; i < rng.length; i++) { if (v >= rng[i][0] && v <= rng[i][1]) hits.push(i); } return hits; }
    /* Variant clamp (owner directive 2026-07-13): the finder never names a size
       this product does not sell. Available sizes are read from the live size
       selector; the table-ideal is clamped to the nearest offered size, said
       honestly (rkc + clamp line). No selector found → no clamp. */
    function availSizes() {
      var out = [], labels = document.querySelectorAll(".D0I_i");
      for (var i = 0; i < labels.length; i++) {
        var l = labels[i];
        if (!/^(size|beden|größe|taille)$/i.test((l.innerText || "").trim())) continue;
        var grp = l.closest(".Y3eUK") || l.parentElement; if (!grp) continue;
        var cand = grp.querySelectorAll("button,[role=button],label,span,div");
        for (var j = 0; j < cand.length; j++) {
          var c = cand[j]; if (c.children.length > 1) continue;
          var t = (c.innerText || "").trim().toUpperCase();
          if (SZA.indexOf(t) >= 0 && out.indexOf(t) < 0) out.push(t);
        }
        if (out.length) break;
      }
      out.sort(function (a, b) { return SZA.indexOf(a) - SZA.indexOf(b); });
      return out;
    }
    function clampSz(sz) {
      var av = availSizes();
      if (!av.length || av.indexOf(sz) >= 0) return null;
      var ii = SZA.indexOf(sz), best = null, bd = 1e9;
      for (var i = 0; i < av.length; i++) {
        var d = Math.abs(SZA.indexOf(av[i]) - ii);
        if (d < bd || (d === bd && best !== null && SZA.indexOf(av[i]) > SZA.indexOf(best))) { best = av[i]; bd = d; }
      }
      return { sz: best, far: bd >= 2, min: av[0], max: av[av.length - 1] };
    }
    function compute() {
      var box = document.getElementById("mgbf"); if (!box) return;
      var res = box.querySelector("#mgbf-res"), fl = box.querySelector("#mgbf-fields"), pills = box.querySelector("#mgbf-pills"), need = box.querySelector("#mgbf-need"), go = box.querySelector("#mgbf-go");
      var sz = null, note = "", honest = "";
      if (RB[cur].bra) {
        var bEl = box.querySelector("#mgbf-bands .mgbf-cup.on"), cEl = box.querySelector("#mgbf-cups .mgbf-cup.on");
        if (!bEl || !cEl) { res.innerHTML = '<p class="mgbf-err">' + TXT.err + "</p>"; return; }
        var cell = BRA_MAP[bEl.getAttribute("data-b")][cEl.getAttribute("data-c")];
        if (cell === null) honest = TXT.nocell; else sz = cell;
      } else {
        var szs = RB[cur].sz, idxs = [], anyTie = false, small = RB[cur].fit === "small";
        for (var i = 0; i < RB[cur].inputs.length; i++) {
          var inp = RB[cur].inputs[i], el = box.querySelector("#mgbf-" + inp.id), v = el ? parseFloat(el.value) : NaN;
          if (isNaN(v) || v < 30 || v > 200) { res.innerHTML = '<p class="mgbf-err">' + TXT.err + "</p>"; return; }
          if (inp.one) {
            if (v < inp.one[0] - 4 || v > inp.one[inp.one.length - 1] + 4) { honest = TXT.out; break; }
            var bi = 0, bdd = 1e9;
            for (var q = 0; q < inp.one.length; q++) { var dq = Math.abs(v - inp.one[q]); if (dq <= bdd) { bdd = dq; bi = q; } }
            idxs.push(bi);
          } else {
            var hits = fitIdx(v, inp.rng);
            if (!hits.length) { honest = TXT.out; break; }
            if (!small && hits.length > 1) anyTie = true;
            idxs.push(small ? Math.min.apply(null, hits) : Math.max.apply(null, hits));
          }
        }
        if (!honest) {
          var mx = Math.max.apply(null, idxs), mn = Math.min.apply(null, idxs);
          sz = szs[mx];
          if (mx - mn >= 2) note = TXT.div.replace("{B}", sz);
          else if (anyTie || mx !== mn) note = TXT.tie.replace("{B}", sz);
        }
      }
      var clamped = null;
      if (!honest && sz) {
        clamped = clampSz(sz);
        if (clamped) { sz = clamped.sz; note = ""; }
      }
      fl.style.display = "none"; pills.style.display = "none"; need.style.display = "none"; if (go) go.style.display = "none";
      if (honest) {
        res.innerHTML = '<div class="mgbf-card"><p style="margin:0;">' + honest + '</p><button type="button" class="mgbf-back">' + TXT.back + "</button></div>";
      } else {
        var head = (clamped ? TXT.rkc : TXT.rk) + ": " + sz;
        var bodyP = clamped ? TXT.clamp.replace("{MIN}", clamped.min).replace("{MAX}", clamped.max).replace("{B}", sz) : TXT.rbody.replace("{B}", sz);
        res.innerHTML = '<div class="mgbf-card"><span class="mgbf-rk">' + head + "</span><p>" + bodyP + "</p>" + (note ? '<p class="mgbf-note">' + note + "</p>" : "") + (clamped && clamped.far ? '<p class="mgbf-note">' + TXT.far + "</p>" : "") + '<button type="button" class="mgbf-own" data-sz="' + sz + '">' + TXT.own.replace("{B}", sz) + '</button><button type="button" class="mgbf-back">' + TXT.back + '</button><p class="mgbf-pickmiss" style="display:none;"></p></div>';
      }
    }
    function pickSize(sz) {
      var ok = false, labels = document.querySelectorAll(".D0I_i");
      for (var i = 0; i < labels.length && !ok; i++) {
        var l = labels[i];
        if (!/^(size|beden|größe|taille)$/i.test((l.innerText || "").trim())) continue;
        var grp = l.closest(".Y3eUK") || l.parentElement; if (!grp) continue;
        var cand = grp.querySelectorAll("button,[role=button],label,span,div");
        for (var j = 0; j < cand.length; j++) {
          var c = cand[j]; if (c.children.length > 1) continue;
          if ((c.innerText || "").trim().toUpperCase() === sz) { c.click(); ok = true; break; }
        }
      }
      return ok;
    }
    function enhance() {
      var bd = document.getElementById("mg-sg-bd"); if (!bd || bd.querySelector("#mgbf")) return;
      var sg = bd.querySelector(".sg"); if (!sg) return;
      var row = document.createElement("div"); row.id = "mgbf-row";
      bd.insertBefore(row, sg);
      var left = document.createElement("div"); left.id = "mgbf-chart";
      var right = document.createElement("div"); right.id = "mgbf";
      row.appendChild(left); row.appendChild(right); left.appendChild(sg);
      right.innerHTML =
        '<span class="mgbf-k">' + L("FIND MY SIZE", "BEDENİMİ BUL") + "</span>" +
        '<p class="mgbf-need" id="mgbf-need"></p>' +
        '<div class="mgbf-pills" id="mgbf-pills"></div>' +
        '<div id="mgbf-fields"></div>' +
        '<button type="button" id="mgbf-go">' + TXT.go + "</button>" +
        '<div id="mgbf-res"></div>';
      right.addEventListener("click", function (e) {
        var t = e.target;
        if (t.classList.contains("mgbf-pill")) { renderPanel(t.getAttribute("data-p")); return; }
        if (t.classList.contains("mgbf-cup")) { var cs = t.parentElement.querySelectorAll(".mgbf-cup"); for (var i = 0; i < cs.length; i++) cs[i].classList.remove("on"); t.classList.add("on"); return; }
        if (t.id === "mgbf-go") { compute(); return; }
        if (t.classList.contains("mgbf-back")) { renderPanel(cur); return; }
        if (t.classList.contains("mgbf-own")) {
          var sz = t.getAttribute("data-sz"), ok = pickSize(sz);
          if (ok) { window.__mgCloseSG && window.__mgCloseSG(); }
          else { var m = right.querySelector(".mgbf-pickmiss"); if (m) { m.textContent = TXT.pick.replace("{B}", sz); m.style.display = ""; m.className = "mgbf-pickmiss mgbf-note"; } }
          return;
        }
      });
      right.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); compute(); } });
      renderPanel(guessPanel());
    }
    function hook() {
      if (window.__mgOpenSG && !window.__mgOpenSG.__bf) {
        var o = window.__mgOpenSG;
        var w = function () { o(); enhance(); try { renderPanel(guessPanel()); } catch (e) { } };
        w.__bf = 1; window.__mgOpenSG = w;
      }
    }
    hook();
    setInterval(function () {
      hook();
      if (document.getElementById("mg-sg-dr")) enhance();
      var lk = document.querySelector(".mg-sg-link");
      if (lk && lk.textContent !== TXT.link) lk.textContent = TXT.link;
    }, 1400);
  })();

  /* =========================================================================
     §22 — PDP EDITORIAL BANDS (route: /products/...)
     Owner feedback wave 2026-07-13 (screenshots): dramaturgy order is
     MOTION → İÇ SES → BEDEN GÜVENCESİ, all before the native COMPLETE THE
     RITUAL block (Vesna: desire → identity → seal → invitation; Eylül: the
     assurance band closes the last worry right before the second-piece ask).
     (a) SAHİP OLANLARDAN (retitled from İÇ SES, owner wave-3.1) — swipeable
         vignette carousel (14 cards, LEYLA/AYŞE/FATMA angles).
         Owner wave-3 2026-07-14: cards now speak in FIRST PERSON, in the
         persona's own comment voice (human, concrete, imperfect) — the
         second-person editorial register read as marketing.
         Owner wave-3.2 2026-07-14: "doesn't look like a review" — cards get
         REVIEW ANATOMY without fabricated identity: an angle kicker on top
         (curated-testimonial künye) + an anonymous signature line below
         ("— SAHİP OLANLARDAN BİRİ"), most compelling card leads, four new
         angles (cost-of-cheap, on-the-skin comfort, after-forty, gift box).
         Still deliberately NOT a review widget: no names, no stars, no
         counts, no dates, no "verified" (owner decision 2026-07-11
         review-RED + TR 2026-08-01 consumer-review rule + cro/CLAUDE.md
         "sahte yorum YASAK"); real named quotes come only from real
         customers via the post-purchase flow, when collected.
     (b) BEDEN GÜVENCESİ ink band — owner wave-3 rebuild: left-aligned
         (brand rule), and ZERO wording that implies a tried-on piece can
         come back (hygiene policy: tried intimates are not accepted — the
         old "check before opening the protective element / withdrawal"
         lines are gone). The hygiene rule is flipped into a purity
         guarantee: %100 — its first owner is you; no silhouette sets out
         twice. Honest numbers only (3 measures / one answer / 24h SLA).
         The whole band opens the size drawer.
     (c) SİLÜET HAREKET HALİNDE — supplier motion loops (owner-confirmed
         2026-07-12), six: v08/v14/v18/v16/v07/v12 (Vesna curation
         2026-07-13, red v12 single closing accent). Owner wave-3.1: header
         is left-aligned and carries the real Instagram following (~19-20k,
         owner-stated → "close to 20,000 women follow"); videos
         AUTOPLAY when scrolled into view — playback is driven by an
         interval visibility pass, NOT IntersectionObserver (LF lesson:
         observers are unreliable on this SPA; IO left videos click-only
         live). muted/playsinline/poster; honours Save-Data only —
         prefers-reduced-motion dropped by owner order (it is a common
         Windows default and killed autoplay for the owner himself).
     Anchored to the related-products section (.mg-yml-head ancestor);
     idempotent + interval-driven.
     ========================================================================= */
  (function () {
    if (window.__mgPDPBands) return; window.__mgPDPBands = true;
    css(
      "#mg-icses{background:#fff;border-top:1px solid #e6e4e0;border-bottom:1px solid #e6e4e0;padding:64px 0 70px;font-family:'Montserrat',sans-serif;}" +
      ".mg-ics-hd{display:flex;align-items:center;justify-content:space-between;max-width:1162px;margin:0 auto;padding:0 24px;}" +
      ".mg-ics-k{font-size:9px;font-weight:600;letter-spacing:.24em;color:#888;}" +
      ".mg-ics-nav{display:none;}" +
      "@media(min-width:720px){.mg-ics-nav{display:flex;gap:8px;}}" +
      ".mg-ics-ar{width:38px;height:38px;border:1px solid #e6e4e0;background:#fff;color:#0d0d0d;font-size:16px;font-weight:300;cursor:pointer;font-family:'Montserrat',sans-serif;line-height:1;padding:0;}" +
      ".mg-ics-ar:hover{border-color:#0d0d0d;}" +
      ".mg-ics-row{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:30px 24px 8px;scrollbar-width:none;}" +
      ".mg-ics-row::-webkit-scrollbar{display:none;}" +
      "@media(min-width:1240px){.mg-ics-row{padding-left:calc((100vw - 1162px)/2);padding-right:calc((100vw - 1162px)/2);}}" +
      ".mg-ics-card{flex:0 0 auto;width:min(340px,82vw);scroll-snap-align:center;border:1px solid #e6e4e0;background:#fff;padding:26px 28px 24px;box-sizing:border-box;display:flex;flex-direction:column;}" +
      ".mg-ics-tag{display:block;font-size:8px;font-weight:600;letter-spacing:.22em;color:#9a9a9a;margin:0 0 16px;text-align:left;}" +
      ".mg-ics-card p{font-size:13.5px;font-weight:300;line-height:1.95;color:#1a1a1a;margin:0;text-align:left;flex:1 1 auto;}" +
      ".mg-ics-sig{display:block;margin-top:18px;padding-top:12px;border-top:1px solid #efedeb;font-size:8px;font-weight:600;letter-spacing:.22em;color:#b3b0ac;text-align:left;}" +
      "#mg-olcu{background:#0d0d0d;padding:76px 24px;cursor:pointer;font-family:'Montserrat',sans-serif;}" +
      ".mg-olc-in{max-width:1162px;margin:0 auto;display:flex;flex-direction:column-reverse;gap:40px;text-align:left;}" +
      "@media(min-width:900px){.mg-olc-in{flex-direction:row;align-items:center;justify-content:space-between;gap:64px;}}" +
      ".mg-olc-l{flex:1 1 auto;max-width:620px;}" +
      ".mg-olc-r{flex:0 0 auto;}" +
      ".mg-olc-k{display:block;font-size:9px;font-weight:600;letter-spacing:.26em;color:#8a8a8a;margin:0 0 22px;}" +
      ".mg-olc-big{display:block;font-size:clamp(64px,10vw,140px);font-weight:200;letter-spacing:.01em;color:#fafafa;line-height:1;}" +
      ".mg-olc-bl{display:block;font-size:9.5px;letter-spacing:.24em;font-weight:600;color:#8a8a8a;margin-top:16px;}" +
      ".mg-olc-lead{font-size:clamp(22px,3vw,36px);font-weight:300;letter-spacing:.01em;line-height:1.35;color:#fafafa;margin:0 0 20px;}" +
      ".mg-olc-tx{font-size:12.5px;font-weight:300;color:#a8a8a8;line-height:2;margin:0;}" +
      ".mg-olc-trio{display:flex;margin:26px 0 0;flex-wrap:wrap;row-gap:8px;}" +
      ".mg-olc-trio span{font-size:9px;letter-spacing:.2em;font-weight:600;color:#8a8a8a;padding:0 16px 0 0;}" +
      ".mg-olc-trio span+span{border-left:1px solid #333;padding-left:16px;}" +
      ".mg-olc-cta{display:inline-block;margin-top:28px;font-size:10px;letter-spacing:.22em;font-weight:600;color:#fafafa;border-bottom:1px solid #fafafa;padding-bottom:6px;}" +
      "#mg-motion{padding:70px 0 84px;background:#fafafa;font-family:'Montserrat',sans-serif;}" +
      ".mg-mot-hd{text-align:left;max-width:1162px;margin:0 auto;padding:0 24px;}" +
      ".mg-mot-t{display:block;font-size:9px;font-weight:600;letter-spacing:.26em;color:#888;}" +
      ".mg-mot-h{font-size:clamp(22px,3vw,34px);font-weight:300;letter-spacing:.01em;line-height:1.35;color:#0d0d0d;margin:18px 0 0;max-width:640px;}" +
      ".mg-mot-h em{font-weight:400;}" +
      ".mg-mot-s{font-size:12px;color:#888;margin:14px 0 0;}" +
      ".mg-mot-row{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:34px 24px 6px;scrollbar-width:none;}" +
      "@media(min-width:1240px){.mg-mot-row{padding-left:calc((100vw - 1162px)/2);padding-right:calc((100vw - 1162px)/2);}}" +
      ".mg-mot-row::-webkit-scrollbar{display:none;}" +
      ".mg-mot-card{flex:0 0 auto;width:min(280px,74vw);aspect-ratio:9/16;background:#0d0d0d;scroll-snap-align:center;}" +
      ".mg-mot-card video{width:100%;height:100%;object-fit:cover;display:block;}"
    );
    function onPDP() { return /\/products\//.test(location.pathname) && !!(window.data && window.data.product); }
    /* Display order = Vesna's colour dramaturgy: v08 candle open, v14 macro
       craft, v18 silhouette, v16 chain detail, v07 rose-lace close, v12 red
       theatrical finale. Files keep their motion-N names on the CDN. */
    var VID = [1, 5, 2, 3, 4, 6].map(function (i) { return { v: CDN + "/video/motion-" + i + ".mp4", p: CDN + "/video/motion-" + i + ".jpg" }; });
    /* Wave-3.2 2026-07-14: fourteen first-person persona comments (Selin).
       Owner: more angles, the most compelling card leads and pulls the
       rest, and the cards must READ as comments — review anatomy added as
       angle kicker (k) + anonymous signature, identity stays fabricated-
       free (no names/stars/dates — see section header note). Order:
       his-gaze hook → price-guilt (top objection) → after-two-births →
       flaw-hunter → cost-of-cheap → trust/tracking (kept mid, owner
       wave-3.1) → plain parcel → on-the-skin → between-two-sizes →
       an-hour-of-her-own → after-forty → gift box → anniversary →
       identity close. Only claims true on this store (tracking code +
       plain unbranded parcel + size table exist; no fabric-composition,
       no delivery-day promises). */
    var VOICES = [
      { k: L("HIS GAZE", "ONUN BAKIŞI"), q: L("“The look on his face when I walked through the door was worth everything. He couldn't take his eyes off me all evening. I'll keep it short: buy it knowing its effect.”", "“Kapıdan girdiğimde yüzündeki ifade her şeye değdi. Bütün akşam gözünü benden alamadı. Sözü uzatmayayım: etkisini bilerek alın.”") },
      { k: L("THE PRICE DECISION", "FİYAT KARARI"), q: L("“I saw the price and closed the page; two days later I came back. I asked myself when I had last set something like this aside for myself, and I didn't like the answer. In front of the mirror the argument ended: this money wasn't spent, it was put in its place.”", "“Fiyatı görünce sayfayı kapattım, iki gün sonra geri döndüm. Kendime en son ne zaman böyle bir şey ayırdığımı düşündüm ve cevap hoşuma gitmedi. Aynanın karşısında tartışma bitti: bu para harcanmadı, yerine kondu.”") },
      { k: L("AFTER TWO BIRTHS", "İKİ DOĞUMDAN SONRA"), q: L("“After two births my mirror and I were not on good terms. The evening I wore this I looked at myself without flinching. My body hadn't changed; the way I looked at it had.”", "“İki doğumdan sonra aynayla aram iyi değildi. Bunu giydiğim akşam kendime baktım, kaçırmadan. Vücudum değişmemişti; benim ona bakışım değişti.”") },
      { k: L("THE FLAW-HUNTER", "KUSUR ARAYAN GÖZ"), q: L("“I'm the kind who looks for flaws first; the seams and the clasps were the first things I checked. I found none. The first evening I wore it I didn't recognise my own posture — apparently I'd been carrying my shoulders low all along.”", "“Ben önce kusur arayan biriyim; elime aldığımda ilk baktığım yer dikişler ve kopçalardı. Bulamadım. Üzerimde olduğu ilk akşam kendi duruşumu yadırgadım — meğer omuzlarımı hep düşük taşıyormuşum.”") },
      { k: L("THE COST OF CHEAP", "UCUZUN HESABI"), q: L("“The ones I bought before are still in a drawer; I never wore any of them twice. Buying cheap meant buying again — I did that maths late. One proper piece was the answer.”", "“Çekmecemde daha önce aldıklarım duruyor; hiçbirini ikinci kez giymedim. Ucuza kaçtıkça yeniden alıyormuşum — bu hesabı geç yaptım. Bir kez doğrusunu almak varmış.”") },
      { k: L("THE FIRST ORDER", "İLK SİPARİŞ"), q: L("“I'll be honest, trusting a brand I didn't know wasn't easy; after ordering I asked myself twice whether I'd done the right thing. The tracking code arrived and I followed every step on the screen. When the parcel reached me, the first thing I did was check the seams. My mind is at ease now; I'm choosing my second.”", "“Açık konuşayım, bilmediğim bir markaya güvenmek kolay değildi; sipariş verdikten sonra iki kez ‘doğru mu yaptım’ diye düşündüm. Takip kodu geldi, her adımı ekrandan izledim. Paket elime geçtiğinde ilk işim dikişlere bakmak oldu. İçim rahat, şimdi ikincisini seçiyorum.”") },
      { k: L("THE PLAIN PARCEL", "SADE PAKET"), q: L("“It arrived in a plain parcel; I was the only one who knew what was inside. Even opening it was a pleasure. I'll leave the rest untold.”", "“Kargo elime sade bir paketle ulaştı; içinde ne olduğunu bir tek ben biliyordum. Açarken bile keyif aldım. Gerisini anlatmayayım.”") },
      { k: L("ON THE SKIN", "TENDEKİ HİS"), q: L("“Delicate things usually bother me, so I hesitated. All evening I forgot I was wearing it; at night I didn't want to take it off. Grace and comfort can live in the same piece.”", "“İnce şeyler beni rahatsız eder diye çekinirdim. Akşam boyunca üzerimde olduğunu unuttum; gece çıkarmak içimden gelmedi. Zarafetle rahatlık aynı parçada durabiliyormuş.”") },
      { k: L("BETWEEN TWO SIZES", "İKİ BEDEN ARASI"), q: L("“I'm always sceptical about sizing; I sit between two sizes. I took my measurements, checked them against the table and ordered the size it suggested — it sat exactly right. Nothing about it felt left to chance.”", "“Beden konusunda hep şüpheciyim; iki bedenin arasındayım. Ölçülerimi aldım, tabloyla karşılaştırdım, önerilen bedeni aldım — tam oturdu. Hiçbir şey şansa bırakılmamış, bu belli.”") },
      { k: L("AN HOUR OF HER OWN", "KENDİNE AYRILAN SAAT"), q: L("“No one was going to see it; only I would know. I came home from work, put it on and drank my coffee like that. It sounds small, but that one hour was the best thing I'd done for myself in a long time.”", "“Kimse görmeyecekti; sadece ben bilecektim. Akşam işten döndüm, giydim, kahvemi öyle içtim. Kulağa küçük geliyor ama o bir saat, uzun zamandır kendim için yaptığım en iyi şeydi.”") },
      { k: L("AFTER FORTY", "KIRKINDAN SONRA"), q: L("“After forty I told myself these were no longer for me. I was wrong. It was never about age; it is about how a woman looks at herself. This is how I look at myself now.”", "“Kırkımdan sonra bunlar bana göre değil diye düşünürdüm. Yanılmışım. Mesele yaş değilmiş; kadının kendine nasıl baktığıymış. Ben artık böyle bakıyorum.”") },
      { k: L("THE BOX FROM HIM", "ONDAN GELEN KUTU"), q: L("“The box came from him; I didn't know what was inside until I opened it. I'm glad I didn't. That night we both won. The next one we will choose together.”", "“Kutu ondan geldi; açana kadar içinde ne olduğunu bilmiyordum. İyi ki bilmiyormuşum. O gece ikimiz de kazandık. Bir sonrakini birlikte seçeceğiz.”") },
      { k: L("THE ANNIVERSARY", "YIL DÖNÜMÜ"), q: L("“I bought it for our anniversary; it was the first time I'd paid for something like this. There was a dinner reservation. We came home early.”", "“Yıl dönümümüz için aldım; ilk kez böyle bir şeye para verdim. Akşam yemeği rezervasyonumuz vardı. Eve erken döndük.”") },
      { k: L("THE POSTURE", "DURUŞ"), q: L("“When it's on me I don't have to prove anything to anyone; that feeling is already mine. My back didn't drop once all night. A woman walks differently when she knows what she's wearing.”", "“Üzerimdeyken kimseye bir şey kanıtlamam gerekmiyor; o his zaten bende. Gece boyunca sırtım bir kez olsun düşmedi. İnsan üstünde ne taşıdığını bilince başka yürüyor.”") }
    ];
    function icsHTML() {
      var sig = L("— ONE OF THE WOMEN WHO OWN IT", "— SAHİP OLANLARDAN BİRİ");
      var h = '<div class="mg-ics-hd"><span class="mg-ics-k">' + L("FROM THE WOMEN WHO OWN IT", "SAHİP OLANLARDAN") + '</span><div class="mg-ics-nav"><button type="button" class="mg-ics-ar" data-d="-1">‹</button><button type="button" class="mg-ics-ar" data-d="1">›</button></div></div><div class="mg-ics-row">';
      for (var i = 0; i < VOICES.length; i++) h += '<div class="mg-ics-card"><span class="mg-ics-tag">' + VOICES[i].k + '</span><p>' + VOICES[i].q + '</p><span class="mg-ics-sig">' + sig + "</span></div>";
      return h + "</div>";
    }
    function wireVoice(sec) {
      var row = sec.querySelector(".mg-ics-row");
      sec.addEventListener("click", function (e) {
        var b = e.target && e.target.closest ? e.target.closest(".mg-ics-ar") : null;
        if (!b || !row) return;
        var card = row.querySelector(".mg-ics-card"), w = card ? card.getBoundingClientRect().width + 14 : 340;
        var d = parseInt(b.getAttribute("data-d"), 10) || 1;
        try { row.scrollBy({ left: d * w, behavior: "smooth" }); } catch (err) { row.scrollLeft += d * w; }
      });
    }
    /* Wave-3 rebuild: purity guarantee. The hygiene policy (tried intimates
       are never taken back) is stated as what it gives the customer: the
       piece that reaches her has never been worn — %100, first owner.
       No withdrawal/try-on wording anywhere in this band (owner order
       2026-07-14); the accordion carries the legal detail. */
    var OLCU =
      '<div class="mg-olc-in"><div class="mg-olc-l"><span class="mg-olc-k">' + L("SIZE ASSURANCE", "BEDEN GÜVENCESİ") + "</span>" +
      '<p class="mg-olc-lead">' + L("No one wore it before you.", "Senden önce kimse denemedi.") + "</p>" +
      '<p class="mg-olc-tx">' + L("Our hygiene principle does not bend: no silhouette sets out twice. The piece you own makes a single journey — to you. Leave your size to no chance: the Size Finder compares at most three of your measurements with this silhouette's table and gives you one answer; on the border of two sizes we suggest the larger, the one that sits at ease. Whenever you hesitate, we answer within 24 hours.", "Hijyen ilkemiz tavizsizdir: hiçbir silüet ikinci kez yola çıkmaz. Sahip olduğun parça tek bir yolculuk yapar — sana. Bedeni şansa bırakma: Beden Bulucu en fazla üç ölçünü bu silüetin tablosuyla karşılaştırır ve sana tek bir cevap verir; iki bedenin sınırında, rahat oturan büyüğü öneririz. Kararsız kaldığın her an, 24 saat içinde yanıt veririz.") + "</p>" +
      '<div class="mg-olc-trio"><span>' + L("3 MEASURES", "3 ÖLÇÜ") + "</span><span>" + L("ONE ANSWER", "TEK CEVAP") + "</span><span>" + L("24 HOURS", "24 SAAT") + "</span></div>" +
      '<span class="mg-olc-cta">' + L("FIND YOUR SIZE", "BEDENİNİ BUL") + "</span></div>" +
      '<div class="mg-olc-r"><span class="mg-olc-big">' + L("100%", "%100") + '</span><span class="mg-olc-bl">' + L("ITS FIRST OWNER IS YOU", "İLK SAHİBİ SENSİN") + "</span></div></div>";
    function motHTML() {
      /* Wave-3.1: owner found 2,000 too small. Order counts are NOT
         fabricated (honest-number rule); the larger TRUE figure is the
         Instagram following (~19-20k, owner-stated) → "close to 20,000
         women follow". Section label returns to the kicker slot. */
      var h = '<div class="mg-mot-hd"><span class="mg-mot-t">' + L("THE SILHOUETTE IN MOTION", "SİLÜET HAREKET HALİNDE") + '</span><p class="mg-mot-h">' + L("Close to 20,000 women <em>follow</em> Mermaid's Glance.", "20.000'e yakın kadın Mermaid's Glance'i <em>takip ediyor.</em>") + '</p><p class="mg-mot-s">' + L("A photograph holds still. The silhouette moves.", "Fotoğraf durdurur. Silüet hareket eder.") + '</p></div><div class="mg-mot-row">';
      for (var i = 0; i < VID.length; i++) h += '<div class="mg-mot-card"><video src="' + VID[i].v + '" poster="' + VID[i].p + '" preload="none" loop muted playsinline webkit-playsinline></video></div>';
      return h + "</div>";
    }
    function wireMotion(sec) {
      /* prefers-reduced-motion is deliberately NOT honoured here (owner
         order 2026-07-14: videos must autoplay on scroll). It is a common
         Windows default ("animation effects" off) and silently killed
         autoplay for the owner himself; only Save-Data still opts out. */
      var save = false;
      try { save = !!(navigator.connection && navigator.connection.saveData); } catch (e) { }
      var vids = [].slice.call(sec.querySelectorAll("video"));
      vids.forEach(function (v) {
        v.muted = true; v.defaultMuted = true;
        /* click still toggles; a manual pause holds until the next click */
        v.addEventListener("click", function () {
          if (v.paused) { v.__mgHold = false; v.muted = true; var p = v.play && v.play(); if (p && p.catch) p.catch(function () { }); }
          else { v.__mgHold = true; v.pause(); }
        });
      });
      if (save) return;
      /* Autoplay on scroll-into-view. Interval visibility pass, NOT
         IntersectionObserver — observers are unreliable on this LF SPA
         (MutationObserver never fires on PDP; IO left these click-only). */
      var iv = setInterval(function () {
        if (!document.body.contains(sec)) { clearInterval(iv); return; }
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var vw = window.innerWidth || document.documentElement.clientWidth;
        vids.forEach(function (v) {
          var r = v.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var visV = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          var visH = Math.min(r.right, vw) - Math.max(r.left, 0);
          var on = visV > r.height * 0.45 && visH > r.width * 0.55;
          if (on && v.paused && !v.__mgHold) { v.muted = true; var p = v.play && v.play(); if (p && p.catch) p.catch(function () { }); }
          else if (!on && !v.paused) { v.pause(); }
        });
      }, 600);
    }
    function relSection() {
      var y = document.querySelector(".mg-yml-head"); if (!y) return null;
      var h1 = document.querySelector("h1"), el = y;
      while (el.parentElement && el.parentElement !== document.body && !(h1 && el.parentElement.contains(h1))) el = el.parentElement;
      return el;
    }
    function sweep() {
      ["mg-icses", "mg-olcu", "mg-motion"].forEach(function (id) { var n = document.getElementById(id); if (n) n.remove(); });
    }
    function build() {
      if (!onPDP()) { if (!/\/products\//.test(location.pathname)) sweep(); return; }
      var rel = relSection(); if (!rel || !rel.parentElement) return;
      if (!document.getElementById("mg-motion")) {
        var c = document.createElement("section"); c.id = "mg-motion"; c.innerHTML = motHTML();
        rel.parentElement.insertBefore(c, rel);
        wireMotion(c);
      }
      if (!document.getElementById("mg-icses")) {
        var a = document.createElement("section"); a.id = "mg-icses"; a.innerHTML = icsHTML();
        rel.parentElement.insertBefore(a, rel);
        wireVoice(a);
      }
      if (!document.getElementById("mg-olcu")) {
        var b = document.createElement("section"); b.id = "mg-olcu"; b.innerHTML = OLCU;
        b.addEventListener("click", function () { window.__mgOpenSG && window.__mgOpenSG(); });
        rel.parentElement.insertBefore(b, rel);
      }
    }
    var t22; new MutationObserver(function () { clearTimeout(t22); t22 = setTimeout(build, 350); })
      .observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(build, 900); setInterval(build, 1500);
  })();


})();
