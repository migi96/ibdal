/* Counter Rotate — the two orb renders stacked on one axis, turning opposite ways.
   Hover eases both velocities through zero and out the other way, 3.4x faster.
   Libraries: GSAP · Canvas 2D

   Usage:  OrbFX.ready()
             .then(() => OrbFX.loadPair('orb-1.png', 'orb-2.png'))
             .then(pair => OrbFX.counterRotate(canvas, pair, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var GLOW = [96, 176, 255], DEEP = [12, 74, 176];

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
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      if (visible && !document.hidden) { clock += dt; fn(dt, clock); }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function () { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
  }

  /* pointer position plus hover enter/leave — the hover is what drives every reversal */
  function pointer(canvas, opts, onEnter, onLeave) {
    var s = { tx: 0, ty: 0, x: 0, y: 0, over: 0, tOver: 0, hot: false };
    function move(e) {
      var r = canvas.getBoundingClientRect();
      s.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      s.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    function enter() { s.hot = true; s.tOver = 1; if (onEnter) onEnter(); }
    function leave() {
      s.hot = false; s.tOver = 0; s.tx = 0; s.ty = 0;
      if (onLeave) onLeave();
    }
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

  /* Velocities and visual state live on SEPARATE objects on purpose: GSAP's
     overwrite:true kills other tweens of the same target, so one tween per object and
     never two objects' worth of properties in one call. */
  function spinTween(g, state, a, b, dur) {
    if (!g) { state.va = a; state.vb = b; return null; }
    return g.to(state, { va: a, vb: b, duration: dur, ease: 'power2.inOut', overwrite: true });
  }

  /* ─────────────────────────── 12a — Counter Rotate ────────────────────────── */
  function counterRotate(canvas, pair, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, size = 0;
    var g = window.gsap, tweens = [];

    /* rest: A clockwise, B anticlockwise, at deliberately unequal rates so the two
       ring systems beat against each other instead of locking */
    var REST_A = 0.20, REST_B = -0.145, BOOST = 3.4;
    var spin = { va: REST_A, vb: REST_B };
    var fx = { lift: 0, glow: 0 };
    var ang = { a: 0, b: Math.PI * 0.37 };

    function toState(hot) {
      var s = hot ? -BOOST : 1;                       // hover reverses AND accelerates
      tweens.push(spinTween(g, spin, REST_A * s, REST_B * s, hot ? 0.75 : 1.15));
      if (g) {
        tweens.push(g.to(fx, { lift: hot ? 1 : 0, glow: hot ? 1 : 0,
          duration: hot ? 0.5 : 0.9, ease: 'power2.out', overwrite: true }));
      } else { fx.lift = hot ? 1 : 0; fx.glow = hot ? 1 : 0; }
    }

    var pt = pointer(canvas, opts, function () { toState(true); }, function () { toState(false); });
    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      size = Math.min(W, H) * 0.82;
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.06);
      ang.a += spin.va * sp * dt;
      ang.b += spin.vb * sp * dt;

      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2 + pt.x * 8, cy = H / 2 + pt.y * 6 + Math.sin(t * 0.5 * sp) * 4 * iv;
      var s = size * (1 + fx.lift * 0.035);

      /* hover glow removed — it read as a highlight square behind the orb */

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang.b);
      ctx.drawImage(pair.b, -s / 2, -s / 2, s, s);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.translate(cx, cy);
      ctx.rotate(ang.a);
      ctx.drawImage(pair.a, -s / 2, -s / 2, s, s);
      ctx.restore();
    });

    return {
      destroy: function () {
        stop(); sz.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
      }
    };
  }

    window.OrbFX = {
    counterRotate: counterRotate,
    loadImage: function (src) {
      return new Promise(function (res, rej) {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = function () { res(im); };
        im.onerror = rej;
        im.src = src;
      });
    },
    loadPair: function (aSrc, bSrc) {
      return Promise.all([this.loadImage(aSrc), this.loadImage(bSrc)])
        .then(function (r) { return { a: r[0], b: r[1] }; });
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
