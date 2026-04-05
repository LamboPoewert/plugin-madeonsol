# @madeonsol/plugin-madeonsol

ElizaOS plugin for [MadeOnSol](https://madeonsol.com) — Solana KOL trading intelligence and deployer analytics.

## Authentication

Three options (in priority order):

| Method | Setting | Best for |
|---|---|---|
| **MadeOnSol API key** (recommended) | `MADEONSOL_API_KEY` | Developers — [get a free key](https://madeonsol.com/developer) |
| RapidAPI key | `RAPIDAPI_KEY` | RapidAPI subscribers |
| x402 micropayments | `SVM_PRIVATE_KEY` | AI agents with Solana wallets |

## What it does

Gives your ElizaOS agent access to MadeOnSol's Solana intelligence API.

| Action | Endpoint |
|--------|----------|
| `GET_KOL_FEED` | Real-time KOL trade feed (946 wallets) |
| `GET_KOL_COORDINATION` | Multi-KOL convergence signals |
| `GET_KOL_LEADERBOARD` | KOL PnL/win-rate rankings |
| `GET_DEPLOYER_ALERTS` | Pump.fun elite deployer alerts |

## Install

```bash
npm install @madeonsol/plugin-madeonsol
```

> x402 peer deps (`@x402/fetch @x402/svm @x402/core @solana/kit @scure/base`) are only needed when using `SVM_PRIVATE_KEY`.

## Usage

```typescript
import { madeOnSolPlugin } from "@madeonsol/plugin-madeonsol";

const agent = {
  plugins: [madeOnSolPlugin],
  settings: {
    // Option 1: API key (simplest — get one free at madeonsol.com/developer)
    MADEONSOL_API_KEY: "msk_your_api_key_here",

    // Option 2: RapidAPI key
    // RAPIDAPI_KEY: "your_rapidapi_key",

    // Option 3: x402 micropayments (AI agents)
    // SVM_PRIVATE_KEY: "your_base58_solana_private_key",
  },
};
```

Your agent can then respond to queries like:
- "What are KOLs buying right now?"
- "Show me the KOL leaderboard this week"
- "What tokens are multiple KOLs accumulating?"
- "Any new deployer alerts from Pump.fun?"

## Discovery endpoint

```
GET https://madeonsol.com/api/x402
```

Returns all available endpoints, prices, and parameter docs. No auth required.

## Also Available

| Platform | Package |
|---|---|
| TypeScript SDK | [`madeonsol-x402`](https://www.npmjs.com/package/madeonsol-x402) |
| Python (LangChain, CrewAI) | [`madeonsol-x402`](https://github.com/LamboPoewert/madeonsol-python) on PyPI |
| MCP Server (Claude, Cursor) | [`mcp-server-madeonsol`](https://www.npmjs.com/package/mcp-server-madeonsol) |
| Solana Agent Kit | [`solana-agent-kit-plugin-madeonsol`](https://www.npmjs.com/package/solana-agent-kit-plugin-madeonsol) |

## License

MIT
