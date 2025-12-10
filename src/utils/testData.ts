// Teste simples para verificar se os servidores estão sendo carregados corretamente
// Agora retorna dados mock para testes, já que usamos SQLite
export const testServerData = () => {
  try {
    // Retorna dados mock para testes
    // O sistema real agora usa SQLite através do DataContext
    return ['Servidor 1', 'Servidor 2', 'Servidor 3'];
  } catch (error) {
    return [];
  }
};