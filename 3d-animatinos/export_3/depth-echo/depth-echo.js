/* Depth Echo — ambient animation for one transparent PNG.
   Libraries: three.js
   Usage:  LoopFX.ready().then(() => LoopFX.loadImage('loop.png'))
             .then(img => LoopFX.depthEcho(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var INK = [32, 30, 29], ACCENT = [236, 48, 19], GLOW = [186, 214, 255];
  var ART_AR = 200 / 216;          // the artwork's own aspect (h / w)
  /* centreline of the tube, measured off the source PNG, in fractions of the drawn box */
  var GEO = { A: 0.3555, B: 0.4914, ox: 0.0137, oy: 0.047, r: 0.0977 };

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

/* ─────────────────────── 3b — Depth Echo (three.js) ─────────────────────── */
  function depthEcho(canvas, img, opts) {
    opts = opts || {};
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: true,
      premultipliedAlpha: false, preserveDrawingBuffer: true
    });
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(32, 1, 0.1, 30);
    cam.position.set(0, 0, 4.2);

    var tex = new T.Texture(img);
    tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter;
    tex.generateMipmaps = false; tex.needsUpdate = true;

    var N = 9, layers = [], geo = new T.PlaneGeometry(1.6, 1.6 * ART_AR);
    var stack = new T.Group();
    scene.add(stack);
    for (var i = 0; i < N; i++) {
      var mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 });
      var m = new T.Mesh(geo, mat);
      m.position.z = -i * 0.19;
      m.scale.setScalar(1 - i * 0.018);
      stack.add(m);
      layers.push({ mesh: m, mat: mat, i: i });
    }

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

      var head = (clock * 0.32) % 1.25;                 // inference passing through the stack
      for (var i = 0; i < layers.length; i++) {
        var L = layers[i], f = i / (N - 1);
        var d = Math.abs(f - head);
        var active = Math.exp(-Math.pow(d / 0.16, 2));
        L.mat.opacity = (i === 0 ? 0.96 : 0.1 + 0.16 * (1 - f)) + active * 0.55;
        var s = (1 - i * 0.018) * (1 + active * 0.035 * iv);
        L.mesh.scale.set(s, s, 1);
        L.mesh.position.z = -i * 0.19 + active * 0.05;
        L.mesh.position.y = Math.sin(clock * 0.6 + i * 0.5) * 0.012 * iv * (i ? 1 : 0.4);
        L.mesh.rotation.z = Math.sin(clock * 0.3 + i * 0.35) * 0.014 * i * 0.3;
      }
      stack.rotation.y = Math.sin(clock * 0.22) * 0.24 + pt.x * 0.32;
      stack.rotation.x = Math.sin(clock * 0.17) * 0.07 - pt.y * 0.14;
      cam.position.x = Math.sin(clock * 0.15) * 0.2;
      cam.lookAt(0, 0, -0.6);
      renderer.render(scene, cam);
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        geo.dispose(); tex.dispose();
        layers.forEach(function (L) { L.mat.dispose(); });
        renderer.dispose();
      }
    };
  }

    window.LoopFX = {
    depthEcho: depthEcho,
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
          if (window.THREE) return res();
          setTimeout(poll, 40);
        })();
      });
    }
  };
})();
