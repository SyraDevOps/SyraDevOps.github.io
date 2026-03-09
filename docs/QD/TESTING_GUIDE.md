# 🧪 QDiário PWA - Testing Guide

## Quick Start Tests

Execute estes testes em sequência para validar o PWA completo.

---

## 1️⃣ Service Worker Registration

### Test Command (Chrome DevTools Console)
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('✅ Service Workers:', regs.length);
    regs.forEach(reg => console.log('  -', reg.scope));
});
```

**Expected:**
```
✅ Service Workers: 1
- https://seu-dominio.com/
```

---

## 2️⃣ Cache Storage Check

### Test Command
```javascript
caches.keys().then(names => {
    console.log('🗂️ Caches:', names);
    names.forEach(name => {
        caches.open(name).then(cache => {
            cache.keys().then(keys => {
                console.log(`\n📦 ${name}:`);
                keys.forEach(req => console.log(`  - ${req.url}`));
            });
        });
    });
});
```

**Expected:**
```
🗂️ Caches: ["qd-web-v1.2"]

📦 qd-web-v1.2:
  - https://seu-dominio.com/diario.html
  - https://seu-dominio.com/styles.css
  - https://seu-dominio.com/icons/icon.svg
  ... (20+ files)
```

---

## 3️⃣ Manifest Validation

### Test Command
```javascript
fetch('manifest.webmanifest')
    .then(r => r.json())
    .then(manifest => {
        console.log('📋 Manifest:', {
            name: manifest.name,
            short_name: manifest.short_name,
            display: manifest.display,
            icons: manifest.icons.length,
            scope: manifest.scope
        });
    });
```

**Expected:**
```
📋 Manifest: {
    name: "QDiário - Seu Diário Pessoal com IA",
    short_name: "QDiário",
    display: "standalone",
    icons: 2,
    scope: "/"
}
```

---

## 4️⃣ Offline Functionality

### Step 1: Load App Normally
- Abrir https://seu-dominio.com/diario.html
- Verificar que funciona online

### Step 2: Simulate Offline
```javascript
// Chrome DevTools > Network tab > Offline checkbox
// Ou:
navigator.onLine
// Deve retornar false
```

### Step 3: Test Offline Access
- Reload a página
- Deve funcionar (carregada do cache)
- Elementos da interface devem estar presentes
- Dados em cache devem estar acessíveis

**Expected:** ✅ Funciona sem erros óbvios

---

## 5️⃣ Installation Prompt Test

### Android (Chrome)

1. **Abrir app:**
   - Chrome mobile > https://seu-dominio.com

2. **Esperar prompt:**
   - Deve aparecer minibar no topo OU
   - Menu Chrome > "Instalar aplicativo"

3. **Instalar:**
   - Clique no botão
   - Confirme

4. **Verificar instalação:**
   ```javascript
   window.navigator.standalone
   // Deve retornar: true (em PWA) ou undefined (no browser)
   ```

### iOS (Safari)

1. **Abrir app:**
   - Safari mobile > https://seu-dominio.com

2. **Compartilhar:**
   - Botão Compartilhar (ícone de seta)
   - "Adicionar à Home Screen"

3. **Confirmar:**
   - Nome: "QDiário" (pré-preenchido)
   - Adicionar

4. **Verificar:**
   ```javascript
   window.navigator.standalone
   // Deve retornar: true (em PWA)
   ```

---

## 6️⃣ Meta Tags Validation

### Test Command
```javascript
const meta = {
    viewport: document.querySelector('meta[name="viewport"]')?.content,
    theme: document.querySelector('meta[name="theme-color"]')?.content,
    description: document.querySelector('meta[name="description"]')?.content,
    apple: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content,
    appleIcon: document.querySelector('link[rel="apple-touch-icon"]')?.href
};
console.table(meta);
```

**Expected:**
```javascript
{
    viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover, ...",
    theme: "#ff6b6b",
    description: "Seu diário pessoal com assistente IA...",
    apple: "yes",
    appleIcon: "/icons/icon-192.svg"
}
```

---

## 7️⃣ Responsive Design Test

### Desktop (1920px+)
```
[ Menu ] [ Main Content ......................... ] [ Chat Panel ]
```

### Tablet (900px)
```
[ Menu ] [ Main Content ....... ]
         [ Chat Panel ........... ]
