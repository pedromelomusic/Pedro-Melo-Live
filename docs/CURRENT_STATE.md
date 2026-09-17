# Pedro Melo Live — estado oficial

## Fonte única e workflow

- Repositório: `https://github.com/pedromelomusic/Pedro-Melo-Live`.
- Produção e base estável: v0.5.1, `3a9b7a54e53a704cde568139363169b0c94503c4`.
- `main`: exclusivamente estável/publicável. Não é alterada durante desenvolvimento.
- `v0.6`: Blocos A–D concluídos; Bloco E implementado, com commit autorizado após três correções finais.
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

## Bloco B — concluído

Song Discovery aprovado e incluído em `ba67f53b6029805e306c8b2d13815e688d9947dd`. Pesquisa, filtros opcionais, páginas de 12 e sugestões aleatórias preservados. Ver `docs/v06-song-discovery.md` para o registo do bloco.

## Bloco C — concluído

Contexto compacto do evento, confirmação do pedido apenas após resposta válida, apoio opcional, original do evento e redes sociais antes do contacto opcional. Aprovado e incluído em `27a015c9d536fbf5fef70ce3e7375ba4655c3f7c`. Regressões A/B, testes C, TypeScript e build aprovados. QA em browser com fixture sintética de 390 × 844 px; teclado físico e integração real com rede fraca continuam a requerer teste manual. Sem migração, alterações de configuração ou publicação. Ver `docs/v06-public-live-experience.md`.

## Bloco D — QA corrigido

Modo Palco disponível em `/admin/palco`, com a mesma autenticação e autorização do admin. Controlo de pedidos, Now Playing, terminar/intervalo, próxima do alinhamento, Top 5, cinco pedidos recentes e repertório pesquisável em páginas de 12. Gestão completa preservada. Usa apenas `/api/manage` e as revisões existentes; nenhuma migration ou alteração de infraestrutura. Ver `docs/v06-stage-mode.md`.

## Bloco E — correções finais e commit autorizado

Gestão avançada em `/admin/gestao`, sobre HEAD `0018edb57c1ea0ee9a5d258a2a929fcb11418939`: catálogo global/evento, filtros, páginas de vinte, operações em massa, metadata e duplicação inativa sem histórico. Artwork opcional no R2 existente, sem schema/migration nem apresentação pública. Sem publicação; QA visual pendente por restrição do browser. Ver `docs/v06-advanced-management.md` para limites e QA.
