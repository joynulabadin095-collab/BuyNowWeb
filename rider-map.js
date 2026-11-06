// Rider-only map of the rider's OWN deliveries. The page is public static HTML; the DATA is protected by Firebase sign-in and firestore.rules
// (a rider reads only orders with riderUid == own uid, riderStallAccess of own deliveries, the public vendorsPublic copy).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collectionGroup, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const cfg = window.RIDER_MAP_CONFIG || {};
const $ = (id) => document.getElementById(id);
const say = (t) => { $('rm-status').textContent = t; };
const DONE = ['DELIVERED', 'CANCELLED', 'REJECTED', 'RETURNED', 'REFUNDED', 'FAILED'];

const fb = cfg.firebase || {};
if (!fb.apiKey || !fb.appId || !cfg.maptilerKey) {
  say('This page is not set up yet: rider-map-config.js needs the Firebase web config and a MapTiler web key.');
} else {
  start();
}

function start() {
  const app = initializeApp(fb);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let map = null; let layer = null;

  $('rm-signin').onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => say('Sign-in failed: ' + (e && e.code ? e.code : 'try again')));
  $('rm-signout').onclick = () => signOut(auth);

  onAuthStateChanged(auth, async (user) => {
    $('rm-app').classList.add('rm-hide');
    $('rm-signin').classList.toggle('rm-hide', !!user);
    $('rm-signout').classList.toggle('rm-hide', !user);
    if (!user) { say('Please sign in.'); return; }
    say('Checking your rider account…');
    try {
      const rider = await getDoc(doc(db, 'riders', user.uid));
      if (!rider.exists() || String(rider.get('status') || 'ACTIVE') !== 'ACTIVE') {
        say('This page is for active BuyNow riders only. This Google account is not an active rider.');
        return;
      }
      say('');
      $('rm-app').classList.remove('rm-hide');
      await load(user.uid);
    } catch (e) {
      say('Could not load: ' + (e && e.code ? e.code : 'try again'));
    }
  });

  function ensureMap() {
    if (map) return;
    map = L.map('rm-map');
    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=' + encodeURIComponent(cfg.maptilerKey), {
      tileSize: 512, zoomOffset: -1, maxZoom: 20,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }

  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const hasPlace = (la, lo) => !(la === 0 && lo === 0) && Math.abs(la) <= 90 && Math.abs(lo) <= 180;

  async function stallPlace(vendorId, orderId) {
    try {
      const a = await getDoc(doc(db, 'riderStallAccess', vendorId + '_' + orderId));
      if (a.exists() && hasPlace(num(a.get('latitude')), num(a.get('longitude')))) {
        return { lat: a.get('latitude'), lng: a.get('longitude'), exact: true, name: '' };
      }
    } catch (_) { /* no access yet: use the public area copy */ }
    try {
      const p = await getDoc(doc(db, 'vendorsPublic', vendorId));
      if (p.exists() && hasPlace(num(p.get('latitude')), num(p.get('longitude')))) {
        return { lat: p.get('latitude'), lng: p.get('longitude'), exact: false, name: String(p.get('name') || '') };
      }
    } catch (_) { /* none */ }
    return null;
  }

  async function load(uid) {
    ensureMap();
    setTimeout(() => map.invalidateSize(), 50);
    layer.clearLayers();
    const list = $('rm-list');
    list.textContent = '';
    const snap = await getDocs(query(collectionGroup(db, 'orders'), where('riderUid', '==', uid)));
    const active = snap.docs.filter((d) => DONE.indexOf(String(d.get('status') || '').toUpperCase()) < 0);
    $('rm-note').textContent = active.length ? 'Green = stall, dark = customer. A stall without exact access shows its area (about 1 km).' : '';
    if (!active.length) { list.textContent = 'You have no active delivery right now.'; map.setView([23.8, 90.4], 7); return; }
    const bounds = [];
    for (const d of active) {
      const orderId = d.id;
      const vendorId = String(d.get('vendorId') || (d.ref.parent.parent ? d.ref.parent.parent.id : ''));
      const cLat = num(d.get('customerLatitude')); const cLng = num(d.get('customerLongitude'));
      const stall = vendorId ? await stallPlace(vendorId, orderId) : null;
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = 'Order #' + orderId.slice(0, 6).toUpperCase() + ' · ' + String(d.get('status') || '');
      const sub = document.createElement('small');
      sub.textContent = String(d.get('customerName') || '') + (d.get('deliveryAddress') ? ' · ' + String(d.get('deliveryAddress')) : '');
      li.append(title, sub);
      list.appendChild(li);
      const pts = [];
      if (stall) {
        const m = L.circleMarker([stall.lat, stall.lng], { radius: 9, color: '#fff', weight: 2, fillColor: '#1a9e4b', fillOpacity: 1 }).addTo(layer);
        m.bindPopup((stall.exact ? 'Stall' : 'Stall area (approximate)') + (stall.name ? ': ' + stall.name : ''));
        pts.push([stall.lat, stall.lng]);
      }
      if (hasPlace(cLat, cLng)) {
        const m = L.circleMarker([cLat, cLng], { radius: 9, color: '#fff', weight: 2, fillColor: '#1f2328', fillOpacity: 1 }).addTo(layer);
        m.bindPopup('Customer');
        pts.push([cLat, cLng]);
      }
      if (pts.length === 2) L.polyline(pts, { color: '#4a4f55', weight: 3, dashArray: '6 6' }).addTo(layer);
      pts.forEach((p) => bounds.push(p));
      li.onclick = () => { if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 }); };
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 }); else map.setView([23.8, 90.4], 7);
  }
}
