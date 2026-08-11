# Light Up

The two renders stacked on one axis, fading from dimmed to lit and back on a loop.

The fade is not a flat cross-dissolve. The lit render is revealed through a soft-edged radial mask growing outward **from the brain**, with the overall level following just behind it, so it reads as the fluid illuminating from the inside rather than one picture replacing another. A field blooms behind the glass, a core brightens at the brain, a slow specular crosses the sphere once it is lit, and the rim picks the light up last. On the way down the level falls first and the reveal closes back to the brain.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it over http (`file://` will block the canvas draw).
- `light-up.js` — the animation. Exposes `window.BrainFX`.
- `brain-dim.png`, `brain-lit.png` — the two renders, **normalised to one frame** (see below). Keep the transparency.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Registration

Your two renders were different heights (903×1520 and 903×1355) and different crops, so stacking them raw would have made the sphere jump. Both were normalised into one **960×1090** frame registered on the sphere — its widest row 900px across, centred at x 480, top of the glass at y 8. That lands the two waterlines within 4px of each other across a 900px sphere, which is what lets them dissolve without any drift. If you re-export either render, re-normalise it to those same three landmarks.

## Embedding

```html
<div style="position:relative;height:600px;overflow:hidden">
  <canvas id="ai-brain" style="width:100%;height:100%"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="light-up.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, hold: 2.4, pointerFollow: true };
  BrainFX.ready()
    .then(function () { return BrainFX.loadKit('brain-dim.png', 'brain-lit.png'); })
    .then(function (kit) {
      var anim = BrainFX.lightUp(document.getElementById('ai-brain'), kit, opts);
      // anim.destroy() on teardown; mutate opts at any time to retune live
    });
<\/script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Strength of the glow, core and specular. |
| `hold` | `2.4` | Seconds held at full brightness before it fades back down. Read when the timeline is built, so set it at mount. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. Hover also runs the cycle 1.6× faster. |

`speed`, `intensity` and `pointerFollow` are read every frame, so changing them retunes the animation live. The returned handle has one method, `destroy()`.

## Tuning

- `SOURCE` at the top of the file is where the light starts — the brain, which sits a little above the sphere's centre. Move it and the whole reveal re-origins.
- `feather` in the draw loop (`R * 0.55`) is how soft the advancing light edge is. Larger is gentler; drop it towards `R * 0.15` for a harder, more visible wavefront.
- The timeline in `build()` is the whole choreography: 2.3s up, `hold` at full, ~2s down, half a second between cycles. Lengthen the up/down durations for an even slower breath.

## Notes

- Only two canvas draws and one masked composite per frame, so it is cheap enough to leave running.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
