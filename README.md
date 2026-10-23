# App contábil

Protótipo de um app contábil feito em HTML e JavaScript puro, sem servidor. Tudo está em um único arquivo, o `index.html`.

O app liga o cliente (empresário) ao contador:

- **Cliente:** envia notas fiscais, extratos, despesas, folhas e pedidos de departamento pessoal, conversa pelo chat e acompanha guias e impostos.
- **Contador:** recebe e confere os documentos, devolve contratos, holerites e guias e define o prazo mensal de cada cliente.

Para usar, basta abrir o `index.html` no navegador. Os dados são simulados e ficam salvos no próprio navegador.

## Teste de comunicação

A pasta `teste-comunicacao/` junta o app do cliente, o app do contador e o painel de gestão na mesma origem. Eles compartilham os dados e os arquivos pelo armazenamento do navegador, então o que um envia aparece no outro. Funciona entre abas do mesmo navegador; entre aparelhos diferentes é preciso o servidor.

A pasta `teste-comunicacao-v2/` é a mesma ligação, com a tela **Gestão contábil** no app do contador: por cliente e mês, mostra o cofre de notas depois de encerrado (com PDF e XML), as notas avulsas, os extratos, as despesas (manuais e da planilha) com comprovantes, os documentos solicitados e os pedidos dos sócios, assim que o cliente envia.

Na `teste-comunicacao-v2/`, o app do contador também tem: botão **Baixar** em todos os arquivos recebidos (nas listas e na tela do documento), a tela **Guias de impostos** (no lugar de Lançar guia) com a situação de cada guia e os pedidos de parcelamento, recálculo, 2ª via e dúvida, e a tela inicial reorganizada.

Também na `teste-comunicacao-v2/`: o DP do contador lista todos os colaboradores dos clientes (admissão, cadastro, readmissão e desligados), cada um com a ficha completa e o histórico de solicitações, e o app do cliente mostra o mesmo histórico na ficha do colaborador. O contador ganhou botão voltar em todas as telas e gestos: deslizar para a esquerda volta, para a direita avança e para baixo atualiza.

No contador da `teste-comunicacao-v2/`: os botões do início têm o tamanho dos do cliente, com a situação dentro do botão ao lado do ícone, a ficha do colaborador abre e fecha por seções como no cliente, a aba Mensagens passou a se chamar Chat e a escolha de cliente nos formulários abre a janela de clientes.

Ainda no contador da `teste-comunicacao-v2/`: o botão **+** mostra as ações da tela aberta (em cada tela, mais Chat e Ajuda), há uma tela **Ajuda** com passo a passo e busca (no início e em Ajustes), e o **Chat** tem o mesmo visual e funcionamento do cliente: o nome do cliente de um lado (toque para trocar, em janela) e o **Contabills** do outro, que ensina a usar o app do contador. As mensagens do Contabills somem em 48 horas e as conversas com os clientes ficam guardadas.

Na tela Lançar guia do contador (`teste-comunicacao-v2/`) agora há o campo **Arquivo da guia**, para carregar o PDF; o cliente baixa o mesmo arquivo.

Imposto enviado pelo contador (`teste-comunicacao-v2/`): em Lançar guia, em Enviar documento (pasta Impostos) e em Enviar em lote (Impostos), a guia fica na pasta **Impostos** e também em **Guias de impostos**, para pagamento, ligada ao mesmo arquivo. O arquivo é guardado uma vez só: o mesmo conteúdo enviado de novo reaproveita o que já existe, e as cópias antigas são unidas ao abrir o app do contador.

Os exemplos de guias de impostos (a pagar, pagas e as da pasta Guias pagas, de todos os meses) saíram dos dados iniciais dos dois apps da `teste-comunicacao-v2/`. Quem já tinha os exemplos guardados no navegador ou no banco tem eles removidos ao abrir o app; as guias lançadas depois ficam.

