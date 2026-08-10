/* Self Draw — ambient animation for one transparent PNG.
   Libraries: GSAP · Canvas 2D
   Usage:  LoopFX.ready().then(() => LoopFX.loadImage('loop.png'))
             .then(img => LoopFX.selfDraw(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var INK = [32, 30, 29], ACCENT = [236, 48, 19], GLOW = [186, 214, 255];
  var ART_AR = 200 / 216;          // the artwork's own aspect (h / w)
  /* centreline of the tube, measured off the source PNG, in fractions of the drawn box */
  var GEO = { A: 0.3555, B: 0.4914, ox: 0.0137, oy: 0.047, r: 0.0977 };

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

  /* lemniscate centreline, arc-length parameterised so motion along it is even */
  function loopPath(w, h, steps) {
    steps = steps || 720;
    var A = GEO.A * w, B = GEO.B * h, pts = [], cum = [0], len = 0;
    for (var i = 0; i <= steps; i++) {
      var t = (i / steps) * Math.PI * 2;
      var s = Math.sin(t), c = Math.cos(t), k = 1 + s * s;
      pts.push([A * c / k, B * s * c / k]);
      if (i > 0) {
        var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        len += Math.hypot(dx, dy);
        cum.push(len);
      }
    }
    return {
      pts: pts, cum: cum, len: len,
      at: function (frac) {                       // frac in [0,1) -> {x,y,ang}
        var target = ((frac % 1) + 1) % 1 * len;
        var lo = 0, hi = cum.length - 1;
        while (lo < hi - 1) { var mid = (lo + hi) >> 1; if (cum[mid] <= target) lo = mid; else hi = mid; }
        var seg = cum[hi] - cum[lo] || 1, u = (target - cum[lo]) / seg;
        var p = pts[lo], q = pts[hi];
        return { x: p[0] + (q[0] - p[0]) * u, y: p[1] + (q[1] - p[1]) * u, ang: Math.atan2(q[1] - p[1], q[0] - p[0]) };
      },
      trace: function (ctx) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
      }
    };
  }

  /* ───────────────────────────── 3c — Self Draw ────────────────────────────── */
  function selfDraw(canvas, img, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, path = null, w = 0, h = 0, ds = 0, tube = 0;
    var mask = document.createElement('canvas'), mctx = mask.getContext('2d');
    var comp = document.createElement('canvas'), cctx = comp.getContext('2d');
    var size = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      mask.width = comp.width = canvas.width;
      mask.height = comp.height = canvas.height;
      ds = Math.min(W, H) * 0.74;
      w = ds; h = ds * ART_AR;
      tube = GEO.r * (w + h) / 2 * 2.25;
      path = loopPath(w, h);
    });
    var pt = pointer(canvas, opts);

    var g = window.gsap, st = { head: 0, tail: 0, hold: 0 }, tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1 })
        .to(st, { head: 1, duration: 2.9, ease: 'power1.inOut' })
        .to(st, { hold: 1, duration: 0.5 }, '-=0.4')
        .to(st, { tail: 1, duration: 2.5, ease: 'power1.inOut' }, '+=1.1')
        .to(st, { hold: 0, duration: 0.4 }, '-=2.4')
        .set(st, { head: 0, tail: 0 });
    } else { st.head = 1; }

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (tl) tl.timeScale(sp);
      pt.update(0.055);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!path) return;

      var cx = W / 2 + pt.x * 12, cy = H / 2 + pt.y * 10;
      var floatY = Math.sin(t * 0.5 * sp) * 5 * iv;
      var breath = 1 + 0.012 * Math.sin(t * 0.85 * sp) * iv;
      var head = st.head, tail = st.tail;
      var vis = Math.max(0, head - tail);

      function place(c) {
        c.setTransform(D, 0, 0, D, 0, 0);
        c.clearRect(0, 0, W, H);
        c.translate(cx, cy + floatY);
        c.scale(breath, breath);
      }

      // mask: the stretch of tube that exists right now
      place(mctx);
      mctx.translate(GEO.ox * w, GEO.oy * h);
      mctx.lineCap = 'round';
      mctx.lineJoin = 'round';
      mctx.strokeStyle = '#fff';
      mctx.lineWidth = tube;
      mctx.setLineDash([Math.max(0.0001, vis * path.len), path.len]);
      mctx.lineDashOffset = -tail * path.len;
      path.trace(mctx);
      mctx.stroke();
      mctx.setLineDash([]);

      // artwork, kept only where the mask is
      place(cctx);
      cctx.drawImage(img, -w / 2, -h / 2, w, h);
      cctx.setTransform(1, 0, 0, 1, 0, 0);
      cctx.globalCompositeOperation = 'destination-in';
      cctx.drawImage(mask, 0, 0);
      cctx.globalCompositeOperation = 'source-over';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(comp, 0, 0);
      ctx.setTransform(D, 0, 0, D, 0, 0);

      // the drawing head, and a highlight that keeps running once the loop is closed
      ctx.save();
      ctx.translate(cx, cy + floatY);
      ctx.scale(breath, breath);
      ctx.translate(GEO.ox * w, GEO.oy * h);
      if (head > 0.001 && head < 0.999) {
        var hp = path.at(head);
        var r = tube * 0.5;
        var grd = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, r * 1.6);
        grd.addColorStop(0, rgba(GLOW, 0.55 * iv));
        grd.addColorStop(1, rgba(GLOW, 0));
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(hp.x, hp.y, r * 1.6, 0, 6.2832); ctx.fill();
        ctx.fillStyle = rgba(ACCENT, 0.95);
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 3, 0, 6.2832); ctx.fill();
      }
      if (st.hold > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        var run = (t * 0.19 * sp) % 1;
        for (var k = 18; k >= 0; k--) {
          var f = k / 18;
          var p = path.at(run - f * 0.06);
          var a = (1 - f) * (1 - f) * 0.22 * st.hold * iv;
          var rr = tube * 0.26 * (1 - f * 0.4);
          var gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
          gg.addColorStop(0, rgba(GLOW, a));
          gg.addColorStop(1, rgba(GLOW, 0));
          ctx.fillStyle = gg;
          ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.2832); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      // faint guide of the whole path, so the unbuilt part reads as intent
      if (vis < 0.995) {
        ctx.strokeStyle = rgba(INK, 0.10 * (1 - vis));
        ctx.lineWidth = 1;
        path.trace(ctx);
        ctx.stroke();
      }
      ctx.restore();
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        if (tl) tl.kill();
      }
    };
  }

  window.LoopFX = {
    selfDraw: selfDraw,
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
