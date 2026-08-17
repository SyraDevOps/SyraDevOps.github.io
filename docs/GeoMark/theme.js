import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

if (!document.querySelector('link[href="coordinate.css"]')) { const extra = document.createElement('link'); extra.rel = 'stylesheet'; extra.href = 'coordinate.css'; document.head.append(extra); }
document.title = document.title.replaceAll('GeoMark', 'Coordenada');
const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) if (node.nodeValue.includes('GeoMark')) node.nodeValue = node.nodeValue.replaceAll('GeoMark', 'Coordenada');

const fallback = { locale: 'pt-BR', primary: '#111111', secondary: '#686868', fontSize: 'normal' };
export function applyTheme(prefs = {}) {
  const theme = { ...fallback, ...prefs }, root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent-soft', `${theme.primary}16`);
  root.style.setProperty('--accent-line', `${theme.primary}3d`);
  root.style.setProperty('--app-font-size', ({ small: '13px', normal: '14px', large: '16px' }[theme.fontSize] || '14px'));
  document.body.style.fontSize = ({ small: '13px', normal: '14px', large: '16px' }[theme.fontSize] || '14px');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
  localStorage.setItem('geomark-prefs', JSON.stringify(theme));
  window.dispatchEvent(new CustomEvent('geomark-theme', { detail: theme }));
  return theme;
}
export function savedTheme() { try { return { ...fallback, ...JSON.parse(localStorage.getItem('geomark-prefs') || '{}') }; } catch { return fallback; } }
applyTheme(savedTheme());
const nav = document.querySelector('.nav');
if (nav && !nav.querySelector('a[href="feed.html"]')) { const feed = document.createElement('a'); feed.href = 'feed.html'; feed.textContent = 'Feed'; nav.prepend(feed); }
onAuthStateChanged(getAuth(app), async user => {
  if (!user) return;
  try { const snapshot = await getDoc(doc(getFirestore(app), 'private_users', user.uid)); if (snapshot.exists()) applyTheme(snapshot.data().preferences || {}); } catch { /* mantém a preferência local em modo offline */ }
});
