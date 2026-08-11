# Glass Suspension

Each stroke sits at its own depth in real 3D and breathes on its own phase; the drifting camera is what reveals the space between them. Hover pushes them further apart with an overshoot.

Libraries: three.js · GSAP

## Files

- `index.html` — the AI-services section demo. Open it over http — the mark is read pixel by pixel, so `file://` will be blocked by the browser.
- `glass-suspension.js` — the animation. Exposes `window.GlyphFX`.
- `glyph.png` — the mark, cropped square to its own content (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-glyph" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="glass-suspension.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  GlyphFX.ready()
    .then(function () { return GlyphFX.loadImage('glyph.png'); })
    .then(function (img) {
      var kit = GlyphFX.prepare(img);
      var anim = GlyphFX.glassSuspension(document.getElementById('ai-glyph'), kit, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
<\/script>
```

## What prepare() does

`prepare(img)` is what makes these animations possible. The mark is four separate strokes — the bowl, the alif, its hamza and the dot — and connected-component labelling on the alpha channel recovers each one as its own layer. It then walks a **geodesic distance** out from each stroke's pen-entry point, staying inside the stroke, so every pixel knows how far along the stroke it sits.

Call it once and share the result between animations.

Two tables at the top of the file control it:

- `ROLES` maps strokes to names **by area rank** — largest is the bowl, then the alif, the hamza, the dot — and gives each one its pen entry: `top` for a downstroke, `right` for a right-to-left sweep, `centre` for a dot. If you re-export the artwork and the area ranking changes, this is what to fix.
- `STROKE_ORDER` is the calligraphic order the strokes are written in. Arabic runs right to left, so the alif comes first, then its hamza, then the bowl, then the dot.

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Amplitude of the motion and the highlights. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Notes

- Each stroke's plane is positioned from its real coordinates in the artwork, so the mark reassembles exactly; only z comes from stroke order.
- The camera does the work — the parallax is what reveals the depth between strokes, not the strokes moving.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
