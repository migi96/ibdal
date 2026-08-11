/* brain-effects.js — the figure lighting up, as one continuous fade.
   window.BrainFX.lightUp(canvas, kit, opts) -> { destroy() }
   opts is read live: {speed, intensity, pointerFollow, hold}
   Libraries: GSAP · Canvas 2D

   Both renders were normalised to one 960x1090 frame registered on the SPHERE — its
   widest row is 900px across, centred at x 480, with the top of the glass at y 8 — so the
   two stack without a pixel of drift and can be dissolved into each other.

   The fade is not a flat cross-dissolve. The lit render is revealed through a radial mask
   growing from the brain outward, which is what makes it read as the fluid illuminating
   from the inside rather than one picture replacing another. A bloom behind the glass and
   a slow specular across it carry the rest. */
(function () {
  var FRAME = { w: 960, h: 1090, sphCx: 480, sphTop: 8, sphR: 450 };
  /* the light starts at the brain, which sits a little above the sphere's centre */
  var SOURCE = { x: 480, y: 458 - 450 * 0.10 };
  var GLOW = [96, 165, 255], CORE = [188, 224, 255];

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

  function pointer(canvas, opts, onEnter, onLeave) {
    var s = { tx: 0, ty: 0, x: 0, y: 0 };
    function move(e) {
      var r = canvas.getBoundingClientRect();
      s.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      s.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    function enter() { if (onEnter) onEnter(); }
    function leave() { s.tx = 0; s.ty = 0; if (onLeave) onLeave(); }
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerenter', enter);
    canvas.addEventListener('pointerleave', leave);
    s.update = function (k) {
      var f = opts.pointerFollow === false ? 0 : 1;
      s.x += (s.tx * f - s.x) * k;
      s.y += (s.ty * f - s.y) * k;
    };
    s.destroy = function () {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerenter', enter);
      canvas.removeEventListener('pointerleave', leave);
    };
    return s;
  }

  function layout(W, H) {
    var s = Math.min(W * 0.94 / FRAME.w, H * 1.0 / FRAME.h);
    return {
      s: s,
      x: (W - FRAME.w * s) / 2,
      y: (H - FRAME.h * s) / 2,
      w: FRAME.w * s, h: FRAME.h * s,
      sph: { x: (W - FRAME.w * s) / 2 + FRAME.sphCx * s,
             y: (H - FRAME.h * s) / 2 + (FRAME.sphTop + FRAME.sphR) * s,
             r: FRAME.sphR * s },
      src: [(W - FRAME.w * s) / 2 + SOURCE.x * s, (H - FRAME.h * s) / 2 + SOURCE.y * s]
    };
  }

  function lightUp(canvas, kit, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, D = 1, L = null;
    var mask = document.createElement('canvas'), mc = mask.getContext('2d');

    var g = window.gsap, tweens = [];
    /* `wave` drives the radial reveal, `lit` the overall level, `bloom` the field behind */
    var st = { wave: 0, lit: 0, bloom: 0, hover: 0 };
    var tl = null;

    function build() {
      if (!g) { st.wave = 1; st.lit = 1; st.bloom = 0.6; return null; }
      var hold = num(opts.hold, 2.4);
      var t = g.timeline({ repeat: -1, repeatDelay: 0.5 });
      /* up — the light spreads from the brain outward, the level follows just behind it */
      t.fromTo(st, { wave: 0 }, { wave: 1, duration: 2.3, ease: 'power2.inOut' }, 0);
      t.fromTo(st, { lit: 0 }, { lit: 1, duration: 2.0, ease: 'power2.inOut' }, 0.25);
      t.fromTo(st, { bloom: 0 }, { bloom: 1, duration: 1.7, ease: 'power2.out' }, 0.5);
      /* hold, lit */
      t.to({}, { duration: hold }, 2.4);
      /* down — the level falls first, then the reveal closes back to the brain */
      t.to(st, { lit: 0, duration: 1.9, ease: 'power2.inOut' }, 2.4 + hold);
      t.to(st, { bloom: 0, duration: 1.6, ease: 'power2.inOut' }, 2.4 + hold);
      t.to(st, { wave: 0, duration: 2.1, ease: 'power2.inOut' }, 2.5 + hold);
      return t;
    }
    tl = build();
    if (tl) tweens.push(tl);

    var pt = pointer(canvas, opts,
      function () {
        if (!g) return;
        tweens.push(g.to(st, { hover: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' }));
        if (tl) tweens.push(g.to(tl, { timeScale: 1.6, duration: 0.5, ease: 'power2.out', overwrite: true }));
      },
      function () {
        if (!g) return;
        tweens.push(g.to(st, { hover: 0, duration: 0.8, ease: 'power2.inOut', overwrite: 'auto' }));
        if (tl) tweens.push(g.to(tl, { timeScale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true }));
      });

    var sz = sizer(canvas, function (m) {
      W = m.w; H = m.h; D = m.d;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      mask.width = canvas.width; mask.height = canvas.height;
      L = layout(W, H);
    });

    var stop = ticker(canvas, function (dt, t) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!L) return;

      var T2 = t * sp;
      var float = Math.sin(T2 * 0.45) * 5 * iv;
      var px = pt.x * 9, py = pt.y * 6 + float;
      var fx = L.x + px, fy = L.y + py;
      var sx = L.sph.x + px, sy = L.sph.y + py, R = L.sph.r;

      /* the field behind the glass, brightening as it lights */
      if (st.bloom > 0.005) {
        var lvl = st.bloom * (0.85 + 0.15 * st.hover) * iv;
        var gg = ctx.createRadialGradient(sx, sy, R * 0.55, sx, sy, R * 1.24);
        gg.addColorStop(0, rgba(GLOW, 0.20 * lvl));
        gg.addColorStop(0.45, rgba(GLOW, 0.09 * lvl));
        gg.addColorStop(1, rgba(GLOW, 0));
        ctx.fillStyle = gg;
        ctx.fillRect(sx - R * 1.3, sy - R * 1.3, R * 2.6, R * 2.6);
      }

      /* the dimmed figure, always underneath */
      ctx.drawImage(kit.dim, fx, fy, L.w, L.h);

      /* the lit figure, revealed through a soft edge growing out from the brain */
      if (st.wave > 0.002) {
        var reach = R * 2.5;
        var lead = st.wave * reach;
        var feather = R * 0.55;
        mc.setTransform(1, 0, 0, 1, 0, 0);
        mc.clearRect(0, 0, mask.width, mask.height);
        mc.setTransform(D, 0, 0, D, 0, 0);
        mc.globalAlpha = Math.min(1, 0.25 + 0.75 * st.lit);
        mc.drawImage(kit.lit, fx, fy, L.w, L.h);
        mc.globalAlpha = 1;
        mc.globalCompositeOperation = 'destination-in';
        var scx = L.src[0] + px, scy = L.src[1] + py;
        var inner = Math.max(0.0001, lead - feather);
        var mg = mc.createRadialGradient(scx, scy, inner, scx, scy, lead + 0.001);
        mg.addColorStop(0, 'rgba(0,0,0,1)');
        mg.addColorStop(1, 'rgba(0,0,0,0)');
        mc.fillStyle = mg;
        mc.fillRect(0, 0, W, H);
        /* only the glass lights — a second pass confines the reveal to the sphere, so the
           body below stays on the dimmed render */
        var lim = mc.createRadialGradient(sx, sy, R * 0.94, sx, sy, R * 1.005);
        lim.addColorStop(0, 'rgba(0,0,0,1)');
        lim.addColorStop(1, 'rgba(0,0,0,0)');
        mc.fillStyle = lim;
        mc.fillRect(0, 0, W, H);
        mc.globalCompositeOperation = 'source-over';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(mask, 0, 0);
        ctx.setTransform(D, 0, 0, D, 0, 0);
      }

      /* the core, where the light comes from — kept inside the glass */
      if (st.lit > 0.005) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, R * 0.985, 0, 6.2832);
        ctx.clip();
        var ccx = L.src[0] + px, ccy = L.src[1] + py;
        var breathe = 1 + 0.05 * Math.sin(T2 * 0.9);
        var cg = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, R * 0.85 * breathe);
        cg.addColorStop(0, rgba(CORE, 0.20 * st.lit * iv));
        cg.addColorStop(0.45, rgba(GLOW, 0.09 * st.lit * iv));
        cg.addColorStop(1, rgba(GLOW, 0));
        ctx.fillStyle = cg;
        ctx.fillRect(sx - R, sy - R, R * 2, R * 2);

        /* a slow specular crossing the glass once it is lit */
        var swx = sx - R + (((T2 * 0.10) % 1.5) - 0.25) * R * 2;
        var band = R * 0.34;
        var sg = ctx.createLinearGradient(swx - band, sy - R, swx + band, sy + R);
        sg.addColorStop(0, rgba(CORE, 0));
        sg.addColorStop(0.5, rgba(CORE, 0.13 * st.lit * iv));
        sg.addColorStop(1, rgba(CORE, 0));
        ctx.fillStyle = sg;
        ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
        ctx.restore();
      }

      /* the rim of the glass picks up the light last */
      if (st.lit > 0.02) {
        ctx.strokeStyle = rgba(CORE, 0.30 * st.lit * iv);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(sx, sy, R * 0.99, 0, 6.2832);
        ctx.stroke();
      }
    });

    return {
      destroy: function () {
        stop(); sz.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
      }
    };
  }

  window.BrainFX = {
    lightUp: lightUp,
    FRAME: FRAME,
    loadImage: function (src) {
      return new Promise(function (res, rej) {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = function () { res(im); };
        im.onerror = rej;
        im.src = src;
      });
    },
    loadKit: function (dimSrc, litSrc) {
      var self = this;
      return Promise.all([self.loadImage(dimSrc), self.loadImage(litSrc)])
        .then(function (r) { return { dim: r[0], lit: r[1] }; });
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
