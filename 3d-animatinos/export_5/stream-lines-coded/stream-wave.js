/* wave-code.js — the Stream Lines wave, drawn entirely in code. No image.
   window.WaveCodeFX.streamWave(canvas, opts) -> { destroy() }
   opts is read live: {speed, intensity, pointerFollow}
   Libraries: GSAP (surge choreography) + Canvas 2D. */
(function () {
  var ACCENT = [236, 48, 19], WHITE = [255, 255, 255], SKY = [150, 210, 255];

  /* the silhouette of the wave, as control points across the width —
     high at the left, dipping through the middle, lifting again at the right */
  var SHAPE = [0.46, 0.54, 0.66, 0.80, 0.90, 0.93, 0.88, 0.79, 0.71, 0.65, 0.68];

  /* back-to-front ribbons: offset from the silhouette, thickness, colour, alpha, blur */
  var RIBBONS = [
    { off: -0.045, th: 0.42, col: [206, 231, 247], a: 0.42, blur: 20, w1: 0.9, a1: 0.030, s1: 0.055, w2: 1.7, a2: 0.014, s2: 0.041 },
    { off: -0.015, th: 0.38, col: [146, 202, 236], a: 0.50, blur: 16, w1: 1.1, a1: 0.026, s1: 0.070, w2: 2.3, a2: 0.011, s2: 0.052 },
    { off: 0.02, th: 0.26, col: [178, 220, 243], a: 0.50, blur: 13, w1: 1.4, a1: 0.022, s1: 0.061, w2: 2.9, a2: 0.009, s2: 0.083 },
    { off: 0.055, th: 0.16, col: [30, 118, 205], a: 0.85, blur: 10, w1: 1.2, a1: 0.019, s1: 0.079, w2: 2.4, a2: 0.008, s2: 0.062 },
    { off: 0.105, th: 0.14, col: [56, 158, 227], a: 0.80, blur: 8, w1: 1.6, a1: 0.017, s1: 0.088, w2: 3.1, a2: 0.007, s2: 0.071 },
    { off: 0.16, th: 0.30, col: [12, 74, 176], a: 0.90, blur: 12, w1: 1.0, a1: 0.014, s1: 0.066, w2: 2.1, a2: 0.006, s2: 0.049 },
    { off: 0.012, th: 0.045, col: [255, 255, 255], a: 0.60, blur: 5, w1: 1.3, a1: 0.024, s1: 0.075, w2: 2.7, a2: 0.010, s2: 0.058 }
  ];

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
  var TAU = Math.PI * 2;

  /* smooth (cosine) interpolation through the control points */
  function master(u) {
    var n = SHAPE.length - 1;
    var f = Math.max(0, Math.min(1, u)) * n;
    var i = Math.min(n - 1, Math.floor(f)), t = f - i;
    var s = t * t * (3 - 2 * t);
    return SHAPE[i] + (SHAPE[i + 1] - SHAPE[i]) * s;
  }

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

  function streamWave(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1;
    var soft = document.createElement('canvas'), sctx = soft.getContext('2d');
    var SCALE = 0.5, canFilter = typeof sctx.filter === 'string';
    if (!canFilter) SCALE = 0.28;               // upscaling does the softening instead

    var size = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      soft.width = Math.max(2, Math.round(W * SCALE));
      soft.height = Math.max(2, Math.round(H * SCALE));
    });
    var pt = pointer(canvas, opts);

    /* the animated top edge of the wave — the streams ride this */
    function edgeAt(u, t, iv) {
      var r = RIBBONS[3];                       // the deep core reads as the crest
      var wob = r.a1 * Math.sin(u * TAU * r.w1 + t * r.s1 * TAU) * iv
        + r.a2 * Math.sin(u * TAU * r.w2 - t * r.s2 * TAU) * iv;
      return master(u) + r.off + wob;
    }

    function ribbonPath(c, r, t, iv, w, h, ampK) {
      var STEP = 1 / 96, u;
      c.beginPath();
      for (u = -0.04; u <= 1.041; u += STEP) {
        c.lineTo(u * w, ribbonY(r, u, t, iv) * h);
      }
      for (u = 1.04; u >= -0.041; u -= STEP) {
        c.lineTo(u * w, (ribbonY(r, u, t, iv) + ribbonTh(r, u) * ampK) * h);
      }
      c.closePath();
    }
    function ribbonY(r, u, t, iv) {
      return master(u) + r.off
        + r.a1 * Math.sin(u * TAU * r.w1 + t * r.s1 * TAU) * iv
        + r.a2 * Math.sin(u * TAU * r.w2 - t * r.s2 * TAU) * iv;
    }
    function ribbonTh(r, u) {
      var uu = Math.max(0, Math.min(1, u));
      return r.th * (0.30 + 0.70 * Math.pow(Math.sin(Math.PI * uu), 0.55));
    }

    var g = window.gsap, surge = { v: 0 }, breathe = { v: 1 }, tweens = [];
    if (g) {
      var pulse = function () {
        var tl = g.timeline({ onComplete: function () { tweens.push(g.delayedCall(2.6 + Math.random() * 3.4, pulse)); } });
        tl.to(surge, { v: 1, duration: 1.0, ease: 'power2.out' })
          .to(surge, { v: 0, duration: 2.4, ease: 'power2.inOut' });
        tweens.push(tl);
      };
      tweens.push(g.delayedCall(1.6, pulse));
      tweens.push(g.to(breathe, { v: 1.05, duration: 7.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    }

    var COUNT = 96, ps = [];
    for (var i = 0; i < COUNT; i++) {
      ps.push({
        u: Math.random(),
        k: Math.pow(Math.random(), 1.5),
        v: 0.035 + Math.random() * 0.075,
        len: 0.035 + Math.random() * 0.08,
        a: 0.12 + Math.random() * 0.5,
        accent: Math.random() < 0.02
      });
    }

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (g) tweens.forEach(function (x) { x.timeScale && x.timeScale(sp); });
      pt.update(0.045);
      var T = t * sp;
      var ampK = breathe.v;

      /* soft body, rendered small and blurred, then blown up */
      var sw = soft.width, sh = soft.height;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, sw, sh);
      var ground = sctx.createLinearGradient(0, 0, 0, sh);
      ground.addColorStop(0, '#ffffff');
      ground.addColorStop(0.55, '#fdfeff');
      ground.addColorStop(1, '#f2f8fd');
      sctx.fillStyle = ground;
      sctx.fillRect(0, 0, sw, sh);
      for (var r = 0; r < RIBBONS.length; r++) {
        var R = RIBBONS[r];
        if (canFilter) sctx.filter = 'blur(' + (R.blur * SCALE).toFixed(2) + 'px)';
        ribbonPath(sctx, R, T, iv, sw, sh, ampK);
        var grd = sctx.createLinearGradient(0, 0, sw, sh);
        grd.addColorStop(0, rgba(R.col, R.a * 0.35));
        grd.addColorStop(0.30, rgba(R.col, R.a));
        grd.addColorStop(0.62, rgba(R.col, R.a * 0.92));
        grd.addColorStop(1, rgba(R.col, R.a * 0.20));
        sctx.fillStyle = grd;
        sctx.fill();
      }
      if (canFilter) sctx.filter = 'none';
      // keep the upper field clean white, the way the reference fades
      var veil = sctx.createLinearGradient(0, 0, 0, sh * 0.72);
      veil.addColorStop(0, 'rgba(255,255,255,1)');
      veil.addColorStop(0.55, 'rgba(255,255,255,0.75)');
      veil.addColorStop(1, 'rgba(255,255,255,0)');
      sctx.fillStyle = veil;
      sctx.fillRect(0, 0, sw, sh * 0.72);

      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingQuality = 'high';
      var px = -pt.x * 8, py = -pt.y * 5;
      ctx.drawImage(soft, px - 6, py - 4, W + 12, H + 8);

      /* fine threads, crisp on top of the soft body */
      ctx.save();
      ctx.translate(px, py);
      ctx.globalCompositeOperation = 'lighter';
      for (var j = 0; j < 12; j++) {
        var k = (j + 0.5) / 12;
        var lift = 0.012 + k * 0.26;
        var ph = T * (0.13 + k * 0.10) * TAU + j * 0.8;
        ctx.strokeStyle = rgba(k < 0.5 ? WHITE : SKY, (0.085 + 0.10 * (1 - k)) * iv);
        ctx.lineWidth = k < 0.35 ? 1.1 : 0.85;
        ctx.beginPath();
        for (var u = -0.02; u <= 1.02; u += 1 / 128) {
          var y = (master(u) + lift
            + 0.014 * Math.sin(u * TAU * 1.3 + ph) * iv
            + 0.006 * Math.sin(u * TAU * 3.1 - ph * 1.3) * iv) * H;
          if (u <= -0.02) ctx.moveTo(u * W, y); else ctx.lineTo(u * W, y);
        }
        ctx.stroke();
      }

      /* the streams themselves */
      var rush = 1 + surge.v * 1.6;
      for (var i2 = 0; i2 < ps.length; i2++) {
        var p = ps[i2];
        p.u += dt * p.v * sp * rush * 0.35;
        if (p.u > 1.12) { p.u = -0.12; p.k = Math.pow(Math.random(), 1.5); }
        var fade = Math.min(1, Math.min(p.u + 0.12, 1.12 - p.u) * 6);
        var alpha = p.a * iv * fade * (0.55 + 0.45 * surge.v) * (1 - p.k * 0.55);
        if (alpha <= 0.004) continue;
        var col = p.accent ? ACCENT : (p.k < 0.35 ? WHITE : SKY);
        if (p.accent) alpha *= 0.6;
        var SEG = 9;
        for (var s = SEG; s >= 1; s--) {
          var u0 = p.u - (s / SEG) * p.len, u1 = p.u - ((s - 1) / SEG) * p.len;
          if (u1 < -0.15) continue;
          var e0 = edgeAt(u0, T, iv), e1 = edgeAt(u1, T, iv);
          var y0 = (e0 + (1.04 - e0) * p.k) * H, y1 = (e1 + (1.04 - e1) * p.k) * H;
          ctx.strokeStyle = rgba(col, alpha * (1 - s / SEG) * 0.55);
          ctx.lineWidth = (1 - p.k * 0.4) * (p.accent ? 1.6 : 2.1) * (1 - s / (SEG * 1.6));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(u0 * W, y0);
          ctx.lineTo(u1 * W, y1);
          ctx.stroke();
        }
      }
      ctx.restore();
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
      }
    };
  }

  window.WaveCodeFX = {
    streamWave: streamWave,
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
