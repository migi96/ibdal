/* Data Uplink — ambient animation for one transparent PNG.
   Libraries: GSAP · Canvas 2D
   Usage:  StackFX.ready().then(() => StackFX.loadImage('stack.png'))
             .then(img => StackFX.dataUplink(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var INK = [32, 30, 29], ACCENT = [70, 198, 255];
  var CYAN = [70, 198, 255], BLUE = [34, 128, 226], WHITE = [236, 244, 255];
  var ART_AR = 200 / 243;                 // the artwork's own aspect (h / w)
  /* the platform's glowing connectors, in fractions of the drawn box (origin at its centre) */
  var NODES = [
    [-0.305, 0.115], [0.300, 0.095], [-0.225, 0.300], [0.020, 0.380],
    [0.225, 0.275], [0.360, 0.170], [-0.360, 0.215]
  ];
  var HUB = [0.0, 0.075];                 // where the light lines meet under the rack
  var RACK_TOP = -0.300;

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

  function glowDot(ctx, x, y, r, col, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  /* ─────────────────────────── 4a — Data Uplink ────────────────────────────── */
  function dataUplink(canvas, img, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, w = 0, h = 0;
    var size = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      w = Math.min(W, H) * 0.80; h = w * ART_AR;
    });
    var pt = pointer(canvas, opts);

    var g = window.gsap, tweens = [], packets = [], risers = [], scan = { p: 2 };
    NODES.forEach(function (n, i) {
      var pk = { p: 0, dir: 1, node: i, live: 0 };
      packets.push(pk);
      function run() {
        pk.dir = Math.random() < 0.62 ? 1 : -1;      // mostly inbound
        pk.p = 0; pk.live = 1;
        var tl = g.timeline({
          onComplete: function () {
            pk.live = 0;
            if (pk.dir === 1) fire(i);
            tweens.push(g.delayedCall(0.25 + Math.random() * 1.5, run));
          }
        });
        tl.to(pk, { p: 1, duration: 0.85 + Math.random() * 0.5, ease: 'power1.inOut' });
        tweens.push(tl);
      }
      if (g) tweens.push(g.delayedCall(i * 0.28 + Math.random() * 0.6, run));
      else { pk.p = 0.5; pk.live = 1; }
    });

    function fire(i) {                                // a packet lands: the rack lights up
      if (!g) return;
      var r = { v: 0, row: Math.random() };
      risers.push(r);
      var tl = g.timeline({
        onComplete: function () { var k = risers.indexOf(r); if (k > -1) risers.splice(k, 1); }
      });
      tl.to(r, { v: 1, duration: 0.55, ease: 'power2.out' })
        .to(r, { v: 0, duration: 0.75, ease: 'power2.in' });
      tweens.push(tl);
    }
    if (g) {
      var sweep = function () {
        var tl = g.timeline({ onComplete: function () { tweens.push(g.delayedCall(1.6 + Math.random() * 1.8, sweep)); } });
        tl.set(scan, { p: 0 }).to(scan, { p: 1, duration: 1.5, ease: 'power1.inOut' }).set(scan, { p: 2 });
        tweens.push(tl);
      };
      tweens.push(g.delayedCall(1.2, sweep));
    }

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (g) tweens.forEach(function (x) { x.timeScale && x.timeScale(sp); });
      pt.update(0.055);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var cx = W / 2 + pt.x * 12, cy = H / 2 + pt.y * 10;
      var floatY = Math.sin(t * 0.5 * sp) * 5 * iv;
      var breath = 1 + 0.012 * Math.sin(t * 0.8 * sp) * iv;

      ctx.save();
      ctx.translate(cx, cy + floatY);
      ctx.scale(breath, breath);

      // light pooling under the platform
      var pool = 0.16 + 0.07 * Math.sin(t * 1.2 * sp);
      ctx.save();
      ctx.translate(0, h * 0.34);
      ctx.scale(1, 0.34);
      glowDot(ctx, 0, 0, w * 0.46, CYAN, pool * iv);
      ctx.restore();

      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      // packets riding the platform's own light lines
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < packets.length; i++) {
        var pk = packets[i];
        if (!pk.live) continue;
        var n = NODES[pk.node];
        var from = pk.dir === 1 ? n : HUB, to = pk.dir === 1 ? HUB : n;
        var over = pk.dir === 1 ? 0 : 0.55;           // outbound packets carry on past the node
        var ex = to[0] + (to[0] - from[0]) * over, ey = to[1] + (to[1] - from[1]) * over;
        for (var k = 6; k >= 0; k--) {
          var f = Math.max(0, pk.p - k * 0.045);
          var x = (from[0] + (ex - from[0]) * f) * w, y = (from[1] + (ey - from[1]) * f) * h;
          var a = (1 - k / 6) * 0.5 * iv * (pk.dir === 1 ? 1 : 0.8);
          glowDot(ctx, x, y, w * (0.035 - k * 0.003), CYAN, a);
          if (k === 0) {
            ctx.fillStyle = rgba(WHITE, 0.85);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            var s = w * 0.011;
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.restore();
          }
        }
      }

      // the rack answering
      for (var r = 0; r < risers.length; r++) {
        var rv = risers[r].v;
        var bx = HUB[0] * w + (risers[r].row - 0.5) * w * 0.10;
        var top = RACK_TOP * h;
        var grd = ctx.createLinearGradient(bx, HUB[1] * h, bx, top);
        grd.addColorStop(0, rgba(CYAN, 0.42 * rv * iv));
        grd.addColorStop(1, rgba(CYAN, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(bx - w * 0.016, top, w * 0.032, (HUB[1] - RACK_TOP) * h);
        glowDot(ctx, bx, top + h * 0.02, w * 0.09, CYAN, 0.22 * rv * iv);
      }

      // read head crossing the rack face
      if (scan.p <= 1) {
        var sy = (RACK_TOP + (0.10 - RACK_TOP) * scan.p) * h;
        var fade = Math.sin(scan.p * Math.PI);
        ctx.strokeStyle = rgba(CYAN, 0.5 * fade * iv);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.135, sy); ctx.lineTo(w * 0.145, sy);
        ctx.stroke();
        glowDot(ctx, w * 0.145, sy, w * 0.05, CYAN, 0.3 * fade * iv);
      }
      ctx.globalCompositeOperation = 'source-over';

      // one ink-and-accent status tick, so the frame stays in the design system
      var blink = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 1.6 * sp)), 6);
      ctx.fillStyle = rgba(ACCENT, blink * 0.9);
      ctx.beginPath(); ctx.arc(w * 0.175, RACK_TOP * h + h * 0.03, 2.4, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = rgba(INK, 0.14);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.175, RACK_TOP * h + h * 0.03);
      ctx.lineTo(w * 0.30, RACK_TOP * h + h * 0.03);
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

    window.StackFX = {
    dataUplink: dataUplink,
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
