# Signal Pulse

The logo animated as what it is: a signal. Its three arcs stay separate paths, and each one scales about the tip they all radiate from — so the pulse leaves the source and travels outward through them in turn, rather than three shapes blinking in order. A field brightens behind the mark on each cycle, and the whole thing floats on its own slow tween. Hover tightens the cycle 2.6x and lifts the mark slightly.

Libraries: GSAP

## Files

- `index.html` — the AI-services section demo, with the logo inlined as SVG. Open it directly in a browser.
- `signal-pulse.js` — the animation. Exposes `window.SignalPulse`.
- `logo.svg` — the original mark, unchanged.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

The SVG must be **inline** in the page (not an `<img>`), because the animation addresses its individual paths. Copy the `<svg id="mark">` block out of `index.html`, or paste your own copy of `logo.svg` and add the three `data-arc` attributes — `0` on the tip chevron, `1` on the middle arc, `2` on the outer arc. That numbering is the pulse order.

```html
<div id="stage" style="position:relative;background:#050d2b;display:flex;align-items:center;justify-content:center">
  <div id="glow"></div>
  <!-- <svg id="mark" viewBox="0 0 175 131"> … three <path data-arc="0|1|2"> … </svg> -->
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="signal-pulse.js"></script>
<script>
  SignalPulse.ready().then(function () {
    var anim = SignalPulse.mount(document.getElementById('mark'), {
      stage: document.getElementById('stage'),   // hover target; defaults to the svg itself
      glow: document.getElementById('glow'),     // optional
      speed: 1,
      cycle: 2.5
    });
    // anim.destroy() on teardown; anim.timeline is the GSAP timeline if you want to drive it
  });
<\/script>
```

## Options

| Key | Default | What it does |
| --- | --- | --- |
| `speed` | `1` | Timeline rate. |
| `cycle` | `2.5` | Seconds from one pulse to the next — the gap is derived from it, so raising it only lengthens the pause, never the pulse. |
| `stage` | the svg | Element the hover listens on. Point it at the whole panel so the cursor doesn't have to find the arcs. |
| `glow` | none | Optional element brightened on each cycle. |

## Tuning

Four constants at the top of `signal-pulse.js` are the whole behaviour:

- `SOURCE` `'87.11 130.6'` — the tip every arc radiates from, in the logo's own viewBox units. This is the number that makes the animation read as a signal; if you redraw the mark, re-measure it.
- `REST` `0.5` — opacity of an arc waiting its turn. Lower is more dramatic, higher keeps the logo more legible at rest.
- `STEP` `0.19` — seconds between one arc lighting and the next. This is the speed of the wave itself.
- `BOOST` `2.6` — the hover multiplier.

## Notes

- The mark's outer and inner arcs are white-to-pale in the source SVG, so it needs a dark ground — on white they disappear. The demo uses `#050d2b`. For a light background you would need a dark-on-light version of the artwork.
- The pulse and the float are separate tweens on purpose; sharing one timeline makes them sync into a bounce.
- The timeline pauses when the mark scrolls out of view.
