/* Depth Stack — ambient animation for the isometric glass bar chart.
   Libraries: three.js · GSAP

   Usage:  BarsFX.ready()
             .then(function () { return BarsFX.loadKit('bars.png'); })
             .then(function (kit) {
               BarsFX.depthStack(canvas, kit, { speed: 1, intensity: 1, pointerFollow: true });
             });
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var SRC = 280;
  var CUTS = [54, 88, 126, 166, 226];      // band edges: four bars, left to right
  var PALE = [214, 238, 255], MID = [86, 190, 232], DEEP = [16, 66, 150];

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

  /* each bar on its own canvas, cropped to its band, with its baseline and top measured */
  function prepare(img) {
    var s = document.createElement('canvas');
    s.width = SRC; s.height = SRC;
    var c = s.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0, SRC, SRC);
    var data = c.getImageData(0, 0, SRC, SRC).data;

    var bars = [];
    for (var b = 0; b < CUTS.length - 1; b++) {
      var x0 = CUTS[b], x1 = CUTS[b + 1], w = x1 - x0;
      var top = SRC, base = 0;
      for (var px = x0; px < x1; px++) {
        for (var py = 0; py < SRC; py++) {
          if (data[(py * SRC + px) * 4 + 3] <= 70) continue;
          if (py < top) top = py;
          if (py > base) base = py;
        }
      }
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = SRC;
      cv.getContext('2d').drawImage(s, x0, 0, w, SRC, 0, 0, w, SRC);
      bars.push({ i: b, canvas: cv, x: x0, w: w, top: top, base: base, h: base - top + 1 });
    }
    return { img: img, src: SRC, bars: bars };
  }

  function layout(W, H, pad) {
    var s = Math.min(W * (pad || 0.78) / SRC, H * (pad || 0.82) / SRC);
    return { s: s, x: (W - SRC * s) / 2, y: (H - SRC * s) / 2 };
  }

  /* ────────────────────── 18c — Depth Stack (three.js) ─────────────────────── */
  function depthStack(canvas, kit, opts) {
    opts = opts || {};
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: true,
      premultipliedAlpha: false, preserveDrawingBuffer: true
    });
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(28, 1, 0.1, 40);
    cam.position.set(0, 0, 5);
    var group = new T.Group();
    scene.add(group);
    var junk = [], slabs = [];

    var UNIT = 2.6 / SRC;
    kit.bars.forEach(function (B, i) {
      var tex = new T.CanvasTexture(B.canvas);
      tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter;
      var mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
      var pw = B.w * UNIT, ph = SRC * UNIT;
      var mesh = new T.Mesh(new T.PlaneGeometry(pw, ph), mat);
      /* placed from its real position in the source, so the chart reassembles exactly */
      mesh.position.x = (B.x + B.w / 2 - SRC / 2) * UNIT;
      mesh.position.y = 0;
      mesh.position.z = i * 0.14;
      group.add(mesh);
      junk.push(mesh.geometry, mat, tex);
      slabs.push({ mesh: mesh, mat: mat, i: i, baseZ: i * 0.14, phase: i * 1.25 });
    });

    var g = window.gsap, tweens = [];
    var st = { rise: 0, sep: 1 };
    var rises = slabs.map(function () { return { v: 0 }; });

    function build() {
      if (!g) { rises.forEach(function (o) { o.v = 1; }); return null; }
      var t = g.timeline({ repeat: -1, repeatDelay: 0.5 });
      rises.forEach(function (o, i) {
        t.fromTo(o, { v: 0 }, { v: 1, duration: 1.2, ease: 'back.out(1.3)' }, i * 0.15);
      });
      var end = (rises.length - 1) * 0.15 + 1.2;
      t.to({}, { duration: 2.2 }, end);
      rises.forEach(function (o, i) {
        t.to(o, { v: 0, duration: 0.7, ease: 'power2.in' }, end + 2.2 + (rises.length - 1 - i) * 0.07);
      });
      return t;
    }
    var tl = build();
    if (tl) tweens.push(tl);

    function toState(hot) {
      if (!g) return;
      tweens.push(g.to(st, { sep: hot ? 2.6 : 1, duration: hot ? 0.8 : 1.0,
        ease: hot ? 'back.out(1.4)' : 'power2.inOut', overwrite: true }));
      if (tl) tweens.push(g.to(tl, { timeScale: hot ? 1.6 : 1, duration: 0.6, ease: 'power2.out', overwrite: true }));
    }
    var pt = pointer(canvas, opts, function () { toState(true); }, function () { toState(false); });

    var sz = sizer(canvas, function (m) {
      renderer.setPixelRatio(m.d);
      renderer.setSize(m.w, m.h, false);
      cam.aspect = m.w / m.h;
      cam.updateProjectionMatrix();
      var visH = 2 * Math.tan((cam.fov * Math.PI / 180) / 2) * cam.position.z;
      group.scale.setScalar(Math.min(visH * 0.84 / (SRC * UNIT), visH * cam.aspect * 0.84 / (SRC * UNIT)));
    });

    var clock = 0;
    var stop = ticker(canvas, function (dt) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      clock += dt * sp;

      slabs.forEach(function (S, i) {
        var v = Math.max(0, rises[i].v);
        S.mat.opacity = Math.min(1, v);
        /* each bar rises out of the floor and drifts on its own phase */
        S.mesh.position.y = (1 - v) * -0.5 + Math.sin(clock * 0.5 + S.phase) * 0.018 * iv;
        S.mesh.position.z = S.baseZ * st.sep + Math.sin(clock * 0.4 + S.phase) * 0.03 * iv;
        S.mesh.rotation.z = Math.sin(clock * 0.3 + S.phase) * 0.012 * iv;
      });

      cam.position.x = (Math.sin(clock * 0.28) * 0.30 + pt.x * 0.7) * iv;
      cam.position.y = (Math.sin(clock * 0.21) * 0.16 - pt.y * 0.45) * iv;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    });

    return {
      destroy: function () {
        stop(); sz.destroy(); pt.destroy();
        tweens.forEach(function (x) { x && x.kill && x.kill(); });
        junk.forEach(function (o) { o.dispose && o.dispose(); });
        renderer.dispose();
      }
    };
  }

  window.BarsFX = {
    prepare: prepare,
    depthStack: depthStack,
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
          if (window.gsap && window.THREE) return res();
          setTimeout(poll, 40);
        })();
      });
    }
  };
})();
