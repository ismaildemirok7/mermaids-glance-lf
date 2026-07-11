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
    "THE COLLECTIONS":      { tr: "KOLEKSİYONLAR",       de: "DIE KOLLEKTIONEN",  fr: "LES COLLECTIONS" },
    "ALL PIECES":           { tr: "TÜM PARÇALAR",        de: "ALLE TEILE",        fr: "TOUTES LES PIÈCES" },
    "CLIENT SERVICES":      { tr: "MÜŞTERİ HİZMETLERİ",  de: "KUNDENSERVICE",     fr: "SERVICE CLIENT" },
    "LINGERIE":             { tr: "İÇ GİYİM",            de: "DESSOUS",           fr: "LINGERIE" },
    "BODYSUIT":             { tr: "BODY",                de: "BODY",              fr: "BODY" },
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
    "Crafted for women who choose to feel extraordinary.": {
      tr: "Olağanüstü hissetmeyi seçen kadınlar için tasarlandı.",
      de: "Gefertigt für Frauen, die sich außergewöhnlich fühlen wollen.", // SELIN
      fr: "Conçue pour les femmes qui choisissent de se sentir extraordinaires." }, // SELIN

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
    var inputs = (root.querySelectorAll ? root : document).querySelectorAll("input[placeholder],textarea[placeholder]");
    for (var i = 0; i < inputs.length; i++) {
      var ph = inputs[i].getAttribute("placeholder");
      var t = ph && ATTR[ph.trim()];
      if (t && t[LANG]) inputs[i].setAttribute("placeholder", t[LANG]);
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
