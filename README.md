# mermaids-glance-lf

External JS module + image host for the Mermaid's Glance LightFunnels storefront.

## What this is

LightFunnels caps a funnel's `header_scripts` at ~64KB. The critical/global code
(nav, cart drawer, sticky bar) lives inline there. This repo holds the heavier
page rebuilds (contact, about), the footer rebuild, and all images — with no size
cap — served over jsDelivr.

## How it loads

A small loader stub in `header_scripts` injects `mg.js`:

```
https://cdn.jsdelivr.net/gh/mermaidsglance-lf/mermaids-glance-lf@v1/mg.js
```

`mg.js` self-gates by route (footer everywhere; contact/about only on their pages).

## Deploy

1. Edit `mg.js` / add images.
2. `git push`
3. New release tag (`v2`, `v3`, …) and bump `@vN` in the loader stub so jsDelivr
   serves the new version (jsDelivr caches tagged versions immutably).

## Files

- `mg.js` — the route-gated module (entry point).
- `images/` — brand images, served via `…@vN/images/<name>`.
- `manifesto.txt` — About Us copy (source of truth).
- `SPEC.md` — full implementation spec for all work items.
