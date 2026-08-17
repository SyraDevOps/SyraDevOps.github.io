import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, onSnapshot, query, orderBy, limit, serverTimestamp, increment, setDoc, Timestamp, writeBatch, runTransaction } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);
const $ = selector => document.querySelector(selector);
const pulseMs = { 1: 3600000, 6: 21600000, 24: 86400000, 168: 604800000 };
const categoryNames = { place: 'Lugar', recommendation: 'Recomendação', discovery: 'Descoberta', event: 'Evento', alert: 'Alerta', problem: 'Problema', information: 'Informação' };
let user, profile = {}, marks = [], selected, editing, draftPin, pendingDeepLink, placing = false, mapFeatureClicked = false;
let sourceReady = false;
const localityField = document.createElement('div');
localityField.className = 'field'; localityField.innerHTML = '<label for="placeName">Localidade ou referência (opcional)</label><input id="placeName" maxlength="120" placeholder="Ex.: Praça Central, São Paulo">';
$('#markPhoto').closest('.field').before(localityField);

const map = new maplibregl.Map({
  container: 'map',
  style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] },
  center: [-44.2609, -21.135], zoom: 4.5, pitch: 30
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

const toast = (message, type = '') => { const notice = $('#notice'); notice.textContent = message; notice.className = `notice ${type}`; setTimeout(() => notice.classList.add('hidden'), 3800); };
const esc = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const safeUrl = value => { if (!value) return ''; const url = new URL(value); if (url.protocol !== 'https:') throw Error('Use apenas links de imagem HTTPS.'); return url.href; };
const safeInstagram = value => { if (!value) return ''; const url = new URL(value); const host = url.hostname.replace(/^www\./, ''); if (url.protocol !== 'https:' || host !== 'instagram.com' || !/^\/(p|reel|tv)\//.test(url.pathname)) throw Error('Use um link válido de postagem do Instagram.'); return url.href; };
const ts = value => value?.toMillis ? value.toMillis() : value?.seconds ? value.seconds * 1000 : 0;
const active = mark => mark.life !== 'pulse' || !mark.expiresAt || ts(mark.expiresAt) > Date.now();
const relative = value => { const minutes = Math.max(0, Math.floor((Date.now() - ts(value)) / 60000)); if (minutes < 1) return 'agora'; if (minutes < 60) return `há ${minutes} min`; const hours = Math.floor(minutes / 60); return hours < 24 ? `há ${hours} h` : `há ${Math.floor(hours / 24)} d`; };
const distanceKm = (a, b) => { const rad = value => value * Math.PI / 180, R = 6371; const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng); const n = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n)); };

function filteredMarks() {
  const text = $('#search').value.trim().toLowerCase(); const category = $('#filterCategory').value; const life = $('#filterLife').value;
  return marks.filter(mark => active(mark) && mark.visibility !== 'hidden' && (!text || `${mark.title} ${mark.description} ${mark.author?.displayName || ''}`.toLowerCase().includes(text)) && (!category || mark.category === category) && (!life || mark.life === life));
}
function geojson() {
  return { type: 'FeatureCollection', features: filteredMarks().map(mark => ({ type: 'Feature', properties: { id: mark.id, likes: Number(mark.likesCount || 0), confirmations: Number(mark.confirmationsCount || 0), visibility: mark.visibility || 'visible', recent: Date.now() - ts(mark.createdAt) < 86400000 ? 1 : 0 }, geometry: { type: 'Point', coordinates: [mark.location.lng, mark.location.lat] } })) };
}
function redraw() { if (sourceReady) map.getSource('community-marks').setData(geojson()); renderFeed(); }
function paintMapTheme(theme = {}) {
  if (!sourceReady) return;
  const primary = theme.primary || getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#111111';
  const secondary = theme.secondary || getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#666666';
  map.setPaintProperty('cluster-halo', 'circle-color', primary);
  map.setPaintProperty('clusters', 'circle-color', ['step', ['get', 'point_count'], primary, 20, secondary, 100, primary]);
  map.setPaintProperty('mark-halo', 'circle-color', primary);
  map.setPaintProperty('unclustered-mark', 'circle-color', ['case', ['>=', ['get', 'likes'], 40], primary, ['>=', ['get', 'likes'], 15], secondary, ['>=', ['get', 'likes'], 5], primary, ['>=', ['get', 'likes'], 1], secondary, primary]);
}
window.addEventListener('geomark-theme', event => paintMapTheme(event.detail));

