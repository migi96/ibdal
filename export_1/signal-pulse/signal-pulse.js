/* Signal Pulse — the logo animated as what it is: a signal.
   Libraries: GSAP

   The mark is three arcs radiating from the tip at (87.11, 130.6) in its own viewBox.
   Scaling each arc about that exact point is what makes the pulse read as leaving the
   source, rather than as three shapes blinking in order.

   Usage:  SignalPulse.ready().then(function () {
             var anim = SignalPulse.mount(document.getElementById('mark'), {
               stage: document.getElementById('stage'),   // hover target, defaults to the svg
               speed: 1, cycle: 2.5, glow: document.getElementById('glow')
             });
           });
   Returns { destroy() }. */
(function () {
  var SOURCE = '87.11 130.6';   // the tip every arc radiates from, in viewBox units
  var REST = 0.5;               // opacity of an arc waiting its turn
  var STEP = 0.19;              // seconds between one arc lighting and the next
  var BOOST = 2.6;              // hover speed multiplier

  function mount(svg, opts) {
    opts = opts || {};
    var g = window.gsap;
    if (!svg || !g) return { destroy: function () {} };

    var stage = opts.stage || svg;
    var glow = opts.glow || null;
    var speed = typeof opts.speed === 'number' ? opts.speed : 1;
    var cycle = typeof opts.cycle === 'number' ? opts.cycle : 2.5;
    var tweens = [];

    /* document order is outer -> middle -> tip; the pulse runs the other way */
    var arcs = [0, 1, 2].map(function (n) { return svg.querySelector('[data-arc="' + n + '"]'); });
    if (arcs.some(function (a) { return !a; })) return { destroy: function () {} };

    g.set(arcs, { opacity: REST, transformOrigin: SOURCE, svgOrigin: SOURCE });

    var tl = g.timeline({ repeat: -1, repeatDelay: Math.max(0, cycle - (arcs.length * STEP + 0.9)) });
    arcs.forEach(function (el, i) {
      var at = i * STEP;
      tl.to(el, { opacity: 1, duration: 0.24, ease: 'power2.out' }, at)
        .to(el, { scale: 1.055, duration: 0.24, ease: 'power2.out' }, at)
        .to(el, { opacity: REST, duration: 0.72, ease: 'power2.inOut' }, at + 0.26)
        .to(el, { scale: 1, duration: 0.72, ease: 'power2.inOut' }, at + 0.26);
    });
    if (glow) {
      tl.fromTo(glow, { opacity: 0, scale: 0.72 },
        { opacity: 0.55, scale: 1.06, duration: 1.1, ease: 'power2.out' }, 0)
        .to(glow, { opacity: 0, duration: 0.9, ease: 'power2.in' }, 1.1);
    }
    tl.timeScale(speed);
    tweens.push(tl);

    /* a slow float, on its own tween so it never syncs with the pulse into a bounce */
    tweens.push(g.to(svg, { y: -7, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

    function enter() {
      tweens.push(g.to(tl, { timeScale: speed * BOOST, duration: 0.5, ease: 'power2.out', overwrite: true }));
      tweens.push(g.to(svg, { scale: 1.045, duration: 0.55, ease: 'back.out(1.6)', overwrite: 'auto' }));
    }
    function leave() {
      tweens.push(g.to(tl, { timeScale: speed, duration: 0.8, ease: 'power2.inOut', overwrite: true }));
      tweens.push(g.to(svg, { scale: 1, duration: 0.7, ease: 'power2.out', overwrite: 'auto' }));
    }
    stage.addEventListener('pointerenter', enter);
    stage.addEventListener('pointerleave', leave);

    /* pause when the mark scrolls out of view or the tab is hidden */
    var io = new IntersectionObserver(function (e) { tl.paused(!e[0].isIntersecting); }, { threshold: 0.02 });
    io.observe(svg);

    return {
      timeline: tl,
      destroy: function () {
        stage.removeEventListener('pointerenter', enter);
        stage.removeEventListener('pointerleave', leave);
        io.disconnect();
        tweens.forEach(function (t) { t && t.kill && t.kill(); });
      }
    };
  }

  window.SignalPulse = {
    mount: mount,
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
