/* Segment Sweep — ambient animation for the donut icon.
   Libraries: GSAP · Canvas 2D

   Usage:  IconFX.ready()
             .then(function () { return IconFX.loadKit('icon.png'); })
             .then(function (kit) {
               IconFX.segmentSweep(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
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

  /* ────────────────────────── 19b — Segment Sweep (donut) ───────────────────── */
  function segmentSweep(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    var g = window.gsap, tweens = [];
    var st = { sweep: 0, lift: 0 };

    var tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1, repeatDelay: 0.4 });
      tl.fromTo(st, { sweep: 0 }, { sweep: 1, duration: 2.1, ease: 'power2.inOut' }, 0);
      tl.fromTo(st, { lift: 0 }, { lift: 1, duration: 0.8, ease: 'power2.out' }, 1.7);
      tl.to({}, { duration: 2.0 }, 2.5);
      tl.to(st, { sweep: 0, lift: 0, duration: 0.8, ease: 'power2.in' }, 4.5);
      tweens.push(tl);
    } else { st.sweep = 1; st.lift = 1; }

    var pt = pointer(canvas, opts,
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1.7, duration: 0.45, ease: 'power2.out', overwrite: true })); },
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true })); });

    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      L = layout(W, H, kit, 0.60);
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!L) return;

      var px = pt.x * 8, py = pt.y * 6 + Math.sin(t * 0.5 * sp) * 4 * iv;
      var cx = L.x + L.w / 2 + px, cy = L.y + L.h / 2 + py;
      var R = Math.max(L.w, L.h) * 0.62;

      /* the track the chart is drawn onto */
      ctx.strokeStyle = rgba(SKY, 0.14 * iv);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.86, R * 0.86, 0, 0, TAU); ctx.stroke();

      /* the chart, revealed by a wedge opening clockwise from twelve o'clock */
      var a0 = -Math.PI / 2;
      var a1 = a0 + TAU * st.sweep;
      ctx.save();
      if (st.sweep < 0.999) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * 2, a0, a1);
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(kit.img, L.x + px, L.y + py, L.w, L.h);
      ctx.restore();

      /* the drawing edge */
      if (st.sweep > 0.002 && st.sweep < 0.998) {
        ctx.strokeStyle = rgba(PALE, 0.75 * iv);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * R * 0.22, cy + Math.sin(a1) * R * 0.22);
        ctx.lineTo(cx + Math.cos(a1) * R * 0.94, cy + Math.sin(a1) * R * 0.94);
        ctx.stroke();
        ctx.fillStyle = rgba(PALE, 0.9 * iv);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a1) * R * 0.86, cy + Math.sin(a1) * R * 0.86, 2.6, 0, TAU);
        ctx.fill();
      }

      /* the total, once the ring closes */
      if (st.lift > 0.01) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 ' + Math.round(R * 0.30) + 'px "Archivo", system-ui, sans-serif';
        ctx.fillStyle = rgba(DEEP, 0.9 * st.lift);
        ctx.fillText(Math.round(st.lift * 68) + '%', cx, cy - R * 1.28);
        ctx.font = '700 ' + Math.round(R * 0.11) + 'px "Archivo", system-ui, sans-serif';
        ctx.fillStyle = rgba(SKY, 0.9 * st.lift);
        ctx.fillText('RESOLVED WITHOUT ESCALATION', cx, cy - R * 1.06);
      }
    });

    return { destroy: function () { stop(); sz.destroy(); pt.destroy(); tweens.forEach(function (x) { x && x.kill && x.kill(); }); } };
  }

    window.IconFX = {
    prepare: prepare,
    segmentSweep: segmentSweep,
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
