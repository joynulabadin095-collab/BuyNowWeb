(function () {
  var root = document.documentElement;

  // Theme toggle (follows system until the visitor picks one)
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var label = function () { btn.textContent = currentTheme() === 'dark' ? 'Day mode' : 'Night mode'; };
      label();
      btn.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) {}
        label();
      });
    }

    // Footer year
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    // Mark current page in the nav
    var page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-head nav a').forEach(function (a) {
      if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
    });

    // Deletion forms: send to Netlify Forms, then show the thank-you page
    document.querySelectorAll('form[data-netlify="true"]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var submit = form.querySelector('button[type="submit"]');
        var original = submit.textContent;
        submit.disabled = true;
        submit.textContent = 'Sending...';
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        }).then(function (r) {
          if (!r.ok) throw new Error('bad response');
          location.href = 'thanks.html';
        }).catch(function () {
          submit.disabled = false;
          submit.textContent = original;
          alert('The request could not be sent. Please email us instead using the address on this page.');
        });
      });
    });
  });
})();
