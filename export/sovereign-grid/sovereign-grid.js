/* Sovereign Grid — ambient animation on a real vector world map.
   Libraries: GSAP · Canvas 2D
   Usage:  WorldFX.ready().then(() => WorldFX.loadWorld('world.svg'))
             .then(world => WorldFX.sovereignGrid(canvas, world, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var PALE = [206, 232, 248], MID = [96, 178, 232], DEEP = [11, 107, 196], INK = [32, 30, 29];
  var HOT = [166, 226, 255], DARK = [8, 74, 150];

  var PROJ = { k: 2.8047, x0: 474.50, y0: 462.22, R: 159.554 };
  function project(lon, lat) {
    return [
      PROJ.k * lon + PROJ.x0,
      PROJ.y0 - PROJ.R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))
    ];
  }

  /* the framed part of the 1010x666 drawing */
  var VIEW = { x: 6, y: 26, w: 998, h: 628 };

  var SITES = [
    { lon: -3.7038, lat: 40.4168, ar: 'مدريد', en: 'MADRID', dx: -18, dy: -48 },
    { lon: 46.6753, lat: 24.7136, ar: 'الرياض', en: 'RIYADH', dx: -14, dy: -80, primary: true },
    { lon: 55.2708, lat: 25.2048, ar: 'دبي', en: 'DUBAI', dx: 26, dy: 48 }
  ];
  var LINKS = [[1, 0], [1, 2]];              // Riyadh is the hub both arcs run from
  var FOCUS = ['SA', 'ES', 'AE'];            // Saudi Arabia, Spain, United Arab Emirates

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
  function ease(t) { return t * t * (3 - 2 * t); }

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
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
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

  /* map box -> canvas box, contain-fitted; topBias 0.5 centres it, lower values lift it */
  function frame(W, H, padX, padY, topBias) {
    var s = Math.min(W * (padX || 0.96) / VIEW.w, H * (padY || 0.94) / VIEW.h);
    var tb = topBias == null ? 0.5 : topBias;
    return {
      s: s,
      ox: (W - VIEW.w * s) / 2 - VIEW.x * s,
      oy: (H - VIEW.h * s) * tb - VIEW.y * s,
      to: function (p) { return [p[0] * s + this.ox, p[1] * s + this.oy]; }
    };
  }

  /* ───────────────────────────── shared marker layer ───────────────────────── */
  function marker(ctx, x, y, s, t, iv) {
    var pri = !!s.primary;
    var rings = pri ? 3 : 2, period = pri ? 2.0 : 2.7, maxR = pri ? 34 : 23;
    for (var i = 0; i < rings; i++) {
      var p = ((t / period) + i / rings) % 1;
      ctx.strokeStyle = rgba(DEEP, (1 - p) * (1 - p) * (pri ? 0.6 : 0.4) * iv);
      ctx.lineWidth = pri ? 1.5 : 1.1;
      ctx.beginPath();
      ctx.arc(x, y, 4 + p * maxR, 0, 6.2832);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(DEEP, 0.96);
    ctx.beginPath(); ctx.arc(x, y, pri ? 4.4 : 3.2, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(x, y, pri ? 1.6 : 1.2, 0, 6.2832); ctx.fill();
  }

  function siteLabel(ctx, x, y, s) {
    var lx = x + s.dx, ly = y + s.dy;
    ctx.strokeStyle = rgba(DEEP, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, ly); ctx.stroke();
    var right = s.dx >= 0, tx = lx + (right ? 5 : -5);
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 11px "Archivo", system-ui, sans-serif';
    if (s.primary) {
      var w = ctx.measureText(s.en).width;
      var bx = right ? tx : tx - w - 8;
      ctx.fillStyle = rgba(DEEP, 1);
      ctx.fillRect(bx, ly - 21, w + 8, 15);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(s.en, bx + 4, ly - 10);
    } else {
      ctx.textAlign = right ? 'left' : 'right';
      ctx.fillStyle = rgba(DEEP, 0.85);
      ctx.fillText(s.en, tx, ly - 9);
    }
    ctx.textAlign = right ? 'left' : 'right';
    ctx.font = '700 15px "Archivo", "Noto Sans Arabic", system-ui, sans-serif';
    ctx.fillStyle = rgba(INK, 0.9);
    ctx.fillText(s.ar, tx, ly + 10);
  }

  function quad(a, c, b, p) {
    var q = 1 - p;
    return [q * q * a[0] + 2 * q * p * c[0] + p * p * b[0],
            q * q * a[1] + 2 * q * p * c[1] + p * p * b[1]];
  }

  function link(ctx, A, B, t, iv, phase) {
    var len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    var C = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - Math.min(110, len * 0.45)];
    ctx.strokeStyle = rgba(DEEP, 0.28 * iv);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(A[0], A[1]);
    ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]);
    ctx.stroke();
    var p = (t * 0.3 + phase) % 1.4;
    if (p > 1) return;
    for (var i = 9; i >= 1; i--) {
      var p0 = Math.max(0, p - i * 0.017), p1 = Math.max(0, p - (i - 1) * 0.017);
      if (p1 <= 0) continue;
      var a = quad(A, C, B, p0), b = quad(A, C, B, p1);
      ctx.strokeStyle = rgba(DEEP, (1 - i / 10) * 0.8 * iv);
      ctx.lineWidth = 1.8 - i * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }

  function drawSites(ctx, fr, t, iv) {
    var pts = SITES.map(function (s) { return fr.to(project(s.lon, s.lat)); });
    ctx.save();
    for (var i = 0; i < LINKS.length; i++) link(ctx, pts[LINKS[i][0]], pts[LINKS[i][1]], t, iv, i * 0.5);
    for (var j = 0; j < SITES.length; j++) marker(ctx, pts[j][0], pts[j][1], SITES[j], t, iv);
    for (var k = 0; k < SITES.length; k++) siteLabel(ctx, pts[k][0], pts[k][1], SITES[k]);
    ctx.restore();
    return pts;
  }

  /* ─────────────────────── 9a — Sovereign Grid ─────────────────────────────── */
  function sovereignGrid(canvas, world, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, fr = null;
    var base = document.createElement('canvas'), bctx = base.getContext('2d');

    function rebuild() {
      base.width = Math.round(W * D); base.height = Math.round(H * D);
      bctx.setTransform(D, 0, 0, D, 0, 0);
      bctx.clearRect(0, 0, W, H);
      bctx.save();
      bctx.translate(fr.ox, fr.oy);
      bctx.scale(fr.s, fr.s);
      bctx.lineJoin = 'round';
      var g = bctx.createLinearGradient(0, VIEW.y, 0, VIEW.y + VIEW.h);
      g.addColorStop(0, 'rgb(214, 236, 250)');
      g.addColorStop(0.55, 'rgb(196, 227, 247)');
      g.addColorStop(1, 'rgb(178, 216, 242)');
      for (var i = 0; i < world.list.length; i++) {
        bctx.fillStyle = g;
        bctx.fill(world.list[i].p);
      }
      bctx.strokeStyle = 'rgba(255,255,255,0.95)';
      bctx.lineWidth = 0.7 / fr.s;
      for (var j = 0; j < world.list.length; j++) bctx.stroke(world.list[j].p);
      bctx.restore();
    }

    var size = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      fr = frame(W, H);
      rebuild();
    });
    var pt = pointer(canvas, opts);

    var g2 = window.gsap, surge = { v: 0 }, tweens = [];
    if (g2) {
      var pulse = function () {
        var tl = g2.timeline({ onComplete: function () { tweens.push(g2.delayedCall(3 + Math.random() * 3, pulse)); } });
        tl.to(surge, { v: 1, duration: 1.1, ease: 'sine.inOut' })
          .to(surge, { v: 0, duration: 2.4, ease: 'sine.inOut' });
        tweens.push(tl);
      };
      tweens.push(g2.delayedCall(1.5, pulse));
    }

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (g2) tweens.forEach(function (x) { x.timeScale && x.timeScale(sp); });
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!fr) return;

      var px = -pt.x * 6, py = -pt.y * 4;
      ctx.save();
      ctx.translate(px, py);
      ctx.setTransform(D, 0, 0, D, px * D, py * D);
      ctx.drawImage(base, 0, 0, W, H);

      /* a reading head crossing the map, lighting whole countries as it passes */
      var scan = (((t * 0.075 * sp) % 1.35) - 0.18) * VIEW.w + VIEW.x;
      var band = VIEW.w * 0.09;
      ctx.save();
      ctx.translate(fr.ox, fr.oy);
      ctx.scale(fr.s, fr.s);
      ctx.lineJoin = 'round';
      for (var i = 0; i < world.list.length; i++) {
        var c = world.list[i];
        var k = 1 - Math.min(1, Math.abs(c.cx - scan) / band);
        if (k <= 0.01) continue;
        ctx.fillStyle = rgba(MID, k * k * 0.55 * iv);
        ctx.fill(c.p);
        ctx.strokeStyle = rgba(DEEP, k * 0.5 * iv);
        ctx.lineWidth = 0.8 / fr.s;
        ctx.stroke(c.p);
      }
      /* the three focus countries stay lit */
      for (var f = 0; f < FOCUS.length; f++) {
        var fc = world.byId[FOCUS[f]];
        if (!fc) continue;
        var breathe = 0.72 + 0.16 * Math.sin(t * 0.9 * sp + f) + surge.v * 0.12;
        var fg = ctx.createLinearGradient(0, fc.y0, 0, fc.y1 + 1);
        fg.addColorStop(0, rgba(HOT, breathe));
        fg.addColorStop(1, rgba(DEEP, breathe * 0.95));
        ctx.fillStyle = fg;
        ctx.fill(fc.p);
        ctx.strokeStyle = rgba(DARK, 0.75);
        ctx.lineWidth = 1.2 / fr.s;
        ctx.stroke(fc.p);
      }
      ctx.restore();

      /* the scan line itself */
      var sx = fr.ox + scan * fr.s;
      var lg = ctx.createLinearGradient(sx - band * fr.s, 0, sx + band * fr.s, 0);
      lg.addColorStop(0, rgba(MID, 0));
      lg.addColorStop(0.5, rgba(MID, 0.10 * iv));
      lg.addColorStop(1, rgba(MID, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(fr.ox + VIEW.x * fr.s, fr.oy + VIEW.y * fr.s, VIEW.w * fr.s, VIEW.h * fr.s);
      ctx.strokeStyle = rgba(DEEP, 0.18 * iv);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, fr.oy + VIEW.y * fr.s);
      ctx.lineTo(sx, fr.oy + (VIEW.y + VIEW.h) * fr.s);
      ctx.stroke();

      drawSites(ctx, fr, t * sp, iv);
      ctx.restore();
      ctx.setTransform(D, 0, 0, D, 0, 0);
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
      }
    };
  }

  /* ───────────────────────────── the map itself ────────────────────────────── */
  function loadWorld(url) {
    return fetch(url || 'world.svg').then(function (r) { return r.text(); }).then(function (txt) {
      var re = /<path\s+d="([^"]+)"[^>]*?id="([A-Za-z0-9]{2,3})"/g, m, list = [], byId = {};
      while ((m = re.exec(txt))) {
        var o = { id: m[2], p: new Path2D(m[1]), cx: 0, cy: 0, x0: 0, y0: 0, x1: 0, y1: 0 };
        var mv = /^\s*[mM]\s*(-?[\d.]+)[ ,](-?[\d.]+)/.exec(m[1]);
        if (mv) { o.cx = parseFloat(mv[1]); o.cy = parseFloat(mv[2]); }
        list.push(o);
        byId[o.id] = o;
      }
      /* one indexed render gives every country its centroid and vertical extent */
      var IW = 1010, IH = 666;
      var cv = document.createElement('canvas');
      cv.width = IW; cv.height = IH;
      var c = cv.getContext('2d', { willReadFrequently: true });
      for (var i = 0; i < list.length; i++) {
        var n = i + 1;
        c.fillStyle = 'rgb(' + (n & 255) + ',' + ((n >> 8) & 255) + ',0)';
        c.fill(list[i].p);
      }
      var d = c.getImageData(0, 0, IW, IH).data;
      var acc = list.map(function () { return { n: 0, sx: 0, sy: 0, y0: 1e9, y1: -1e9 }; });
      for (var y = 0; y < IH; y++) {
        for (var x = 0; x < IW; x++) {
          var o2 = (y * IW + x) * 4;
          if (d[o2 + 3] < 250) continue;
          var idx = d[o2] + d[o2 + 1] * 256 - 1;
          if (idx < 0 || idx >= list.length) continue;
          var a = acc[idx];
          a.n++; a.sx += x; a.sy += y;
          if (y < a.y0) a.y0 = y;
          if (y > a.y1) a.y1 = y;
        }
      }
      for (var j = 0; j < list.length; j++) {
        var A = acc[j];
        if (A.n > 4) {
          list[j].cx = A.sx / A.n; list[j].cy = A.sy / A.n;
          list[j].y0 = A.y0; list[j].y1 = A.y1;
        } else {
          list[j].y0 = list[j].cy - 2; list[j].y1 = list[j].cy + 2;
        }
      }
      return { list: list, byId: byId, project: project, view: VIEW, sites: SITES };
    });
  }

  window.WorldFX = {
    sovereignGrid: sovereignGrid,
    loadWorld: loadWorld,
    project: project,
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
