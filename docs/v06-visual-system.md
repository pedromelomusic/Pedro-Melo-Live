# Bloco F — Visual System

Base `1b679832db992c6da5f85856e55754f6dd4a8a32`, branch `v0.6`. Alterações de apresentação, sem commit/deploy ou migrations. Leitura pública de artwork adicionada por autorização explícita posterior; gestão autenticada preservada.

## Sistema

Camada final `app/visual-system.css`, importada após o CSS existente. Creme #f5f0e5, tinta verde #182d27, verde de ação #28533e, acento terracota e lima contidos. Georgia para hierarquia editorial, sans-serif para controlos e monospace local para legendas/números. Sem fontes remotas, imagens geradas ou novas dependências. Superfícies planas, separadores e badges substituem a ênfase em cartões.

Home, contexto de evento, Now Playing, pesquisa e resultados, confirmação/pós-pedido, apoio, comunidade, aulas e projetos partilham a paleta. Pedro tem acentos quentes, Giant’s tons de bosque e serifas itálicas, Pete violeta e títulos sans-serif fortes. Modo Palco usa superfície escura e ações de alto contraste; admin e gestão avançada mantêm todos os controlos e posições funcionais. Feedback reservado dos Blocos D/E preservado. Navegação, conteúdo e fluxos PT/EN não foram reescritos.

O SongPicker recebe apenas uma classe para destacar Surpreende-me; pesquisa/filtros/seleção/paginação continuam iguais. Resultados são linhas compactas com separadores, estado selecionado e alvos de pelo menos 64 px. Controlos principais >=44 px; foco visível e reduced motion. A regra antiga de iframe Twitch com largura mínima de 400 px é substituída por largura fluida em mobile.

## Artwork e limite de acesso

O Bloco E serve imagens exclusivamente ao administrador. O editor autenticado mostra thumbnail discreta de 64×64 junto ao link da música, apenas depois de confirmar existência. Sem capa não há imagem/placeholder; uma falha de imagem reutiliza o estado de erro e nova tentativa existentes. Nenhum acesso remoto foi executado neste trabalho.

Por autorização explícita, `/api/public-song-artwork?id=...` expõe apenas GET de uma imagem específica. ID ASCII alfanumérico inicial seguido de alfanuméricos, hífen ou underscore (máximo 150); valida existência da música com SQL parametrizado e usa exclusivamente `artworkKey(id)` no bucket existente. Sem listagem, escrita, schema novo ou alteração à gestão autenticada. Só JPEG/PNG/WebP até 1 MiB, com nosniff e política same-origin.

Cache pública com `max-age=0, must-revalidate` e ETag R2: reutilização exige revalidação porque a chave permite substituição/remoção. Ausência e erros usam no-store; 404 sem corpo. O SongPicker consulta apenas as linhas renderizadas (12/página); imagem de 44×44 aparece após load e desaparece silenciosamente em falha/ausência, sem placeholder nem erro visível. Não faz prefetch de todo o catálogo. IDs legados fora do formato aceite ficam sem thumbnail, mantendo a música funcional. Gestão GET/PUT/DELETE original continua admin.

## QA e revisão local

Testes focados: `node tests/v06-visual-system.mjs` (CSS válido, contraste dos pares principais >=4.5:1, reduced motion, regras de feedback preservadas, DOM real de descoberta com 500 músicas, pesquisa sem acentos, paginação, seleção e sugestão); `node tests/v06-management-feedback.mjs` (feedback E, PT/EN, artwork ausente/presente/removido e thumbnail). DOM sintético com happy-dom já disponível no diretório ignorado de QA; não mede pixels nem overflow real.

TypeScript e build executados uma vez ao terminar. A política do browser já bloqueou o servidor e o ficheiro de QA na sessão anterior; não foram repetidas tentativas nem contornada a restrição. Necessária revisão no Mac a 390×844 e 768×1024: Home em PT/EN, resultados longos/zero/pausa, pós-pedido, três projetos, admin, gestão e Stage Mode; verificar overflow, foco, scroll, teclado e feedback. Para isso usar o fluxo local já existente do projeto, sem apontar QA a produção/R2 remoto. A integração real de artwork continua sem QA remoto.

Resultado: testes F e feedback/artwork aprovados; `npx tsc --noEmit` sem erros; `npm run build` pelo wrapper existente terminou com código 0 e gerou artefactos client/server/SSR. O log terminou na fase SSR sem o resumo habitual de rotas; não foi feita uma segunda execução. Ambos executados uma vez na validação final. Avisos de proxy e tempo de plugins do ambiente, sem falha de build. Nenhum commit, push ou publicação.

Correção final de leitura pública: `node tests/v06-public-artwork.mjs` aprovado (handler real, D1/R2 simulados, cache/ETag/substituição/remoção, validação de IDs, autorização da gestão, DOM do SongPicker com/sem capa). Sem repetir TypeScript/build ou suites completas; sem acesso ao R2 remoto.
