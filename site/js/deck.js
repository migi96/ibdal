/* Ibdal deck — scaling + navigation */
(function () {
  var PAD = 0.94; // breathing room around the scaled slide

  function fit() {
    var s = Math.min(window.innerWidth / 1024, window.innerHeight / 576) * PAD;
    document.documentElement.style.setProperty('--slide-scale', s.toFixed(4));
  }
  fit();
  window.addEventListener('resize', fit);

  var wraps = Array.prototype.slice.call(document.querySelectorAll('.slide-wrap'));
  var counter = document.querySelector('.hud-counter');
  var bar = document.querySelector('.hud-progress');
  var current = 0;

  function indexInView() {
    var y = window.scrollY + window.innerHeight / 2;
    for (var i = 0; i < wraps.length; i++) {
      var r = wraps[i].offsetTop;
      if (y >= r && y < r + wraps[i].offsetHeight) return i;
    }
    return 0;
  }

  function refresh() {
    current = indexInView();
    if (counter) counter.textContent = (current + 1) + ' / ' + wraps.length;
    if (bar) bar.style.width = (((current + 1) / wraps.length) * 100) + '%';
  }

  function go(i) {
    i = Math.max(0, Math.min(wraps.length - 1, i));
    wraps[i].scrollIntoView({ behavior: 'smooth' });
  }

  window.addEventListener('scroll', refresh, { passive: true });
  refresh();

  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
      case 'ArrowLeft': // RTL: left = forward
        e.preventDefault(); go(indexInView() + 1); break;
      case 'ArrowUp':
      case 'PageUp':
      case 'ArrowRight':
        e.preventDefault(); go(indexInView() - 1); break;
      case 'Home':
        e.preventDefault(); go(0); break;
      case 'End':
        e.preventDefault(); go(wraps.length - 1); break;
    }
  });
})();