map.on('load', () => {
  map.addSource('community-marks', { type: 'geojson', data: geojson(), cluster: true, clusterMaxZoom: 13, clusterRadius: 48 });
  map.addLayer({ id: 'cluster-halo', type: 'circle', source: 'community-marks', filter: ['has', 'point_count'], paint: { 'circle-radius': ['step', ['get', 'point_count'], 26, 20, 32, 100, 39], 'circle-color': '#111111', 'circle-opacity': 0.14, 'circle-blur': 0.55 } });
  map.addLayer({ id: 'clusters', type: 'circle', source: 'community-marks', filter: ['has', 'point_count'], paint: { 'circle-color': ['step', ['get', 'point_count'], '#111111', 20, '#393939', 100, '#6a6a6a'], 'circle-radius': ['step', ['get', 'point_count'], 18, 20, 23, 100, 29], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 } });
  map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'community-marks', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Open Sans Bold'], 'text-size': 12 }, paint: { 'text-color': '#ffffff' } });
  map.addLayer({ id: 'mark-halo', type: 'circle', source: 'community-marks', filter: ['!', ['has', 'point_count']], paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'likes'], 0, 10, 5, 15, 15, 20, 22, 40, 29], 'circle-color': '#111111', 'circle-opacity': 0.18, 'circle-blur': 0.35 } });
  map.addLayer({ id: 'unclustered-mark', type: 'circle', source: 'community-marks', filter: ['!', ['has', 'point_count']], paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'likes'], 0, 6, 5, 9, 15, 12, 40, 16], 'circle-color': ['case', ['>=', ['get', 'likes'], 40], '#111111', ['>=', ['get', 'likes'], 15], '#333333', ['>=', ['get', 'likes'], 5], '#555555', ['>=', ['get', 'likes'], 1], '#777777', '#111111'], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5, 'circle-opacity': ['case', ['==', ['get', 'visibility'], 'reduced'], 0.42, 1] } });
  sourceReady = true; redraw(); paintMapTheme();
  map.on('click', 'clusters', event => { mapFeatureClicked = true; setTimeout(() => { mapFeatureClicked = false; }, 0); event.originalEvent.stopPropagation(); const feature = event.features[0], source = map.getSource('community-marks'); source.getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => { if (!error) map.easeTo({ center: feature.geometry.coordinates, zoom }); }); });
  map.on('click', 'unclustered-mark', event => { mapFeatureClicked = true; setTimeout(() => { mapFeatureClicked = false; }, 0); event.originalEvent.stopPropagation(); const mark = marks.find(item => item.id === event.features[0].properties.id); if (mark) openMark(mark); });
  ['clusters', 'unclustered-mark'].forEach(layer => map.on('mouseenter', layer, () => map.getCanvas().style.cursor = 'pointer'));
  ['clusters', 'unclustered-mark'].forEach(layer => map.on('mouseleave', layer, () => map.getCanvas().style.cursor = ''));
});

