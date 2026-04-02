# @madeonsol/plugin-madeonsol

ElizaOS plugin for [MadeOnSol](https://madeonsol.com) — Solana KOL trading intelligence and deployer analytics via x402 micropayments.

## What it does

Gives your ElizaOS agent access to MadeOnSol's x402-gated API endpoints. The agent pays per request with USDC on Solana — no API keys needed.

| Action | Endpoint | Price |
|--------|----------|-------|
| `GET_KOL_FEED` | Real-time KOL trade feed (946 wallets) | $0.005 USDC |
| `GET_KOL_COORDINATION` | Multi-KOL convergence signals | $0.02 USDC |
| `GET_KOL_LEADERBOARD` | KOL PnL/win-rate rankings | $0.005 USDC |
| `GET_DEPLOYER_ALERTS` | Pump.fun elite deployer alerts | $0.01 USDC |

## Install

```bash
npm install @madeonsol/plugin-madeonsol @x402/fetch @x402/svm @x402/core @solana/kit @scure/base
```

## Usage

```typescript
import { madeOnSolPlugin } from "@madeonsol/plugin-madeonsol";

const agent = {
  plugins: [madeOnSolPlugin],
  settings: {
    // Required for automatic x402 payments:
    SVM_PRIVATE_KEY: "your_base58_solana_private_key",
    // Optional:
    MADEONSOL_API_URL: "https://madeonsol.com",
  },
};
```

The plugin's `init` function automatically:
1. Creates a Solana signer from `SVM_PRIVATE_KEY`
2. Registers the x402 payment scheme
3. Wraps fetch with automatic 402 → pay → retry handling

Your agent can then respond to queries like:
- "What are KOLs buying right now?"
- "Show me the KOL leaderboard this week"
- "What tokens are multiple KOLs accumulating?"
- "Any new deployer alerts from Pump.fun?"

Without `SVM_PRIVATE_KEY`, the plugin runs in read-only mode and returns payment requirement info instead of data.

## Wallet requirements

The wallet needs:
- ~0.01 SOL for transaction fees
- USDC balance (even $0.10 covers 20+ requests)

## Discovery endpoint

```
GET https://madeonsol.com/api/x402
```

Returns all available endpoints, prices, and parameter docs. No payment required.

## License

MIT
