# Bloco E — Advanced Management

Implementação para revisão em `v0.6`, sobre `0018edb57c1ea0ee9a5d258a2a929fcb11418939`. Commit do Bloco E autorizado após as três correções finais. Sem deploy ou migração.

## Utilização

O dashboard preservado oferece **Gestão avançada →** em `/admin/gestao`, com a mesma autenticação ChatGPT e autorização de proprietário. O evento selecionado é apenas o evento de trabalho; selecioná-lo não ativa o evento público.

- Catálogo global separado do repertório de cada evento. Estado refere-se à relação com o evento; «Fora do evento» existe apenas na vista global. O estado ativo/pausado/arquivado aparece separadamente.
- Pesquisa instantânea parcial de título/artista, ignorando capitalização e acentos. Filtros de género, década e idioma apenas quando existem valores, recomendado e estado. Campos opcionais não impedem a utilização.
- Vinte músicas por página; até quarenta músicas explicitamente selecionadas entre páginas. Mudar filtros/vista/evento limpa a seleção. «Selecionar esta página» substitui a seleção pela página atual.
- Adicionar/remover do evento ou disponibilizar/ocultar pedidos em massa, com confirmação. Remover só elimina a associação ao evento, nunca a música global, pedidos ou tips. Não altera pedidos pendentes; gestão desses pedidos permanece no admin existente.
- Operações de repertório em eventos arquivados ou seleções com músicas a tocar são recusadas. Revisões impedem sobreposição silenciosa de alterações concorrentes. Disponibilizar músicas reservadas/tocadas é explícito e mantém o histórico.
- Edição individual dos metadados globais opcionais, com revisão da música; contexto do evento reutiliza venue/cidade/original do Bloco A. Título, artista, importação, alinhamento e restantes funções continuam no dashboard existente.
- Duplicação copia contexto, repertório, posições e alinhamento. Novo nome/data explícitos; evento inativo, pedidos pausados, sem Now Playing, pedidos, tips ou histórico. Estados playing/played tornam-se available; hidden/reserved são preservados. Pode duplicar um evento arquivado, mas a cópia não é arquivada.

## Implementação

`/api/management` fornece uma projeção leve do catálogo e das associações, sem letras, e comandos administrativos. Reutiliza `songs`, `sessions`, `session_songs`, validação de metadata, autenticação e revisões existentes. Não altera APIs públicas nem o Song Discovery. SQL em batches atómicos D1, até quarenta IDs por comando e menos de cem parâmetros por statement. Sem dependências de produção novas.

O cliente não faz polling que elimine rascunhos durante a edição. Após guardar, recarrega os dados. Resultado de rede ambíguo bloqueia novas gravações até atualizar/verificar; não há retry automático de duplicações. Antes de repetir uma duplicação sem confirmação, verificar a lista atualizada de eventos. Os formulários usam o contexto recarregado após operações; guardar o contexto antes de executar outra operação para não perder um rascunho.

## Artwork opcional / R2

Sem coluna ou migration: objeto determinístico `song-artwork/v1/<song-id codificado>` no binding **BUCKET já existente**, separado dos backups. A ausência do objeto significa ausência de capa. Não são guardadas imagens na D1; sem novo bucket ou alteração de configuração.

Upload/substituição, consulta e remoção autenticados em `/api/song-artwork?id=...`; máximo 1 MiB, JPG/PNG/WebP, MIME e assinatura verificados. SVG não aceite. Respostas privadas sem cache e com nosniff. Não existe ainda apresentação pública, transformação de imagens ou sistema de artwork do Bloco F. A assinatura é uma verificação de formato, não uma descodificação completa da imagem.

As capas **não entram nos backups JSON atuais**, não são restauradas/revertidas juntamente com D1 e não têm versionamento por revisão da música: última gravação R2 vence. Um restauro que mude IDs pode deixar objetos sem associação; não é feita limpeza destrutiva automática. Capa ausente devolve 404 na consulta direta; a UI trata essa resposta como «Sem capa» e só oferece o link de visualização após confirmar a existência. Testar upload real num ambiente autorizado antes de utilização; QA deste bloco utiliza exclusivamente R2 simulado.

## QA focado

```sh
node tests/v06-management.mjs
python tests/v06-management-sql.py
node tests/v06-management-api.mjs
node tests/v06-management-dom.mjs
npx tsc --noEmit
npm run build
```

O teste DOM reutiliza happy-dom no diretório ignorado `work/discovery-dom` como os testes anteriores. Num checkout sem esse auxiliar, instalar apenas aí: `npm install --prefix work/discovery-dom --no-save --package-lock=false happy-dom@20.14.5`. Não é dependência do projeto. No ambiente managed-linux, executar o build com o wrapper existente `bash scripts/sites-env.sh -- npm run build`.

Cobertura: cenário de 500 músicas, pesquisa/acentos/filtros, vinte linhas por página, seleção limitada a quarenta, PT/EN, zero resultados, erro inicial/retry, prevenção de double-submit, foco no editor; SQL real em SQLite em memória, revisões obsoletas, eventos arquivados/música a tocar, isolamento entre eventos, duplicação sem histórico; handlers reais com autenticação/transportes simulados e testes de limites/formato do artwork. Nenhum acesso a dados reais.

DOM sintético não prova layout nem integração real. Revisão manual recomendada em mobile/tablet, autenticação e upload/leitura R2 real. Suites completas A–D não repetidas, pois código e APIs públicos não foram modificados.

Resultado nesta implementação: quatro testes focados aprovados, TypeScript sem erros e build concluído (rotas `/admin/gestao`, `/api/management` e `/api/song-artwork` incluídas). Mil pesquisas sobre 500 músicas demoraram aproximadamente 149 ms no teste local; é uma medição do filtro puro, não do browser. O DOM confirmou limite de vinte linhas, PT/EN, ausência de filtros opcionais sem dados e estado de pedidos pausados. O build emitiu apenas o aviso de proxy do ambiente e a nota habitual de classificação estática de rotas do vinext.

## Correções finais

Feedback e botão Atualizar ocupam espaço permanente; durante gravação/recarregamento o botão permanece desativado e os controlos não são inseridos/removidos. Confirmações em massa identificam operação e quantidade em PT/EN. O editor consulta a existência de artwork: 404 é ausência normal, sem link de visualização nem remoção ativa; falha real oferece nova tentativa. Upload/remoção confirmados atualizam o estado da capa. Sem alteração de API/schema.

`node tests/v06-management-feedback.mjs`: aprovado, com React/DOM e rede simulada, cobrindo estas três correções. Não foram repetidos TypeScript, build ou suites anteriores. QA visual mobile/tablet continua pendente porque a política do browser bloqueou o acesso ao preview e ao ficheiro de QA; não houve upload remoto.
