# Guia de Estilo – Botões de Alternância de Visualização

## Contexto
Os botões de alternância de visualização da seção de Clientes devem ser idênticos aos da seção de Leads.

## Estrutura HTML
Container:
```
<div class="flex bg-black/30 rounded-lg p-1 border border-purple-500/30">
  <!-- Botão Kanban/Cards -->
  <button class="p-2 rounded ..." title="Visualização Kanban">
    <ViewColumnsIcon className="w-5 h-5" />
  </button>
  <!-- Botão Tabela -->
  <button class="p-2 rounded ..." title="Visualização Tabela">
    <TableCellsIcon className="w-5 h-5" />
  </button>
 </div>
```

## Classes e Estados
- Base do container: `flex bg-black/30 rounded-lg p-1 border border-purple-500/30`
- Base do botão: `p-2 rounded`
- Estado ativo: `bg-cyan-500/20 text-cyan-400`
- Estado inativo: `text-gray-400 hover:text-white`
- Ícones: `w-5 h-5` (`@heroicons/react/24/outline`)

## Mapeamento de modos
- Leads: `kanban` ↔ `table`
- Clientes: `cards` ↔ `table` (usar os mesmos títulos/ícones dos Leads)

## Comportamento
- Transições via classes `hover` e estilos idênticos em ambos contextos
- Alternância de estado atualiza classes conforme modo ativo