# v0.6 — Bloco B: Song Discovery (para revisão)

Base: `v0.6` em `a88d58f1237c9071a17f33006013fb29011832cf`. Alterações sem commit. Sem publicação, migrações, alteração de configuração do Site ou implementação do Bloco C.

## Comportamento e decisões

- Pesquisa parcial por título/artista, sem distinção de capitalização/acentos. Inicialmente **zero linhas de músicas**; pesquisa, filtros ou «Ver músicas» revelam resultados em páginas de 12. Limpar regressa ao estado inicial; a seleção é independente da pesquisa.
- «Explorar» só oferece dimensões com pelo menos dois valores conhecidos distintos. Metadados em falta continuam desconhecidos. Artistas/géneros equivalentes por acentos/capitalização partilham uma opção; décadas e idiomas são apresentados em PT/EN. Géneros livres são conteúdo do catálogo, não traduzido automaticamente.
- «Mais pedidas» aparece quando há pedidos reais para músicas disponíveis. Ordena pela contagem de pedidos recebidos **neste evento**, sem votos pagos/tips. Combina com a pesquisa/filtros; não presume popularidade global.
- «Surpreende-me» usa todas as músicas disponíveis do evento, independentemente dos filtros. «Outra» evita repetição imediata; com uma única música fica desativada. «Quero esta» apenas seleciona e foca o campo de nome. O pedido mantém o formulário, idempotência e validação existentes.
- Pedidos pausados permitem explorar mas impedem seleção/sugestão/envio. Loading, indisponibilidade de ligação, vazio, zero resultados e desaparecimento de músicas são tratados. A falha de ligação tem prioridade sobre mensagens anteriores de sucesso.
- Reutilizada a API e o polling de 5 segundos. A consulta pública acrescenta apenas genre/decade/language e contagens agregadas, sem letras/contactos. A subconsulta agrega uma vez por evento usando o índice existente de pedidos; não há uma consulta por música.
- Sem paginação de servidor, nova framework de produção, schema ou alterações ao catálogo geral. Índice normalizado memoizado no cliente; apenas músicas `available` podem ser escolhidas. A API mantém os estados públicos existentes e a fronteira de evento ativo.
- CSS limitado ao picker, controlos de pelo menos 44 px, linhas de 64 px, texto com quebra, filtros numa coluna em larguras pequenas, labels/foco/aria-live e reduced motion.

## Validação reproduzível

```sh
node tests/v06-discovery.mjs
python tests/v06-discovery-query.py
# Dependência apenas de QA, instalada no diretório ignorado; não altera package.json/lockfile:
npm install --prefix work/discovery-dom --no-save --no-package-lock --ignore-scripts happy-dom@20.14.5
node tests/v06-discovery-dom.mjs
node tests/v06-models.mjs
python tests/v06-foundation.py
node node_modules/typescript/bin/tsc --noEmit
bash scripts/sites-env.sh -- npm run build
```

A simulação DOM usa happy-dom 20.14.5 e não mede layout.

- Testes de lógica/SSR: aprovados. 500 músicas, zero botões de músicas iniciais, 12 por página, cobertura completa em 42 páginas, pesquisa parcial/acentos, filtros/interseções, ordenação, metadados ausentes e 1.000 sugestões sem repetição imediata.
- Desempenho sintético de pesquisa + filtros: p95 entre 0,08 e 0,22 ms nas execuções locais (não é medição num telemóvel real); payload de músicas de aproximadamente 70 KB sem compressão. Sem evidência que justifique paginação server-side neste volume.
- SQLite em memória: 500 músicas do evento + uma só no catálogo, 5.000 pedidos; isolamento de evento, contagens, metadados, exclusão de ocultas e índice existente aprovados; consulta de cerca de 4 ms no ambiente local. Não mede a latência D1.
- Simulação DOM com componentes reais da Home/SongPicker e respostas sintéticas: paginação, foco, pesquisa, filtros, aleatório, escolha sem POST, envio normal, falha de disponibilidade, remoção da seleção, estados e PT/EN aprovados. Não contacta APIs nem dados reais.
- Regressões do Bloco A, TypeScript e build: aprovados. O checkout tem scripts shell sem bit executável; invocar o wrapper existente através de `bash` permite executar `npm run build`, sem modificar scripts nem modos Git.

## Limites e revisão pendente

O browser abriu a Home local e confirmou os estados de loading/falha de ligação sem uma base preparada. O browser bloqueou a abertura da fixture isolada (`ERR_BLOCKED_BY_CLIENT`); não se aplicaram migrações para contornar isto. **A validação visual/interativa a 390 px, overflow real, teclado real e medição num telemóvel continuam pendentes.** O DOM simulado não substitui essa validação.

`node tests/v06-discovery.mjs` gera a fixture da Home real com contexto sintético em `work/discovery/`, incluindo um iframe de 390 px. Estes artefactos são ignorados e não entram no build. Os testes de pedidos usam respostas simuladas; a API de escrita não foi alterada nem ensaiada contra produção. O limite/retenção existente de pedidos condiciona o histórico de «Mais pedidas».

Não há decisões funcionais bloqueantes para Pedro. A interpretação de «Mais pedidas» por evento fica explícita na interface. Bloco B disponível para revisão do código/comportamento, com a reserva de QA visual acima. Aguardar aprovação antes de commit; não avançar para C.
