/* Focus Pull — ambient animation for the lens icon.
   Libraries: GSAP · Canvas 2D

   Usage:  IconFX.ready()
             .then(function () { return IconFX.loadKit('icon.png'); })
             .then(function (kit) {
               IconFX.focusPull(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
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

  /* ─────────────────────────── 19c — Focus Pull (lens) ──────────────────────── */
  function focusPull(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    var g = window.gsap, tweens = [];
    var st = { spread: 1, beam: 0, focus: 0 };

    var tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1, repeatDelay: 0.3 });
      /* the assembly collapses along its own axis, holds in focus, then opens again */
      tl.fromTo(st, { spread: 1 }, { spread: 0.34, duration: 1.9, ease: 'power2.inOut' }, 0);
      tl.fromTo(st, { beam: 0 }, { beam: 1, duration: 1.2, ease: 'power2.out' }, 0.7);
      tl.fromTo(st, { focus: 0 }, { focus: 1, duration: 0.6, ease: 'power2.out' }, 1.8);
      tl.to({}, { duration: 1.5 }, 2.4);
      tl.to(st, { focus: 0, duration: 0.6, ease: 'power2.in' }, 3.9);
      tl.to(st, { spread: 1, duration: 2.0, ease: 'power2.inOut' }, 4.1);
      tl.to(st, { beam: 0, duration: 1.0, ease: 'power2.in' }, 4.4);
      tweens.push(tl);
    }

    var pt = pointer(canvas, opts,
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1.7, duration: 0.45, ease: 'power2.out', overwrite: true })); },
      function () { if (tl && g) tweens.push(g.to(tl, { timeScale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true })); });

    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      L = layout(W, H, kit, 0.80);
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!L) return;

      var px = pt.x * 8, py = pt.y * 5 + Math.sin(t * 0.5 * sp) * 3 * iv;
      /* the optical axis runs left to right; the focal point sits off the large end */
      var fx = L.x + L.w * 1.06 + px, fy = L.y + L.h * 0.5 + py;

      /* the beam converging on the focus */
      if (st.beam > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var reach = L.w * 1.15;
        var bg = ctx.createLinearGradient(fx - reach, 0, fx, 0);
        bg.addColorStop(0, rgba(SKY, 0));
        bg.addColorStop(0.7, rgba(SKY, 0.10 * st.beam * iv));
        bg.addColorStop(1, rgba(PALE, 0.22 * st.beam * iv));
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.moveTo(fx - reach, fy - L.h * 0.34);
        ctx.lineTo(fx, fy - 1.5);
        ctx.lineTo(fx, fy + 1.5);
        ctx.lineTo(fx - reach, fy + L.h * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      /* the assembly, scaled about the focal point along the axis — the elements
         converge on the focus and open back out without needing to be separated */
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(st.spread, 1);
      ctx.translate(-fx, -fy);
      ctx.drawImage(kit.img, L.x + px, L.y + py, L.w, L.h);
      ctx.restore();

      /* the point it resolves to */
      if (st.focus > 0.01) {
        var r = L.h * 0.30 * (0.6 + 0.4 * Math.sin(t * 2.2 * sp));
        var fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        fg.addColorStop(0, rgba(WHITE, 0.55 * st.focus * iv));
        fg.addColorStop(0.4, rgba(PALE, 0.22 * st.focus * iv));
        fg.addColorStop(1, rgba(SKY, 0));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = fg;
        ctx.fillRect(fx - r, fy - r, r * 2, r * 2);
        ctx.restore();
      }

      /* the axis it all sits on */
      ctx.strokeStyle = rgba(SKY, 0.16 * iv);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(L.x + px - L.w * 0.06, fy);
      ctx.lineTo(fx + L.w * 0.08, fy);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    return { destroy: function () { stop(); sz.destroy(); pt.destroy(); tweens.forEach(function (x) { x && x.kill && x.kill(); }); } };
  }

    window.IconFX = {
    prepare: prepare,
    focusPull: focusPull,
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
