/* Orbital Volume — ambient animation for one transparent PNG.
   Libraries: three.js
   Usage:  TilesFX.ready().then(() => TilesFX.loadImage('tiles.png'))
             .then(img => TilesFX.orbitalVolume(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
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

/* ───────────────────── 2c — Orbital Volume (three.js) ────────────────────── */
  function roundedSquareTexture(T) {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.beginPath();
    if (x.roundRect) x.roundRect(6, 6, 116, 116, 26); else x.rect(6, 6, 116, 116);
    x.fill();
    var tex = new T.CanvasTexture(c);
    tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter;
    return tex;
  }

  function orbitalVolume(canvas, img, opts) {
    opts = opts || {};
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: true,
      premultipliedAlpha: false, preserveDrawingBuffer: true
    });
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(34, 1, 0.1, 20);
    cam.position.set(0, 0, 3.4);

    var tex = new T.Texture(img);
    tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter;
    tex.generateMipmaps = false; tex.needsUpdate = true;
    var art = new T.Mesh(
      new T.PlaneGeometry(1.34, 1.34),
      new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    scene.add(art);

    var sqTex = roundedSquareTexture(T);
    var geo = new T.PlaneGeometry(1, 1);
    var rings = [], tiles = [];
    var RING = [
      { r: 1.02, tilt: 1.16, spin: 0.20, n: 9, s: 0.15 },
      { r: 1.36, tilt: 1.30, spin: -0.14, n: 11, s: 0.12 },
      { r: 0.78, tilt: 1.02, spin: 0.28, n: 6, s: 0.10 }
    ];
    RING.forEach(function (cfg, ri) {
      var grp = new T.Group();
      grp.rotation.x = cfg.tilt;
      grp.rotation.z = ri * 0.7;
      scene.add(grp);
      rings.push({ grp: grp, cfg: cfg });
      for (var i = 0; i < cfg.n; i++) {
        var col = PALETTE[(i + ri * 2) % PALETTE.length];
        var mat = new T.MeshBasicMaterial({
          map: sqTex, transparent: true, opacity: 0.9, depthWrite: false,
          color: new T.Color(col[0] / 255, col[1] / 255, col[2] / 255)
        });
        var m = new T.Mesh(geo, mat);
        m.scale.setScalar(cfg.s);
        grp.add(m);
        tiles.push({ mesh: m, mat: mat, ring: ri, i: i, phase: i / cfg.n, cfg: cfg });
      }
    });

    var pt = pointer(canvas, opts);
    var size = sizer(canvas, function (m) {
      renderer.setPixelRatio(m.d);
      renderer.setSize(m.w, m.h, false);
      cam.aspect = m.w / m.h;
      cam.updateProjectionMatrix();
    });

    var clock = 0;
    var stop = ticker(canvas, function (dt) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      clock += dt * sp;

      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i], cfg = t.cfg;
        var ang = t.phase * Math.PI * 2 + clock * cfg.spin;
        var wob = Math.sin(clock * 0.9 + t.phase * 6.283) * 0.055 * iv;
        t.mesh.position.set(Math.cos(ang) * cfg.r, Math.sin(ang) * cfg.r, wob);
        t.mesh.rotation.z = ang + clock * 0.15;
        // a signal runs around each ring
        var pulse = Math.pow(Math.max(0, Math.sin(clock * 0.9 - t.phase * 6.283)), 8);
        t.mat.opacity = 0.42 + 0.34 * (0.5 + 0.5 * Math.sin(clock * 0.7 + t.phase * 6.283)) + pulse * 0.35;
        t.mesh.scale.setScalar(cfg.s * (1 + pulse * 0.28 * iv));
      }
      rings.forEach(function (r, i) {
        r.grp.rotation.z += dt * 0.03 * (i % 2 ? -1 : 1) * sp;
        r.grp.rotation.x = r.cfg.tilt + Math.sin(clock * 0.25 + i) * 0.06;
      });

      var b = 1 + 0.016 * Math.sin(clock * 0.75) * iv;
      art.scale.set(b, b, 1);
      art.position.y = Math.sin(clock * 0.5) * 0.02;
      cam.position.x = Math.sin(clock * 0.18) * 0.28 + pt.x * 0.5;
      cam.position.y = Math.sin(clock * 0.14) * 0.16 - pt.y * 0.35;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        geo.dispose(); sqTex.dispose(); tex.dispose();
        art.geometry.dispose(); art.material.dispose();
        tiles.forEach(function (t) { t.mat.dispose(); });
        renderer.dispose();
      }
    };
  }

  window.TilesFX = {
    orbitalVolume: orbitalVolume,
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
          if (window.THREE && window.gsap) return res();
          setTimeout(poll, 40);
        })();
      });
    }
  };
})();
