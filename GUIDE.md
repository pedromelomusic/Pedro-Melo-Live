# Pedro Melo Live — v0.5

Entrega local validada em 15 de setembro de 2026. A publicação continua bloqueada por falta de escrita em `.git`; o domínio continua na versão publicada 1. Não distribuir os novos QR como se esta versão já estivesse publicada.

## Novidades

- Páginas individuais `/projetos/pedro`, `/projetos/giants` e `/projetos/pete`, em PT/EN, com estilos próprios.
- Pedro Melo: “Sina”, Spotify, bio editável, agenda e publicações Instagram selecionadas.
- Giant’s Magazine: The Storyteller no Bandcamp, bio, agenda e entrada para a campanha quando existir um link.
- Pete On The Radio: Twitch incorporada, Discord e acesso aos pedidos.
- Painel dividido em No palco, Eventos, Repertório, Tips, Conteúdos e Dados e ligações; seletor de idioma independente.
- Tips por PayPal, Revolut e MB WAY através do Tipme, associadas a um pedido ou independentes.
- Backup consistente, pré-visualização e restauração dos dados musicais, conteúdos e tips; cópia anterior temporária.
- Verificação explícita de contactos antes de criar a inscrição confirmada destinada ao Make.
- Consulta manual do volume de dados. Não calcula faturas nem promete custos ilimitados gratuitos.

## Operação das tips

Cada pedido gratuito vale um voto. Cada euro inteiro recebido e confirmado acrescenta um voto à canção associada. Arredonda-se por tip para baixo: 2,90 € valem dois votos extra. Não existe garantia de execução da canção. Uma tip independente não atribui votos.

O visitante prepara a tip, copia uma referência e abre o serviço escolhido. O link externo não confirma um pagamento. Pedro consulta o serviço e, em Tips, regista o valor efetivamente recebido e o identificador da transação. A confirmação exige uma caixa explícita; identificadores repetidos no mesmo fornecedor são recusados. Reembolsos já efetuados no fornecedor podem ser registados e retiram os votos correspondentes. O painel não movimenta dinheiro nem emite reembolsos.

Os três links fornecidos estão configurados. Não há confirmação automática de pagamentos nesta entrega: isso exige contas/API dos fornecedores e validação dos respetivos eventos. A referência ajuda a conciliação manual; a disponibilidade do campo de mensagem depende do fornecedor. O painel mostra as 100 tips mais recentes do evento e as independentes; o backup inclui os registos completos dentro dos limites abaixo.

## Conteúdos

Em Conteúdos, editar bios, datas confirmadas, links das tips e até seis URLs de publicações ou reels públicos do Instagram. Não foram inventadas datas, letras nem publicações. O feed automático do Instagram fica dependente da ligação de uma conta compatível; atualmente existe incorporação de publicações selecionadas e o link do perfil.

Os leitores externos só são carregados após clicar em reproduzir. A disponibilidade depende dos serviços originais, das permissões de incorporação e do browser. A Twitch exige o domínio no parâmetro `parent`. Cada leitor mantém um link para abrir o serviço original.

## Backup e restauração

Em Dados e ligações, criar um backup, escolher o JSON e rever os totais e as sessões antes de escrever RESTAURAR. É criado um ficheiro do estado atual, descarregável durante 24 horas. A restauração substitui canções, letras, sessões, alinhamentos, pedidos, métricas, tips, conteúdos e links, incluindo a sessão ativa.

Contactos, consentimentos, credenciais e filas de comunicações não são substituídos por um backup musical. Os contactos têm exportação privada separada. Esta entrega não inclui restauro integral dos fornecedores externos nem reativação de consentimentos a partir de ficheiros antigos.

O snapshot é lido numa transação D1. A aplicação do backup usa uma única transação com uma revisão global: alterações após a pré-visualização causam recusa e exigem nova revisão. Uma exportação grande pendente também impede a substituição. Repetir a confirmação de um restauro concluído não o aplica novamente.

Limites por backup/restauro: 8 MiB, 2 000 canções, 500 sessões, 25 000 entradas de alinhamento, 25 000 pedidos, 25 000 linhas de métricas e 10 000 tips. Os limites são verificados; não há truncagem silenciosa. As exportações grandes de pedidos da v0.4 continuam disponíveis no servidor, mas não equivalem a um snapshot musical consistente e não podem ser importadas como tal. Para volumes acima destes limites, falta um restauro por etapas com bloqueio de escrita ou snapshot nativo do alojamento.

