# Pedro Melo Live — estado oficial

## Fonte única e workflow

- Repositório: `https://github.com/pedromelomusic/Pedro-Melo-Live`.
- Produção e base estável: v0.5.1, `3a9b7a54e53a704cde568139363169b0c94503c4`.
- `main`: exclusivamente estável/publicável. Não é alterada durante desenvolvimento.
- `v0.6`: desenvolvimento a partir dessa base; Bloco A implementado, sem commit automático.
- Fluxo: desenvolvimento em `v0.6` → testes → commit/push → validação → aprovação de Pedro → merge em `main` → publicação da revisão aprovada de `main`.
- Não publicar automaticamente. Não criar Sites, repositórios ou bases alternativos. Não usar `outputs` como fonte de código. Não contornar restrições de `.git`; Pedro pode fazer commit/push manualmente.

## Site a preservar

- `project_id`: `appgprj_6aa719a1c8708191aeba6a4292c8f31d`.
- Domínio: `https://pedro-melo-live.peteontheradio.chatgpt.site`.
- Bindings existentes: D1 `DB`, R2 `BUCKET`.
- `.openai/hosting.json`, audience, secrets e dados existentes não foram alterados no Bloco A.
- Acesso público sem conta; administração mantém a autenticação existente.

## Produção v0.5.1

Pedidos gratuitos e idempotentes, seleção pesquisável, ranking, sessões e QR por evento, Now Playing, letras autorizadas, alinhamentos, importação, administração paginada, projetos, aulas e comunidade. Tips via links externos, confirmação manual e votos por euros confirmados. Backups com pré-visualização e cópia anterior; exportações grandes no servidor; retenção e métricas agregadas.

Discord preparado como segredo, envios desativados. Make/ManyChat, agendamento externo, feed Instagram automático e conciliação automática de pagamentos não estão ativados. Contactos têm consentimento separado, confirmação e retirada; o formulário depende do canal configurado. Não guardar segredos nesta documentação.

## Desenvolvimento v0.6

Bloco A: campos opcionais de repertório/evento, validação, compatibilidade de importação e backups, migração aditiva `0007_music_context.sql`. Não inclui Song Discovery, experiência pós-pedido, Modo Palco, gestão em massa ou redesign: pertencem aos blocos seguintes.

Migração validada exclusivamente numa base em memória; não aplicada à produção nem aos dados locais reais. É necessário aplicar a migração pendente antes de executar esta branch contra uma base existente. Não reinstalar/recriar a base nem reaplicar migrações antigas. Ver `docs/v0.6.md`.

## Bloco B — para revisão

Song Discovery implementado no working tree de `v0.6`, sobre `a88d58f`, sem commit/publicação. Pesquisa preservada, filtros opcionais, páginas de 12 e sugestões aleatórias. Testes sintéticos com 500 músicas, simulação DOM, consulta SQLite, regressões do Bloco A, TypeScript e build aprovados. QA visual a 390 px pendente por bloqueio de abertura da fixture no navegador. Ver `docs/v06-song-discovery.md`. Bloco C não iniciado.
