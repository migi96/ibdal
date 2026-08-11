/* Guard Pulse — ambient animation for the shield icon.
   Libraries: GSAP · Canvas 2D

   Usage:  IconFX.ready()
             .then(function () { return IconFX.loadKit('icon.png'); })
             .then(function (kit) {
               IconFX.guardPulse(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
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

  /* ─────────────────────────── 19a — Guard Pulse (shield) ───────────────────── */
  function guardPulse(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    var g = window.gsap, tweens = [];
    var rings = [], hits = [], flash = { v: 0 };

    function ping() {
      if (!g) return;
      var r = { p: 0 };
      rings.push(r);
      tweens.push(g.to(r, { p: 1, duration: 2.2, ease: 'power2.out',
        onComplete: function () { var i = rings.indexOf(r); if (i > -1) rings.splice(i, 1); } }));
      tweens.push(g.delayedCall(1.15, ping));
    }
    if (g) tweens.push(g.delayedCall(0.5, ping));

    /* incoming threats arrive from the rim and are turned away at the barrier */
    function threat() {
      if (!g) return;
      var a = Math.random() * TAU;
      var t = { a: a, r: 1.5, live: 1 };
      hits.push(t);
      tweens.push(g.to(t, { r: 0.62, duration: 1.1, ease: 'power2.in',
        onComplete: function () {
          tweens.push(g.to(flash, { v: 1, duration: 0.1, ease: 'power2.out' }));
          tweens.push(g.to(flash, { v: 0, duration: 0.55, ease: 'power2.out', delay: 0.1 }));
          tweens.push(g.to(t, { r: 1.6, live: 0, duration: 0.75, ease: 'power2.out',
            onComplete: function () { var i = hits.indexOf(t); if (i > -1) hits.splice(i, 1); } }));
        } }));
      tweens.push(g.delayedCall(0.7 + Math.random() * 0.9, threat));
    }
    if (g) tweens.push(g.delayedCall(1.2, threat));

    var pt = pointer(canvas, opts);
    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      L = layout(W, H, kit, 0.58);
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (g) tweens.forEach(function (x) { x.timeScale && x.timeScale(sp); });
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!L) return;

      var px = pt.x * 8, py = pt.y * 6 + Math.sin(t * 0.5 * sp) * 4 * iv;
      var cx = L.x + L.w / 2 + px, cy = L.y + L.h / 2 + py;
      var R = Math.max(L.w, L.h) * 0.5;

      /* the barrier the shield holds */
      for (var i = 0; i < rings.length; i++) {
        var p = rings[i].p;
        var rr = R * (0.72 + p * 0.95);
        ctx.strokeStyle = rgba(SKY, (1 - p) * (1 - p) * 0.42 * iv);
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = rgba(PALE, (1 - p) * 0.24 * iv);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, rr * 0.92, 0, TAU); ctx.stroke();
      }

      /* the shield itself, breathing, brighter on impact */
      var kick = 1 + flash.v * 0.03 + 0.008 * Math.sin(t * 0.9 * sp);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(kick, kick);
      ctx.translate(-cx, -cy);
      ctx.drawImage(kit.img, L.x + px, L.y + py, L.w, L.h);
      ctx.restore();

      if (flash.v > 0.01) {
        var fg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.05);
        fg.addColorStop(0, rgba(PALE, 0.30 * flash.v * iv));
        fg.addColorStop(1, rgba(SKY, 0));
        ctx.fillStyle = fg;
        ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
      }

      /* incoming, and deflected */
      for (var j = 0; j < hits.length; j++) {
        var Tt = hits[j];
        var hx = cx + Math.cos(Tt.a) * R * Tt.r, hy = cy + Math.sin(Tt.a) * R * Tt.r;
        var tail = 22;
        var gd = ctx.createLinearGradient(hx + Math.cos(Tt.a) * tail, hy + Math.sin(Tt.a) * tail, hx, hy);
        gd.addColorStop(0, rgba(SKY, 0));
        gd.addColorStop(1, rgba(Tt.live > 0.5 ? PALE : SKY, 0.75 * iv));
        ctx.strokeStyle = gd;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(Tt.a) * tail, hy + Math.sin(Tt.a) * tail);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }
    });

    return { destroy: function () { stop(); sz.destroy(); pt.destroy(); tweens.forEach(function (x) { x && x.kill && x.kill(); }); } };
  }

    window.IconFX = {
    prepare: prepare,
    guardPulse: guardPulse,
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
