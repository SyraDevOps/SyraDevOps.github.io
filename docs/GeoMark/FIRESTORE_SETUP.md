# Operação do Firestore

## Expiração real dos Pulsos

No Firebase Console, abra **Firestore Database → Time-to-live** e crie uma política para a coleção `markers` no campo `expiresAt`.

- Tipo de campo: `Timestamp`
- Campo: `expiresAt`
- Ação: ativar TTL

O Firestore remove o documento após a expiração de forma assíncrona (normalmente até 24 horas). O GeoMark o oculta imediatamente ao passar do horário e o TTL garante a remoção definitiva no banco. Marcos possuem `expiresAt: null` e não são removidos.

## Regras e proteção contra abuso

Publique `firestore.rules` no Console ou com Firebase CLI. As regras exigem autenticação, validam limites de texto, impedem edição de outra pessoa, registram interações únicas, exigem HTTPS para imagens e aplicam um intervalo mínimo de um minuto para novas marcações.

Antes de abrir ao público, ative também **Firebase App Check** para o site hospedado. App Check é a barreira adequada contra automação; não é possível habilitá-lo apenas a partir do código do navegador.

## Links profundos e compartilhamento

O aplicativo gera links como `main.html?mark=ID`. Caso o provedor ofereça rewrites, configure `/mark/*` para servir `main.html`; isso permite adotar URLs públicas como `/mark/abc123` sem perder o carregamento da marcação.

As tags OpenGraph básicas já estão em `main.html`. Prévia individual com foto e título de cada marcação requer renderização no servidor/edge, pois robôs de WhatsApp, Discord e X não executam JavaScript nem leem o Firestore do navegador.
