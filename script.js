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

    // Deletion forms: build an email to the developer from the fields and open the visitor's mail app
    document.querySelectorAll('form.mail-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var app = (form.querySelector('input[name="app"]') || {}).value || '';
        var lines = ['Account deletion request', 'App: ' + app];
        ['email', 'name', 'phone', 'reason'].forEach(function (n) {
          var el = form.querySelector('[name="' + n + '"]');
          if (el && el.value) lines.push(n + ': ' + el.value);
        });
        lines.push('I understand this permanently deletes my account and cannot be undone.');
        location.href = 'mailto:joynulabadin095@gmail.com?subject=' + encodeURIComponent('Account Deletion Request: ' + app) +
          '&body=' + encodeURIComponent(lines.join('\n'));
      });
    });
  });
})();
