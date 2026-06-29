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

  var CDN = "https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@v16";
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

  /* Hide the cart-plus icon (Iconoir font span) that LF renders next to the ATC button. */
  css("[class*='iconoir-cart-plus'],[class*='iconoir-cart']{display:none!important;}");

  /* Checkout payment-method cards + payment-logo badges carry an 8px radius the
     global inline reset misses (LF hash classes, checkout step only). Square them. */
  css(".tebYR,.zsy6s,.NF7a4{border-radius:0!important;}");

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
          '<div class="mgf-tag">Ultra-luxury lingerie.<br>Crafted for women who choose to feel extraordinary.</div>' +
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
          '<a href="/about-us" class="mgf-lnk">About Us</a>' +
          '<a href="/contactus" class="mgf-lnk">FAQ</a>' +
          '<a href="https://www.instagram.com/mermaidsglanceofficial/" target="_blank" rel="noopener" class="mgf-lnk">Instagram</a>' +
        '</div>' +
      '</div>' +
      '<div class="mgf-bot">' +
        '<span>© 2025 MERMAID\'S GLANCE</span>' +
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
      t: "İADE VE TESLİMAT",
      body:
        '<p class="mgpol-lead">Her parça, size ulaşana dek özenle hazırlanır. Aşağıda hazırlık, teslimat ve iade sürecimizi açık ve eksiksiz bulacaksınız.</p>' +
        '<h2>Hazırlık &amp; Teslimat</h2><p>Her siluet, sevkiyattan önce 2–5 iş günü süren özenli bir hazırlık gerektirir. Sevkiyat sonrası teslimat süresi — hem Türkiye hem global (ABD, İngiltere, AB) — 7–15 iş günüdür. Hafta sonları ve resmî tatiller bu süreye dâhil değildir.</p>' +
        '<h2>Gümrük &amp; Vergiler</h2><p>Sınırların kontrolünü tümüyle biz üstleniriz. Tüm uluslararası vergiler, gümrük işlemleri ve yasal harçlar tarafımızca karşılanır. Teslimatta hiçbir gizli ücret yoktur.</p>' +
        '<h2>Sipariş Değişikliği &amp; İptal</h2><p>Satın alımdan itibaren siparişinizi iptal etmek veya bilgilerinizi düzenlemek için 24 saatlik bir süreniz vardır. Bu sürenin ardından küratörlük sürecimiz başlar ve lojistik ağı kilitlenir; iptal veya değişiklik artık mümkün değildir.</p>' +
        '<h2>İade</h2><p>Mahrem olmayan parçalar için teslimattan itibaren 14 gün içinde iade başlatabilirsiniz. Parça kusursuz, yıkanmamış, etiketli ve orijinal sunumunda olmalıdır.</p>' +
        '<h2>Hijyen Standardı</h2><p>Mahrem alt parçalarda, tangalarda ve bodysuit’lerde iade kabul edilmez. Bu standart, teninize değen parçanın kusursuz hijyenik ve yalnızca size ait olmasını güvence altına alır.</p>' +
        '<h2>Kusurlu Parça</h2><p>Kusurlarla pazarlık etmez, kısmi iade sunmayız. Bir parça kusurlu ulaşırsa, gecikmeden kusursuz bir parçayla değiştirilir. Teslimattan sonraki 48 saat içinde görsel kanıtla <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresinden bize ulaşın.</p>' +
        '<h2>İade Süreci</h2><p>Uygun bir iade için <a href="mailto:info@mermaidsglance.com">info@mermaidsglance.com</a> adresinden talebinizi iletin. Onaylanan iadelerde ücret iadesi, parça tarafımıza ulaşıp incelendikten sonra orijinal ödeme yönteminize yapılır.</p>'
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
    _ftT = setTimeout(function () { buildFooter(); buildPolicy(); ensureSearchBtn(); }, 200);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { buildFooter(); buildPolicy(); buildSearchOverlay(); ensureSearchBtn(); }, 600);

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
          ["Siparişimi iptal edebilir veya değiştirebilir miyim?",
            "Satın alımdan itibaren siparişinizi iptal etmek veya bilgilerinizi düzenlemek için kesin 24 saatlik bir süreniz vardır. Bu sürenin ardından küratörlük sürecimiz başlar ve lojistik ağı kilitlenir; iptal veya değişiklik artık mümkün değildir."],
          ["Parçam elime ne zaman ulaşır?",
            "Her siluet, sevkiyattan önce 2–5 iş günü özenli bir hazırlık gerektirir. Sevkiyat sonrası teslimat — hem Türkiye hem global (ABD, İngiltere, AB) — 7–15 iş günüdür. Hafta sonları ve resmi tatiller bu süreye dahil değildir."],
          ["Sürpriz gümrük vergisi veya ek ücret öder miyim?",
            "Kesinlikle hayır. Sınırların kontrolünü tamamen biz üstleniriz. Tüm uluslararası vergiler, gümrük işlemleri ve yasal harçlar tarafımızca karşılanır. Teslimatta hiçbir gizli ücret yoktur — yalnızca kusursuzluğu teslim alırsınız."],
          ["İade protokolünüz nedir?",
            "Mahrem olmayan parçalar için teslimattan itibaren 14 gün içinde iade başlatabilirsiniz. Parça kusursuz, yıkanmamış, etiketli ve orijinal sunumunda olmalıdır. Kesin Hijyen Standardı: Mahrem alt parçalarda, tangalarda ve bodysuit’lerde iade kesinlikle kabul edilmez. Bu, teninize değen parçanın kusursuz hijyenik ve yalnızca size ait olmasını güvence altına alır."],
          ["Parça kusurlu gelirse ne olur?",
            "Kusurlarla pazarlık etmez, kısmi iade sunmayız. Bir parça kusurlu gelirse, gecikmeden kusursuz bir parçayla değiştirilir. Teslimattan sonraki 48 saat içinde görsel kanıtla info@mermaidsglance.com adresinden bize ulaşın."],
          ["Parça nasıl paketlenir?",
            "Dış kargo paketi tamamen sade ve gizlidir. İçeride parçanız, imza mat siyah kutumuzun içinde özenle dinlenir. Gizliliğiniz mutlaktır."],
          ["Doğru bedenimi nasıl seçerim?",
            "Her parça hassas ölçülere göre üretilir. Bedeninizi tahmin etmeyin. Uyumunuzdan tam olarak emin olmak için parçanızı edinmeden önce Beden Rehberimize başvurun."]
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

})();
