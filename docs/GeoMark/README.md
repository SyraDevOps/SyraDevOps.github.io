# GeoMark

> **GeoMark é um mapa comunitário e aberto onde pessoas podem marcar lugares, compartilhar descobertas e deixar sua presença pelo mundo.**

Versão **1.0** · Produzido por **@Syradevops**.

GeoMark usa Firebase Authentication e Cloud Firestore; portanto, é comunitário e aberto, mas **não é descentralizado** no sentido técnico.

## Produto entregue

- Cadastro por e-mail/senha ou Google, com nome, @usuário, data de nascimento e aceite dos termos.
- Perfil público, bio, foto HTTPS, dados privados em `private_users` e preferências de tema/idioma.
- Mapa OpenStreetMap com busca, filtros, criação por clique e pino arrastável antes de publicar.
- Categorias: Lugar, Recomendação, Descoberta, Evento, Alerta, Problema e Informação.
- **Marco** permanente e **Pulso** temporário de 1h, 6h, 24h ou 7 dias.
- Curtidas e confirmações são independentes. A confirmação registra `lastConfirmedAt`, exibido como “Confirmado há …”.
- Pins escaláveis: clusters com contagem em zoom distante, brilho de atividade e tamanho/cor proporcionais às curtidas quando o mapa aproxima.
- Feed “Agora no mundo”, navegação até a marcação, geolocalização efêmera “Perto de você” em raio de 5 km e links de compartilhamento.
- Autor pode editar ou apagar a própria marcação; cada edição cria histórico público.
- Comentários como atualizações, sugestões de edição enviadas ao autor e denúncias independentes.
- Após três denúncias, a marcação entra em visibilidade reduzida até a revisão no painel de moderação.
- Validação de tamanho, categorias, coordenadas e imagem HTTPS; imagem remota é isolada com `referrerpolicy="no-referrer"`.
- PWA instalável e responsivo; interface sem emojis, utilizando texto e ícones SVG.

## Estrutura Firestore

```text
users/{uid}                              perfil público
private_users/{uid}                      nascimento, termos, preferências e cooldown
markers/{markerId}                       marcação, contadores e expiresAt
markers/{markerId}/likes/{uid}           uma curtida por pessoa
markers/{markerId}/confirmations/{uid}   uma confirmação por pessoa
markers/{markerId}/comments/{id}         atualizações públicas
markers/{markerId}/suggestions/{id}      sugestões ao autor
markers/{markerId}/reports/{uid}         denúncias
markers/{markerId}/history/{id}          histórico de edições
users/{uid}/blocks/{uid}                 bloqueios preparados
users/{uid}/notifications/{id}           notificações preparadas
admins/{uid}                             moderadores provisionados
```

## Antes de publicar

1. Habilite E-mail/senha e Google em Firebase Authentication.
2. Publique `firestore.rules`.
3. Siga **[FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)** para ativar TTL de `markers.expiresAt` e App Check.
4. Adicione o domínio HTTPS em Authentication → Authorized domains.
5. Hospede a pasta inteira em HTTPS para permitir a instalação PWA.

## Limites que exigem infraestrutura adicional

O TTL é configurado no Firebase Console, não no código. As tags OpenGraph básicas estão incluídas, mas prévias individuais com título/foto de cada marcação exigem uma função ou edge renderer: crawlers sociais não executam JavaScript nem podem consultar Firestore do cliente. Como o produto usa somente Auth e Firestore, imagens continuam sendo URLs HTTPS externas; upload, compressão e antivírus requerem armazenamento controlado em uma próxima fase.

## Termos

Os termos deixam claro que sinais e denúncias ajudam a moderar, imagens podem ser removidas, e cada usuário responde pelo conteúdo publicado. Faça revisão jurídica antes da abertura pública.
