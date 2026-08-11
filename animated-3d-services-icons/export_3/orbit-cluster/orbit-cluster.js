/* Orbit Cluster — ambient animation for the cubes icon.
   Libraries: GSAP · Canvas 2D

   Usage:  IconFX.ready()
             .then(function () { return IconFX.loadKit('icon.png'); })
             .then(function (kit) {
               IconFX.orbitCluster(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
             });
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var PALE = [214, 238, 255], SKY = [96, 178, 246], DEEP = [16, 62, 168], WHITE = [255, 255, 255];

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
  var TAU = Math.PI * 2;

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

  function pointer(canvas, opts, onEnter, onLeave) {
    var s = { tx: 0, ty: 0, x: 0, y: 0, over: 0, tOver: 0 };
    function move(e) {
      var r = canvas.getBoundingClientRect();
      s.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      s.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    function enter() { s.tOver = 1; if (onEnter) onEnter(); }
    function leave() { s.tOver = 0; s.tx = 0; s.ty = 0; if (onLeave) onLeave(); }
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerenter', enter);
    canvas.addEventListener('pointerleave', leave);
    s.update = function (k) {
      var f = opts.pointerFollow === false ? 0 : 1;
      s.x += (s.tx * f - s.x) * k;
      s.y += (s.ty * f - s.y) * k;
      s.over += (s.tOver - s.over) * k;
    };
    s.destroy = function () {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerenter', enter);
      canvas.removeEventListener('pointerleave', leave);
    };
    return s;
  }

  function prepare(img) {
    return { img: img, w: img.width, h: img.height };
  }

  function layout(W, H, kit, pad) {
    var s = Math.min(W * (pad || 0.62) / kit.w, H * (pad || 0.62) / kit.h);
    return { s: s, x: (W - kit.w * s) / 2, y: (H - kit.h * s) / 2, w: kit.w * s, h: kit.h * s };
  }

  /* a small shared shell: sets up ticker/sizer/pointer and a hover-accelerated timeline */
  function shell(canvas, opts, buildTimeline, draw) {
    var ctx = canvas.getContext('2d');
    var view = { W: 1, H: 1, D: 1, L: null, ctx: ctx };
    var g = window.gsap, tweens = [];
    var tl = buildTimeline(g);
    if (tl) tweens.push(tl);
    var pt = pointer(canvas, opts,
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1.7, duration: 0.45, ease: 'power2.out', overwrite: true })); },
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true })); });
    return { view: view, pt: pt, tweens: tweens, tl: tl, g: g };
  }

  /* ────────────────────── 19e — Orbit Cluster (cubes) ───────────────────────── */
  function splitSeeds(img, seeds) {
    var W = img.width, H = img.height;
    var s = document.createElement('canvas');
    s.width = W; s.height = H;
    var c = s.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0);
    var data = c.getImageData(0, 0, W, H);
    var outs = seeds.map(function () {
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      return { cv: cv, img: cv.getContext('2d').createImageData(W, H), n: 0, sx: 0, sy: 0 };
    });
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        if (data.data[i * 4 + 3] < 24) continue;
        var best = 0, bd = Infinity;
        for (var k = 0; k < seeds.length; k++) {
          var dx = x - seeds[k][0] * W, dy = y - seeds[k][1] * H;
          var dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = k; }
        }
        var o = outs[best];
        o.img.data[i * 4] = data.data[i * 4];
        o.img.data[i * 4 + 1] = data.data[i * 4 + 1];
        o.img.data[i * 4 + 2] = data.data[i * 4 + 2];
        o.img.data[i * 4 + 3] = data.data[i * 4 + 3];
        o.n++; o.sx += x; o.sy += y;
      }
    }
    return outs.map(function (o, i) {
      o.cv.getContext('2d').putImageData(o.img, 0, 0);
      return { canvas: o.cv, cx: o.n ? o.sx / o.n : seeds[i][0] * W, cy: o.n ? o.sy / o.n : seeds[i][1] * H, i: i };
    });
  }

  function orbitCluster(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    /* three cubes: one high centre, one lower left, one lower right */
    var parts = splitSeeds(kit.img, [[0.62, 0.24], [0.26, 0.66], [0.74, 0.72]]);
    var g = window.gsap, tweens = [];
    var st = { spread: 0, spin: 0 };

    var tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1, repeatDelay: 0.3 });
      tl.fromTo(st, { spread: 0 }, { spread: 1, duration: 1.8, ease: 'power2.inOut' }, 0);
      tl.to({}, { duration: 1.3 }, 1.8);
      tl.to(st, { spread: 0, duration: 1.8, ease: 'power2.inOut' }, 3.1);
      tl.to({}, { duration: 1.2 }, 4.9);
      tweens.push(tl);
    }

    var pt = pointer(canvas, opts,
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1.7, duration: 0.45, ease: 'power2.out', overwrite: true })); },
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true })); });

    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      L = layout(W, H, kit, 0.58);
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!L) return;

      var T2 = t * sp;
      var px = pt.x * 8, py = pt.y * 6 + Math.sin(t * 0.5 * sp) * 4 * iv;
      var ox = L.x + px, oy = L.y + py;
      var cx = ox + L.w / 2, cy = oy + L.h / 2;
      var reach = Math.max(L.w, L.h) * 0.14 * iv;

      /* the links between them, drawn while they are apart */
      if (st.spread > 0.02) {
        ctx.strokeStyle = rgba(SKY, 0.28 * st.spread * iv);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var a = 0; a < parts.length; a++) {
          for (var b = a + 1; b < parts.length; b++) {
            var pa = parts[a], pb = parts[b];
            var ax = ox + pa.cx * L.s, ay = oy + pa.cy * L.s;
            var bx = ox + pb.cx * L.s, by = oy + pb.cy * L.s;
            var da = Math.atan2(ay - cy, ax - cx), db = Math.atan2(by - cy, bx - cx);
            ctx.moveTo(ax + Math.cos(da) * reach * st.spread, ay + Math.sin(da) * reach * st.spread);
            ctx.lineTo(bx + Math.cos(db) * reach * st.spread, by + Math.sin(db) * reach * st.spread);
          }
        }
        ctx.stroke();
      }

      for (var i = 0; i < parts.length; i++) {
        var P = parts[i];
        var pcx = ox + P.cx * L.s, pcy = oy + P.cy * L.s;
        var ang = Math.atan2(pcy - cy, pcx - cx);
        /* each cube drifts outward along its own radius and bobs on its own phase */
        var out = reach * st.spread;
        var bob = Math.sin(T2 * 0.7 + i * 2.1) * L.h * 0.012 * iv;
        ctx.save();
        ctx.translate(Math.cos(ang) * out, Math.sin(ang) * out + bob);
        ctx.translate(pcx, pcy);
        ctx.rotate(Math.sin(T2 * 0.4 + i * 1.6) * 0.035 * iv);
        ctx.translate(-pcx, -pcy);
        ctx.drawImage(P.canvas, ox, oy, L.w, L.h);
        ctx.restore();
      }

      /* the node at the centre they belong to */
      var pulse = 0.5 + 0.5 * Math.sin(T2 * 1.4);
      ctx.fillStyle = rgba(PALE, (0.20 + 0.35 * pulse) * st.spread * iv);
      ctx.beginPath(); ctx.arc(cx, cy, 3 + pulse * 2, 0, TAU); ctx.fill();
    });

    return { destroy: function () { stop(); sz.destroy(); pt.destroy(); tweens.forEach(function (x) { x && x.kill && x.kill(); }); } };
  }

    window.IconFX = {
    prepare: prepare,
    orbitCluster: orbitCluster,
    loadImage: function (src) {
      return new Promise(function (res, rej) {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = function () { res(im); };
        im.onerror = rej;
        im.src = src;
      });
    },
    loadKit: function (src) {
      return this.loadImage(src).then(function (img) { return prepare(img); });
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
