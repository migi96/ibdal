# Data Uplink

Packets ride the platform's own light lines into the rack; each arrival lights a column and a read head crosses the face.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it directly in a browser.
- `data-uplink.js` — the animation. Exposes `window.StackFX.dataUplink`.
- `stack.png` — the source render (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-stack" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="data-uplink.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  StackFX.ready()
    .then(function () { return StackFX.loadImage('stack.png'); })
    .then(function (img) {
      var anim = StackFX.dataUplink(document.getElementById('ai-stack'), img, opts);
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

- The glowing connector positions are the `NODES` constants at the top of the file, in fractions of the artwork box. Swap in a different render and you only need to retune those.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
- Give the canvas a fixed CSS size, or a sized parent; the animation fills whatever box it is given.
