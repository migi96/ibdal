# Broadcast

The two arcs are split out of the file and sent outward as real copies of themselves, on a 1.35s pulse.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it directly in a browser.
- `broadcast.js` — the animation. Exposes `window.WaveFX.broadcast`.
- `wave.png` — the source render (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-signal" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="broadcast.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  WaveFX.ready()
    .then(function () { return WaveFX.loadImage('wave.png'); })
    .then(function (img) {
      var anim = WaveFX.broadcast(document.getElementById('ai-signal'), img, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
</script>
```

The library tag can be swapped for your own bundled copy of GSAP.

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Amplitude of the motion. |
| `pointerFollow` | `true` | Cursor steers the scene; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Notes

- `splitParts()` separates the mark into its arcs at load time by labelling connected regions of the alpha channel, so each part animates on its own. `ORIGIN` at the top of the file is where the signal radiates from, in fractions of the artwork box — retune it if you swap the render.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
- Give the canvas a fixed CSS size, or a sized parent; the animation fills whatever box it is given.
