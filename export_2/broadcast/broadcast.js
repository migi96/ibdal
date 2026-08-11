/* Broadcast — ambient animation for one transparent PNG.
   Libraries: GSAP · Canvas 2D
   Usage:  WaveFX.ready().then(() => WaveFX.loadImage('wave.png'))
             .then(img => WaveFX.broadcast(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var INK = [32, 30, 29], ACCENT = [236, 48, 19];
  var LIGHT = [176, 216, 255], BLUE = [46, 116, 187], DARK = [54, 75, 99];
  var ART_AR = 139 / 185;              // the artwork's own aspect (h / w)
  var ORIGIN = [0.515, 0.90];          // where the signal comes from, in fractions of the box

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  function sizer(canvas, onResize) {
    var last = '';
    function measure() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      var key = w + 'x' + h + 'x' + dpr();
      if (key === last) return null;
      last = key;
      return { w: w, h: h, d: dpr() };
    }
    var ro = new ResizeObserver(function () { var m = measure(); if (m) onResize(m); });
    ro.observe(canvas);
    var first = measure();
    if (first) onResize(first);
    return { destroy: function () { ro.disconnect(); } };
  }

  function ticker(canvas, fn) {
    var raf = 0, alive = true, visible = true, last = performance.now(), clock = 0;
    var io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.02 });
    io.observe(canvas);
    function step(now) {
      if (!alive) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (visible && !document.hidden) { clock += dt; fn(dt, clock); }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function () { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
  }

  function pointer(canvas, opts) {
    var s = { tx: 0, ty: 0, x: 0, y: 0, over: 0, tOver: 0 };
    function move(e) {
      var r = canvas.getBoundingClientRect();
      s.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      s.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      s.tOver = 1;
    }
    function out() { s.tx = 0; s.ty = 0; s.tOver = 0; }
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', out);
    s.update = function (k) {
      var f = opts.pointerFollow === false ? 0 : 1;
      s.x += (s.tx * f - s.x) * k;
      s.y += (s.ty * f - s.y) * k;
      s.over += (s.tOver * f - s.over) * k;
    };
    s.destroy = function () {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', out);
    };
    return s;
  }

  /* split the mark into its parts — largest first (outer arc, then inner arc + wedge) */
  function splitParts(img, boxW, boxH) {
    var W = Math.max(2, Math.round(boxW)), H = Math.max(2, Math.round(boxH));
    var src = document.createElement('canvas');
    src.width = W; src.height = H;
    var sctx = src.getContext('2d');
    sctx.drawImage(img, 0, 0, W, H);
    var data = sctx.getImageData(0, 0, W, H);
    var d = data.data, N = W * H;
    var lab = new Int32Array(N).fill(-1), q = new Int32Array(N), comps = [];
    for (var i = 0; i < N; i++) {
      if (d[i * 4 + 3] <= 50 || lab[i] >= 0) continue;
      var head = 0, tail = 0; q[tail++] = i; lab[i] = comps.length;
      var area = 0, sx = 0, sy = 0;
      while (head < tail) {
        var p = q[head++], px = p % W, py = (p - px) / W;
        area++; sx += px; sy += py;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          var k = ny * W + nx;
          if (d[k * 4 + 3] > 50 && lab[k] < 0) { lab[k] = comps.length; q[tail++] = k; }
        }
      }
      comps.push({ id: comps.length, area: area, cx: sx / area / W, cy: sy / area / H });
    }
    var keep = comps.filter(function (c) { return c.area > N * 0.004; })
      .sort(function (a, b) { return b.area - a.area; });
    var parts = keep.map(function (c) {
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var out = cv.getContext('2d').createImageData(W, H);
      for (var j = 0; j < N; j++) {
        if (lab[j] !== c.id) continue;
        out.data[j * 4] = d[j * 4]; out.data[j * 4 + 1] = d[j * 4 + 1];
        out.data[j * 4 + 2] = d[j * 4 + 2]; out.data[j * 4 + 3] = d[j * 4 + 3];
      }
      cv.getContext('2d').putImageData(out, 0, 0);
      return { canvas: cv, cx: c.cx, cy: c.cy, area: c.area };
    });
    return parts.length ? parts : null;
  }

  /* ───────────────────────────── 5a — Broadcast ────────────────────────────── */
  function broadcast(canvas, img, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, w = 0, h = 0, parts = null;
    var size = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      w = Math.min(W / 1.02, H / ART_AR) * 0.74; h = w * ART_AR;
      parts = splitParts(img, w * D, h * D);
    });
    var pt = pointer(canvas, opts);

    var g = window.gsap, tweens = [], waves = [], kick = { v: 0 };
    function emit() {
      if (!g) return;
      var wv = { p: 0 };
      waves.push(wv);
      var tl = g.timeline({
        onComplete: function () { var k = waves.indexOf(wv); if (k > -1) waves.splice(k, 1); }
      });
      tl.to(wv, { p: 1, duration: 2.5, ease: 'power2.out' });
      tweens.push(tl);
      var kt = g.timeline();
      kt.to(kick, { v: 1, duration: 0.16, ease: 'power2.out' })
        .to(kick, { v: 0, duration: 0.9, ease: 'power2.out' });
      tweens.push(kt);
      tweens.push(g.delayedCall(1.35, emit));
    }
    if (g) tweens.push(g.delayedCall(0.5, emit));

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (g) tweens.forEach(function (x) { x.timeScale && x.timeScale(sp); });
      pt.update(0.055);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var cx = W / 2 + pt.x * 12, cy = H / 2 + pt.y * 10;
      var floatY = Math.sin(t * 0.5 * sp) * 5 * iv;
      var ox = (ORIGIN[0] - 0.5) * w, oy = (ORIGIN[1] - 0.5) * h;

      ctx.save();
      ctx.translate(cx, cy + floatY);
      ctx.rotate(Math.sin(t * 0.22 * sp) * 0.018);

      // outgoing copies of the real arcs, scaled about the signal's origin
      if (parts) {
        for (var i = 0; i < waves.length; i++) {
          var p = waves[i].p;
          for (var k = 0; k < Math.min(2, parts.length); k++) {
            var s = 1 + p * (k === 0 ? 0.62 : 0.44) * iv;
            var a = Math.max(0, (1 - p) * (1 - p) * (k === 0 ? 0.42 : 0.5));
            if (a < 0.004) continue;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.translate(ox, oy);
            ctx.scale(s, s);
            ctx.translate(-ox, -oy);
            ctx.drawImage(parts[k].canvas, -w / 2, -h / 2, w, h);
            ctx.restore();
          }
        }
      }

      // the mark itself, kicking a little as each wave leaves
      var ks = 1 + kick.v * 0.022 * iv + 0.008 * Math.sin(t * 0.85 * sp);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(ks, ks);
      ctx.translate(-ox, -oy);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      // the source, ticking in accent
      var blink = 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(t * 1.5 * sp)), 6);
      ctx.fillStyle = rgba(ACCENT, blink * 0.85);
      ctx.beginPath(); ctx.arc(ox + w * 0.10, oy + h * 0.02, 2.4, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = rgba(INK, 0.13);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox + w * 0.10, oy + h * 0.02);
      ctx.lineTo(ox + w * 0.30, oy + h * 0.02);
      ctx.stroke();
      ctx.restore();
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
      }
    };
  }

    window.WaveFX = {
    broadcast: broadcast,
    loadImage: function (src) {
      return new Promise(function (res, rej) {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = function () { res(im); };
        im.onerror = rej;
        im.src = src;
      });
    },
    ready: function () {
      return new Promise(function (res) {
        (function poll() {
          if (window.gsap) return res();
          setTimeout(poll, 40);
        })();
      });
    }
  };
})();
