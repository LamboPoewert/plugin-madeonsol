import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

const MINT_RE = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/;
const WINDOW_RE = /\b(1h|24h)\b/i;

export const tokenFlowAction: Action = {
  name: "GET_TOKEN_FLOW",
  description:
    "Get net buy/sell flow for a Solana token over a rolling window (1h or 24h) from MadeOnSol. Returns unique wallet/buyer/seller counts, buy/sell trade counts, buy/sell/net SOL, and trades-per-wallet. PRO+.",
  similes: [
    "token flow",
    "net flow",
    "buy sell flow",
    "buy pressure",
    "sell pressure",
    "net sol flow",
    "money flow",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text || "";
    return /\b(flow|net buy|net sell|buy pressure|sell pressure|money flow)\b/i.test(text) && MINT_RE.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ) => {
    const client = getClient(runtime);
    const text = message.content?.text || "";
    const mint = text.match(MINT_RE)?.[1];
    if (!mint) {
      callback?.({ text: "Please include a token mint address." });
      return undefined;
    }

    const window = text.match(WINDOW_RE)?.[1]?.toLowerCase() as "1h" | "24h" | undefined;
    const result = await client.getTokenFlow(mint, window ? { window } : undefined);

    if (result.error) {
      callback?.({ text: result.status === 402
        ? "Authentication required. Set MADEONSOL_API_KEY — free at https://madeonsol.com/pricing — or SVM_PRIVATE_KEY."
        : `Error: ${result.error}` });
      return undefined;
    }

    const data = result.data!;
    const net = data.net_sol >= 0 ? `+${data.net_sol.toFixed(2)}` : data.net_sol.toFixed(2);
    const summary = [
      `Net flow (${data.window}) for ${mint.slice(0, 8)}…`,
      `• Net SOL: ${net} (buy ${data.buy_sol.toFixed(2)} / sell ${data.sell_sol.toFixed(2)})`,
      `• Trades: ${data.total_trades} (${data.buy_count} buys / ${data.sell_count} sells)`,
      `• Wallets: ${data.unique_wallets} (${data.unique_buyers} buyers / ${data.unique_sellers} sellers, ${data.trades_per_wallet.toFixed(1)}/wallet)`,
    ].join("\n");

    callback?.({ text: summary, content: { ...data } });
    return undefined;
  },

  examples: [
    [
      { name: "user1", content: { text: "What's the 24h net flow for 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" } },
      { name: "assistant", content: { text: "Here's the buy/sell flow for that token..." } },
    ],
  ] as Action["examples"],
};
