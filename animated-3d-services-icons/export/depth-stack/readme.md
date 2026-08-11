# Depth Stack

Each bar becomes its own plane at its own depth, rising out of the floor and drifting on its own phase. The drifting camera is what reveals the space between them; hover pushes them further apart.

Libraries: three.js · GSAP

## Files

- `index.html` — the AI-services section demo. Open it over http — the chart is read pixel by pixel, so `file://` will be blocked by the browser.
- `depth-stack.js` — the animation. Exposes `window.BarsFX`.
- `bars.png` — the source render (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## How the bars are separated

The four bars touch in the artwork, so connected-component labelling would return them as one shape. They are split instead at the three **step edges** in the silhouette — the columns where the top-most opaque row jumps by more than 8px, which for this render is x = 88, 126 and 166 in the 280×280 source. `CUTS` at the top of the file is that list.

`prepare(img)` uses it to give each bar its own canvas, its own **baseline** and its own **top**, measured from the alpha channel. The baselines differ per bar (232, 232, 218, 205) because the chart is isometric and the further bars sit higher on screen — that is why each one has to grow about its own base rather than a shared floor.

Call `prepare` once and share the result if you run more than one variation on a page.

Each plane is positioned from its real x in the source, so the chart reassembles exactly — only z comes from bar order.

## Embedding

```html
<div style="position:relative;height:440px;overflow:hidden">
  <canvas id="ai-bars" style="width:100%;height:100%"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="depth-stack.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  BarsFX.ready()
    .then(function () { return BarsFX.loadKit('bars.png'); })
    .then(function (kit) {
      var anim = BarsFX.depthStack(document.getElementById('ai-bars'), kit, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
<\/script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Amplitude of the motion and the highlights. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Tuning

- The timeline in `build()` is the whole choreography — the per-bar stagger is the second argument to each `fromTo` (`i * 0.16`), so raising it spreads the run out.
- `i * 0.14` is the resting depth gap between bars, and `st.sep` multiplies it on hover.
- If you re-export the chart with different proportions, re-check `CUTS` — everything else is measured from the artwork at load.

## Notes

- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
