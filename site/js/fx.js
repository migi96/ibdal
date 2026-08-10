/* Ibdal deck — live 3D animation wiring (vendor/fx).
   Scripts are loaded strictly one after another: several exports share a
   global name (LoopFX/TilesFX), so each global is captured right after its
   script loads, before the next one can overwrite it. */
(function () {
  var DEFS = [
    { js: 'vendor/fx/latent-field/latent-field.js', global: 'SphereFX', method: 'latentField',
      img: 'vendor/fx/latent-field/sphere.png',
      target: '#s-12-fx', mode: 'swap',
      opts: { speed: 1, intensity: 1, pointerFollow: true } },

    { js: 'vendor/fx/self-draw/self-draw.js', global: 'LoopFX', method: 'selfDraw',
      img: 'vendor/fx/self-draw/loop.png',
      target: '#s-13 .card-learning .card-fig img', mode: 'swap',
      opts: { speed: 1, intensity: 1, pointerFollow: false } },

    { js: 'vendor/fx/docking-field/docking-field.js', global: 'TilesFX', method: 'dockingField',
      img: 'vendor/fx/docking-field/tiles.png',
      target: '#s-14-fx', mode: 'swap',
      opts: { speed: 1, intensity: 1, pointerFollow: true } },

    { js: 'vendor/fx/stream-lines-coded/stream-wave.js', global: 'WaveCodeFX', method: 'streamWave',
      img: null,
      target: '#s-29 .clip', mode: 'background',
      opts: { speed: 1, intensity: 0.8, pointerFollow: false, transparent: true } }
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* replace an <img> with a canvas occupying exactly the same box */
  function swapCanvas(img) {
    var parent = img.parentNode;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = img.offsetLeft + 'px';
    canvas.style.top = img.offsetTop + 'px';
    canvas.style.width = img.offsetWidth + 'px';
    canvas.style.height = img.offsetHeight + 'px';
    canvas.style.pointerEvents = 'none';
    var t = getComputedStyle(img).transform;
    if (t && t !== 'none') canvas.style.transform = t;
    img.insertAdjacentElement('afterend', canvas);
    img.style.visibility = 'hidden';
    return canvas;
  }

  /* ambient layer behind a host's content */
  function bgCanvas(host) {
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.55';
    host.insertBefore(canvas, host.firstChild);
    return canvas;
  }

  function initOne(def) {
    var target = document.querySelector(def.target);
    if (!target) return Promise.resolve();
    return loadScript(def.js).then(function () {
      var api = window[def.global];
      return api.ready()
        .then(function () { return def.img ? api.loadImage(def.img) : null; })
        .then(function (img) {
          var canvas = def.mode === 'swap' ? swapCanvas(target) : bgCanvas(target);
          if (img) api[def.method](canvas, img, def.opts);
          else api[def.method](canvas, def.opts);
        });
    });
  }

  function boot() {
    DEFS.reduce(function (chain, def) {
      return chain
        .then(function () { return initOne(def); })
        .catch(function (e) { console.warn('FX init failed:', def.target, e); });
    }, Promise.resolve());
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
