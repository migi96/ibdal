# Sovereign Grid

A reading head crosses the world and lights whole countries as it passes. Saudi Arabia, Spain and the UAE stay lit; Riyadh, Madrid and Dubai are marked and joined by arcs that run from Riyadh.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it directly in a browser (over http — the map is fetched, so `file://` will be blocked by the browser).
- `sovereign-grid.js` — the animation. Exposes `window.WorldFX.sovereignGrid`.
- `world.svg` — the map: 250 country outlines, each keyed by its ISO-2 id.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<div style="position:relative;height:600px">
  <canvas id="ai-world" style="width:100%;height:100%"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="sovereign-grid.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  WorldFX.ready()
    .then(function () { return WorldFX.loadWorld('world.svg'); })
    .then(function (world) {
      var anim = WorldFX.sovereignGrid(document.getElementById('ai-world'), world, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
</script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Strength of the highlights and motion. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Cities and countries

The map's projection was solved against 18 reference countries and is Mercator:

    x = 2.8047 * lon + 474.50
    y = 462.22 - 159.554 * ln(tan(pi/4 + lat/2))

so every place sits where it really is — Riyadh hit-tests inside the `SA` path and Madrid inside `ES`, to about a pixel. `project(lon, lat)` is exported if you want to place anything else.

- `SITES` holds Madrid, Riyadh (the primary, with the filled badge and the wider ring pulse) and Dubai as real coordinates, with `dx`/`dy` positioning each label. Add a city by adding its coordinates.
- `LINKS` says which pairs are joined; both arcs run from Riyadh as the hub.
- `FOCUS` lists the highlighted countries by ISO-2 id — `SA`, `ES`, `AE`. Any id in `world.svg` works.
- `VIEW` is the framed part of the 1010×666 drawing; tighten it to zoom into a region.

## Notes

- The static map is rendered once into an offscreen canvas per resize, so only the animated layer is redrawn each frame — 250 country paths stay cheap.
- Arabic labels are drawn by the browser's own text engine; the font stack falls back to a system Arabic face when Archivo has no glyph.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