As migrações `0005_backstage.sql` e `0006_verification.sql` seguem as anteriores. Os triggers de revisão em `0005` têm fonte em `db/revision-triggers.sql`; são SQL intencional porque não são representados pelos snapshots Drizzle. Preservá-los em futuras alterações de schema. Nunca reaplicar migrações já executadas.

## Discord, contactos e agendamento

O webhook Discord recebido foi guardado como segredo de produção, fora do código e dos ficheiros entregues. A revisão de ambiente será aplicada na próxima publicação. `INTEGRATIONS_ENABLED=false`: não foram enviados testes nem notificações reais.

Make e ManyChat continuam por configurar. Quando existir Make, ativar apenas os canais efetivamente preparados em `COMMUNICATION_CHANNELS`. O cenário recebe primeiro `verification_requested`, com a ligação de confirmação e o contacto. Deve enviar essa ligação exclusivamente para confirmar a titularidade do contacto. O token expira em 24 horas e é guardado apenas como hash na tabela de desafios; a ligação em claro permanece temporariamente na fila necessária à entrega. Clicar na ligação e confirmar cria `communication_opt_in` com `contactVerified:true`. Confirmações repetidas não duplicam esse evento.

Só depois desse evento pode o cenário inscrever o contacto em novidades, respeitando o canal, o consentimento, a validade e as regras do fornecedor. Pedidos de músicas não inscrevem ninguém. A retirada elimina o contacto local, cancela a fila e invalida os desafios; o cenário deve processar a retirada no fornecedor. O nome de utilizador Instagram/WhatsApp não substitui a configuração de uma API de mensagens.

O endpoint protegido `/api/maintenance` está preparado para um agendador externo, mas nenhum agendamento foi ativado. Usar `MAINTENANCE_SECRET` aleatório com pelo menos 32 caracteres, transmitido no header Bearer, nunca no URL. O guia histórico explica o ritmo e a execução. Só ativar envios depois de preparar e testar o cenário e a identidade dos contactos. O Discord divulga Now Playing; os dados de contacto não são enviados para o Discord.

## Validação

- Compilação de produção e TypeScript.
- Páginas de projetos e tips a 390 px; sem erros JavaScript nem excesso de largura.
- Todas as áreas do painel em PT/EN a 390 px.
- Base de testes separada: tips pendentes, confirmação, referência repetida, conflitos, reembolso parcial/total e tips independentes.
- Backup inválido recusado, cópia anterior descarregável, prévia desatualizada recusada, substituição transacional e repetição segura.
- Inscrição pendente, confirmação explícita, deduplicação e retirada com token invalidado; nenhum envio real.
- Datas impossíveis recusadas; edição/restauro de conteúdo e consulta de volume.

Testes reutilizáveis: `tests/v05-regression.cjs` e `tests/v05-verification.cjs`. São testes destrutivos de restauro destinados exclusivamente a uma base local isolada na porta 5174. Não executar sobre os dados de Pedro nem sobre o domínio real. Os testes da v0.4 documentam a validação anterior de exportações de 24 001 pedidos; não foram repetidos como ensaio de volume nesta versão.

## Próximos passos

1. Resolver a escrita do repositório, publicar a v0.5 no Site existente preservando acesso e segredos, e validar no domínio com Pedro.
2. Rever as bios PT/EN, acrescentar datas confirmadas, publicações Instagram e o link da campanha.
3. Configurar Make/fornecedores, testar a confirmação de contactos e estabelecer agendamento antes de ativar envios.
4. Ligar APIs de pagamento para conciliação automática, mantendo confirmação de eventos no servidor.
5. Se o volume justificar, ampliar restauro, paginação de tips, métricas de consumo e alertas de custos do alojamento.


## Instalação e operação de base

Consultar [o guia v0.4](docs/v0.4.md) para instalação, operação de eventos, retenção e exportações grandes. Na instalação, aplicar também as migrações 0005_backstage.sql e 0006_verification.sql depois das anteriores. As novidades e limitações deste guia v0.5 prevalecem sobre o roadmap e as descrições antigas de confirmação de contactos.