function updateCoords() { if (selected) $('#coords').textContent = `Arraste o ponto no mapa · ${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`; }
function addDraft(coordinates) {
  draftPin?.remove();
  const pin = document.createElement('div'); pin.className = 'draft-pin'; pin.setAttribute('aria-label', 'Posição da marcação');
  draftPin = new maplibregl.Marker({ element: pin, draggable: true, anchor: 'bottom' }).setLngLat(coordinates).addTo(map);
  draftPin.on('dragend', () => { const point = draftPin.getLngLat(); selected = { lat: point.lat, lng: point.lng }; updateCoords(); if (placing) { $('#continuePlacement').disabled = false; $('#placementText').textContent = 'Posição escolhida. Arraste o ponto se quiser refinar.'; } });
}
function setPulseVisibility() { $('.pulse-duration').classList.toggle('hidden', $('#life').value !== 'pulse'); }
function dialog(coordinates, mark) {
  selected = coordinates || selected; editing = mark || null;
  $('#dialogTitle').textContent = mark ? 'Editar marcação' : 'Nova marcação';
  $('#markTitle').value = mark?.title || ''; $('#markDescription').value = mark?.description || ''; $('#placeName').value = mark?.placeName || ''; $('#category').value = mark?.category || 'place'; $('#life').value = mark?.life || 'permanent'; $('#markPhoto').value = mark?.imageURL || ''; $('#instagramURL').value = mark?.instagramURL || '';
  $('#pulseDuration').value = String(mark?.durationHours || 1); setPulseVisibility(); addDraft(selected); updateCoords(); $('#markDialog').classList.remove('hidden');
}
function closeDialog() { draftPin?.remove(); draftPin = null; selected = editing = null; $('#markDialog').classList.add('hidden'); }
function startPlacement() { closeDialog(); placing = true; selected = null; $('#newMark').classList.add('hidden'); $('#placementPanel').classList.remove('hidden'); $('#continuePlacement').disabled = true; $('#placementText').textContent = 'Clique no mapa e ajuste o ponto para escolher a posição.'; }
function cancelPlacement() { placing = false; draftPin?.remove(); draftPin = null; selected = null; $('#placementPanel').classList.add('hidden'); $('#newMark').classList.remove('hidden'); }
function finishPlacement() { if (!selected) return; placing = false; $('#placementPanel').classList.add('hidden'); $('#newMark').classList.remove('hidden'); dialog(selected); }
$('#newMark').onclick = startPlacement; $('#continuePlacement').onclick = finishPlacement; $('#cancelPlacement').onclick = cancelPlacement; $('#life').onchange = setPulseVisibility;
document.querySelectorAll('[data-close]').forEach(button => button.onclick = closeDialog);
map.on('click', event => { if (!placing || mapFeatureClicked) return; selected = { lat: event.lngLat.lat, lng: event.lngLat.lng }; addDraft(event.lngLat); $('#continuePlacement').disabled = false; $('#placementText').textContent = 'Posição escolhida. Arraste o ponto se quiser refinar.'; updateCoords(); });
['search', 'filterCategory', 'filterLife'].forEach(id => $(`#${id}`).addEventListener('input', redraw));

