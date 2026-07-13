/* =============================================================================
   Mermaid's Glance — i18n engine  (EN base · TR · DE · FR)
   -----------------------------------------------------------------------------
   LightFunnels has NO native multi-language (verified: funnel node has no
   locale/language/translations field). So we translate entirely client-side.

   Loaded by the inline loader stub BEFORE mg.js, on every page. A single
   persistent DOM-dictionary MutationObserver translates ALL chrome — the inline
   header_scripts nav/cart/size-guide/checkout output AND mg.js's footer / contact
   / about output — with zero changes to that (fragile) rebuild code, because we
   translate post-render by exact text-node match. Product title + description are
   handled by a separate route-gated layer on the PDP.

   Phase 1 (live) = engine + short UI dictionary (below).
   Long-form content (manifesto, FAQ Q&A) → i18n-content.<lang>.json (Phase 2).
   Product copy → products.<lang>.json (Phase 3, PDP only).

   Hosting: jsDelivr, same repo/pin as mg.js — deploy by pushing to the CDN repo
   and updating the pinned SHA in header-scripts.html's loader stub.
   ============================================================================= */
(function () {
  if (window.__mgI18n) return;
  window.__mgI18n = true;

  /* Self-derive the CDN base from this module's own <script src> so it tracks the
     loader's @vN automatically — a hardcoded version goes stale on every bump. */
  var CDN = (function () {
    var t = Array.prototype.slice.call(document.scripts).filter(function (x) { return /mermaids-glance-lf@/.test(x.src); }).pop();
    return t ? t.src.replace(/\/(mg|i18n)\.js.*$/, "") : "https://cdn.jsdelivr.net/gh/ismaildemirok7/mermaids-glance-lf@v18";
  })();

  /* ---- language detection ------------------------------------------------- */
  var SUPPORTED = { tr: 1, de: 1, fr: 1, en: 1 };
  function pickLang() {
    try {
      var saved = localStorage.getItem("mgLang");
      if (saved && SUPPORTED[saved]) return saved;
    } catch (e) {}
    var nav = (navigator.language || navigator.userLanguage || "en")
      .slice(0, 2).toLowerCase();
    return SUPPORTED[nav] ? nav : "en";
  }
  var LANG = pickLang();
  window.MG_LANG = LANG;
  document.documentElement.setAttribute("lang", LANG);

  /* ---- short UI dictionary (Phase 1) -------------------------------------
     Keyed by the EXACT English text as rendered. Brand proper names
     (MERMAID'S GLANCE, THE AXELLE/NOCTURNE/… collection names) are deliberately
     absent → never translated. Drafts below: TR is production-grade; DE/FR are
     solid drafts flagged for Selin's brand-voice polish (// SELIN).            */
  var DICT = {
    /* nav — structural + category labels */
    "HOME":                 { tr: "ANA SAYFA",          de: "STARTSEITE",        fr: "ACCUEIL" },
    "NEW ARRIVALS":         { tr: "YENİ GELENLER",       de: "NEUHEITEN",         fr: "NOUVEAUTÉS" },
    "MOST DESIRED":         { tr: "EN ÇOK ARZULANLAR", de: "BESTSELLER",         fr: "LES PLUS DÉSIRÉS" },
    "SHOP":                 { tr: "ALIŞVERİŞ",           de: "SHOP",               fr: "BOUTIQUE" },
    "THE COLLECTIONS":      { tr: "KOLEKSİYONLAR",       de: "DIE KOLLEKTIONEN",  fr: "LES COLLECTIONS" },
    "ALL PIECES":           { tr: "TÜM PARÇALAR",        de: "ALLE TEILE",        fr: "TOUTES LES PIÈCES" },
    "CLIENT SERVICES":      { tr: "MÜŞTERİ HİZMETLERİ",  de: "KUNDENSERVICE",     fr: "SERVICE CLIENT" },
    "LINGERIE":             { tr: "İÇ GİYİM",            de: "DESSOUS",           fr: "LINGERIE" },
    "BODYSUIT":             { tr: "BODY",                de: "BODY",              fr: "BODY" },
    "BODYSUITS":            { tr: "BODY",                de: "BODYS",               fr: "BODYS" },
    "NIGHTWEAR":            { tr: "GECELİK",             de: "NACHTWÄSCHE",         fr: "NUIT" },
    "CORSET & HARNESS":     { tr: "KORSE & HARNESS",     de: "KORSETT & HARNESS",  fr: "CORSET & HARNAIS" },
    "COSTUME & ROLEPLAY":   { tr: "KOSTÜM & ROLEPLAY",   de: "KOSTÜM & ROLEPLAY",  fr: "COSTUME & JEUX DE RÔLE" },
    "ACCESSORIES":          { tr: "AKSESUARLAR",         de: "ACCESSOIRES",         fr: "ACCESSOIRES" },
    "CHEMISE & NIGHTDRESS": { tr: "KOMBİNEZON & GECELİK",de: "CHEMISE & NACHTKLEID", fr: "NUISETTE & CHEMISE DE NUIT" }, // SELIN
    "ROBE & KIMONO":        { tr: "ROB & KİMONO",        de: "MORGENMANTEL & KIMONO", fr: "PEIGNOIR & KIMONO" },
    "CAMI & PAJAMA SET":    { tr: "ATLET & PİJAMA TAKIMI", de: "CAMI & PYJAMA-SET", fr: "CARACO & PYJAMA" }, // SELIN
    "BODYSTOCKING":         { tr: "VÜCUT ÇORABI",        de: "BODYSTOCKING",      fr: "COMBINAISON RÉSILLE" },
    "HARNESS & ACCESSORY":  { tr: "HARNESS & AKSESUAR",  de: "HARNESS & ACCESSOIRE", fr: "HARNAIS & ACCESSOIRE" },
    "CONTACT":              { tr: "İLETİŞİM",            de: "KONTAKT",           fr: "CONTACT" },
    "TRACK YOUR ORDER":     { tr: "SİPARİŞ TAKİBİ",      de: "SENDUNG VERFOLGEN", fr: "SUIVRE MA COMMANDE" },
    "FAQ":                  { tr: "SSS",                 de: "FAQ",               fr: "FAQ" },
    "ABOUT US":             { tr: "HAKKIMIZDA",          de: "ÜBER UNS",          fr: "À PROPOS" },

    /* cart drawer */
    /* task-10 item 4: drawer language — "Sepet" is banned vocabulary (anayasa:
       Çanta≠Sepet, sen dili); "Nothing selected yet" was untranslated → İ-bug. */
    "YOUR BAG":             { tr: "ÇANTAN",              de: "IHRE TASCHE",       fr: "VOTRE PANIER" },
    "Nothing selected yet": { tr: "Çantan henüz boş",    de: "Noch nichts gewählt", fr: "Rien de sélectionné" },
    "SUBTOTAL":             { tr: "ARA TOPLAM",          de: "ZWISCHENSUMME",     fr: "SOUS-TOTAL" },
    "COMPLETE ORDER":       { tr: "SİPARİŞİ TAMAMLA",    de: "BESTELLUNG ABSCHLIESSEN", fr: "FINALISER LA COMMANDE" },
    "ADD TO BAG":           { tr: "ÇANTAYA EKLE",        de: "IN DIE TASCHE",     fr: "AJOUTER AU PANIER" },
    "CHOOSE A SIZE":        { tr: "BEDENİNİ SEÇ" },
    "UNAVAILABLE":          { tr: "MEVCUT DEĞİL" },
    "Unavailable":          { tr: "Mevcut değil" },
    "Go to size selection": { tr: "Beden seçimine git" },
    "Add selected size to bag": { tr: "Seçili bedeni çantaya ekle" },
    "SEPETE EKLE":          { tr: "ÇANTAYA EKLE",        de: "IN DIE TASCHE",     fr: "AJOUTER AU PANIER" },
    "SIZE GUIDE":           { tr: "BEDEN REHBERİ",       de: "GRÖSSENTABELLE",    fr: "GUIDE DES TAILLES" },
    "SIZE":                 { tr: "BEDEN",               de: "GRÖSSE",            fr: "TAILLE" },
    "COLOR":                { tr: "RENK",                de: "FARBE",             fr: "COULEUR" },
    "Quantity":             { tr: "Adet",                de: "Menge",             fr: "Quantité" },
    "Remove":               { tr: "Kaldır",              de: "Entfernen",         fr: "Retirer" },

    /* checkout — merchant-configured payment method name (LF renders it verbatim; TR
       shoppers otherwise hit an English label at the most sensitive step) */
    "Debit/Credit Card":    { tr: "Banka / Kredi Kartı", de: "Debit-/Kreditkarte", fr: "Carte bancaire" },
    /* hamburger-menu best-sellers entry (label is TR-first by brand default) */
    "EN ÇOK ARZULANANLAR":  { tr: "EN ÇOK ARZULANANLAR", de: "BESTSELLER",         fr: "LES PLUS DÉSIRÉS" },

    /* PDP native trust/info chrome (LF original-case, CSS-uppercased) */
    "30-Day Warranty":      { tr: "30 Günlük Garanti",   de: "30 Tage Garantie",  fr: "Garantie 30 jours" },
    "Shipping":             { tr: "Kargo",               de: "Versand",           fr: "Livraison" },
    "Return policy":        { tr: "İade politikası",     de: "Rückgaberecht",     fr: "Politique de retour" },
    "You may also like":    { tr: "Bunları da beğenebilirsiniz", de: "Das könnte dir auch gefallen", fr: "Vous aimerez aussi" }, // SELIN
    "Discover Your Size":   { tr: "Bedenini Keşfet" },
    "DISCOVER YOUR SIZE":   { tr: "BEDENİNİ KEŞFET" },
    "COMPLETE THE RITUAL":  { tr: "RİTÜELİNİ TAMAMLA" },
    "DETAILS & FIT":        { tr: "DETAY VE KALIP" },
    "SIZE, RETURNS & HYGIENE": { tr: "BEDEN, İADE VE HİJYEN" },
    "DELIVERY & TRACKING":  { tr: "TESLİMAT VE TAKİP" },

    /* PDP legal/trust copy — English base prevents TR leakage in US/EU. */
    "Size:": { tr: "Beden:" },
    "Review the size guide before choosing": { tr: "Seçiminden önce beden rehberini incele" },
    "; do not guess.": { tr: "; ölçünü tahmin etme." },
    "Withdrawal:": { tr: "Cayma hakkı:" },
    "You may notify us from contract formation through delivery, and within 14 days after delivery.": { tr: "Sözleşmenin kurulmasından teslimata kadar ve teslimden itibaren 14 gün içinde cayma bildirimi yapabilirsin." },
    "Hygiene exception:": { tr: "Hijyen istisnası:" },
    "For lingerie, withdrawal does not apply after protective packaging, tape, seals or wrapping have been opened.": { tr: "İç çamaşırında ambalaj, bant, mühür veya paket gibi koruyucu unsur açıldıktan sonra cayma hakkı uygulanmaz." },
    "For defective goods, your statutory choices include a refund, price reduction, free repair or replacement where possible. For a faster resolution,": { tr: "Ayıplı malda bedel iadesi, ayıp oranında indirim, ücretsiz onarım veya imkân varsa değişim dahil yasal seçimlik hakların saklıdır. Hızlı çözüm için" },
    "write with images within 48 hours after delivery": { tr: "teslimattan sonraki 48 saat içinde bize görselle yaz" },
    "; this does not limit your legal rights. See every condition in our": { tr: "; bu talep yasal haklarını sınırlamaz. Tüm koşullar" },
    "Return Policy": { tr: "İade Politikamızda" },
    "Order routing takes 1 business day. Delivery after dispatch is estimated at 7–15 business days; the total estimate is 8–16 business days from your order. Weekends and public holidays are excluded.": { tr: "Sipariş yönlendirmesi 1 iş günü sürer. Sevkiyat sonrası teslimat tahmini 7–15 iş günüdür; toplam tahmin 8–16 iş günüdür. Hafta sonu ve resmî tatiller hariçtir." },
    "Shipping, customs and border procedures are handled by us.": { tr: "Kargo, gümrük ve sınır işlemleri bize aittir." },
    "Follow it on your tracking page": { tr: "Yolculuğu takip sayfandan izleyebilirsin" },
    "The outer parcel is plain and unbranded; what it carries stays yours alone.": { tr: "Dış paket sade ve markasızdır; ne taşıdığı yalnızca sana kalır." },

    /* Custom size guide — English base, TR localized here. */
    "SIZE PROTOCOL — ARCHITECTURE": { tr: "BEDEN PROTOKOLÜ — MİMARİ" },
    "01 — WAIST": { tr: "01 — BEL" },
    "The narrowest point of your natural waist": { tr: "Doğal belinin en ince noktası" },
    "02 — HIPS": { tr: "02 — KALÇA" },
    "The widest point of your hips": { tr: "Kalçanın en geniş noktası" },
    "03 — UNDERBUST": { tr: "03 — ALT GÖĞÜS" },
    "Directly beneath your bust line": { tr: "Göğüs hattının hemen altı" },
    "Sets & Bottoms": { tr: "Takımlar ve Altlar" },
    "Bras & Bustiers": { tr: "Sütyen ve Büstiyer" },
    "Nightwear": { tr: "Gecelik" },
    "Waist (cm)": { tr: "Bel (cm)" },
    "Hips (cm)": { tr: "Kalça (cm)" },
    "Underbust": { tr: "Alt Göğüs" },
    "A Cup": { tr: "A Kup" },
    "B Cup": { tr: "B Kup" },
    "C Cup": { tr: "C Kup" },
    "D Cup": { tr: "D Kup" },
    "Bust (cm)": { tr: "Göğüs (cm)" },
    "Between two sizes —": { tr: "İki beden arasındaysan —" },
    "choose the larger.": { tr: "büyük olanı seç." },
    "The silhouette should hold without compromise.": { tr: "Siluet ödün vermeden sarmalıdır." },

    /* footer headings + links */
    "THE COMPANY":          { tr: "ŞİRKET",              de: "DAS UNTERNEHMEN",   fr: "L'ENTREPRISE" },
    "LEGAL":                { tr: "YASAL",               de: "RECHTLICHES",       fr: "MENTIONS LÉGALES" },
    "INFORMATION":          { tr: "BİLGİ",               de: "INFORMATIONEN",     fr: "INFORMATIONS" },
    "Privacy Policy":       { tr: "Gizlilik Politikası", de: "Datenschutz",       fr: "Politique de confidentialité" },
    "Refund Policy":        { tr: "İade Politikası",     de: "Rückgaberecht",     fr: "Politique de remboursement" },
    "Returns & Delivery":   { tr: "İade ve Teslimat",    de: "Rückgabe & Versand",fr: "Retours et livraison" },
    "Shipping Policy":      { tr: "Kargo Politikası",    de: "Versandrichtlinie", fr: "Politique d'expédition" },
    "Terms of Service":     { tr: "Kullanım Koşulları",  de: "AGB",               fr: "Conditions d'utilisation" },
    "About Us":             { tr: "Hakkımızda",          de: "Über uns",          fr: "À propos" },
    "Size Guide":           { tr: "Beden Rehberi",       de: "Größentabelle",     fr: "Guide des tailles" },
    "Ultra-luxury lingerie.": { tr: "Ultra-lüks iç giyim.", de: "Ultra-luxuriöse Dessous.", fr: "Lingerie ultra-luxe." },
    "Curated for women who choose to feel extraordinary.": {
      tr: "Olağanüstü hissetmeyi seçen kadınlar için küratörlüğü yapıldı." },

    /* Homepage Promise — factual, non-coercive, legally qualified. */
    "Trust begins with what is clear": { tr: "Güven, kararından önce" },
    "before you decide.": { tr: "açık olanla başlar." },
    "CURATED WITH INTENT": { tr: "NİYETLE SEÇİLDİ" },
    "Every piece is evaluated by the same standard: clear information, considered presence and no invented claims.": { tr: "Her parça aynı standartla değerlendirilir: açık bilgi, düşünülmüş duruş ve uydurulmamış iddia." },
    "RETURNS & HYGIENE": { tr: "İADE VE HİJYEN" },
    "Notify us of withdrawal within 14 days after delivery. The hygiene exception applies only after protective packaging or seals are opened.": { tr: "Teslimden itibaren 14 gün içinde cayma bildirimi yapabilirsin. Hijyen istisnası yalnız koruyucu ambalaj veya mühür açıldıysa uygulanır." },
    "Order routing takes 1 business day; delivery after dispatch is estimated at 7–15. Duties are handled and tracking is shared at dispatch.": { tr: "Sipariş yönlendirmesi 1 iş günü sürer; sevkiyat sonrası teslimat tahmini 7–15 iş günüdür. Harçlar bize aittir; takip bilgisi sevkiyatla paylaşılır." },

    /* contact page */
    "GET IN TOUCH":         { tr: "BİZE ULAŞIN",         de: "KONTAKT AUFNEHMEN", fr: "NOUS CONTACTER" },
    "SEND MESSAGE":         { tr: "MESAJ GÖNDER",        de: "NACHRICHT SENDEN",  fr: "ENVOYER LE MESSAGE" },
    "FREQUENTLY ASKED QUESTIONS": { tr: "SIKÇA SORULAN SORULAR", de: "HÄUFIG GESTELLTE FRAGEN", fr: "QUESTIONS FRÉQUENTES" },
    "MON–FRI, 10AM–9PM":    { tr: "PZT–CUM, 10:00–21:00", de: "MO–FR, 10–21 UHR", fr: "LUN–VEN, 10H–21H" },

    /* about page title (manifesto body → Phase 2 JSON) */
    "The Power of Grace: That Moment": {
      tr: "Zarafetin Gücü: O An",
      de: "Die Kraft der Anmut: Jener Moment", // SELIN
      fr: "Le Pouvoir de la Grâce : Cet Instant" } // SELIN
  };

  /* Regex rules for dynamic strings. Each: [pattern, {lang:tpl}].
     - "3 ITEMS" → cart count (LF-native casing handled by the /i flag).
     - "SIZE: S" / "COLOR: BLACK" → cart variant lines are ONE text node in
       LABEL: VALUE form, so the bare "SIZE"/"COLOR" dict keys never match.     */
  var RULES = [
    [/^(\d+)\s+ITEMS?$/i, { tr: "$1 PARÇA", de: "$1 ARTIKEL", fr: "$1 ARTICLE$2" }], /* task-10: "ürün" yasak sözlük (Silüet/Parça) */
    [/^SIZE:\s*(.+)$/i,   { tr: "BEDEN: $1", de: "GRÖSSE: $1", fr: "TAILLE: $1" }],
    [/^COLOR:\s*(.+)$/i,  { tr: "RENK: $1",  de: "FARBE: $1",  fr: "COULEUR: $1" }]
  ];

  /* Placeholder/attribute dictionary (form inputs render text via placeholder). */
  var ATTR = {
    "First name": { tr: "Ad",       de: "Vorname",  fr: "Prénom" },
    "Last name":  { tr: "Soyad",    de: "Nachname", fr: "Nom" },
    "Email":      { tr: "E-posta",  de: "E-Mail",   fr: "E-mail" },
    "Subject":    { tr: "Konu",     de: "Betreff",  fr: "Sujet" },
    "Message":    { tr: "Mesaj",    de: "Nachricht",fr: "Message" }
  };

  /* External content packs (Phase 2/3): per-ACTIVE-language files keyed by the
     exact English source text → translated string. Format: { "English": "Çeviri" }.
     Only the active language's pack is fetched (smaller payload). Product packs
     (PDP) are decomposed to the description's individual text nodes + the title,
     so the SAME text-node observer translates product copy with no PDP-specific
     code — the render is non-reactive, but we never touch the data object.        */
  function mergePack(j) {
    if (!j) return;
    for (var k in j) if (j.hasOwnProperty(k)) {
      var entry = DICT[k] || (DICT[k] = {});
      entry[LANG] = j[k];
      DICT_CI[k.toLowerCase()] = entry;
    }
    translateAll(); /* re-run with the enriched dictionary */
  }
  function loadPack(name) {
    fetch(CDN + "/" + name)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(mergePack)
      .catch(function () {});
  }

  /* ---- translation core ---------------------------------------------------
     Case-insensitive index: LF-native chrome stores text in original case and
     uppercases via CSS `text-transform` (e.g. node value "Add to bag" renders as
     "ADD TO BAG"). Our DICT keys are written as the *rendered* form, so an exact
     match misses native nodes. The CI fallback bridges that; CSS re-applies the
     visible casing to whatever translation we emit, so output case is harmless.  */
  var DICT_CI = {};
  for (var _k in DICT) if (DICT.hasOwnProperty(_k)) DICT_CI[_k.toLowerCase()] = DICT[_k];

  function lookup(raw) {
    if (LANG === "en") return null;
    var key = raw.trim();
    if (!key) return null;
    var hit = DICT[key] || DICT_CI[key.toLowerCase()];
    if (hit && hit[LANG]) return raw.replace(key, hit[LANG]); /* keep surrounding ws */
    for (var i = 0; i < RULES.length; i++) {
      var m = key.match(RULES[i][0]);
      if (m) {
        var tpl = RULES[i][1][LANG];
        if (!tpl) continue;
        var plural = /ITEMS$/.test(key) && LANG === "fr" ? "S" : "";
        return raw.replace(key, tpl.replace("$1", m[1]).replace("$2", plural));
      }
    }
    return null;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, OPTION: 1 };
  function translateNode(node) {
    var p = node.parentNode;
    if (!p || SKIP[p.nodeName]) return;
    var out = lookup(node.nodeValue);
    if (out != null && out !== node.nodeValue) node.nodeValue = out;
  }
  function translateAttrs(root) {
    if (LANG === "en") return;
    var scope = root.querySelectorAll ? root : document;
    var inputs = scope.querySelectorAll("input[placeholder],textarea[placeholder]");
    for (var i = 0; i < inputs.length; i++) {
      var ph = inputs[i].getAttribute("placeholder");
      var t = ph && ATTR[ph.trim()];
      if (t && t[LANG]) inputs[i].setAttribute("placeholder", t[LANG]);
    }
    var labelled = scope.querySelectorAll("[aria-label],[title]");
    for (var j = 0; j < labelled.length; j++) {
      ["aria-label", "title"].forEach(function (name) {
        var raw = labelled[j].getAttribute(name), out = raw && lookup(raw);
        if (out != null && out !== raw) labelled[j].setAttribute(name, out);
      });
    }
  }
  function walk(root) {
    if (LANG === "en") return;
    if (root.nodeType === 3) { translateNode(root); return; }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) translateNode(n);
    translateAttrs(root);
  }
  function translateAll() { walk(document.body || document.documentElement); }

  /* Persistent observer: the LF SPA re-renders chrome on navigation, and mg.js
     injects footer/contact/about after first paint — a one-shot pass loses that
     race. Idempotent by construction: translated text no longer matches an EN
     key, so re-running is a no-op (no observer feedback loop). Debounced. */
  var _t;
  function schedule() { clearTimeout(_t); _t = setTimeout(translateAll, 120); }
  function startObserver() {
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true, subtree: true, characterData: true
    });
    translateAll();
  }

  /* ---- product layer (PDP) -------------------------------------------------
     The PDP renders window.data.product.description (HTML) into clean text nodes
     (h3/p, inside `.mgpx-bd`) and the title into the H1 (text-transform:uppercase).
     The render is non-reactive, so we do NOT mutate the data object. Instead the
     product pack is keyed by the exact English text of each description text node
     (+ the title), and the existing observer translates them. Loaded only on PDP,
     keyed nowhere — it's just dictionary entries. Pack name uses the active lang.  */
  function loadProductPack() {
    if (LANG === "en") return;
    if (!/^\/products\//.test(location.pathname)) return;
    loadPack("i18n/products." + LANG + ".json");
  }

  /* ---- FOUC soft-gate ----------------------------------------------------
     Only when not English. Hide body briefly so the first EN→target swap isn't
     visible, with a hard failsafe so a JS error never leaves the page blank.    */
  function gate() {
    if (LANG === "en") return function () {};
    var s = document.createElement("style");
    s.id = "mg-i18n-gate";
    s.textContent = "body{visibility:hidden!important}";
    (document.head || document.documentElement).appendChild(s);
    var done = false;
    function reveal() { if (done) return; done = true; var g = document.getElementById("mg-i18n-gate"); if (g) g.remove(); }
    setTimeout(reveal, 900); /* failsafe */
    return reveal;
  }

  /* ---- public API (switcher hook for Phase 4) ----------------------------- */
  window.MG_I18N = {
    lang: LANG,
    supported: ["en", "tr", "de", "fr"],
    set: function (l) {
      if (!SUPPORTED[l]) return;
      try { localStorage.setItem("mgLang", l); } catch (e) {}
      location.reload(); /* simplest robust re-render in the target language */
    },
    t: function (key) { var h = DICT[key]; return (h && h[LANG]) || key; }
  };

  /* ---- boot --------------------------------------------------------------- */
  var reveal = gate();
  function boot() {
    startObserver();
    loadProductPack();
    loadPack("i18n/content." + LANG + ".json"); /* Phase 2 long-form (404 ok for now) */
    setTimeout(reveal, 150); /* reveal shortly after first pass */
  }
  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
