# Coordenada

> **Coordenada é um mapa comunitário e aberto para marcar lugares, compartilhar descobertas e deixar contexto útil pelo mundo.**

Versão **1.0** · Produzido por **@Syradevops**.

## Destaques

- Mapa com busca, categorias, clusters e pontos de tamanho proporcional às curtidas.
- Fluxo em duas etapas: primeiro escolha e ajuste a coordenada; depois descreva a marcação.
- Marcos permanentes e Pulsos de 1h, 6h, 24h ou 7 dias.
- Curtidas, confirmações recentes, comentários, histórico, denúncias e sugestões de edição.
- Feed compacto com as cinco atividades mais recentes e busca “Perto de você” sem persistir localização.
- Perfil, preferências salvas, temas de cor, português/inglês/espanhol e interface responsiva.
- Foto por URL HTTPS ou postagem pública do Instagram por link. O post é incorporado pelo serviço oficial do Instagram quando disponível; a mídia não é copiada para o Coordenada.
- PWA instalável: navegadores compatíveis exibem um convite de instalação; no iPhone/iPad o app orienta a adição pela tela de compartilhamento do Safari.

## Firestore

```text
users/{uid}                              perfil público
private_users/{uid}                      dados privados e preferências
markers/{markerId}                       conteúdo, localização, imagem e instagramURL
markers/{markerId}/likes/{uid}           curtidas únicas
markers/{markerId}/confirmations/{uid}   confirmações únicas
markers/{markerId}/comments/{id}         comentários
markers/{markerId}/suggestions/{id}      sugestões para o autor
markers/{markerId}/reports/{uid}         denúncias
markers/{markerId}/history/{id}          histórico público
```

## Publicação

1. Habilite E-mail/senha e Google no Firebase Authentication.
2. Publique `firestore.rules`.
3. Siga [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) para TTL e App Check.
4. Hospede a pasta em HTTPS e adicione o domínio autorizado no Firebase.

Postagens privadas, removidas ou com incorporação bloqueada pelo Instagram exibem o link de abertura como fallback.
