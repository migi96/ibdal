# Orbit Cluster

The three cubes drift apart along their own radii, each bobbing and tilting on its own phase, held by links that draw between them, then close back in.

Libraries: GSAP · Canvas 2D

## Files

- `index.html` — the AI-services section demo. Open it over http — the icon is drawn to a canvas, so `file://` will be blocked by the browser.
- `orbit-cluster.js` — the animation. Exposes `window.IconFX`.
- `icon.png` — the icon, cropped square to its own content with a small margin. Keep the transparency.
- `modernist.css` — the Modernist tokens and component classes used by the demo page. Not needed by the animation itself.

## Embedding

```html
<div style="position:relative;height:420px;overflow:hidden">
  <canvas id="ai-icon" style="width:100%;height:100%"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="orbit-cluster.js"></script>
<script>
  var opts = { speed: 1, intensity: 1, pointerFollow: true };
  IconFX.ready()
    .then(function () { return IconFX.loadKit('icon.png'); })
    .then(function (kit) {
      var anim = IconFX.orbitCluster(document.getElementById('ai-icon'), kit, opts);
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

`splitSeeds` assigns every pixel to the nearest of three seed points — `[[0.62,0.24],[0.26,0.66],[0.74,0.72]]`, in fractions of the artwork. If you re-export the icon with the cubes in different places, move those three seeds.

## Notes

- This render is a single connected shape — the parts touch, so component labelling returns one blob and cannot separate them. The animation is built around that: whole transforms, code-drawn overlays that match the artwork's own geometry, and a geometric split that the layout makes reliable.
- The canvas sizes itself to its container (a `ResizeObserver` handles layout changes) and caps device pixel ratio at 2.
- The loop pauses when the canvas scrolls out of view or the tab is hidden.
