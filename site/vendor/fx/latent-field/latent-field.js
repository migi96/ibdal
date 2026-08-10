/* Latent Field — ambient animation for one transparent PNG.
   Libraries: three.js r136 + GSAP 3
   Usage:  SphereFX.ready().then(() => SphereFX.loadImage('sphere.png'))
             .then(img => SphereFX.latentField(canvas, img, { speed: 1, intensity: 1, pointerFollow: true }));
   Returns { destroy() }. The loop pauses itself when the canvas scrolls out of view. */
(function () {
  var INK = [32, 30, 29], ACCENT = [70, 198, 255];

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }

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
    return { destroy: function () { ro.disconnect(); }, measure: measure };
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

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }

    var PASS_VERT = [
    'varying vec2 vUv;',
    'void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'
  ].join('\n');

  function glStage(canvas) {
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: true,
      premultipliedAlpha: false, preserveDrawingBuffer: true /* keeps the canvas readable for screenshots */
    });
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    cam.position.z = 2;
    function resize(m) {
      renderer.setPixelRatio(m.d);
      renderer.setSize(m.w, m.h, false);
      var asp = m.w / m.h;
      cam.left = -asp; cam.right = asp; cam.top = 1; cam.bottom = -1; cam.updateProjectionMatrix();
    }
    return { T: T, renderer: renderer, scene: scene, cam: cam, resize: resize };
  }

/* ───────────────────── 1c — Latent Field (WebGL points) ─────────────────── */
  var PT_VERT = [
    'attribute vec3 aScatter; attribute vec3 aColor; attribute float aPhase; attribute float aSeed;',
    'uniform float uProg, uTime, uSize, uRot, uAmp;',
    'varying vec3 vColor; varying float vA;',
    'void main(){',
    '  float p=clamp((uProg-aPhase*0.42)/0.58,0.0,1.0); p=p*p*(3.0-2.0*p);',
    '  vec3 pos=mix(position,aScatter,p);',
    '  pos += p*uAmp*0.07*vec3(sin(uTime*0.7+aSeed*6.283), cos(uTime*0.55+aSeed*4.1), sin(uTime*0.42+aSeed*3.3));',
    '  float sr=sin(uRot), cr=cos(uRot);',
    '  pos=vec3(pos.x*cr+pos.z*sr, pos.y, -pos.x*sr+pos.z*cr);',
    '  vColor=mix(aColor, aColor*1.1+vec3(0.06), p);',
    '  vA=mix(1.0,0.34,p);',
    '  gl_PointSize=uSize*(1.0-p*0.22);',
    '  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);',
    '}'
  ].join('\n');

  var PT_FRAG = [
    'precision mediump float;',
    'varying vec3 vColor; varying float vA;',
    'void main(){',
    '  float d=length(gl_PointCoord-0.5);',
    '  if(d>0.5) discard;',
    '  gl_FragColor=vec4(vColor, vA*smoothstep(0.5,0.33,d));',
    '}'
  ].join('\n');

  function latentField(canvas, img, opts) {
    opts = opts || {};
    var s = glStage(canvas), T = s.T;
    var S = 176;
    var off = document.createElement('canvas'); off.width = off.height = S;
    var octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, S, S);
    var data = octx.getImageData(0, 0, S, S).data;

    var pos = [], sca = [], col = [], pha = [], sed = [];
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var i = (y * S + x) * 4, al = data[i + 3];
      if (al < 34) continue;
      var r = data[i] / 255, gr = data[i + 1] / 255, b = data[i + 2] / 255;
      var nx = (x / (S - 1) - 0.5) * 2, ny = -(y / (S - 1) - 0.5) * 2;
      var lum = 0.299 * r + 0.587 * gr + 0.114 * b;
      pos.push(nx * 0.86, ny * 0.86, (lum - 0.5) * 0.22);
      // latent target: the surface lifts outward along its own radius into a soft 3D halo
      var angp = Math.atan2(ny, nx), rh = Math.hypot(nx, ny) * 0.86;
      var puff = rh * 1.22 + 0.07 + Math.random() * 0.09;
      if (Math.random() < 0.07) puff += 0.18 + Math.random() * 0.22;   // a few outliers, still searching
      sca.push(Math.cos(angp) * puff, Math.sin(angp) * puff, (Math.random() - 0.5) * 0.6);
      var accent = Math.random() < 0.008;
      if (accent) col.push(0.925, 0.188, 0.075); else col.push(r, gr, b);
      var ang = (Math.atan2(ny, nx) + Math.PI) / (Math.PI * 2);
      pha.push(Math.min(1, Math.hypot(nx, ny) * 0.55 + ang * 0.3 + Math.random() * 0.16));
      sed.push(Math.random());
    }

    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aScatter', new T.Float32BufferAttribute(sca, 3));
    geo.setAttribute('aColor', new T.Float32BufferAttribute(col, 3));
    geo.setAttribute('aPhase', new T.Float32BufferAttribute(pha, 1));
    geo.setAttribute('aSeed', new T.Float32BufferAttribute(sed, 1));

    var mat = new T.ShaderMaterial({
      uniforms: {
        uProg: { value: 0 }, uTime: { value: 0 }, uSize: { value: 3 },
        uRot: { value: 0 }, uAmp: { value: 1 }
      },
      vertexShader: PT_VERT, fragmentShader: PT_FRAG,
      transparent: true, depthTest: false, depthWrite: false
    });
    var points = new T.Points(geo, mat);
    s.scene.add(points);

    var pt = pointer(canvas, opts);
    var size = sizer(canvas, function (m) {
      s.resize(m);
      mat.uniforms.uSize.value = Math.max(1.6, (0.86 * m.h * m.d / S) * 2.05);
    });

    var g = window.gsap, u = { prog: 0 }, tl = null;
    if (g) {
      tl = g.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })
        .to(u, { prog: 0.58, duration: 2.6 })
        .to(u, { prog: 0.58, duration: 1.4 })
        .to(u, { prog: 0, duration: 2.8, ease: 'power3.inOut' })
        .to(u, { prog: 0, duration: 2.6 });
    }

    var clock = 0;
    var stop = ticker(canvas, function (dt) {
      var sp = num(opts.speed, 1), iv = num(opts.intensity, 1);
      if (tl) tl.timeScale(sp);
      pt.update(0.05);
      clock += dt * sp;
      mat.uniforms.uTime.value = clock;
      mat.uniforms.uProg.value = u.prog;
      mat.uniforms.uAmp.value = iv;
      // sway rather than spin — the cloud is a plane at rest, so a full turn would edge it on
      mat.uniforms.uRot.value = Math.sin(clock * 0.17) * (0.16 + 0.30 * u.prog) + pt.x * 0.35;
      points.rotation.x = Math.sin(clock * 0.13) * 0.05 * (0.3 + u.prog) - pt.y * 0.2;
      points.position.y = Math.sin(clock * 0.5) * 0.015;
      s.renderer.render(s.scene, s.cam);
    });

    return {
      destroy: function () {
        stop(); size.destroy(); pt.destroy();
        if (tl) tl.kill();
        geo.dispose(); mat.dispose(); s.renderer.dispose();
      }
    };
  }

  window.SphereFX = {
    latentField: latentField,
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
