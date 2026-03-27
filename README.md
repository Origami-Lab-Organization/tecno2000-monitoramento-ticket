# Sistema de Assistências Técnicas — Tecno2000

Sistema interno para gerenciamento de assistências técnicas e motoristas. MVP em desenvolvimento ativo.

## Stack

- [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)
- TypeScript
- Tailwind CSS 4
- Armazenamento em `localStorage` (sem backend por enquanto)

## Como rodar

```bash
npm install
npm run dev
```

Acesse em `http://localhost:3000`.

## Rotas

| Rota | Descrição |
|------|-----------|
| `/assistencias` | Lista de assistências técnicas com filtros |
| `/assistencias/nova` | Cadastro de nova assistência |
| `/assistencias/[id]` | Detalhes e edição de uma assistência |
| `/motoristas` | Visão por motorista com suas assistências vinculadas |

## Scripts

```bash
npm run dev      # inicia em modo desenvolvimento
npm run build    # gera build de produção
npm run start    # inicia o build gerado
npm run lint     # roda o linter
```

## Observações

- Os dados ficam salvos no `localStorage` do navegador — **limpar o cache/dados do navegador apaga tudo**.
- Na primeira abertura, o sistema carrega dados de exemplo automaticamente.
