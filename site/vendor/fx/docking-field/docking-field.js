/* Docking Field — ambient animation for one transparent PNG.
   Libraries: GSAP · Canvas 2D
   Usage:  TilesFX.ready().then(() => TilesFX.loadImage('tiles.png'))
             .then(img => TilesFX.dockingField(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var INK = [32, 30, 29], ACCENT = [70, 198, 255];
  var PALETTE = [
    [35, 52, 198], [74, 92, 216], [110, 124, 228],
    [154, 166, 238], [223, 227, 238], [242, 244, 249]
  ];

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

  /* isometric footprint: unit square in tile space -> 2:1 diamond on screen */
  function isoPath(ctx, s, r) {
    ctx.save();
    ctx.transform(0.866, 0.5, -0.866, 0.5, 0, 0);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-s / 2, -s / 2, s, s, r);
    else ctx.rect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }

  /* ─────────────────────────── 2a — Docking Field ─────────────────────────── */
  function dockingField(canvas, img, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1;
    var size = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
    });
    var pt = pointer(canvas, opts);
    var g = window.gsap, tweens = [], tiles = [];
    var AXES = [-0.523, 0.523, 2.617, -2.617];   // the artwork's four isometric diagonals

    function spawn(i) {
      var t = tiles[i];
      var ax = AXES[(Math.random() * 4) | 0] + (Math.random() - 0.5) * 0.5;
      t.ax = ax;
      t.dock = 0.42 + Math.random() * 0.34;              // docking radius, share of half-height
      t.size = 0.055 + Math.random() * 0.05;
      t.col = PALETTE[(Math.random() * PALETTE.length) | 0];
      t.lift = -0.02 - Math.random() * 0.05;
      t.tick = Math.random() < 0.3;
      t.p = 0; t.a = 0; t.out = 0;
      if (!g) { t.p = 1; t.a = 1; return; }
      var tl = g.timeline({ onComplete: function () { spawn(i); } });
      tl.to(t, { p: 1, duration: 1.25 + Math.random() * 0.5, ease: 'power3.out' }, 0)
        .to(t, { a: 1, duration: 0.7, ease: 'power2.out' }, 0)
        .to(t, { out: 1, duration: 1.5, ease: 'power2.inOut' }, 2.4 + Math.random() * 2.6)
        .to(t, { a: 0, duration: 1.1, ease: 'power2.in' }, 2.8 + Math.random() * 2.6);
      t.tl = tl; tweens.push(tl);
    }
    for (var i = 0; i < 16; i++) { tiles.push({ a: 0, p: 0, out: 0, ax: 0, dock: 0.5, size: 0.06, lift: 0, col: PALETTE[0] }); }
    tiles.forEach(function (t, i) {
      if (g) tweens.push(g.delayedCall(i * 0.22, function () { spawn(i); }));
      else spawn(i);
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (g) tweens.forEach(function (x) { x.timeScale && x.timeScale(sp); });
      pt.update(0.055);

      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2 + pt.x * 12, cy = H / 2 + pt.y * 10;
      var R = Math.min(W, H) / 2;
      var floatY = Math.sin(t * 0.55 * sp) * 5 * iv;

      function drawTile(tile, front) {
        if (!tile.col || !(tile.a > 0.002)) return;
        var far = 1.9;
        var rad = R * (far + (tile.dock - far) * tile.p) + tile.out * R * 0.12;
        var x = cx + Math.cos(tile.ax) * rad;
        var y = cy + Math.sin(tile.ax) * rad * 0.62 + floatY * 0.6 + tile.lift * R * tile.p;
        var isFront = Math.sin(tile.ax) > 0;
        if (isFront !== front) return;
        var s = R * tile.size * (0.86 + 0.14 * tile.p);
        var bob = Math.sin(t * 1.1 * sp + tile.ax * 3) * R * 0.008 * iv * tile.p;

        ctx.save();
        ctx.translate(x, y + bob);
        // shadow
        ctx.save();
        ctx.translate(0, s * 0.42);
        isoPath(ctx, s, s * 0.22);
        ctx.fillStyle = rgba(INK, 0.07 * tile.a);
        ctx.fill();
        ctx.restore();
        // face
        isoPath(ctx, s, s * 0.22);
        ctx.fillStyle = rgba(tile.col, 0.92 * tile.a);
        ctx.fill();
        ctx.strokeStyle = rgba([255, 255, 255], 0.5 * tile.a);
        ctx.lineWidth = 1;
        ctx.stroke();
        if (tile.tick && tile.p > 0.85) {
          ctx.fillStyle = rgba(ACCENT, tile.a * (0.55 + 0.45 * Math.sin(t * 3 + tile.ax)));
          ctx.beginPath(); ctx.arc(0, -s * 0.42, 2.1, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }

      tiles.forEach(function (tile) { drawTile(tile, false); });

      var ds = Math.min(W, H) * 0.64 * (1 + 0.014 * Math.sin(t * 0.8 * sp) * iv);
      ctx.save();
      ctx.translate(cx, cy + floatY);
      ctx.rotate(Math.sin(t * 0.2 * sp) * 0.02);
      ctx.drawImage(img, -ds / 2, -ds / 2, ds, ds);
      ctx.restore();

      tiles.forEach(function (tile) { drawTile(tile, true); });
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
        tiles.forEach(function (t) { t.tl && t.tl.kill(); });
      }
    };
  }

    window.TilesFX = {
    dockingField: dockingField,
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
