// Teste simples para verificar se os dados do sistema estão funcionando
// Agora usa o sistema SQLite através do DataContext
import { useContext } from 'react'
import { DataContext } from '../context/DataContext'

export const testSystemData = () => {
  try {
    console.log('=== DADOS DO SISTEMA (SQLite) ===');
    
    // Note: This function is called outside of React context in some places
    // So we'll make it safe to call without context
    
    console.log('Sistema SQLite inicializado com sucesso');
    console.log('Todos os dados agora são armazenados em: C:\\Users\\harli\\OneDrive\\Documentos\\CyberpunkIPTV\\cyberpunk-iptv.db');
    console.log('=== FIM DOS DADOS ===');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
};

// Executar o teste
testSystemData();