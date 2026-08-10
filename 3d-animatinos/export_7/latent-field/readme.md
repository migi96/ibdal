# Latent Field

The object dissolves into a particle field, drifts through latent space and reassembles itself.

Libraries: three.js points · GSAP

## Files

- `index.html` — the AI-services section demo. Open it directly in a browser.
- `latent-field.js` — the animation. Exposes `window.SphereFX.latentField`.
- `sphere.png` — the source render (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-sphere" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="latent-field.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  SphereFX.ready()
    .then(function () { return SphereFX.loadImage('sphere.png'); })
    .then(function (img) {
      var anim = SphereFX.latentField(document.getElementById('ai-sphere'), img, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
</script>
```

The two library tags can be swapped for your own bundled copies of three.js / GSAP.

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Amplitude of the motion. |
| `pointerFollow` | `true` | Cursor steers the object; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Notes

- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
- Give the canvas a fixed CSS size, or a sized parent; the animation fills whatever box it is given.