const icon = name => ({ heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.4a5.5 5.5 0 0 0-.1-7.8Z"/></svg>', thumb:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H4V10h3Zm3 11h7.2a2 2 0 0 0 2-1.7l1-6A2 2 0 0 0 18.2 11H15l.6-3.1A3.1 3.1 0 0 0 12.5 4L10 10v11Z"/></svg>', trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 3m-9 0 1 13h10l1-13"/></svg>', edit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-.9L19 8.3a2.2 2.2 0 0 0-3.1-3.1L5.1 16 4 20Z"/><path d="m13.8 7.3 3 3"/></svg>', share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v7h14v-7"/></svg>' })[name] || '';
function actionButton(label, handler, className = '', iconName = '') { const button = document.createElement('button'); button.className = `icon-action ${className}`; button.setAttribute('aria-label', label); button.title = label; button.innerHTML = `${iconName ? icon(iconName) : ''}<span>${label}</span>`; button.onclick = handler; return button; }
function renderInstagram(root, url) { const wrap = document.createElement('div'); wrap.className = 'instagram-wrap'; const quote = document.createElement('blockquote'); quote.className = 'instagram-media'; quote.dataset.instgrmCaptioned = ''; quote.dataset.instgrmPermalink = url; quote.dataset.instgrmVersion = '14'; quote.innerHTML = `<a href="${esc(url)}" target="_blank" rel="noopener">Ver publicação no Instagram</a>`; wrap.append(quote); root.append(wrap); const process = () => window.instgrm?.Embeds?.process(); if (window.instgrm?.Embeds) return process(); if (!document.querySelector('script[data-instagram-embed]')) { const script = document.createElement('script'); script.async = true; script.src = 'https://www.instagram.com/embed.js'; script.dataset.instagramEmbed = 'true'; script.onload = process; document.head.append(script); } }
function appendInfo(root, mark) {
  const info = document.createElement('small'); const confirmation = mark.lastConfirmedAt ? `Confirmado ${relative(mark.lastConfirmedAt)}` : 'Ainda sem confirmações';
  info.textContent = `${mark.likesCount || 0} curtidas · ${mark.confirmationsCount || 0} confirmações · ${confirmation}`; root.append(info);
}
async function openMark(mark) {
  const root = document.createElement('article'); root.className = 'mark-pop';
  if (mark.imageURL) { const image = document.createElement('img'); image.src = mark.imageURL; image.referrerPolicy = 'no-referrer'; image.alt = `Imagem de ${mark.title}`; image.onerror = () => image.remove(); root.append(image); }
  if (mark.instagramURL) renderInstagram(root, mark.instagramURL);
  const title = document.createElement('h3'); title.textContent = mark.title; root.append(title);
  const description = document.createElement('p'); description.textContent = mark.description; root.append(description);
  const meta = document.createElement('p'); meta.className = 'mark-meta'; meta.textContent = `${mark.placeName ? `${mark.placeName} · ` : ''}${categoryNames[mark.category] || 'Informação'} · ${mark.life === 'pulse' ? `Pulso até ${new Date(ts(mark.expiresAt)).toLocaleString()}` : 'Marco permanente'} · ${mark.author?.displayName || 'Explorador'}`; root.append(meta); appendInfo(root, mark);
  if (mark.visibility === 'reduced') { const warning = document.createElement('p'); warning.className = 'reduced-note'; warning.textContent = 'Visibilidade reduzida enquanto a comunidade revisa denúncias.'; root.append(warning); }
  const actions = document.createElement('div'); actions.className = 'pop-actions';
  actions.append(actionButton('Curtir', () => toggleInteraction('likes', mark), '', 'heart'));
  if (mark.authorId !== user.uid) actions.append(actionButton('Confirmar', () => toggleInteraction('confirmations', mark), '', 'thumb'));
  actions.append(actionButton('Compartilhar', () => shareMark(mark), '', 'share'));
  if (mark.authorId !== user.uid) { actions.append(actionButton('Sugerir edição', () => suggestEdit(mark))); actions.append(actionButton('Denunciar', () => reportMark(mark), 'report')); }
  if (mark.authorId === user.uid) { actions.append(actionButton('Editar', () => { popup.remove(); dialog({ lat: mark.location.lat, lng: mark.location.lng }, mark); }, '', 'edit')); actions.append(actionButton('Apagar', async () => { if (confirm('Apagar esta marcação?')) await deleteDoc(doc(db, 'markers', mark.id)); }, 'danger', 'trash')); }
  root.append(actions);
  const extra = document.createElement('div'); extra.className = 'popup-extra';
  extra.append(actionButton(`Histórico${mark.editsCount ? ` (${mark.editsCount})` : ''}`, () => loadHistory(mark, extra)));
  extra.append(actionButton('Comentários', () => loadComments(mark, extra)));
  root.append(extra);
  const popup = new maplibregl.Popup({ offset: 15, maxWidth: '350px' }).setLngLat([mark.location.lng, mark.location.lat]).setDOMContent(root).addTo(map);
}
async function toggleInteraction(kind, mark) {
  try {
    const ref = doc(db, 'markers', mark.id, kind, user.uid); const markerRef = doc(db, 'markers', mark.id);
    await runTransaction(db, async transaction => {
      const current = await transaction.get(ref);
      if (current.exists()) throw Error(kind === 'likes' ? 'Você já curtiu esta marcação.' : 'Você já confirmou esta marcação.');
      if (kind === 'confirmations' && mark.authorId === user.uid) throw Error('Você não pode confirmar a própria marcação.');
      transaction.set(ref, { uid: user.uid, createdAt: serverTimestamp() });
      transaction.update(markerRef, kind === 'likes' ? { likesCount: increment(1) } : { confirmationsCount: increment(1), lastConfirmedAt: serverTimestamp() });
    });
    toast(kind === 'likes' ? 'Curtida registrada.' : 'Confirmação registrada.', 'ok');
  } catch (error) { toast(error.message, 'error'); }
}
async function reportMark(mark) {
  const reason = prompt('Motivo da denúncia (até 240 caracteres):'); if (!reason?.trim()) return;
  try {
    const reportRef = doc(db, 'markers', mark.id, 'reports', user.uid), markerRef = doc(db, 'markers', mark.id); const exists = await getDoc(reportRef); if (exists.exists()) throw Error('Você já denunciou esta marcação.');
    const batch = writeBatch(db); batch.set(reportRef, { uid: user.uid, reason: reason.trim().slice(0, 240), createdAt: serverTimestamp() }); batch.update(markerRef, { reportsCount: increment(1), visibility: Number(mark.reportsCount || 0) + 1 >= 3 ? 'reduced' : (mark.visibility || 'visible') }); await batch.commit(); toast('Denúncia enviada para revisão.', 'ok');
  } catch (error) { toast(error.message, 'error'); }
}
async function suggestEdit(mark) {
  const text = prompt('Descreva a correção sugerida:'); if (!text?.trim()) return;
  try { await addDoc(collection(db, 'markers', mark.id, 'suggestions'), { authorId: user.uid, text: text.trim().slice(0, 500), status: 'pending', createdAt: serverTimestamp() }); toast('Sugestão enviada ao autor.', 'ok'); } catch (error) { toast(error.message, 'error'); }
}
async function loadHistory(mark, container) {
  try { const snapshot = await getDocs(query(collection(db, 'markers', mark.id, 'history'), orderBy('createdAt', 'desc'), limit(8))); const panel = document.createElement('div'); panel.className = 'history-list'; panel.innerHTML = snapshot.empty ? '<p>Nenhuma edição ainda.</p>' : snapshot.docs.map(item => `<p><b>${esc(item.data().editorName || 'Autor')}</b> editou ${relative(item.data().createdAt)}${item.data().summary ? ` · ${esc(item.data().summary)}` : ''}</p>`).join(''); container.replaceChildren(panel); } catch (error) { toast('Não foi possível carregar o histórico.', 'error'); }
}
async function loadComments(mark, container) {
  try { const snapshot = await getDocs(query(collection(db, 'markers', mark.id, 'comments'), orderBy('createdAt', 'desc'), limit(8))); const panel = document.createElement('div'); panel.className = 'history-list'; panel.innerHTML = snapshot.docs.map(item => `<p><b>${esc(item.data().authorName || 'Explorador')}</b> · ${esc(item.data().text)}</p>`).join('') || '<p>Sem comentários. Adicione a primeira atualização.</p>'; const form = document.createElement('form'); form.className = 'comment-form'; const input = document.createElement('input'); input.maxLength = 500; input.placeholder = 'Adicionar atualização'; const send = actionButton('Enviar', async () => { if (!input.value.trim()) return; try { await addDoc(collection(db, 'markers', mark.id, 'comments'), { authorId: user.uid, authorName: profile.displayName || user.displayName || 'Explorador', text: input.value.trim(), createdAt: serverTimestamp() }); input.value = ''; loadComments(mark, container); } catch (error) { toast(error.message, 'error'); } }); send.type = 'button'; form.append(input, send); panel.append(form); container.replaceChildren(panel); } catch (error) { toast('Não foi possível carregar comentários.', 'error'); }
}
async function shareMark(mark) {
  const url = `${location.origin}${location.pathname}?mark=${encodeURIComponent(mark.id)}`; const share = { title: mark.title, text: `${categoryNames[mark.category] || 'Marcação'} no Coordenada: ${mark.title}`, url };
  try { if (navigator.share) await navigator.share(share); else { await navigator.clipboard.writeText(url); toast('Link copiado.', 'ok'); } } catch (error) { if (error.name !== 'AbortError') toast('Não foi possível compartilhar.', 'error'); }
}
function renderFeed() {
  const host = $('#feedItems'); const activity = [...filteredMarks()].sort((a, b) => Math.max(ts(b.lastConfirmedAt), ts(b.createdAt)) - Math.max(ts(a.lastConfirmedAt), ts(a.createdAt))).slice(0, 5);
  host.replaceChildren(); if (!activity.length) { host.innerHTML = '<p class="feed-empty">Ainda não há atividade visível.</p>'; return; }
  activity.forEach(mark => { const button = document.createElement('button'); button.className = 'feed-item'; const action = mark.lastConfirmedAt && ts(mark.lastConfirmedAt) >= ts(mark.createdAt) ? `Confirmado ${relative(mark.lastConfirmedAt)}` : `${categoryNames[mark.category] || 'Marcação'} publicado ${relative(mark.createdAt)}`; button.innerHTML = `<b>${esc(mark.title)}</b><span>${esc(action)}</span>`; button.onclick = () => { map.flyTo({ center: [mark.location.lng, mark.location.lat], zoom: 14, speed: 1.4 }); openMark(mark); }; host.append(button); });
}
$('#closeFeed').onclick = () => $('#worldFeed').classList.toggle('collapsed');
$('#nearby').onclick = () => { if (!navigator.geolocation) return toast('Geolocalização não é suportada neste navegador.', 'error'); navigator.geolocation.getCurrentPosition(position => { const point = { lat: position.coords.latitude, lng: position.coords.longitude }; const close = filteredMarks().filter(mark => distanceKm(point, mark.location) <= 5); map.flyTo({ center: [point.lng, point.lat], zoom: 13, speed: 1.4 }); toast(`${close.length} ${close.length === 1 ? 'marcação encontrada' : 'marcações encontradas'} em até 5 km.`, 'ok'); }, () => toast('Permita a localização apenas para ver o que está perto de você. Ela não é salva.', 'error'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }); };

$('#markForm').onsubmit = async event => {
  event.preventDefault();
  try {
    const life = $('#life').value, hours = Number($('#pulseDuration').value), title = $('#markTitle').value.trim(), description = $('#markDescription').value.trim();
    if (!selected || title.length < 3 || description.length < 3) throw Error('Preencha título, descrição e posição.');
    const data = { title, description, placeName: $('#placeName').value.trim().slice(0,120), category: $('#category').value, life, durationHours: life === 'pulse' ? hours : null, expiresAt: life === 'pulse' ? Timestamp.fromMillis(Date.now() + pulseMs[hours]) : null, location: { lat: selected.lat, lng: selected.lng }, imageURL: safeUrl($('#markPhoto').value.trim()), instagramURL: safeInstagram($('#instagramURL').value.trim()), updatedAt: serverTimestamp() };
    if (editing) { const batch = writeBatch(db); batch.update(doc(db, 'markers', editing.id), { ...data, editsCount: increment(1) }); batch.set(doc(collection(db, 'markers', editing.id, 'history')), { editorId: user.uid, editorName: profile.displayName || user.displayName || 'Autor', summary: 'Dados da marcação atualizados', createdAt: serverTimestamp() }); batch.update(doc(db, 'users', user.uid), { 'stats.edits': increment(1), lastActiveAt: serverTimestamp() }); await batch.commit(); }
    else { const markerRef = doc(collection(db, 'markers')); const batch = writeBatch(db); batch.set(markerRef, { ...data, authorId: user.uid, author: { uid: user.uid, displayName: profile.displayName || user.displayName || 'Explorador' }, likesCount: 0, confirmationsCount: 0, reportsCount: 0, commentsCount: 0, editsCount: 0, visibility: 'visible', createdAt: serverTimestamp() }); batch.update(doc(db, 'users', user.uid), { 'stats.markers': increment(1), lastActiveAt: serverTimestamp() }); batch.update(doc(db, 'private_users', user.uid), { lastMarkerCreatedAt: serverTimestamp() }); await batch.commit(); }
    closeDialog(); toast(editing ? 'Marcação atualizada.' : 'Marcação publicada.', 'ok');
  } catch (error) { toast(error.message, 'error'); }
};

onAuthStateChanged(auth, async current => {
  if (!current) return location.assign('./index.html'); user = current;
  const profileDoc = await getDoc(doc(db, 'users', user.uid)); profile = profileDoc.data() || {};
  if ((await getDoc(doc(db, 'admins', user.uid))).exists()) $('#moderationLink').classList.remove('hidden');
  const pathMatch = location.pathname.match(/\/mark\/([^/]+)/);
  pendingDeepLink = new URLSearchParams(location.search).get('mark') || (pathMatch ? decodeURIComponent(pathMatch[1]) : null);
  onSnapshot(query(collection(db, 'markers'), orderBy('createdAt', 'desc')), snapshot => { marks = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); redraw(); if (pendingDeepLink) { const target = marks.find(mark => mark.id === pendingDeepLink); if (target) { pendingDeepLink = null; map.flyTo({ center: [target.location.lng, target.location.lat], zoom: 14, speed: 1.3 }); openMark(target); } } }, error => toast(error.message, 'error'));
});
$('#logout').onclick = () => signOut(auth);
setInterval(redraw, 60000);
