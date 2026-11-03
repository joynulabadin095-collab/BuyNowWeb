/* Slide menu: groups and items. Builds the header button and the drawer on every page. */
(function () {
  var GROUPS = [
    { title: 'BuyNow', items: [['Home', 'index.html']] },
    { title: 'Guides', bn: 'নির্দেশিকা', items: [
      ['Shopper guide', 'guide-buynow.html', 'গ্রাহক'],
      ['Stall owner guide', 'guide-partner.html', 'বিক্রেতা'],
      ['Rider guide', 'guide-rider.html', 'রাইডার']
    ] },
    { title: 'BuyNow (shoppers)', items: [['Privacy policy', 'privacy-buynow.html'], ['Delete account', 'delete-buynow.html']] },
    { title: 'BuyNow Partner (stalls)', items: [['Privacy policy', 'privacy-partner.html'], ['Delete account', 'delete-partner.html']] },
    { title: 'BuyNow Rider (delivery)', items: [['Privacy policy', 'privacy-rider.html'], ['Delete account', 'delete-rider.html']] },
    { title: 'Legal', items: [['Terms of Use', 'terms.html'], ['All privacy policies', 'privacy-policy.html'], ['All account deletion', 'delete-account.html']] },
    { title: 'Contact', items: [['joynulabadin095@gmail.com', 'mailto:joynulabadin095@gmail.com']] }
  ];

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function init() {
    var root = document.documentElement;
    var page = location.pathname.split('/').pop() || 'index.html';

    // Header: use the page's own, or create one (the guide pages have none).
    var head = document.querySelector('.site-head');
    if (!head) {
      head = el('header', { 'class': 'site-head' });
      var row = el('div', { 'class': 'head-row' });
      row.appendChild(el('a', { 'class': 'brand', href: 'index.html' }, 'BuyNow'));
      var nav = el('nav', { 'aria-label': 'Main' });
      nav.appendChild(el('button', { id: 'theme-toggle', type: 'button' }, 'Night mode'));
      row.appendChild(nav);
      head.appendChild(row);
      document.body.insertBefore(head, document.body.firstChild);
    }
    var bar = head.querySelector('.wrap, .head-row') || head;
    var btn = el('button', { id: 'menu-btn', type: 'button', 'aria-label': 'Open menu', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'site-menu' },
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>');
    bar.insertBefore(btn, bar.firstChild);
    root.classList.add('has-menu');

    // Drawer
    var scrim = el('div', { 'class': 'menu-scrim' });
    var drawer = el('aside', { 'class': 'menu-drawer', id: 'site-menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' });
    var top = el('div', { 'class': 'menu-top' }, '<strong>BuyNow</strong>');
    var close = el('button', { 'class': 'menu-close', type: 'button', 'aria-label': 'Close menu' }, '&times;');
    top.appendChild(close);
    var scroll = el('div', { 'class': 'menu-scroll' });
    var hasCurrent = function (g) { return g.items.some(function (i) { return i[1] === page; }); };
    GROUPS.forEach(function (g, idx) {
      var open = hasCurrent(g) || idx === 0 || idx === 1;
      var d = el('details', { 'class': 'menu-group' });
      if (open) d.setAttribute('open', '');
      d.appendChild(el('summary', null, g.title + (g.bn ? ' <span lang="bn">(' + g.bn + ')</span>' : '')));
      var ul = el('ul');
      g.items.forEach(function (i) {
        var a = el('a', { href: i[1] }, i[0] + (i[2] ? '<small lang="bn">' + i[2] + '</small>' : ''));
        if (i[1] === page) a.setAttribute('aria-current', 'page');
        var li = el('li'); li.appendChild(a); ul.appendChild(li);
      });
      d.appendChild(ul);
      scroll.appendChild(d);
    });
    drawer.appendChild(top);
    drawer.appendChild(scroll);
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    var lastFocus = null;
    function setOpen(on) {
      root.classList.toggle('menu-open', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) { lastFocus = document.activeElement; close.focus(); }
      else if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }
    btn.addEventListener('click', function () { setOpen(true); });
    close.addEventListener('click', function () { setOpen(false); });
    scrim.addEventListener('click', function () { setOpen(false); });
    drawer.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a'); if (a) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') { // keep focus inside the drawer
        var f = drawer.querySelectorAll('a[href],button,summary');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
