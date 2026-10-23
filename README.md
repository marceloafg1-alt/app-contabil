# App contábil

Protótipo de um app contábil feito em HTML e JavaScript puro, sem servidor. Tudo está em um único arquivo, o `index.html`.

O app liga o cliente (empresário) ao contador:

- **Cliente:** envia notas fiscais, extratos, despesas, folhas e pedidos de departamento pessoal, conversa pelo chat e acompanha guias e impostos.
- **Contador:** recebe e confere os documentos, devolve contratos, holerites e guias e define o prazo mensal de cada cliente.

Para usar, basta abrir o `index.html` no navegador. Os dados são simulados e ficam salvos no próprio navegador.

## Teste de comunicação

A pasta `teste-comunicacao/` junta o app do cliente, o app do contador e o painel de gestão na mesma origem. Eles compartilham os dados e os arquivos pelo armazenamento do navegador, então o que um envia aparece no outro. Funciona entre abas do mesmo navegador; entre aparelhos diferentes é preciso o servidor.
