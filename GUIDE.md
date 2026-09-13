# Pedro Melo Live — v0.1

## Usar no concerto
1. Abre `/admin` e entra na conta ChatGPT autorizada. O email autorizado vive no servidor (`ADMIN_EMAIL`), nunca no código público.
2. Mantém o painel aberto no iPad. Os pedidos atualizam a cada 10 segundos.
3. Usa “Tocar agora” para publicar a música. “Marcar tocada” arquiva o pedido; são ações separadas. “Intervalo” limpa o Now Playing.
4. Podes pausar novos pedidos, corrigir links e exportar os 1000 pedidos mais recentes em JSON. Exporta periodicamente; apagar elimina TODOS os pedidos, incluindo os que não aparecem na lista.
5. Antes do concerto, testa com dois dispositivos. A publicação inicial é privada: abre o acesso público nas definições do Site antes de partilhar um QR. O painel continua protegido pela autorização no servidor.
6. Cria um QR para o URL público final, de preferência um domínio teu para poderes mudar de alojamento sem reimprimir. Testa sem sessão iniciada. Não uses o endereço localhost no QR.
7. No iPhone/iPad: Safari → Partilhar → Adicionar ao ecrã principal. Android: menu do navegador → Instalar/adicionar. Os pedidos e o Now Playing precisam de internet; offline é mostrado um aviso e nenhum pedido é falsamente confirmado.

## O que está na v0.1
- Página mobile-first PT/EN, preferência de idioma guardada apenas no dispositivo.
- Pedro Melo, Giant’s Magazine, Pete On The Radio; Spotify, Instagram, YouTube, Twitch reais.
- WhatsApp para aulas com o número fornecido.
- Espaço de crowdfunding sem inventar campanha, valor angariado ou meta. Adicionar link no painel quando existir.
- Pedidos persistidos em D1, nome opcional, Now Playing partilhado, pausa e estado tocada.
- Painel protegido por autenticação ChatGPT e email autorizado; verificação em TODOS os endpoints de gestão.
- Manifesto PWA e aviso offline. Sem bibliotecas ou fontes externas no percurso público.
- Proteção básica: validação, consultas parametrizadas, origem nas escritas, honeypot e limite de 3 pedidos/minuto por IP/dia pseudonimizado. Redes partilhadas podem atingir o mesmo limite. Para grandes públicos, evoluir para um controlo por visitante com Turnstile.
- Dados nunca usados para mailing ou analytics. Nome é opcional. Sem publicação da lista de pedidos.

## Arquitetura e publicação
Frontend React/Vinext → APIs same-origin → Cloudflare Worker → D1 (SQLite). Não há Tally/Sheets/Make obrigatórios nem cadeias de automações. Código e migrações acompanham o projeto. Não foi confirmado um preço de alojamento: verificar os limites e custos do plano antes do lançamento público.

No Sites: configurar `ADMIN_EMAIL` como segredo de produção; gerar migrações; compilar; guardar versão com o código e migrações; publicar. A base D1 é declarada por `.openai/hosting.json`; a plataforma cria e aplica as migrações. Não colocar credenciais nesse ficheiro.

Desenvolvimento com Node 22.13+ e npm: `npm run install:ci`, copiar `.env.example` para `.env`, `npm run build`; aplicar cada migração local uma vez com `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_tan_nicolaos.sql`; depois `npm run dev`.

O ambiente local simula a conta `seedy@sites.test` somente em loopback. Para testar administração local, usar esse email em `.env`; nunca em produção. `.env.example` fica vazio de dados pessoais.

Para alojamento independente Cloudflare: criar D1, aplicar as migrações, configurar Worker e assets a partir da configuração gerada e `ADMIN_EMAIL`. A autenticação atual depende do dispatcher Sites; antes de migrar, substituir os helpers por uma autenticação verificada (por exemplo Cloudflare Access) e não confiar em headers enviados pelo visitante. Não publicar simplesmente o Worker fora de Sites sem essa adaptação. Os dados D1 são SQLite e podem ser exportados; o painel exporta pedidos, não é um backup integral. Implementar backup de toda a base no alojamento escolhido.

## Roadmap
v0.2: sessões de concerto, ranking por música normalizada, repertório pesquisável, exportação completa paginada e retenção automática de pedidos.
v0.3: letras de músicas próprias com confirmação de direitos, modos Concert/Busking/Twitch, QR por evento e analytics agregados sem rastreio individual.
v0.4: integrações opcionais por webhook com Make, Discord, WhatsApp/ManyChat; consentimento separado para comunicações. Nenhuma subscrição automática ao pedir uma música.
Crowdfunding: link para campanha externa primeiro; sincronização de progresso só com dados reais e integração fiável. Nunca processar pagamentos no MVP.

## Antes de abrir ao público
- Rever texto dos projetos e acrescentar o link Giant’s Magazine e campanha.
- Confirmar acesso ao painel na conta autorizada e bloqueio de outra conta.
- Abrir a página ao público e testar pedido/Now Playing entre dois dispositivos.
- Definir rotina de exportação e apagamento depois dos eventos.
- Confirmar custos, domínio e QR final. A revisão inicial privada não substitui este teste público.
