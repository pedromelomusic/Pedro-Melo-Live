# Bloco C — Public Live Experience (para revisão)

Base: `v0.6`, `ba67f53b6029805e306c8b2d13815e688d9947dd`. Sem commit, publicação ou migração.

## Experiência

- Contexto compacto do evento: nome, local, cidade, data e modo. Estados derivados dos campos existentes, incluindo pausa, inatividade, arquivo e ausência de evento.
- Confirmação com título/artista apenas após HTTP válido e `{ok:true}`. Foco no título da confirmação.
- Apoio opcional, com mensagem explícita de pedidos gratuitos e ligação ao pedido confirmado. Sem mudanças em pagamentos ou votos.
- Original escolhido por evento, apresentado apenas quando completo e com URL HTTPS válida. Redes reutilizam `useSite().links`, sem URLs duplicados; o placeholder WhatsApp existente não é mostrado.
- Redes antes do contacto opcional na comunidade; consentimento, confirmação e retirada existentes preservados.
- Song Discovery e os seus ficheiros permanecem intactos.

## Segurança de envio

Bloqueio síncrono por ref e botão desativado. Timeout de 15 segundos abrange transporte e parsing; respostas ambíguas nunca confirmam sucesso. Uma nova tentativa da mesma combinação evento/música/nome reutiliza o UUID enquanto esta página permanece aberta, aproveitando a idempotência existente da API. Recarregar a página ou mudar essa combinação inicia outra tentativa; não existe fila offline ou persistência de tentativas. Uma falha ao gerar UUID também liberta o estado de envio. Produção requer o contexto HTTPS normal para `crypto.randomUUID`.

## QA executado

Passaram: `node tests/v06-models.mjs`, `python tests/v06-foundation.py`, `python tests/v06-discovery-query.py`, `node tests/v06-discovery.mjs`, `node tests/v06-discovery-dom.mjs`, `node tests/v06-live-experience.mjs`, `node tests/v06-live-dom.mjs`, `npx tsc --noEmit` e build.

Neste ambiente o build usa `bash scripts/sites-env.sh -- npm run build`, porque o script existente não tem bit executável. Nenhum script/permissão foi alterado.

Testes C cobrem respostas válidas, erro HTTP/rede, JSON inválido/ambíguo, timeout do transporte e corpo, duplo submit síncrono, falha de UUID, retry com o mesmo id, título confirmado, foco, estados do evento, original presente/ausente/URL inválida e PT/EN.

Regressão B: 500 músicas, zero opções iniciais, páginas de 12 (42 páginas), pesquisa parcial/acentos, filtros, metadados ausentes e 1000 sugestões sem repetição imediata. Consulta SQLite com 500 músicas/5000 pedidos: cerca de 2 ms neste ambiente (não representa latência de produção).

Browser: fixture com Home/SongPicker reais, CSS compilado e transporte sintético, num iframe 390 × 844 px (375 px úteis devido à scrollbar). Pesquisa, filtros abrir/selecionar/fechar, paginação, Surpreende-me/Outra/Quero esta, confirmação PT/EN e pausa observados. Título/artista longos quebram linha; largura de scroll igual à largura útil nos estados medidos; novos links de ação medidos em aproximadamente 48 px de altura. Não é teste de teclado virtual ou dispositivo físico; não houve pedidos reais nem validação end-to-end contra D1.

## Repetir QA visual sem dados reais

Após instalar as dependências e fazer build:

```sh
node tests/v06-live-experience.mjs
node tests/v06-live-preview.mjs
open work/live-tests/mobile.html
```

A fixture é autocontida e usa 500 músicas fictícias. Controlos QA permitem evento aberto/pausado/ausente/sem original e respostas de sucesso/falha. Pesquisar `inesquecivel` encontra o título/artista compridos. URLs example são fictícios; não testar pagamentos ou canais externos com a fixture. O timeout da fixture é encurtado a 40 ms para testes. O HTML gerado fica em `work/`, ignorado pelo Git.

Para testes DOM, reutilizar a dependência de QA isolada do Bloco B (`happy-dom@20.14.5` em `work/discovery-dom`); não foi adicionada dependência ao projeto.

Antes de publicação futura, validar no telemóvel real teclado, scroll/foco da confirmação e comportamento com rede fraca e servidor de teste. Não executar migrações nem publicar automaticamente.
