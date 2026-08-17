import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const fallback = { locale: 'pt-BR', primary: '#111111', secondary: '#686868' };
export function applyTheme(prefs = {}) {
  const theme = { ...fallback, ...prefs }, root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent-soft', `${theme.primary}16`);
  root.style.setProperty('--accent-line', `${theme.primary}3d`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
  localStorage.setItem('geomark-prefs', JSON.stringify(theme));
  window.dispatchEvent(new CustomEvent('geomark-theme', { detail: theme }));
  return theme;
}
export function savedTheme() { try { return { ...fallback, ...JSON.parse(localStorage.getItem('geomark-prefs') || '{}') }; } catch { return fallback; } }
applyTheme(savedTheme());
onAuthStateChanged(getAuth(app), async user => {
  if (!user) return;
  try { const snapshot = await getDoc(doc(getFirestore(app), 'private_users', user.uid)); if (snapshot.exists()) applyTheme(snapshot.data().preferences || {}); } catch { /* mantém a preferência local em modo offline */ }
});
