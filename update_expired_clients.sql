UPDATE clients
SET 
  situacao = 'Ativo',
  statusPagamento = 'Pendente'
WHERE 
  DATE(vencimento) < DATE('now');

SELECT changes() as clientes_atualizados;
