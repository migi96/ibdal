/* Glass Suspension — ambient animation for the blue calligraphy mark.
   Libraries: three.js · GSAP

   Usage:  GlyphFX.ready()
             .then(function () { return GlyphFX.loadImage('glyph.png'); })
             .then(function (img) {
               GlyphFX.glassSuspension(canvas, GlyphFX.prepare(img), { speed: 1, intensity: 1, pointerFollow: true });
             });
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var GLOW = [110, 190, 255], DEEP = [16, 76, 168], PALE = [214, 234, 255];

  /* stroke roles by area rank, and the pen-entry each one flows from.
     Arabic runs right to left: the alif is written first, then its hamza, then the
     bowl, then the dot. Re-check these if the artwork is re-exported. */
  var ROLES = [
    { rank: 0, name: 'bowl', anchor: 'right' },
    { rank: 1, name: 'alif', anchor: 'top' },
    { rank: 2, name: 'hamza', anchor: 'top' },
    { rank: 3, name: 'dot', anchor: 'centre' }
  ];
  var STROKE_ORDER = ['alif', 'hamza', 'bowl', 'dot'];

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

  /* ─────────────────────────── taking the mark apart ───────────────────────── */
  function prepare(img) {
    var W = img.width, H = img.height, N = W * H;
    var src = document.createElement('canvas');
    src.width = W; src.height = H;
    var s = src.getContext('2d', { willReadFrequently: true });
    s.drawImage(img, 0, 0);
    var data = s.getImageData(0, 0, W, H).data;

    var mask = new Uint8Array(N);
    for (var i = 0; i < N; i++) mask[i] = data[i * 4 + 3] > 90 ? 1 : 0;

    var lab = new Int32Array(N).fill(-1), q = new Int32Array(N), comps = [];
    for (var j = 0; j < N; j++) {
      if (!mask[j] || lab[j] >= 0) continue;
      var head = 0, tail = 0; q[tail++] = j; lab[j] = comps.length;
      var n = 0, sx = 0, sy = 0, minx = W, miny = H, maxx = 0, maxy = 0;
      while (head < tail) {
        var p = q[head++], px = p % W, py = (p - px) / W;
        n++; sx += px; sy += py;
        if (px < minx) minx = px; if (px > maxx) maxx = px;
        if (py < miny) miny = py; if (py > maxy) maxy = py;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          var k = ny * W + nx;
          if (mask[k] && lab[k] < 0) { lab[k] = comps.length; q[tail++] = k; }
        }
      }
      comps.push({ id: comps.length, n: n, cx: sx / n, cy: sy / n,
        minx: minx, miny: miny, maxx: maxx, maxy: maxy });
    }
    comps.sort(function (a, b) { return b.n - a.n; });

    /* geodesic distance from each stroke's pen entry, walked inside the stroke itself */
    var dist = new Float32Array(N).fill(-1);
    var partOf = new Int32Array(N).fill(-1);
    var parts = {};

    comps.forEach(function (c, rank) {
      var role = ROLES[rank] || { name: 'part' + rank, anchor: 'centre' };
      /* the pen-entry pixel: topmost for a downstroke, rightmost for a right-to-left
         sweep, nearest the centroid for a dot */
      var seed = -1, bestScore = Infinity;
      for (var p = 0; p < N; p++) {
        if (lab[p] !== c.id) continue;
        var px = p % W, py = (p - px) / W, score;
        if (role.anchor === 'top') score = py * 1000 + Math.abs(px - c.cx);
        else if (role.anchor === 'right') score = (W - px) * 1000 + Math.abs(py - c.cy);
        else score = Math.abs(px - c.cx) + Math.abs(py - c.cy);
        if (score < bestScore) { bestScore = score; seed = p; }
      }
      if (seed < 0) return;

      var head = 0, tail = 0;
      q[tail++] = seed; dist[seed] = 0; partOf[seed] = rank;
      var maxD = 0;
      while (head < tail) {
        var cur = q[head++], cx2 = cur % W, cy2 = (cur - cx2) / W, dcur = dist[cur];
        if (dcur > maxD) maxD = dcur;
        for (var ddy = -1; ddy <= 1; ddy++) for (var ddx = -1; ddx <= 1; ddx++) {
          if (!ddx && !ddy) continue;
          var qx = cx2 + ddx, qy = cy2 + ddy;
          if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
          var kk = qy * W + qx;
          if (lab[kk] !== c.id || dist[kk] >= 0) continue;
          dist[kk] = dcur + (ddx && ddy ? 1.414 : 1);
          partOf[kk] = rank;
          q[tail++] = kk;
        }
      }

      /* the stroke on its own canvas, cropped to its box — used by the 3D variation */
      var bw = c.maxx - c.minx + 1, bh = c.maxy - c.miny + 1;
      var cv = document.createElement('canvas');
      cv.width = bw; cv.height = bh;
      var cc = cv.getContext('2d');
      var out = cc.createImageData(bw, bh);
      for (var pp = 0; pp < N; pp++) {
        if (lab[pp] !== c.id) continue;
        var ppx = pp % W, ppy = (pp - ppx) / W;
        var o = ((ppy - c.miny) * bw + (ppx - c.minx)) * 4;
        out.data[o] = data[pp * 4]; out.data[o + 1] = data[pp * 4 + 1];
        out.data[o + 2] = data[pp * 4 + 2]; out.data[o + 3] = data[pp * 4 + 3];
      }
      cc.putImageData(out, 0, 0);

      parts[role.name] = {
        rank: rank, name: role.name, canvas: cv, maxD: maxD || 1,
        x: c.minx, y: c.miny, w: bw, h: bh, cx: c.cx, cy: c.cy, area: c.n
      };
    });

    var order = STROKE_ORDER.filter(function (k) { return parts[k]; })
      .map(function (k) { return parts[k].rank; });

    return {
      img: img, w: W, h: H, data: data, dist: dist, partOf: partOf,
      parts: parts, order: order, count: comps.length
    };
  }

  function frame(W, H, kit, pad) {
    var s = Math.min(W * (pad || 0.62) / kit.w, H * (pad || 0.62) / kit.h);
    return { s: s, ox: (W - kit.w * s) / 2, oy: (H - kit.h * s) / 2 };
  }

  /* ─────────────────── 14b — Glass Suspension (three.js) ───────────────────── */
  function glassSuspension(canvas, kit, opts) {
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

    /* one plane per stroke, placed from its real position in the artwork so the mark
       reassembles exactly; z comes from stroke order, so it has genuine depth */
    var UNIT = 2.6 / kit.w;
    var names = Object.keys(kit.parts);
    names.forEach(function (name) {
      var P = kit.parts[name];
      var tex = new T.CanvasTexture(P.canvas);
      tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter;
      var mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      var mesh = new T.Mesh(new T.PlaneGeometry(P.w * UNIT, P.h * UNIT), mat);
      var ordIdx = Math.max(0, kit.order.indexOf(P.rank));
      mesh.position.set(
        (P.x + P.w / 2 - kit.w / 2) * UNIT,
        (kit.h / 2 - (P.y + P.h / 2)) * UNIT,
        (ordIdx - (kit.order.length - 1) / 2) * 0.20
      );
      group.add(mesh);
      junk.push(mesh.geometry, mat, tex);
      slabs.push({ mesh: mesh, base: mesh.position.clone(), i: ordIdx, phase: ordIdx * 1.35 });
    });

    var haloCv = document.createElement('canvas');
    haloCv.width = haloCv.height = 256;
    var hc = haloCv.getContext('2d');
    var hg = hc.createRadialGradient(128, 128, 6, 128, 128, 126);
    hg.addColorStop(0, 'rgba(120, 195, 255, 0.5)');
    hg.addColorStop(0.5, 'rgba(60, 130, 235, 0.16)');
    hg.addColorStop(1, 'rgba(60, 130, 235, 0)');
    hc.fillStyle = hg; hc.fillRect(0, 0, 256, 256);
    var haloTex = new T.CanvasTexture(haloCv);
    var haloMat = new T.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false });
    var halo = new T.Mesh(new T.PlaneGeometry(4.4, 4.4), haloMat);
    halo.position.z = -0.9;
    group.add(halo);
    junk.push(halo.geometry, haloMat, haloTex);

    var g = window.gsap, tweens = [];
    var st = { spread: 1, halo: 0 };
    function toState(hot) {
      if (!g) { st.spread = hot ? 2.6 : 1; st.halo = hot ? 1 : 0; return; }
      tweens.push(g.to(st, {
        spread: hot ? 2.6 : 1, halo: hot ? 1 : 0,
        duration: hot ? 0.85 : 1.1,
        ease: hot ? 'back.out(1.5)' : 'power2.inOut', overwrite: true
      }));
    }

    var pt = pointer(canvas, opts, function () { toState(true); }, function () { toState(false); });
    var sz = sizer(canvas, function (m) {
      renderer.setPixelRatio(m.d);
      renderer.setSize(m.w, m.h, false);
      cam.aspect = m.w / m.h;
      cam.updateProjectionMatrix();
      var visH = 2 * Math.tan((cam.fov * Math.PI / 180) / 2) * cam.position.z;
      var visW = visH * cam.aspect;
      group.scale.setScalar(Math.min(visW / 3.4, visH / 3.0) * 0.92);
    });

    var clock = 0;
    var stop = ticker(canvas, function (dt) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      pt.update(0.05);
      clock += dt * sp;

      slabs.forEach(function (S) {
        var breathe = 0.5 + 0.5 * Math.sin(clock * 0.42 + S.phase);
        var push = (S.i - (slabs.length - 1) / 2) * 0.14 * breathe * st.spread * iv;
        S.mesh.position.z = S.base.z + push;
        S.mesh.position.x = S.base.x + push * 0.22;
        S.mesh.position.y = S.base.y + Math.sin(clock * 0.33 + S.phase) * 0.022 * iv;
        S.mesh.rotation.z = Math.sin(clock * 0.24 + S.phase) * 0.028 * iv;
      });
      haloMat.opacity = st.halo * 0.85 * iv;

      /* the camera does the work — parallax is what reveals the depth between strokes */
      cam.position.x = (Math.sin(clock * 0.28) * 0.30 + pt.x * 0.7) * iv;
      cam.position.y = (Math.sin(clock * 0.21) * 0.18 - pt.y * 0.5) * iv;
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

    window.GlyphFX = {
    prepare: prepare,
    glassSuspension: glassSuspension,
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
          if (window.gsap && window.THREE) return res();
          setTimeout(poll, 40);
        })();
      });
    }
  };
})();
