# Stream Lines — pure code

The same wave as the image version, generated at runtime: seven ribbon curves over a white ground, blurred in code, with light streams riding the crest. No PNG, so it scales to any size, weighs nothing, and the whole composition breathes.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — a full-width AI-services hero. Open it directly in a browser.
- `stream-wave.js` — the animation. Exposes `window.WaveCodeFX.streamWave`.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<div style="position:relative;height:470px;overflow:hidden">
  <canvas id="ai-wave" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
  <!-- your headline and buttons go here, above the canvas -->
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="stream-wave.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  WaveCodeFX.ready().then(function () {
    var anim = WaveCodeFX.streamWave(document.getElementById('ai-wave'), opts);
    // anim.destroy() on teardown; mutate opts at any time to retune live
  });
<\/script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Global time multiplier. |
| `intensity` | `1` | Wobble amplitude of the ribbons and brightness of the streams. |
| `pointerFollow` | `true` | Cursor parallax; set `false` for a hands-off loop. |

## Shaping the wave

Two arrays at the top of `stream-wave.js` are the whole design:

- `SHAPE` — the silhouette, as control points across the width (0 = top of the box, 1 = bottom). The default reads high at the left, dips through the middle and lifts at the right.
- `RIBBONS` — one entry per band: `off` pushes it below the silhouette, `th` is its thickness, `col`/`a` its colour and opacity, `blur` its softness, and `w1/a1/s1` + `w2/a2/s2` are the two sine waves that make it drift. Order is back to front.

Recolouring the whole wave is a matter of editing the six `col` values.

## Notes

- The soft body is drawn at half resolution with a canvas blur and scaled up; the fine threads and streams are drawn crisp on top. That keeps it cheap enough to leave running.
- Browsers without canvas `filter` support fall back to a lower-resolution upscale for the same softness.
- The canvas sizes itself to its container and caps device pixel ratio at 2. The loop pauses when it scrolls out of view or the tab is hidden.
