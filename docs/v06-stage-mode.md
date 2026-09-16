# Bloco D — Modo Palco

Base: commit C `27a015c9d536fbf5fef70ce3e7375ba4655c3f7c`, branch `v0.6`. Commit autorizado após correções de QA; sem deploy.

- `/admin/palco` protegido por `requireChatGPTUser` e `admin()`, tal como `/admin`. Ligação nos dois sentidos; dashboard existente preservado.
- Segue o evento ativo através de GET `/api/manage`, a cada 5 segundos. Sem evento ativo, mostra orientação para gestão completa e desativa ações.
- Pausa/abertura, `break` e `song_state:playing` reutilizam a API, incluindo `sessionRevision`. Tocar outra música termina a anterior e fecha os pedidos associados, mantendo a semântica existente.
- Próxima: primeira música disponível/reservada depois da atual no alinhamento, sem voltar ao início. No intervalo, primeira ainda disponível/reservada. Não avança por ranking nem repete músicas tocadas automaticamente.
- Top 5 respeita a ordem e contagem existentes (pedidos + votos por tips, incluindo pedidos fechados). Cinco pedidos recentes da página administrativa, que já vem ordenada do mais recente.
- Alinhamento e repertório revelam 12 linhas de cada vez; pesquisa parcial por título/artista ignora acentos e capitalização. Gestão avançada continua fora deste bloco.
- Bloqueio síncrono impede duplo submit. Não há retry automático de escritas. Timeout de 10 segundos, erro explícito e nova leitura antes de reativar ações; respostas antigas de polling são descartadas após uma ação. Falhas de leitura mantêm as ações bloqueadas.
- PT/EN através do idioma administrativo existente. CSS limitado a `.stage`, duas colunas em tablet e uma em mobile; botões com mínimo de 48 px, pausa com 64 px, foco herdado e texto com quebra de linha.

## Testes

`node tests/v06-stage.mjs`: funções puras + componente real em DOM sintético. 500 músicas, próxima exclui tocadas/ocultas, Top5/recentes5, 12/24 linhas, pesquisa sem acentos, pausa/próxima/intervalo, revisão enviada, duplo clique, conflito, perda de rede e recuperação, ausência de evento e PT/EN. Verificação estática das duas guardas da rota. Reutiliza happy-dom isolado do QA anterior; nenhuma dependência adicionada ao projeto.

Regressões essenciais: `node tests/v06-models.mjs` e `node tests/v06-discovery.mjs`. TypeScript: `npx tsc --noEmit`. Build: `bash scripts/sites-env.sh -- npm run build` (wrapper existente do ambiente). Todos aprovados.

## Limitações

Sem nova API otimizada: a leitura administrativa existente inclui dados adicionais que o Modo Palco não apresenta. Não foi introduzida arquitetura nova por precaução. Polling de 5 segundos mantém a mesma cadência do dashboard.

QA visual realizado com componente real e dados sintéticos em 390 × 844 e 768 × 1024. Autenticação end-to-end com D1 não validada neste ambiente. Validar num telemóvel/tablet real o conforto do layout, toque, scroll e rede fraca antes do uso em concerto. Não foram executadas as suites destrutivas de restauro ou escritas em dados reais. Nenhuma migration, configuração, secret, Site ou main alterados.

## Correções do QA

- Feedback com espaço reservado; removido o botão Atualizar durante a escrita. No browser mobile 390 × 844, pausa/intervalo/próxima mantiveram exatamente a posição antes, durante e depois: deslocamento medido de 0 px.
- Erro de leitura separado de loading: mensagem de ligação indisponível e Tentar novamente, sem A carregar simultâneo. Recuperação limpa o erro.
- O 404 observado não era de `/admin/palco`: o browser terminou em `/signin-with-chatgpt?return_to=%2Fadmin%2Fpalco`. A guarda redireciona corretamente; o preview managed-linux desativa o mock de autenticação (`sites({mockAuth: !managedLinux})`), deixando esse endpoint indisponível. Build inclui `/admin/palco`. Não alterada autenticação/configuração; login completo continua dependente do ambiente apropriado.
- Validação focada: `node tests/v06-stage-feedback.mjs`, `npx tsc --noEmit` e `bash scripts/sites-env.sh -- npm run build` aprovados. Não repetida a suite A/B/C/D. QA mobile confirmou erro sem loading e ausência de overflow no estado de gravação.
