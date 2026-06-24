# Mermaid's Glance — LF customization spec

Implementation spec for the 5 work items. Written on Opus; execute on Sonnet 4.6
against the **live** store (Chrome MCP), never blind-deploy.

## Hard rules (from memory — do not violate)

1. **No blind deploy.** Storefront is `*.myecomstore.net`, password-walled, SPA.
   Inspect the real DOM with Chrome MCP before and after every change.
2. **Builder autosave reverts API deploys.** Before running `apply-hs.mjs`, the
   user must CLOSE the LF admin/builder. After deploy, re-fetch and confirm the
   change was not overwritten.
3. **header_scripts ~64KB cap, silent truncation.** Dry-run `node build-hs.mjs`
   after any inline change; `returned len < sent len` ⇒ truncated. Current
   headroom ≈ 793 bytes — only the loader stub + qty fix go inline; everything
   else goes in `mg.js`.
4. **Inline vs external split:** nav, cart drawer (+ qty fix), sticky stay INLINE
   in `header-scripts.html`. Contact / About / Footer rebuilds + all images live
   in `mg.js` (this repo), served via jsDelivr.
5. Brand font is **Montserrat** everywhere.
6. Store stays **English** for now; TR pass is a final, separate step.

## §0 — Loader stub (INLINE, header_scripts)

Add once, near the other IIFEs in `header-scripts.html`. ~200 bytes minified:

```html
<script>(function(){if(window.__mgL)return;window.__mgL=1;var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@v1/mg.js';s.defer=1;document.head.appendChild(s);})();</script>
```

After adding: `node build-hs.mjs` → confirm still under cap. Deploy via `apply-hs.mjs`
(builder closed). To ship new `mg.js`: `git push` + new tag `vN` + bump `@vN` here.

## §1 — Cart drawer reskin (INLINE)

Re-skin the EXISTING drawer (`header-scripts.html` `__mgCartDrawer`, `#mgcd-pn`,
`render()` ≈ L978-1016, CSS ≈ L901-935). Keep logic; change presentation only.
Reference design = attached Shopify-theme drawer, **English labels**:

- **Header title:** item-count aware → `N ITEM` / `N ITEMS` (was "YOUR BAG").
- **Column header row** under title: `ITEM` (left) · `TOTAL` (right).
- **Per item:** keep image + name. Variation lines in `LABEL: VALUE` form,
  uppercase: `COLOR: BLACK`, `SIZE: S` (current `it.size` → `SIZE: …`; color from
  `it.colorName`). Show the **line total** (unit×qty) right-aligned on the row.
- **Remove control:** replace the "Remove" text link with a **trash-can icon**
  button, positioned to the right of the qty stepper (see attached). SVG, no fill,
  `stroke:currentColor`, 18px, `opacity .3s` hover like `.mgc-x`.
- **Qty stepper:** keep `− N +`; wire to the §5 cookie-synced `__mgQty`.
- **Footer:** label `SUBTOTAL` (was "Total"); button `CHECKOUT` (was "PROCEED TO
  CHECKOUT") — keep `getCheckoutUrl()`.
- **Close X animation:** add rotate+fade on hover/active to `.mgc-x`
  (`transition:transform .3s,opacity .3s; :hover{transform:rotate(90deg);opacity:.5}`).
- **Font:** force `Montserrat` on `#mgcd-pn` and children (already set; verify it
  wins over LF defaults).
- Run final microcopy past `/mg` (Eylül CRO / Selin copy).

CSS budget: reuse existing `.mgc-*` classes; net byte delta must keep
`build-hs.mjs` under cap. If it doesn't fit, move the drawer CSS string out to a
`<style>`-injected block sourced from a constant — but prefer trimming.

## §5 — Quantity → checkout sync fix (INLINE) — do WITH §1

Bug (verified): `__mgQty` (≈L1055) updates the localStorage mirror + calls
`lfReplay`, but never writes the **LF cart cookie** quantity. `lfReplay` no-ops
when `LF_REQ` is absent (gone after reload), so checkout reads the stale qty.
`__mgRm` already splices the cookie correctly — mirror that, but SET quantity.

**First, live-inspect the cookie shape** (Chrome MCP on the live store, item in
cart): read `lf_*_cart`, confirm the exact path to a line's quantity
(`body[j].variants[0].quantity`? `body[j].quantity`?). Do NOT guess the field —
implement against the real shape. Then in `__mgQty`, after `lfReplay`, walk
`ck.body`, match `variants[0].id == it.vid`, set its quantity to `q`,
`writeLFCartCookie(ck)`. Verify end-to-end: bump qty → reload checkout → qty
reflects.

## §2 — Contact page rebuild (EXTERNAL, `mgContact`)

Route `^/contact/?$`. First diagnose why the live form "doesn't work" (Chrome MCP:
inspect the form element, submit handler, network on submit, console errors).
Then rebuild to the attached design:

- Heading `CONTACT`; dark card `GET IN TOUCH`.
- Fields: `NAME*`, `EMAIL*`, `PHONE`, `MESSAGE` (textarea); white `SEND MESSAGE`
  button. reCAPTCHA notice line below (Google Privacy Policy / Terms links).
- Contact block: `CONTACT`, `INFO@MERMAIDSGLANCE.COM`, `+1 302 5202387`,
  `MON–FRI, 10AM–9PM`.
- Wire submit to whatever transport the live diagnosis says works (LF native
  endpoint if present, else a form service). Confirm a test submission lands.

## §3 — Footer rebuild (EXTERNAL, `mgFooter`, global)

Inspect the real LF footer; rebuild to attached structure:

- `THE COMPANY` — `INFO@MERMAIDSGLANCE.COM`, `+1 302 5202387`.
- `LEGAL` column — Privacy Policy, Refund Policy, Shipping Policy, Terms of Service.
- `INFORMATION` column — About Us, Size Guide, Instagram, FAQ.
- `MERMAID'S GLANCE` wordmark (use `IMG + "/logo-wordmark.svg"` or brand font text).
- Resolve each link to its real LF route (verify, don't assume slugs). Coordinate
  with the inline `__mgHome` footer pass (L1565) so they don't fight — prefer
  moving footer handling fully here and disabling the inline fake-testimonial
  hider only if it overlaps.

## §4 — About Us rebuild (EXTERNAL, `mgAbout`)

Route `^/about/?$`. Replace generic content with the MANIFESTO (verbatim, English,
in `manifesto.txt` in this repo). Remove/hide unneeded generic images. ADD brand
images from `IMG` (to be sourced — confirm with user / `/mg` Vesna+Ece which
frames: product vs atmosphere). Typographic, editorial layout matching brand
(Montserrat, generous whitespace, ink `#0d0d0d` on light).

## Deploy checklist (every change)

1. Inline change? → `node build-hs.mjs` (under cap) → ask user to close builder →
   `node apply-hs.mjs` → re-fetch, confirm not reverted.
2. External change? → `git push` → new tag `vN` → bump `@vN` in the loader stub
   (inline change → redeploy header_scripts) OR use `@latest` during dev only.
3. Chrome MCP: load the affected live route, verify visually + functionally.