Os exemplos de guias voltam a ser removidos sempre que aparecem (por exemplo, quando uma aba antiga grava os dados de novo), e a página inicial da `teste-comunicacao-v2/` abre os apps com um endereço novo a cada vez, para o navegador não usar uma cópia guardada.

Leitura do PDF da guia (`teste-comunicacao-v2/`, app do contador): em **Lançar guia**, ao carregar o PDF o app lê o arquivo no próprio navegador, sem IA e sem internet, e preenche imposto, competência, valor, vencimento, código de barras e Pix copia e cola (do texto ou do QR Code). Reconhece DAS, DARF (IRPJ, CSLL, PIS/COFINS, IRRF), INSS (GPS e DARF da DCTFWeb), FGTS Digital, ISS e boletos (44, 47 ou 48 dígitos, conferindo os dígitos verificadores). PDF que é só imagem avisa que não deu para ler, e tudo pode ser corrigido antes de lançar. O cliente copia o mesmo código de barras e Pix. As bibliotecas embutidas são o pdf.js 3.11.174 e o jsQR 1.4.0 (Apache-2.0).

Guias pagas e resposta ao cliente (`teste-comunicacao-v2/`): no app do cliente, **Marcar como paga** pede só a data; o comprovante é opcional e, quando enviado, fica na pasta **Recibos**. Com a guia paga, recálculo e parcelamento somem da guia e das listas; **Desmarcar como paga** libera os dois de novo. No app do contador, o pedido de guia (recálculo, 2ª via, parcelamento, dúvida, guia paga) é respondido numa janela: mensagem, **Pedir ação ao cliente** logo abaixo, o novo PDF da guia (obrigatório em recálculo, 2ª via e parcelamento) e, no recálculo, **Cobrar** com o valor. A pasta é sempre a do tipo do pedido (Guias de impostos), sem escolha. O novo PDF é lido no navegador, atualiza valor, vencimento, código e Pix da guia do cliente e substitui o arquivo anterior, que é apagado do armazenamento. Ao abrir um pedido, o contador faz ele aparecer como **Visualizado** para o cliente; quando o app do cliente recebe a resposta, o pedido mostra **Recebido pelo cliente** para o contador. O campo Lançar guia junto com a resposta saiu.

Barras do celular (`teste-comunicacao-v2/`): no app instalado, a barra de status (em cima) e a barra de navegação (embaixo) do Android deixaram de ser verde-escuras e passaram a acompanhar o app. Em cada tela, o topo pega a cor do começo do degradê e o rodapé pega a cor da barra de abas, e mudam junto quando o tema, o modo escuro ou a tela mudam. Vale para o cliente, o contador e o painel de gestão. A barra de navegação do Android não muda sozinha com a tela: ela usa a cor fixa do manifesto, que agora é a mesma da barra de abas (branco no cliente e no contador, o fundo claro no painel). No celular, a mudança aparece quando o Chrome atualiza o app instalado, ou na hora ao reinstalar.

Seletor de clientes no DP (`teste-comunicacao-v2/`, app do contador): a tela **Departamento Pessoal** tem o mesmo seletor de cliente de Guias de impostos, Pedidos e Recebidos, que abre a janela de clientes. Escolhendo um cliente, a lista de colaboradores, as admissões, férias, pedidos de férias, atualizações cadastrais, demissões e alterações e as contagens do topo mostram só esse cliente; **Todos os clientes** volta a mostrar tudo. A escolha é a mesma das outras telas.

Barra de abas mais baixa (cliente e contador, em todas as versões): o cartão da barra inferior (Início, Chat, +, Serviços/Pedidos, Perfil/Arquivo) passou de 84 para 66 pixels de altura e a folga embaixo dos ícones caiu de 22 para 8 pixels. O visual é o mesmo, com os ícones mais perto da borda de baixo. A área segura do celular e a reserva para a barra de 3 botões do Android continuam somadas por cima.
