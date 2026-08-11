/* Scan Field — ambient animation for the ai icon.
   Libraries: GSAP · Canvas 2D

   Usage:  IconFX.ready()
             .then(function () { return IconFX.loadKit('icon.png'); })
             .then(function (kit) {
               IconFX.scanField(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
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

  /* ─────────────────────────── 19f — Scan Field (AI) ────────────────────────── */
  function scanField(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    var sheen = document.createElement('canvas'), shc = sheen.getContext('2d');
    var g = window.gsap, tweens = [];
    var st = { scan: -0.3, lock: 0 };

    var tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1, repeatDelay: 0.4 });
      tl.fromTo(st, { scan: -0.3 }, { scan: 1.3, duration: 2.4, ease: 'power1.inOut' }, 0);
      tl.fromTo(st, { lock: 0 }, { lock: 1, duration: 0.5, ease: 'power2.out' }, 2.1);
      tl.to({}, { duration: 1.6 }, 2.6);
      tl.to(st, { lock: 0, duration: 0.7, ease: 'power2.in' }, 4.2);
      tweens.push(tl);
    }

    var pt = pointer(canvas, opts,
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1.7, duration: 0.45, ease: 'power2.out', overwrite: true })); },
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true })); });

    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      sheen.width = canvas.width; sheen.height = canvas.height;
      L = layout(W, H, kit, 0.68);
    });

    var NODES = 7;
    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!L) return;

      var T2 = t * sp;
      var px = pt.x * 8, py = pt.y * 6 + Math.sin(t * 0.5 * sp) * 4 * iv;
      var cx = L.x + L.w * 0.46 + px, cy = L.y + L.h * 0.46 + py;
      var R = Math.max(L.w, L.h) * 0.46;

      /* two orbits of nodes, matching the rings already in the artwork */
      for (var o = 0; o < 2; o++) {
        var tilt = o ? -0.42 : 0.38;
        var rx = R * (o ? 1.02 : 1.06), ry = R * (o ? 0.40 : 0.34);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.strokeStyle = rgba(SKY, 0.16 * iv);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
        for (var n = 0; n < NODES; n++) {
          var a = (n / NODES) * TAU + T2 * (o ? -0.28 : 0.34);
          var nx = Math.cos(a) * rx, ny = Math.sin(a) * ry;
          var front = (Math.sin(a) + 1) / 2;
          ctx.fillStyle = rgba(o ? PALE : SKY, (0.25 + 0.55 * front) * iv);
          ctx.beginPath(); ctx.arc(nx, ny, 1.6 + front * 1.8, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }

      ctx.drawImage(kit.img, L.x + px, L.y + py, L.w, L.h);

      /* the scan crossing the disc, clipped to the artwork's own pixels */
      if (st.scan > -0.25 && st.scan < 1.25) {
        shc.setTransform(1, 0, 0, 1, 0, 0);
        shc.clearRect(0, 0, sheen.width, sheen.height);
        shc.setTransform(D, 0, 0, D, 0, 0);
        shc.drawImage(kit.img, L.x + px, L.y + py, L.w, L.h);
        var sxp = L.x + px + st.scan * L.w;
        var band = L.w * 0.10;
        var sg = shc.createLinearGradient(sxp - band, 0, sxp + band, 0);
        sg.addColorStop(0, rgba(SKY, 0));
        sg.addColorStop(0.5, rgba(PALE, 0.62 * iv));
        sg.addColorStop(1, rgba(SKY, 0));
        shc.globalCompositeOperation = 'source-atop';
        shc.fillStyle = sg;
        shc.fillRect(L.x + px, L.y + py, L.w, L.h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(sheen, 0, 0);
        ctx.globalAlpha = 1;
        ctx.setTransform(D, 0, 0, D, 0, 0);
        ctx.strokeStyle = rgba(PALE, 0.35 * iv);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sxp, L.y + py + L.h * 0.06);
        ctx.lineTo(sxp, L.y + py + L.h * 0.94);
        ctx.stroke();
      }

      /* the reticle that closes once the pass completes */
      if (st.lock > 0.01) {
        var k = 1 - st.lock;
        var rr = R * (0.62 + k * 0.5);
        ctx.strokeStyle = rgba(DEEP, 0.55 * st.lock * iv);
        ctx.lineWidth = 1.4;
        for (var q = 0; q < 4; q++) {
          var a2 = q * Math.PI / 2 + Math.PI / 4;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, a2 - 0.30, a2 + 0.30);
          ctx.stroke();
        }
      }
    });

    return { destroy: function () { stop(); sz.destroy(); pt.destroy(); tweens.forEach(function (x) { x && x.kill && x.kill(); }); } };
  }

  window.IconFX = {
    prepare: prepare,
    scanField: scanField,
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
