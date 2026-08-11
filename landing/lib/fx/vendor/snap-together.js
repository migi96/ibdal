/* Snap Together — ambient animation for the puzzle icon.
   Libraries: GSAP · Canvas 2D

   Usage:  IconFX.ready()
             .then(function () { return IconFX.loadKit('icon.png'); })
             .then(function (kit) {
               IconFX.snapTogether(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
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

  /* ──────────────────────── 19d — Snap Together (puzzle) ────────────────────── */
  function splitQuadrants(img) {
    var W = img.width, H = img.height;
    var s = document.createElement('canvas');
    s.width = W; s.height = H;
    s.getContext('2d').drawImage(img, 0, 0);
    var parts = [];
    /* the four pieces sit in a 2x2 grid, so a cut through the centre separates them —
       it slices the interlocking tabs, which is why the separation is kept small */
    var mx = W / 2, my = H / 2;
    var boxes = [[0, 0, mx, my, -1, -1], [mx, 0, W - mx, my, 1, -1],
                 [0, my, mx, H - my, -1, 1], [mx, my, W - mx, H - my, 1, 1]];
    boxes.forEach(function (b) {
      var cv = document.createElement('canvas');
      cv.width = Math.round(b[2]); cv.height = Math.round(b[3]);
      cv.getContext('2d').drawImage(s, b[0], b[1], b[2], b[3], 0, 0, b[2], b[3]);
      parts.push({ canvas: cv, x: b[0], y: b[1], w: b[2], h: b[3], dx: b[4], dy: b[5] });
    });
    return parts;
  }

  function snapTogether(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    var parts = splitQuadrants(kit.img);
    var g = window.gsap, tweens = [];
    var open = parts.map(function () { return { v: 1 }; });
    var seam = { v: 0 };

    var tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1, repeatDelay: 0.4 });
      open.forEach(function (o, i) {
        tl.fromTo(o, { v: 1 }, { v: 0, duration: 1.0, ease: 'power3.inOut' }, i * 0.13);
      });
      var end = (open.length - 1) * 0.13 + 1.0;
      tl.fromTo(seam, { v: 0 }, { v: 1, duration: 0.16, ease: 'power2.out' }, end - 0.1);
      tl.to(seam, { v: 0, duration: 0.9, ease: 'power2.out' }, end + 0.06);
      tl.to({}, { duration: 1.9 }, end + 0.96);
      open.forEach(function (o, i) {
        tl.to(o, { v: 1, duration: 0.85, ease: 'power2.inOut' }, end + 2.86 + i * 0.05);
      });
      tweens.push(tl);
    } else { open.forEach(function (o) { o.v = 0; }); }

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

      var px = pt.x * 8, py = pt.y * 6 + Math.sin(t * 0.5 * sp) * 4 * iv;
      var ox = L.x + px, oy = L.y + py;
      var reach = Math.max(L.w, L.h) * 0.16 * iv;

      for (var i = 0; i < parts.length; i++) {
        var P = parts[i], v = open[i].v;
        ctx.globalAlpha = 1 - v * 0.25;
        ctx.drawImage(P.canvas,
          ox + P.x * L.s + P.dx * reach * v,
          oy + P.y * L.s + P.dy * reach * v,
          P.w * L.s, P.h * L.s);
      }
      ctx.globalAlpha = 1;

      /* the seams light up at the moment they lock */
      if (seam.v > 0.01) {
        var cx = ox + L.w / 2, cy = oy + L.h / 2;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(PALE, 0.75 * seam.v * iv);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, oy + L.h * 0.14); ctx.lineTo(cx, oy + L.h * 0.86);
        ctx.moveTo(ox + L.w * 0.14, cy); ctx.lineTo(ox + L.w * 0.86, cy);
        ctx.stroke();
        var fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, L.w * 0.42);
        fg.addColorStop(0, rgba(PALE, 0.30 * seam.v * iv));
        fg.addColorStop(1, rgba(SKY, 0));
        ctx.fillStyle = fg;
        ctx.fillRect(cx - L.w * 0.5, cy - L.h * 0.5, L.w, L.h);
        ctx.restore();
      }
    });

    return { destroy: function () { stop(); sz.destroy(); pt.destroy(); tweens.forEach(function (x) { x && x.kill && x.kill(); }); } };
  }

    window.IconFX = {
    prepare: prepare,
    snapTogether: snapTogether,
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

export {};