```

### Mobile (640px)
```
[ Menu ] [ Full Width ... ]
[ Chat Panel - Full ]
```

**Test Steps:**
1. DevTools > Toggle device toolbar (Ctrl+Shift+M)
2. Test different screen sizes:
   - iPhone SE (375px)
   - iPhone 12 (390px)
   - iPad (768px)
   - Desktop (1920px)
3. Verificar layout responsivo
4. Botões devem ser 48px+ de altura

---

## 8️⃣ Touch Interaction Test

### Mobile Device

1. **Button Tap:**
   - Tap deve ter feedback visual
   - Sem delay de 300ms
   - Sem zoom duplo-clique

2. **Scroll Performance:**
   - Usar 60fps smooth scrolling
   - Sem jank/stuttering

3. **Safe Area Handling:**
   - iPhone com notch: Conteúdo respeita área
   - iPhone com Dynamic Island: Sem overlap

4. **Bottom Gesture Bar:**
   - iOS: Botões não cobrem gesture bar
   - Android: Back gesture funciona corretamente

---

## 9️⃣ Performance Test (Lighthouse)

### Run Lighthouse
```
Chrome DevTools > Lighthouse > Mobile > PWA
```

### Checklist
- [ ] Overall Score: 90+/100
- [ ] Does not register a service worker that controls page and start_url
- [ ] Web app is installable
- [ ] Configured for a custom splash screen
- [ ] Sets an address-bar theme color
- [ ] Has a valid apple-touch-icon
- [ ] Has viewport meta tag with width or initial-scale
- [ ] LCP metric (Largest Contentful Paint): < 2.5s
- [ ] FID metric (First Input Delay): < 100ms
- [ ] CLS metric (Cumulative Layout Shift): < 0.1

---

## 🔟 Offline Feature Test

### Simulate Network Issues

**Throttle Speed:**
```
DevTools > Network > Throttling > "3G" or "Slow 4G"
```

**Expected:**
- Página carrega (cache)
- Imagens carregam
- Funcionalidade offline OK
- APIs retornam erro gracefully

**Test Script:**
```javascript
// Testa se há permissão de escrita no IndexedDB (offline data)
const dbReq = indexedDB.open('QDiary');
dbReq.onsuccess = () => console.log('✅ IndexedDB OK');
dbReq.onerror = () => console.log('❌ IndexedDB Error');
```

---

## 1️⃣1️⃣ Security Test

### HTTPS Check
```javascript
console.log('🔐 Secure?', location.protocol === 'https:' ? '✅' : '❌');
```

### CSP Headers (verificar em Network tab)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

### Same-Origin Policy
```javascript
// APIs devem estar no mesmo domínio
// Verificar que /api calls funcionam
fetch('/api/user')
    .then(r => r.json())
    .then(data => console.log('✅ API OK', data));
```

---

## 1️⃣2️⃣ Automatic Validation

### Access Validation Page
```
https://seu-dominio.com/pwa-validation.html
```

**Testa automaticamente:**
- ✅ Manifest conformidade
- ✅ Service Worker
- ✅ Meta tags
- ✅ Icons
- ✅ HTTPS
- ✅ Responsividade
- ✅ Touch support
- ✅ Display mode

**Output:**
- Score de conformidade
- Relatório detalhado
- JSON exportável

---

## 📋 Full Testing Checklist

### Core Functionality
- [ ] Service Worker registration working
- [ ] Cache strategy functioning
- [ ] Offline mode functional
- [ ] Installation prompt appears
- [ ] Installation succeeds
- [ ] App launches in standalone mode

### UI/UX
- [ ] Viewport correctly sized
- [ ] Safe area respected
- [ ] Touch targets 48px+
- [ ] Button feedback on tap
- [ ] No 300ms tap delay
- [ ] Smooth scrolling
- [ ] Responsive at all breakpoints

### Performance
- [ ] Lighthouse PWA: 90+
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] First Load: < 3s
- [ ] Network throttle: 3G OK

### Compatibility
- [ ] Chrome/Edge (Android/Desktop)
- [ ] Safari (iOS)
- [ ] Firefox (all platforms)
- [ ] Samsung Internet (Android)
- [ ] Opera (all platforms)

### Devices
- [ ] iPhone SE (iOS latest)
- [ ] iPhone 12+ (iOS latest)
- [ ] Android 11+ (Chrome latest)
- [ ] iPad (iOS latest)
- [ ] Desktop 1920px
- [ ] Desktop 1366px

### Features
- [ ] Drag notes
- [ ] Draw on page
- [ ] Add stickers
- [ ] Chat functionality
- [ ] Auth flow
- [ ] Settings persist
- [ ] Offline data cached

---

## 🐛 Debug Commands

### View PWA Install History
```javascript
JSON.parse(localStorage.getItem('pwa_installations') || '[]')
```

### Force Update Service Worker
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
});
// Reload page
```

### Clear All Caches
```javascript
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
});
```

### Test API Fallback
```javascript
fetch('/api/nonexistent')
    .then(r => r.json())
    .then(data => console.log('API Response:', data))
    .catch(err => console.log('API Error:', err.message));
```

---

## 📊 Test Report Template

```markdown
# PWA Testing Report - QDiário
**Date:** 2024-XX-XX
**Tester:** [Name]
**Device:** [iPhone 12 / Pixel 6 / etc]
**OS:** [iOS 17 / Android 13 / etc]
**Browser:** [Safari / Chrome / etc]

## Results
- Service Worker: ✅ / ❌
- Installation: ✅ / ❌
- Offline Mode: ✅ / ❌
- Touch UI: ✅ / ❌
- Responsive: ✅ / ❌
- Performance: ✅ / ❌

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
- [Recommendation]
- [Recommendation]
```

---

**Status:** Ready for testing
**Last Updated:** 2024
