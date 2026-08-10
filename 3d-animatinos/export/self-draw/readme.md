# Self Draw

The mark draws itself along its own path, holds while light circulates inside it, then unwinds and starts over.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it directly in a browser.
- `self-draw.js` — the animation. Exposes `window.LoopFX.selfDraw`.
- `loop.png` — the source render (transparent background — keep the transparency).
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-loop" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="self-draw.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  LoopFX.ready()
    .then(function () { return LoopFX.loadImage('loop.png'); })
    .then(function (img) {
      var anim = LoopFX.selfDraw(document.getElementById('ai-loop'), img, opts);
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

- The loop's centreline is a lemniscate fitted to this artwork (the `GEO` constants at the top of the file). Swap in a different render and you only need to retune `GEO`.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
- Give the canvas a fixed CSS size, or a sized parent; the animation fills whatever box it is given.
