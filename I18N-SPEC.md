# Mermaid's Glance — i18n (EN / TR / DE / FR)

Client-side translation for the LightFunnels storefront. **There is no native LF
i18n** — verified: the funnel node has no `locale` / `language` / `translations`
field. So *everything* is translated in the browser by `i18n.js`.

## Decisions (locked 2026-06-24)

- **Scope:** total — UI chrome + product title/description + policy pages + (best
  effort) checkout. Visitor sees one language end to end.
- **Trigger:** `navigator.language` on first visit → persisted in
  `localStorage.mgLang` → overridable via a manual switcher in the footer/nav.
  `tr→Türkçe, de→Deutsch, fr→Français, everything else→English` (base).
- **Product copy (538 products, ~530 distinct descriptions, ~260K chars):**
  machine-translated by Claude into TR/DE/FR, then Selin polishes brand-critical
  lines. Delivered as route-gated JSON loaded only on PDP.
- **UI copy:** drafted in all three languages now (so the system is testable),
  Selin polishes in place (brand voice).

## Architecture

```
loader stub (inline header_scripts)  ──loads──▶  i18n.js (CDN)  ──then──▶  mg.js (CDN)
                                                     │
                          ┌──────────────────────────┼────────────────────────────┐
                          ▼                          ▼                              ▼
              lang detect + switcher        DOM dictionary observer        product-data layer (PDP)
              (localStorage.mgLang)         (EN→target text-node swap,      window.data.product →
                                            persistent MutationObserver,    swap title + descriptionHtml
                                            catches inline nav/cart +        from products.<lang>.json
                                            mg.js footer/contact/about +
                                            LF chrome — no refactor of
                                            existing rebuild code)
```

**Why a post-render DOM observer (not emit-time `t()`):** it translates the inline
header_scripts output (nav, cart drawer, size guide, checkout relabels) AND mg.js's
own footer/contact/about output with a *single* mechanism and **zero changes** to
the existing, fragile rebuild code. The observer mirrors the footer-rebuild
observer pattern already in `mg.js` (the SPA re-renders; one-shot loses the race).

**Load order matters:** `i18n.js` must be loaded *before* `mg.js` so the dictionary
+ observer are live when footer/contact/about inject their English. The loader stub
loads `i18n.js` first, then `mg.js` (both route: every page).

## Hard rules (inherited)

1. **No blind deploy.** Storefront is `*.myecomstore.net`, password-walled, SPA.
   Verify with Chrome MCP on the live store before/after.
2. **Builder autosave reverts API deploys** — only relevant if the loader stub
   (inline) changes; the CDN files (`i18n.js`, product JSON) deploy via git+tag.
3. **Inline header_scripts is FULL** (64,832 / 65,000). The only inline change
   allowed is adding `i18n.js` to the loader — measure with `build-hs.mjs`, it must
   stay under cap. If it doesn't fit, fold the i18n loader line into the existing
   stub rather than adding a second `<script>`.
4. Brand font Montserrat everywhere; brand proper names never translated
   (MERMAID'S GLANCE, THE AXELLE/NOCTURNE/FLORA/… collection names).

## What is translated vs. left as-is

| Translate | Leave (proper noun / brand) |
|---|---|
| HOME, NEW ARRIVALS, THE COLLECTIONS, ALL PIECES, CLIENT SERVICES | MERMAID'S GLANCE |
| LINGERIE, BODYSUIT, CHEMISE & NIGHTDRESS, ROBE & KIMONO, CAMI & PAJAMA SET, BODYSTOCKING, HARNESS & ACCESSORY | THE AXELLE, THE NOCTURNE, THE FLORA, THE SIENNA, THE SERENA, THE MARLENE, THE JUNO, THE LORELEI, THE CALYPSO (collection names) |
| Cart: YOUR BAG, ITEM(S), SUBTOTAL, COMPLETE ORDER, ADD TO BAG, SIZE GUIDE, SIZE, COLOR, Remove | Series names inside product titles (ZIVA, MARLENE, …) |
| Footer headings + tagline + LEGAL/INFO links | © year line, email, phone |
| Contact: CONTACT, GET IN TOUCH, form labels, SEND MESSAGE, FAQ block | Instagram (label kept) |
| About: title + manifesto paragraphs | kicker "MERMAID'S GLANCE" |
| Product title (descriptive part) + descriptionHtml | product handle/slug (URLs unchanged) |

## Phasing

- **Phase 1 (this turn):** engine (`i18n.js`) + short-UI dictionary EN/TR/DE/FR
  (nav, cart, footer headings, contact form labels). Deployable + testable.
- **Phase 2:** long-form UI content (manifesto, 7 FAQ Q&A, footer tagline) →
  `i18n-content.<lang>.json`. Drafted by Claude, polished by Selin.
- **Phase 3:** product title + description → `products.<lang>.json` (route-gated,
  PDP only). Claude MT → Selin polish on brand-critical lines.
- **Phase 4:** manual language switcher UI in footer + live Chrome-MCP verify on
  every route (home / collection / PDP / contact / about / checkout).

## Known tradeoffs (accepted)

- **SEO:** Google indexes the English base (translation is post-JS). Multilingual
  SEO (hreflang, server-rendered locales) is out of scope for this pass.
- **Checkout:** LF-owned, fragile DOM; best-effort dictionary pass, must be
  live-verified — no guarantee of 100% coverage.
- **FOUC:** inline has no room for an early lang flag, so ~first paint may flash
  English. `i18n.js` loads early and gates `body` visibility briefly to mask it.

## Deploy

CDN files: `git push` + new tag `vN`, bump `@vN` in the loader stub (inline →
`build-hs.mjs` under cap → close builder → `apply-hs.mjs` → re-fetch, confirm not
reverted). During dev only, `@latest` is acceptable to avoid re-deploying inline.

### Phase 1 deploy (turnkey — measured 2026-06-24)

Live loader is currently `@v12` (single: `mg.js`). The new dual-loader loads
`i18n.js` *before* `mg.js`, both at the new tag. **Measured fit: 64,775 / 65,000,
headroom 225** (the dual-loader costs ~48 B over the old single-loader — fits).

1. In `mermaids-glance-lf`: `git add i18n.js I18N-SPEC.md && git commit && git push`,
   then `git tag v13 && git push --tags`. (mg.js unchanged → its `@v2` image refs
   still resolve; bumping its `CDN` const to v13 is optional, not required.)
2. In `header-scripts.html`, replace the single loader line (`…@v12/mg.js…`) with
   the dual-loader (ordered via `async=false`):
   ```html
   <script>(function(){if(window.__mgL)return;window.__mgL=1;var B='https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@v13/',h=document.head;['i18n.js','mg.js'].forEach(function(f){var s=document.createElement('script');s.src=B+f;s.async=false;h.appendChild(s);});})();</script>
   ```
3. `node build-hs.mjs` → confirm under cap (≈ headroom 225). Ask user to **close
   the LF builder**. `node apply-hs.mjs`. Re-fetch `header_scripts`, confirm the
   dual-loader survived (not autosave-reverted).
4. **Chrome MCP live-verify** on `*.myecomstore.net` with `navigator.language`
   forced to each of tr/de/fr: nav, cart drawer (open it), footer, contact, about,
   checkout. English = baseline (no swap). Watch for: untranslated chrome (add to
   DICT), over-translation of brand names (must NOT happen — they're absent from
   DICT), FOUC flash longer than ~150 ms.
