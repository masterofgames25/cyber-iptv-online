# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

## NEON CRM IPTV – Comportamento Financeiro Atualizado

- Despesas e lucro líquido são calculados a partir de `revenue_transactions` usando `costSnapshot`.
- No cadastro de novo cliente, uma transação de assinatura é criada com `serverSnapshot` e `costSnapshot`, garantindo exibição imediata de despesas.
- A exclusão de cliente agora é soft delete: o cliente é marcado como `archived = 1` e `deleted_at`, mantendo os dados financeiros.
- Operações críticas registram eventos no `system_log`.

### Fluxos
- Cadastro de cliente: cria transação de assinatura com snapshot e registra `client_added`.
- Transações de receita: persistem `serverSnapshot`, `costSnapshot`, `monthsSnapshot` e registram `revenue_added`.
- Exclusão de cliente: atualiza `situacao = Inativo`, `archived = 1` e registra `client_archived`.

### Testes Automatizados
- `src/test/FinancialsPersistence.test.tsx` valida:
  - Exibição de despesas após cadastro de cliente (snapshot).
  - Persistência de dados financeiros após exclusão (soft delete).
