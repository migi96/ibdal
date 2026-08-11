# Counter Rotate

The two orb renders stacked on one axis, turning opposite ways at deliberately unequal rates so the two ring systems beat against each other instead of locking. Hover eases both velocities **through zero** and out the other way at 3.4x — a decelerate-and-reverse, not a jerk — and a soft field lifts behind the pair.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it over http (the images are drawn to canvas, so `file://` may be blocked by the browser).
- `counter-rotate.js` — the animation. Exposes `window.OrbFX`.
- `orb-1.png`, `orb-2.png` — the two renders, cropped to a common 900x900 square with the orb centred. That crop is what lets them stack concentrically and spin on one axis; if you swap in new art, crop it the same way.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<canvas id="ai-orb" style="width:520px;height:470px"></canvas>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="counter-rotate.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  OrbFX.ready()
    .then(function () { return OrbFX.loadPair('orb-1.png', 'orb-2.png'); })
    .then(function (pair) {
      var anim = OrbFX.counterRotate(document.getElementById('ai-orb'), pair, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
<\/script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Float, drift and glow strength. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. |

The `opts` object is read every frame, so changing a value retunes the animation live. The returned handle has one method, `destroy()`.

## Tuning the spin

Three constants at the top of `counterRotate` are the whole behaviour:

- `REST_A` `0.20` — orb 1's resting speed in radians per second (positive = clockwise).
- `REST_B` `-0.145` — orb 2's, negative so it turns the other way. Keeping the two rates unequal is what makes the pair read as two systems rather than one.
- `BOOST` `3.4` — the hover multiplier. It is applied as `-BOOST`, so hover reverses and accelerates in the same tween; the `power2.inOut` ease carries each orb smoothly down through a standstill and back up the other way.

Hover state is driven by `pointerenter` / `pointerleave` on the canvas.

## Notes

- Spin velocities and visual state (lift, glow) live on **separate** objects. GSAP's `overwrite: true` kills other tweens of the same target, so one tween per object — putting them together silently cancels the reversal.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
