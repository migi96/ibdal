# Guard Pulse

Threats arrive from the rim and are turned away at a barrier that flashes on impact, while the shield holds a steady outward pulse and breathes.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it over http — the icon is drawn to a canvas, so `file://` will be blocked by the browser.
- `guard-pulse.js` — the animation. Exposes `window.IconFX`.
- `icon.png` — the icon, cropped square to its own content with a small margin. Keep the transparency.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<div style="position:relative;height:420px;overflow:hidden">
  <canvas id="ai-icon" style="width:100%;height:100%"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="guard-pulse.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  IconFX.ready()
    .then(function () { return IconFX.loadKit('icon.png'); })
    .then(function (kit) {
      var anim = IconFX.guardPulse(document.getElementById('ai-icon'), kit, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
<\/script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Amplitude of the motion and the highlights. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. Hover also runs the loop 1.7× faster. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Tuning

`ping()` sets the barrier rhythm (one every 1.15s) and `threat()` the arrival rate. Both are self-rescheduling, so changing the delay in either changes the pace without touching a timeline.

## Notes

- This render is a single connected shape — the parts touch, so component labelling returns one blob and cannot separate them. The animation is built around that: whole transforms, code-drawn overlays that match the artwork's own geometry.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
