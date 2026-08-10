# Orbital Volume

Three real 3D rings of rounded tiles turn around the artwork while the camera drifts, a pulse running around each ring.

Libraries: three.js

## Files

- `index.html` — the AI-services section demo. Open it directly in a browser.
- `orbital-volume.js` — the animation. Exposes `window.TilesFX.orbitalVolume`.
- `tiles.png` — the source render (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-tiles" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="orbital-volume.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  TilesFX.ready()
    .then(function () { return TilesFX.loadImage('tiles.png'); })
    .then(function (img) {
      var anim = TilesFX.orbitalVolume(document.getElementById('ai-tiles'), img, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
</script>
```

The library tags can be swapped for your own bundled copies of three.js.

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Amplitude of the motion. |
| `pointerFollow` | `true` | Cursor steers the scene; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Notes

- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
- Give the canvas a fixed CSS size, or a sized parent; the animation fills whatever box it is given.
