# إبداع الفكر — الملف التعريفي (Ibdal Al-Fakr deck site)

A 30-slide RTL presentation site built from the Figma file `ibdal` (node 1-2),
with live 3D canvas animations from `../3d-animatinos/`.

## Run

The animations sample image pixels, so the site must be served over HTTP
(file:// will taint the canvases):

```bash
python3 -m http.server 8931 --directory site
# then open http://127.0.0.1:8931
```

Navigate with arrow keys, Page Up/Down, space, or scrolling. In RTL fashion,
ArrowLeft also advances.

## Structure

- `index.html` — generated file. Do not edit by hand; run `./assemble.sh`.
- `assemble.sh` — stitches `parts/head.html` + `slides/*.html` (sorted) + `parts/tail.html`,
  injecting one `<link>` per `css/slides/*.css` and the FX script hook from `parts/fx.html`.
- `slides/NN-name.html` — one `<section class="slide" id="s-NN">` per slide, designed at 1024×576.
- `css/base.css` — design tokens, slide frame, viewport scaling, HUD.
- `css/slides/NN-name.css` — per-slide styles; every selector is scoped under `#s-NN`.
- `js/deck.js` — slide scaling + keyboard/scroll navigation.
- `js/fx.js` — loads the 3D animations and swaps the matching still renders for live canvases:
  - slide 12 (Juman AI intro): `latent-field` particle sphere (three.js)
  - slide 13 (capabilities): `self-draw` infinity loop
  - slide 14 (architecture): `docking-field` isometric tiles
  - slide 29 (CTA): `stream-wave` coded stream lines (patched `transparent: true` mode)
- `vendor/fx/` — animation modules copied from `../3d-animatinos/` exports.
  Local patches: red accent `[236,48,19]` → brand cyan `[70,198,255]` in all modules;
  `stream-wave.js` gained an `opts.transparent` flag that skips its paper backdrop.
  FX scripts must load sequentially — `LoopFX`/`TilesFX` names are shared by
  several modules and would overwrite each other (js/fx.js handles this).
- `assets/NN-name/` — all Figma image/SVG exports, downloaded locally.
- `reference/` — Figma screenshots of every slide, used for visual verification.

## Fonts

Alexandria (200–800) from Google Fonts, loaded in `parts/head.html`.
